import {it} from "vitest";
import assert from "assert";
import {near} from "~test/helpers.js";
import {useJsdom} from "~test/jsdom.js";
import {path2polygon} from "@d3plus/math";
import {ArcDiagram, Network} from "../../index.ts";
import {
  arcApex,
  arcBox,
  arcDiagramDef,
  arcEndTip,
  arcNodeGroup,
  arcPathD,
  arcPoint,
  arcRadiusScale,
  arcScale,
  arcSideOf,
  fitLabels,
  graphNodeId,
  isArcLink,
  labelReach,
  labelWidthLimit,
  naturalCompare,
  nodeDegrees,
  placeArcLabel,
  resolveGraphLinks,
  resolveGraphNodes,
  slotPositions,
  sortArcNodes,
} from "../../internal.ts";

useJsdom();

const link = (s, t) => ({source: {id: s}, target: {id: t}});

it("nodeDegrees counts each link once at each end", () => {
  const degrees = nodeDegrees([
    link("a", "b"),
    link("a", "c"),
    link("b", "c"),
    link("a", "a"),
  ]);
  assert.deepStrictEqual(Object.fromEntries(degrees), {a: 4, b: 2, c: 2});
  assert.strictEqual(nodeDegrees([]).size, 0);
});

it("naturalCompare orders numbers by size and text with embedded numbers", () => {
  assert.ok(naturalCompare(2, 10) < 0);
  assert.ok(naturalCompare("item 2", "item 10") < 0);
  assert.ok(naturalCompare("b", "a") > 0);
  assert.strictEqual(naturalCompare("a", "a"), 0);
  assert.ok(naturalCompare(undefined, "a") > 0, "missing values sort last");
  assert.ok(naturalCompare("a", null) < 0);
  assert.strictEqual(naturalCompare(undefined, ""), 0);
});

const sample = [
  {id: "d", label: "Delta", group: "y", degree: 1, order: 0, datum: {v: 3}},
  {id: "a", label: "Alpha", group: "y", degree: 3, order: 1, datum: {v: 1}},
  {id: "c", label: "Charlie", group: "x", degree: 3, order: 2, datum: {v: 2}},
  {id: "b", label: "Bravo", group: "x", degree: 0, order: 3, datum: {v: 4}},
];
const ids = nodes => nodes.map(n => n.id).join("");

it("sortArcNodes orders by each nodeSort mode", () => {
  assert.strictEqual(ids(sortArcNodes(sample, "data")), "dacb");
  assert.strictEqual(ids(sortArcNodes(sample, undefined)), "dacb");
  assert.strictEqual(ids(sortArcNodes(sample, "label")), "abcd");
  assert.strictEqual(ids(sortArcNodes(sample, "group")), "bcad");
  assert.strictEqual(ids(sortArcNodes(sample, "degree")), "acdb");
  assert.strictEqual(
    ids(sortArcNodes(sample, (a, b) => a.v - b.v)),
    "acdb",
    "a comparator receives node rows",
  );
  assert.strictEqual(
    ids(sortArcNodes(sample, () => 0)),
    "dacb",
    "ties keep the nodes order",
  );
  assert.strictEqual(ids(sample), "dacb", "the input is left as is");
});

it("slotPositions spaces nodes evenly, half a slot in from each end", () => {
  assert.deepStrictEqual(slotPositions(4, 0, 400), [50, 150, 250, 350]);
  assert.deepStrictEqual(slotPositions(2, 10, 100), [35, 85]);
  assert.deepStrictEqual(slotPositions(1, 0, 80), [40]);
  assert.deepStrictEqual(slotPositions(0, 0, 80), []);
});

it("arcSideOf puts every arc on one side, or splits by direction for both", () => {
  assert.strictEqual(arcSideOf(0, 3, "above"), "above");
  assert.strictEqual(arcSideOf(3, 0, undefined), "above");
  assert.strictEqual(arcSideOf(0, 3, "below"), "below");
  assert.strictEqual(arcSideOf(0, 3, "both"), "above", "forward arcs above");
  assert.strictEqual(arcSideOf(3, 0, "both"), "below", "backward arcs below");
});

it("arcScale keeps semicircles when they fit and flattens them evenly when not", () => {
  assert.deepStrictEqual(arcScale(200, 0, 150), {
    scale: 1,
    above: 100,
    below: 0,
  });
  const flat = arcScale(400, 0, 100);
  assert.strictEqual(flat.scale, 0.5);
  assert.strictEqual(flat.above, 100, "the tallest arc fills the room");
  const both = arcScale(400, 200, 150);
  assert.strictEqual(both.scale, 0.5);
  assert.strictEqual(both.above + both.below, 150);
  assert.strictEqual(both.above / both.below, 2, "heights follow spans");
  assert.strictEqual(arcScale(0, 0, 50).scale, 1);
  assert.strictEqual(arcScale(100, 0, -5).scale, 0);
});

const horizontal = {from: 100, to: 300, base: 200, scale: 0.5, side: "above"};

it("arcPoint maps along/out-from-line coordinates onto each orientation", () => {
  const h = {...horizontal, orient: "horizontal"};
  assert.deepStrictEqual(arcPoint(h, 120, 10), [120, 190]);
  assert.deepStrictEqual(arcPoint({...h, side: "below"}, 120, 10), [120, 210]);
  const v = {...h, orient: "vertical"};
  assert.deepStrictEqual(arcPoint(v, 120, 10), [210, 120], "above is right");
  assert.deepStrictEqual(arcPoint({...v, side: "below"}, 120, 10), [190, 120]);
});

it("arcPathD draws half an ellipse between the two nodes, as tall as scale × half its span", () => {
  const arc = {...horizontal, orient: "horizontal"};
  const d = arcPathD(arc);
  assert.strictEqual(d, "M100,200A100,50 0 0,1 300,200");
  const points = path2polygon(d, 2);
  assert.deepStrictEqual(points[0], [100, 200], "starts at the source");
  assert.deepStrictEqual(
    points[points.length - 1],
    [300, 200],
    "ends at the target",
  );
  const top = Math.min(...points.map(p => p[1]));
  near(top, 150, 0.5, "rises scale × half the span");
  assert.ok(
    points.every(p => p[1] <= 200.01),
    "stays above the line",
  );

  const back = path2polygon(arcPathD({...arc, from: 300, to: 100}), 2);
  assert.ok(
    back.every(p => p[1] <= 200.01),
    "a backward arc rises too",
  );
  const below = path2polygon(arcPathD({...arc, side: "below"}), 2);
  near(Math.max(...below.map(p => p[1])), 250, 0.5, "below the line");

  const vertical = arcPathD({...arc, orient: "vertical"});
  assert.strictEqual(vertical, "M200,100A50,100 0 0,1 200,300");
  const right = path2polygon(vertical, 2);
  near(Math.max(...right.map(p => p[0])), 250, 0.5, "bulges right");
});

it("arcApex and arcBox find the arc's top and the box it covers", () => {
  const arc = {...horizontal, orient: "horizontal"};
  assert.deepStrictEqual(arcApex(arc), [200, 150]);
  assert.deepStrictEqual(arcBox(arc), [
    [100, 150],
    [300, 200],
  ]);
  assert.deepStrictEqual(arcBox({...arc, orient: "vertical"}), [
    [200, 100],
    [250, 300],
  ]);
});

it("arcEndTip sits on the arc just past the node and points into it", () => {
  const arc = {...horizontal, orient: "horizontal", scale: 1};
  const tip = arcEndTip(arc, "target", 6);
  near(tip.y, 194, 1e-9, "inset from the line");
  assert.ok(tip.x < 300 && tip.x > 299, "on the arc, just inside its end");
  near(tip.angle, Math.PI / 2, 0.1, "points down into the node");
  const source = arcEndTip(arc, "source", 6);
  assert.ok(source.x > 100 && source.x < 101);
  near(source.angle, Math.PI / 2, 0.1);
  // On the ellipse: ((x - cx) / a)^2 + ((y - base) / b)^2 = 1.
  near(((tip.x - 200) / 100) ** 2 + ((tip.y - 200) / 100) ** 2, 1, 1e-9);

  const below = arcEndTip({...arc, side: "below"}, "target", 6);
  near(below.y, 206, 1e-9);
  near(below.angle, -Math.PI / 2, 0.1, "points up into the node");
  const vertical = arcEndTip({...arc, orient: "vertical"}, "target", 6);
  near(vertical.x, 206, 1e-9);
  near(Math.abs(vertical.angle), Math.PI, 0.1, "points left into the node");
  const flat = arcEndTip({...arc, scale: 0.01}, "target", 6);
  near(flat.angle, 0, 1e-9, "past a flat arc's top, along the line");
});

it("fitLabels lays labels flat, slants them, then turns them upright and thins them", () => {
  assert.deepStrictEqual(fitLabels(40, 50, 14, "horizontal"), {
    angle: 0,
    step: 1,
  });
  assert.deepStrictEqual(fitLabels(80, 30, 14, "horizontal"), {
    angle: -45,
    step: 1,
  });
  assert.deepStrictEqual(fitLabels(80, 15, 14, "horizontal"), {
    angle: -90,
    step: 1,
  });
  assert.deepStrictEqual(fitLabels(80, 5, 14, "horizontal"), {
    angle: -90,
    step: 3,
  });
  assert.deepStrictEqual(fitLabels(80, 20, 14, "vertical"), {
    angle: 0,
    step: 1,
  });
  assert.deepStrictEqual(fitLabels(80, 6, 14, "vertical"), {
    angle: 0,
    step: 3,
  });
});

it("labelReach measures how far a label reaches out from and along the line", () => {
  assert.deepStrictEqual(labelReach(0, 40, 14, "horizontal"), {
    depth: 14,
    spread: 20,
  });
  assert.deepStrictEqual(labelReach(-90, 40, 14, "horizontal"), {
    depth: 40,
    spread: 7,
  });
  const slant = labelReach(-45, 40, 14, "horizontal");
  near(slant.depth, 47 * Math.SQRT1_2, 1e-9);
  near(slant.spread, 47 * Math.SQRT1_2, 1e-9);
  assert.deepStrictEqual(labelReach(0, 40, 14, "vertical"), {
    depth: 40,
    spread: 7,
  });
});

it("labelWidthLimit caps rotated and vertical-line labels to the room past the line", () => {
  assert.strictEqual(labelWidthLimit(0, 30, 14, "horizontal"), Infinity);
  assert.strictEqual(labelWidthLimit(-90, 30, 14, "horizontal"), 30);
  near(labelWidthLimit(-45, 30, 14, "horizontal"), 30 / Math.SQRT1_2 - 7, 1e-9);
  assert.strictEqual(labelWidthLimit(-45, 0, 14, "horizontal"), 0);
  assert.strictEqual(labelWidthLimit(0, 30, 14, "vertical"), 30);
});

it("placeArcLabel hangs each label off its node on the labels' side", () => {
  const base = {
    id: "n",
    datum: {id: "n"},
    text: "Node",
    at: 100,
    base: 200,
    gap: 8,
    width: 40,
    spacing: 50,
    lineHeight: 14,
    orient: "horizontal",
  };
  const flat = placeArcLabel({...base, angle: 0, side: "below"});
  assert.deepStrictEqual(
    [flat.x, flat.y, flat.anchor, flat.verticalAlign],
    [100, 208, "middle", "top"],
  );
  assert.deepStrictEqual(flat.box, {x: -25, y: 0, width: 50, height: 14});
  const over = placeArcLabel({...base, angle: 0, side: "above"});
  assert.deepStrictEqual(
    [over.y, over.box.y, over.verticalAlign],
    [192, -14, "bottom"],
  );
  const upright = placeArcLabel({...base, angle: -90, side: "below"});
  assert.deepStrictEqual([upright.anchor, upright.angle], ["end", -90]);
  assert.deepStrictEqual(upright.box, {x: -40, y: -7, width: 40, height: 14});
  const rising = placeArcLabel({...base, angle: -45, side: "above"});
  assert.deepStrictEqual([rising.anchor, rising.box.x], ["start", 0]);
  const left = placeArcLabel({
    ...base,
    orient: "vertical",
    angle: 0,
    side: "below",
  });
  assert.deepStrictEqual([left.x, left.y, left.anchor], [192, 100, "end"]);
  const right = placeArcLabel({
    ...base,
    orient: "vertical",
    angle: 0,
    side: "above",
  });
  assert.deepStrictEqual(
    [right.x, right.anchor, right.box.x],
    [208, "start", 0],
  );
});

it("arcRadiusScale sizes nodes up to just under half their spacing", () => {
  const opts = {sizeMin: 5, sizeScale: "sqrt", spacing: 20};
  assert.strictEqual(arcRadiusScale(null, opts)(123), 5, "unsized: sizeMin");
  assert.strictEqual(
    arcRadiusScale(null, {...opts, spacing: 6})(1),
    2.7,
    "unsized nodes never overlap",
  );
  const sized = arcRadiusScale([1, 4, 9], {...opts, spacing: 100});
  assert.deepStrictEqual(sized.range(), [5, 20], "capped at 20");
  assert.strictEqual(sized(9), 20);
  const tight = arcRadiusScale([1, 9], opts);
  assert.deepStrictEqual(tight.range(), [4.5, 9]);
  assert.strictEqual(
    arcRadiusScale([3, 3], opts)(3),
    9,
    "equal sizes take the cap",
  );
  const capped = arcRadiusScale([1, 9], {...opts, sizeMax: 12});
  assert.deepStrictEqual(capped.range(), [5, 12]);
  const linear = arcRadiusScale([0, 10], {
    ...opts,
    sizeScale: "linear",
    spacing: 100,
  });
  assert.strictEqual(linear(5), 12.5);
});

/** A stand-in viz holding what the graph helpers read. */
const graphViz = (schema = {}, extra = {}) => ({
  _filteredData: [],
  _drawDepth: 0,
  _id: d => d.id,
  ctx: {},
  schema: {
    nodes: [],
    links: [],
    nodeGroupBy: [d => d.id],
    groupBy: [d => d.id],
    sizeMin: 5,
    shape: () => "Circle",
    linkSize: () => 1,
    ...schema,
  },
  ...extra,
});

it("graphNodeId reads a row's groupBy id, else its nodeGroupBy id", () => {
  const viz = graphViz({nodeGroupBy: [d => d.key]}, {_id: d => d.id});
  assert.strictEqual(graphNodeId(viz, {id: "a", key: "k"}, 0), "a");
  assert.strictEqual(graphNodeId(viz, {key: "k"}, 0), "k");
});

it("resolveGraphNodes merges data rows onto nodes by id", () => {
  const nodes = [{id: "a", size: 1}, {id: "b", size: 2}, {id: "c"}];
  const viz = graphViz(
    {nodes},
    {
      _filteredData: [
        {id: "b", size: 20},
        {id: "z", size: 9},
      ],
      _size: d => d.size,
    },
  );
  const out = resolveGraphNodes(viz);
  assert.deepStrictEqual(
    out.map(n => n.id),
    ["b", "a", "c"],
    "data ids first, and only ids in nodes",
  );
  const b = out[0];
  assert.strictEqual(b.data.size, 20, "the data row is the node's data");
  assert.strictEqual(b.node, nodes[1], "keeps its nodes entry");
  assert.strictEqual(b.r, 20, "sized from the data row");
  assert.strictEqual(out[1].r, 1, "sized from the node without a row");
  assert.strictEqual(out[0].shape, "Circle");
  assert.strictEqual(b.fx, undefined, "no positions without x/y accessors");
  const placed = resolveGraphNodes(
    graphViz({nodes: [{id: "a", x: 3, y: 4}]}, {_x: d => d.x, _y: d => d.y}),
  );
  assert.deepStrictEqual([placed[0].fx, placed[0].fy], [3, 4]);
  assert.strictEqual(
    resolveGraphNodes(graphViz({nodes})).at(-1).r,
    5,
    "sizeMin",
  );
});

it("resolveGraphLinks resolves index, id, and object ends and builds lookups", () => {
  const nodes = [{id: "a"}, {id: "b"}, {id: "c"}];
  const viz = graphViz({
    nodes,
    links: [
      {source: 0, target: 1, w: 3},
      {source: "b", target: "c", w: 1},
      {source: nodes[0], target: {id: "c"}, w: 2},
      {source: "a", target: "missing", w: 5},
    ],
    linkSize: d => d.w,
  });
  const graph = resolveGraphNodes(viz);
  const links = resolveGraphLinks(viz, graph);
  assert.strictEqual(links.length, 4, "index-aligned with links");
  assert.deepStrictEqual(
    links.slice(0, 3).map(l => `${l.source.id}${l.target.id}${l.size}`),
    ["ab3", "bc1", "ac2"],
  );
  assert.strictEqual(
    links[3].target,
    undefined,
    "an unknown end stays unresolved",
  );
  assert.strictEqual(viz.ctx.nodeLookup.b, graph[1]);
  assert.deepStrictEqual(
    viz.ctx.linkLookup.a.map(n => n.id),
    ["b", "c"],
    "neighbors, skipping unresolved links",
  );
});

it("arcNodeGroup reads the top groupBy level, then nodeGroupBy, then color", () => {
  const node = {data: {g: "x", c: "red"}, node: {k: "n"}, i: 0};
  const top = d => d.g;
  assert.strictEqual(
    arcNodeGroup(graphViz({groupBy: [top, d => d.id]}), node),
    "x",
  );
  assert.strictEqual(
    arcNodeGroup(graphViz({nodeGroupBy: [d => d.k, d => d.id]}), node),
    "n",
  );
  assert.strictEqual(arcNodeGroup(graphViz({color: d => d.c}), node), "red");
  assert.strictEqual(arcNodeGroup(graphViz(), node), undefined);
});

it("isArcLink tells links from node rows", () => {
  assert.strictEqual(isArcLink({source: {id: "a"}, target: {id: "b"}}), true);
  assert.strictEqual(isArcLink({source: "a", target: "b"}), false);
  assert.strictEqual(isArcLink({id: "a"}), false);
  assert.strictEqual(isArcLink(null), false);
});

it("ArcDiagram takes Network's data accessors plus its own options", () => {
  const viz = new ArcDiagram();
  assert.strictEqual(arcDiagramDef.name, "ArcDiagram");
  assert.strictEqual(viz.nodeSort(), "data");
  assert.strictEqual(viz.arcSide(), "above");
  assert.strictEqual(viz.orient(), "horizontal");
  assert.strictEqual(viz.linkColor(), false);
  assert.strictEqual(viz.arrows(), false);
  assert.strictEqual(viz.sizeMin(), 5);
  assert.deepStrictEqual(viz.links(), []);
  assert.deepStrictEqual(viz.nodes(), []);
  const nodes = [{id: "a"}, {id: "b"}];
  const links = [{source: "a", target: "b"}];
  // Network's config drops in as is.
  const config = {nodes, links, linkSize: 2, size: "value", nodeGroupBy: "id"};
  viz.config(config);
  new Network().config(config);
  assert.strictEqual(viz.links(), links);
  assert.strictEqual(viz.nodes(), nodes);
  assert.strictEqual(viz.linkSize()(), 2);
  assert.strictEqual(viz.size()({value: 3}), 3);
  viz.nodeSort("degree").arcSide("both").linkColor("source");
  assert.deepStrictEqual(
    [viz.nodeSort(), viz.arcSide(), viz.linkColor()],
    ["degree", "both", "source"],
  );
  assert.strictEqual(viz.shapeConfig().Path.fill, "none");
});
