import {it} from "vitest";
import assert from "assert";
import {scaleLinear} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";

import {ArcDiagram, Network, Rings, Sankey} from "../../index.ts";
import {
  coerceLinkColor,
  colorScaleColor,
  colorScaleValue,
  isScaleValue,
  linkColorResolver,
  linkColorScaleRows,
  linkRow,
  linkStyleFields,
  linkValueColor,
  makeLinkDatum,
  noteLinkValue,
} from "../../internal.ts";

useJsdom();

/**
    `linkColor` on the node-link charts: how a setting is stored, which link
    row a drawn link reads, how each kind of value becomes a color, and how
    numeric link values join the chart's colorScale.
*/

/** A link's datum, as a chart draws it, between nodes `a` and `b`. */
const linkDatum = (raw, index, a = {id: "a"}, b = {id: "b"}) =>
  makeLinkDatum(
    raw,
    {data: a, i: 0, id: a.id},
    {data: b, i: 1, id: b.id},
    index,
  );

/** A stand-in ColorScale whose scale runs from white at 0 to black at 100. */
const fakeScale = () => ({
  _colorScale: scaleLinear().domain([0, 100]).range(["#ffffff", "#000000"]),
  color: () => ["#ffffff", "#000000"],
});

it("isScaleValue — finite numbers only", () => {
  assert.strictEqual(isScaleValue(3), true);
  assert.strictEqual(isScaleValue(0), true);
  assert.strictEqual(isScaleValue(NaN), false);
  assert.strictEqual(isScaleValue(Infinity), false);
  assert.strictEqual(isScaleValue("3"), false);
  assert.strictEqual(isScaleValue(undefined), false);
});

it("coerceLinkColor — keeps the end names and functions, reads any other string as a key", () => {
  assert.strictEqual(coerceLinkColor(false), false);
  assert.strictEqual(coerceLinkColor(undefined), false);
  assert.strictEqual(coerceLinkColor(""), false);
  assert.strictEqual(coerceLinkColor("source"), "source");
  assert.strictEqual(coerceLinkColor("target"), "target");
  const fn = d => d.w;
  assert.strictEqual(coerceLinkColor(fn), fn);
  const key = coerceLinkColor("weight");
  assert.strictEqual(typeof key, "function");
  assert.strictEqual(key({weight: 7}), 7);
});

it("linkRow — a drawn link's datum and its index in links, else the link itself", () => {
  const datum = linkDatum({w: 3}, 2);
  assert.deepStrictEqual(linkRow({datum}, 0), {row: datum, index: 2});
  assert.deepStrictEqual(linkRow(datum, 0), {row: datum, index: 2});
  const own = {w: 9};
  assert.deepStrictEqual(linkRow(own, 5), {row: own, index: 5});
});

it("colorScaleColor — the scale's color, or its last color without a domain", () => {
  assert.strictEqual(
    colorScaleColor({_colorScaleClass: fakeScale()}, 100),
    "rgb(0, 0, 0)",
  );
  const empty = {
    _colorScaleClass: {
      _colorScale: scaleLinear().range(["#111111", "#222222"]).domain([]),
      color: () => [],
    },
  };
  assert.strictEqual(colorScaleColor(empty, 5), "#222222");
  const unbuilt = {_colorScaleClass: {color: () => ["#aaa", "#bbb"]}};
  assert.strictEqual(colorScaleColor(unbuilt, 5), "#bbb");
  assert.strictEqual(colorScaleColor({}, 5), undefined);
});

it("linkValueColor — numbers on the colorScale, colors as given, other strings as categories", () => {
  const viz = new Network();
  viz._colorScaleClass = fakeScale();
  assert.strictEqual(linkValueColor(viz, 0), "rgb(255, 255, 255)");
  assert.strictEqual(linkValueColor(viz, "#ff0000"), "#ff0000");
  assert.strictEqual(linkValueColor(viz, "steelblue"), "steelblue");
  const road = linkValueColor(viz, "road");
  assert.match(road, /^#|^rgb/, "a palette color");
  assert.strictEqual(linkValueColor(viz, "road"), road, "the same each time");
  assert.notStrictEqual(linkValueColor(viz, "rail"), road);
  assert.strictEqual(linkValueColor(viz, ""), undefined);
  assert.strictEqual(linkValueColor(viz, null), undefined);
  assert.strictEqual(linkValueColor(viz, {}), undefined);
});

it("linkColorResolver — false keeps the link config's stroke", () => {
  const viz = new Network();
  assert.strictEqual(viz.linkColor(), false);
  const resolve = linkColorResolver(viz);
  assert.strictEqual(resolve(linkDatum({}, 0)), undefined);
});

it("linkColorResolver — source and target take that end node's fill", () => {
  const viz = new Network().color("group");
  const a = {id: "a", group: "x"};
  const b = {id: "b", group: "y"};
  const datum = linkDatum({}, 0, a, b);
  const drawn = {source: {shape: "Circle"}, target: {shape: "Circle"}};
  const fill = d => viz.shapeConfig().fill(d, 0);
  viz.linkColor("source");
  assert.strictEqual(linkColorResolver(viz)(datum, drawn), fill(a));
  viz.linkColor("target");
  assert.strictEqual(linkColorResolver(viz)(datum), fill(b));
  assert.notStrictEqual(fill(a), fill(b));
});

it("linkColorResolver — a key colors each link by its row's value, noting numbers for the colorScale", () => {
  const links = [
    {source: "a", target: "b", w: 100},
    {source: "b", target: "c", w: "#00ff00"},
    {source: "a", target: "c"},
  ];
  const viz = new Network().links(links).linkColor("w");
  viz._colorScaleClass = fakeScale();
  const drawn = links.map((row, i) => linkDatum(row, i));
  const resolve = linkColorResolver(viz);
  assert.strictEqual(resolve(drawn[0]), "rgb(0, 0, 0)");
  assert.strictEqual(resolve(drawn[1]), "#00ff00");
  assert.strictEqual(resolve(drawn[2]), undefined, "no value: theme gray");
  const value = colorScaleValue(viz);
  assert.strictEqual(value(drawn[0], 0), 100, "the drawn link reads its value");
  assert.strictEqual(value(drawn[1], 1), undefined);
});

it("linkColorResolver — an accessor receives the link's datum and its index in links", () => {
  const links = [{source: "a", target: "b"}];
  const seen = [];
  const viz = new Network().links(links).linkColor((d, i) => {
    seen.push([d, i]);
    return "red";
  });
  const datum = linkDatum(links[0], 3);
  assert.strictEqual(linkColorResolver(viz)(datum), "red");
  assert.deepStrictEqual(seen, [[datum, 3]]);
  assert.strictEqual(seen[0][0].source.id, "a", "ends as node data");
});

it("linkColorScaleRows — the links with numeric values, cached until links or linkColor change", () => {
  const links = [{w: 5}, {w: "x"}, {w: 20}, null];
  const viz = new Network().links(links).linkColor("w");
  const rows = linkColorScaleRows(viz);
  assert.deepStrictEqual(rows, [links[0], links[2]]);
  assert.strictEqual(linkColorScaleRows(viz), rows, "cached");
  viz.linkColor(d => (d ? 1 : null));
  assert.strictEqual(linkColorScaleRows(viz).length, 3);
  viz.linkColor("source");
  assert.deepStrictEqual(linkColorScaleRows(viz), []);
  const nodes = [
    {id: "a", size: 4},
    {id: "b", size: 6},
  ];
  viz.nodes(nodes).links([
    {source: "a", target: 1},
    {source: "z", target: "b"},
  ]);
  viz.linkColor(d => d.source.size ?? d.source.id);
  assert.deepStrictEqual(
    linkColorScaleRows(viz).map(r => r.source),
    ["a"],
    "ends read as the nodes they name, before the layout runs",
  );
  viz.linkColor("w").links(() => []);
  assert.deepStrictEqual(linkColorScaleRows(viz), [], "links not loaded");
});

it("colorScaleValue — the chart's colorScale, extended with numeric link values", () => {
  const nodes = [{id: "a", pop: 3}];
  const links = [{source: "a", target: "a", w: 9}];
  const viz = new Network().nodes(nodes).links(links);
  assert.strictEqual(colorScaleValue(viz), undefined, "nothing to show");
  viz.colorScale("pop");
  assert.strictEqual(colorScaleValue(viz), viz.colorScale(), "nodes only");
  viz.linkColor("w");
  const value = colorScaleValue(viz);
  assert.strictEqual(value(links[0], 0), 9, "a link row");
  assert.strictEqual(value(nodes[0], 0), 3, "a node row");
  viz.colorScale(false);
  assert.strictEqual(colorScaleValue(viz)(links[0], 0), 9, "links only");
  assert.strictEqual(colorScaleValue(viz)(nodes[0], 0), undefined);
});

it("noteLinkValue — a drawn link datum reads its noted value", () => {
  const links = [{w: 1}];
  const viz = new Network().links(links).linkColor("w");
  const drawn = {source: {}, target: {}};
  noteLinkValue(viz, drawn, 42);
  assert.strictEqual(colorScaleValue(viz)(drawn, 0), 42);
  assert.strictEqual(
    colorScaleValue(new Network().links(links).linkColor("w"))(drawn, 0),
    undefined,
    "noted per chart",
  );
});

it("linkStyleFields — linkColor, linkLabel, and linkLabelConfig on every node-link chart", () => {
  const keys = linkStyleFields().map(f => f.key);
  assert.deepStrictEqual(keys, ["linkColor", "linkLabel", "linkLabelConfig"]);
  for (const Chart of [Network, Rings, Sankey, ArcDiagram]) {
    const viz = new Chart();
    assert.strictEqual(viz.linkColor(), false, Chart.name);
    assert.strictEqual(viz.linkLabel(), undefined, Chart.name);
    assert.strictEqual(viz.linkLabelConfig().rotate, "along", Chart.name);
    viz.linkLabel("w").linkLabelConfig({fontSize: 14});
    assert.strictEqual(viz.linkLabel()({w: 2}), 2);
    assert.deepStrictEqual(
      [viz.linkLabelConfig().rotate, viz.linkLabelConfig().fontSize],
      ["along", 14],
      "merged over the defaults",
    );
  }
});
