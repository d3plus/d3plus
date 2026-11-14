import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {Geomap} from "../../index.ts";
import {themeDark, themeLight} from "../../src/utils/theme.ts";
import {
  applyGeomapLayout,
  visiblePointData,
} from "../../src/charts/Geomap/applyLayout.ts";
import {geoPath} from "d3-geo";
import {
  coordinateLabel,
  flowEndResolver,
  flowLinkCoordinates,
  flowLinkWidths,
  geomapFlowLinks,
  linkEndRef,
} from "../../src/charts/Geomap/flowLinks.ts";
import {
  emitFlowLabels,
  emitFlowLinks,
  flowArrowEdge,
  flowLinkGray,
  flowLinkKey,
} from "../../src/charts/Geomap/flowEmit.ts";
import {
  flowHoverPredicate,
  flowLinkBox,
  setupGeomapLinks,
} from "../../src/charts/Geomap/flowEvents.ts";
import {
  linkMeta,
  linkNodeOf,
} from "../../src/charts/features/linkInteraction.ts";
import {arrowTrim} from "../../src/charts/features/edgeArrows.ts";
import {pathRuns} from "../../src/charts/Geomap/flowGeometry.ts";

useJsdom();

/**
    Geomap's links: how each end names a place (a coordinate, a point row,
    or a topojson shape), how links are sized and shaped, the scene nodes
    they draw, and their hover and click handlers.
*/

const square = (x, y, s) => [
  [
    [x, y],
    [x, y + s],
    [x + s, y + s],
    [x + s, y],
    [x, y],
  ],
];

/** Two cities with coordinates, and a region drawn from topojson. */
const cities = [
  {id: "NYC", name: "New York", point: [-74, 40.7], pop: 8},
  {id: "LON", name: "London", point: [-0.13, 51.5], pop: 9},
];
const region = {id: "R1", name: "Region One", value: 3};
const features = [
  {
    type: "Feature",
    id: "R1",
    geometry: {type: "Polygon", coordinates: square(10, 10, 4)},
  },
  {
    type: "Feature",
    id: "R2",
    geometry: {type: "Polygon", coordinates: square(-60, -20, 6)},
  },
  // A shape whose id is also a city's: the city's point wins.
  {
    type: "Feature",
    id: "NYC",
    geometry: {type: "Polygon", coordinates: square(-80, 35, 4)},
  },
];
/** The features as a topology, one closed arc per shape. */
const topojson = {
  type: "Topology",
  objects: {
    shapes: {
      type: "GeometryCollection",
      geometries: features.map((f, k) => ({
        type: "Polygon",
        id: f.id,
        arcs: [[k]],
      })),
    },
  },
  arcs: features.map(f => f.geometry.coordinates[0]),
};

/**
    A Geomap over `topojson` with its draw state filled in by hand, ready
    for `applyGeomapLayout`.
*/
function geomap(config = {}) {
  const viz = new Geomap().config({
    width: 400,
    height: 300,
    tiles: false,
    point: d => d.point,
    pointSize: d => d.pop,
    topojson,
    legend: false,
    ...config,
  });
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._filteredData = [...cities, region];
  viz._id = d => d.id;
  viz._drawLabel = d => d.name ?? `${d.id}`;
  return viz;
}

const topoData = [
  {__d3plus__: true, data: region, feature: features[0], id: "R1"},
  {__d3plus__: true, data: undefined, feature: features[1], id: "R2"},
  {__d3plus__: true, data: undefined, feature: features[2], id: "NYC"},
];

/** Runs Geomap's layout with the cities as points and `links`. */
function laidOut(links, config = {}) {
  const viz = geomap({links, ...config});
  applyGeomapLayout({viz});
  return viz;
}

it("linkEndRef reads a coordinate, an id, or an object's id", () => {
  assert.deepStrictEqual(linkEndRef([-74, 40.7]), [-74, 40.7]);
  assert.strictEqual(linkEndRef("NYC"), "NYC");
  assert.strictEqual(linkEndRef(840), "840");
  assert.strictEqual(linkEndRef({id: "LON", name: "London"}), "LON");
  assert.strictEqual(linkEndRef({id: 4}), "4");
  assert.strictEqual(linkEndRef(undefined), null);
  assert.strictEqual(linkEndRef({name: "nowhere"}), null);
  assert.strictEqual(linkEndRef(NaN), null);
  assert.strictEqual(linkEndRef([1, 2, 3]), null);
});

it("coordinateLabel writes longitude and latitude in the locale", () => {
  assert.strictEqual(
    coordinateLabel([-74.0061, 40.7128], "en-US"),
    "-74.01, 40.71",
  );
  assert.strictEqual(coordinateLabel([2.5, 48.25], "de-DE"), "2,5, 48,25");
  assert.strictEqual(
    coordinateLabel([1.234, 5], "not a locale!"),
    "1.23, 5",
    "falls back on a bad locale",
  );
});

it("flowEndResolver finds point rows, topojson shapes, and coordinates", () => {
  const viz = geomap();
  const resolve = flowEndResolver(viz, {
    pointData: cities,
    topoData,
    pointR: d => d.pop,
  });
  const nyc = resolve("NYC");
  assert.strictEqual(
    nyc.shape,
    "Circle",
    "the city's point wins over its shape",
  );
  assert.strictEqual(nyc.data, cities[0]);
  assert.deepStrictEqual(nyc.coord, [-74, 40.7]);
  assert.strictEqual(nyc.r, 8);
  assert.strictEqual(resolve({id: "LON"}).data, cities[1]);

  const r1 = resolve("R1");
  assert.strictEqual(r1.shape, "Path");
  assert.strictEqual(r1.data, region, "a shape with data ends at its row");
  assert.ok(
    Math.abs(r1.coord[0] - 12) < 0.05 && Math.abs(r1.coord[1] - 12) < 0.1,
  );
  assert.strictEqual(r1.r, 0);
  const r2 = resolve("R2");
  assert.strictEqual(
    r2.data,
    topoData[1],
    "a shape without data ends at its drawn datum",
  );
  assert.strictEqual(resolve("R1"), r1, "resolved once");

  const coord = resolve([-58.4, -34.6]);
  assert.deepStrictEqual(coord.coord, [-58.4, -34.6]);
  assert.strictEqual(coord.id, "-58.4,-34.6");
  assert.strictEqual(coord.label, "-58.4, -34.6");
  assert.strictEqual(coord.shape, undefined);
  assert.strictEqual(resolve([-58.4, -34.6]), coord);

  assert.strictEqual(resolve("nowhere"), null);
  assert.strictEqual(resolve(null), null);
});

it("flowLinkCoordinates lists the coordinate ends of links", () => {
  assert.deepStrictEqual(
    flowLinkCoordinates([
      {source: "NYC", target: [1, 2]},
      {source: [3, 4], target: [5, 6]},
      null,
      {source: "a"},
    ]),
    [
      [1, 2],
      [3, 4],
      [5, 6],
    ],
  );
  assert.deepStrictEqual(flowLinkCoordinates(undefined), []);
});

it("flowLinkWidths scales differing sizes onto [min, max], and keeps equal ones", () => {
  assert.deepStrictEqual(
    flowLinkWidths([2, 2, 2], {min: 1, max: 10}),
    [2, 2, 2],
  );
  assert.deepStrictEqual(
    flowLinkWidths([0, 50, 100], {scale: "linear", min: 1, max: 11}),
    [1, 6, 11],
  );
  const sqrt = flowLinkWidths([0, 25, 100], {min: 0, max: 10});
  assert.deepStrictEqual(sqrt, [0, 5, 10], "sqrt by default");
  assert.deepStrictEqual(
    flowLinkWidths([0, "x", 100], {scale: "linear", min: 1, max: 3}),
    [1, 1, 3],
    "a missing value takes the minimum",
  );
  assert.deepStrictEqual(
    flowLinkWidths([0, 100], {scale: "nope", min: 0, max: 10}),
    [0, 10],
    "an unknown scale falls back to sqrt",
  );
  assert.deepStrictEqual(
    flowLinkWidths([0, 100], {scale: "linear", min: 4, max: 2}),
    [4, 4],
    "max never below min",
  );
  assert.deepStrictEqual(flowLinkWidths([], {min: 1, max: 2}), []);
});

it("geomapFlowLinks resolves, sizes, and shapes links, skipping ones it can't place", () => {
  const viz = geomap({
    links: [
      {source: "NYC", target: "LON", n: 10},
      {source: "LON", target: "R1", n: 40},
      {source: "NYC", target: [-58.4, -34.6], n: 20},
      {source: "NYC", target: "nowhere", n: 5},
      {source: "LON", target: "LON", n: 5},
    ],
    linkSize: d => d.n,
    linkSizeScale: "linear",
    linkSizeMin: 2,
    linkSizeMax: 8,
  });
  applyGeomapLayout({viz});
  const links = viz.ctx.geomapCtx.flowLinks;
  assert.deepStrictEqual(
    links.map(l => l.index),
    [0, 1, 2],
    "an unknown end and a link to itself are left out",
  );
  assert.deepStrictEqual(
    links.map(l => l.size),
    [2, 8, 4],
    "scaled over every placed link's value",
  );
  const [first, second] = links;
  assert.strictEqual(first.datum.source, cities[0]);
  assert.strictEqual(first.datum.target, cities[1]);
  assert.strictEqual(first.datum.n, 10);
  assert.strictEqual(linkMeta(first.datum).value, 10);
  assert.ok(first.points.length > 10);
  assert.ok(first.d.startsWith("M"));
  assert.ok(first.box[0][0] < first.box[1][0]);
  assert.strictEqual(second.target.shape, "Path");
  assert.strictEqual(linkNodeOf(viz, cities[0]).id, "NYC");
  assert.strictEqual(linkNodeOf(viz, region).id, "R1");
  assert.strictEqual(viz.ctx.linkGraph.links.length, 3);

  // Without links, the rows stop reading as link ends.
  viz.links([]);
  applyGeomapLayout({viz});
  assert.deepStrictEqual(viz.ctx.geomapCtx.flowLinks, []);
  assert.strictEqual(linkNodeOf(viz, cities[0]), undefined);
});

it("geomapFlowLinks uses linkCurve and the default link width", () => {
  const straight = laidOut([{source: "NYC", target: "LON"}], {linkCurve: 0});
  const curved = laidOut([{source: "NYC", target: "LON"}], {linkCurve: 0.4});
  const a = straight.ctx.geomapCtx.flowLinks[0];
  const b = curved.ctx.geomapCtx.flowLinks[0];
  assert.strictEqual(a.size, 2, "every link 2px by default");
  const i = Math.floor(a.points.length / 2);
  assert.ok(
    b.points[i][1] < a.points[i][1],
    "the lifted arc rises above the great circle",
  );
  assert.strictEqual(
    geomapFlowLinks(geomap(), {
      pointData: [],
      topoData: [],
      pointR: () => 0,
      path: () => null,
    }).length,
    0,
  );
});

it("applyGeomapLayout frames the coordinate ends of links with no other geography", () => {
  const viz = new Geomap().config({
    width: 400,
    height: 300,
    tiles: false,
    projectionPadding: 0,
    links: [{source: [-74, 40.7], target: [139.7, 35.7]}],
  });
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._filteredData = [];
  viz._id = d => d.id;
  viz._drawLabel = d => `${d.id}`;
  applyGeomapLayout({viz});
  const {projection} = viz.schema;
  for (const p of [
    [-74, 40.7],
    [139.7, 35.7],
  ]) {
    const [x, y] = projection(p);
    assert.ok(
      x >= -0.5 && x <= 400.5 && y >= -0.5 && y <= 300.5,
      `${p} in view: ${x},${y}`,
    );
  }
  const link = viz.ctx.geomapCtx.flowLinks[0];
  assert.strictEqual(link.source.label, "-74, 40.7");
});

it("emitFlowLinks draws each link, its hit path, and its arrowheads, widest first", () => {
  const viz = laidOut(
    [
      {source: "NYC", target: "LON", n: 1},
      {source: "LON", target: "NYC", n: 9},
    ],
    {linkSize: d => d.n, arrows: "both"},
  );
  const links = viz.ctx.geomapCtx.flowLinks;
  const nodes = emitFlowLinks(viz, links);
  const keys = nodes.map(n => n.key);
  assert.deepStrictEqual(keys.slice(0, 4), [
    "geomap-link-LON-NYC-1",
    "geomap-link-NYC-LON-0",
    "geomap-link-LON-NYC-1::hit",
    "geomap-link-NYC-LON-0::hit",
  ]);
  assert.strictEqual(nodes.length, 8, "two arrowheads per link");
  const [wide] = nodes;
  assert.strictEqual(wide.paint.fill, "none");
  assert.strictEqual(
    wide.paint.stroke,
    flowLinkGray(viz),
    "the map's link gray",
  );
  assert.strictEqual(wide.paint.strokeWidth, links[1].size);
  assert.strictEqual(wide.datum, links[1].datum);
  assert.strictEqual(wide.aria.label, "London to New York, 9.");
  const arrows = nodes.slice(4);
  assert.ok(
    arrows.every(
      n => n.interactive === false && n.paint.fill === flowLinkGray(viz),
    ),
  );
  assert.strictEqual(flowLinkKey(links[0]), "geomap-link-NYC-LON-0");
  assert.deepStrictEqual(emitFlowLinks(viz, []), []);

  viz.arrows(false).linkColor(d => (d.n > 5 ? "#ff0000" : "#0000ff"));
  const colored = emitFlowLinks(viz, links);
  assert.strictEqual(colored.length, 4, "no arrowheads");
  assert.strictEqual(colored[0].paint.stroke, "#ff0000");
  assert.strictEqual(colored[1].paint.stroke, "#0000ff");
});

it("flowLinkGray mixes the chart's background and text colors", () => {
  const light = flowLinkGray({_theme: {...themeLight, dark: false}});
  const dark = flowLinkGray({_theme: {...themeDark, dark: true}});
  const lum = c =>
    c
      .match(/\d+/g)
      .slice(0, 3)
      .reduce((a, b) => a + +b, 0) / 3;
  assert.ok(lum(light) > 80 && lum(light) < 180, `a mid gray: ${light}`);
  assert.ok(lum(dark) > 80 && lum(dark) < 180, `a mid gray: ${dark}`);
  assert.notStrictEqual(light, dark);
});

it("emitFlowLinks colors links by an end's point", () => {
  const viz = laidOut([{source: "NYC", target: "LON"}], {
    linkColor: "source",
    shapeConfig: {
      Circle: {fill: d => (d.id === "NYC" ? "#123456" : "#654321")},
    },
  });
  const [path] = emitFlowLinks(viz, viz.ctx.geomapCtx.flowLinks);
  assert.strictEqual(path.paint.stroke, "#123456");
});

it("emitFlowLabels labels each link at its middle, inert to the pointer", () => {
  const viz = laidOut([{source: "NYC", target: "LON", n: 1200}]);
  const links = viz.ctx.geomapCtx.flowLinks;
  assert.deepStrictEqual(
    emitFlowLabels(viz, links, []),
    [],
    "no linkLabel, no labels",
  );
  viz.linkLabel("n");
  const [label] = emitFlowLabels(viz, links, []);
  assert.strictEqual(label.type, "group");
  assert.strictEqual(label.interactive, false);
  assert.strictEqual(label.datum, links[0].datum);
  assert.strictEqual(label.key, "geomap-link-NYC-LON-0-label-group");
  const text = JSON.stringify(label.children);
  assert.ok(text.includes("1.2k") || text.includes("1,200"), text);
});

it("flowLinkBox and flowHoverPredicate read a drawn link", () => {
  const viz = laidOut([
    {source: "NYC", target: "LON"},
    {source: "LON", target: "R1"},
  ]);
  const [a, b] = viz.ctx.geomapCtx.flowLinks;
  assert.deepStrictEqual(flowLinkBox(viz, a.datum), a.box);
  assert.strictEqual(flowLinkBox(viz, {}), null);

  const overLink = flowHoverPredicate(viz, a.datum);
  assert.ok(overLink(a.datum, 0));
  assert.ok(!overLink(b.datum, 1));
  assert.ok(overLink(cities[0], 0) && overLink(cities[1], 1));
  assert.ok(!overLink(region, 2));

  const overCity = flowHoverPredicate(viz, cities[1]);
  assert.ok(overCity(a.datum, 0) && overCity(b.datum, 1), "London's two links");
  assert.ok(overCity(region, 2), "and the region it links to");
  assert.strictEqual(flowHoverPredicate(viz, {id: "elsewhere"}), null);
});

it("setupGeomapLinks hovers and focuses links, and clears the focus on another click", () => {
  const viz = laidOut([{source: "NYC", target: "LON"}]);
  const [link] = viz.ctx.geomapCtx.flowLinks;
  const on = viz.schema.on;
  viz.schema.tooltip = () => false;
  const calls = [];
  viz._tooltipClass = {data: () => ({render: () => calls.push("tooltip")})};
  viz._scheduleSceneRepaint = () => calls.push("repaint");
  viz._select = {style: () => viz._select};
  on["mousemove.shape"](link.datum, 0, link.datum, {});
  assert.strictEqual(typeof viz._hover, "function");
  assert.ok(viz._hover(cities[0], 0), "the link's end is emphasized");
  on["mouseleave.shape"](link.datum, 0, link.datum, {});
  assert.strictEqual(viz._hover, false);

  on["click.shape"](link.datum, 0, link.datum, {stopPropagation() {}});
  assert.strictEqual(viz._focus, "link:0");
  assert.ok(viz._active(link.datum, 0));
  on["click.shape"](cities[0], 0, cities[0], {stopPropagation() {}});
  assert.strictEqual(
    viz._focus,
    undefined,
    "a click on another mark clears it",
  );
  assert.strictEqual(viz._active, false);

  // `links` stores rows given directly.
  const rows = [{source: "LON", target: "NYC"}];
  assert.strictEqual(viz.links(rows), viz);
  assert.strictEqual(viz.links(), rows);
  const fresh = new Geomap();
  setupGeomapLinks(fresh);
  assert.deepStrictEqual(fresh.links(), []);
});

it("emitFlowLinks sizes arrowheads by the shared default, and arrowSize wins", () => {
  const viz = laidOut(
    [
      {source: "NYC", target: "LON", n: 1},
      {source: "LON", target: "NYC", n: 100},
    ],
    {linkSize: d => d.n, linkSizeMin: 1, linkSizeMax: 10, arrows: true},
  );
  const links = viz.ctx.geomapCtx.flowLinks;
  /** An arrowhead's tip-to-base length, from its path's three points. */
  const length = node => {
    const n = node.d.match(/-?[\d.]+/g).map(Number);
    const base = [(n[2] + n[4]) / 2, (n[3] + n[5]) / 2];
    return Math.hypot(n[0] - base[0], n[1] - base[1]);
  };
  const arrows = key =>
    emitFlowLinks(viz, links).find(n => n.key === `${key}-arrow-t`);
  const wide = arrows("geomap-link-LON-NYC-1");
  const thin = arrows("geomap-link-NYC-LON-0");
  assert.ok(Math.abs(length(wide) - 15) < 0.1, `wide: ${length(wide)}`);
  assert.ok(Math.abs(length(thin) - 6) < 0.1, `thin: ${length(thin)}`);
  viz.arrowSize(20);
  assert.ok(Math.abs(length(arrows("geomap-link-NYC-LON-0")) - 20) < 0.1);
});

it("geomapFlowLinks draws links unbowed on a globe", () => {
  const viz = laidOut([{source: "NYC", target: "LON"}], {
    projection: "geoOrthographic",
    linkCurve: 0.4,
  });
  const [link] = viz.ctx.geomapCtx.flowLinks;
  const {projection} = viz.schema;
  const path = geoPath(projection);
  assert.strictEqual(
    link.d,
    path({type: "LineString", coordinates: [cities[0].point, cities[1].point]}),
    "the great circle, as the globe clips it",
  );
});

it("visiblePointData drops the points a globe hides, and the layout draws only those", () => {
  const far = {id: "TYO", name: "Tokyo", point: ["139.7", "35.7"], pop: 5};
  const viz = geomap({projection: "geoOrthographic", topojson: false});
  viz._filteredData = [...cities, far];
  viz.projectionRotate([60, -30]);
  applyGeomapLayout({viz});
  const path = geoPath(viz.schema.projection);
  assert.deepStrictEqual(
    visiblePointData(viz, [...cities, far], path).map(d => d.id),
    ["NYC", "LON"],
  );
  assert.deepStrictEqual(
    viz.ctx.geomapCtx.pointData.map(d => d.id),
    ["NYC", "LON"],
  );
  // Turned to face Tokyo, it shows and New York and London hide.
  viz.projectionRotate([-150, -20]);
  viz._zoomSet = false;
  applyGeomapLayout({viz});
  assert.deepStrictEqual(
    viz.ctx.geomapCtx.pointData.map(d => d.id),
    ["TYO"],
  );
});

/** An arrowhead path's tip, base corners, and axis (tip to base midpoint). */
function headOf(node) {
  const n = node.d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi).map(Number);
  const tip = [n[0], n[1]];
  const base = [(n[2] + n[4]) / 2, (n[3] + n[5]) / 2];
  return {tip, base, corners: [tip, [n[2], n[3]], [n[4], n[5]]]};
}

/** How far `p` is from the line through `a` and `b`. */
const offAxis = (p, a, b) =>
  Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) /
  Math.hypot(b[0] - a[0], b[1] - a[1]);

it("flowArrowEdge ends the stroke at each head's base, on its axis", () => {
  const viz = laidOut([{source: "NYC", target: "LON"}], {
    arrows: "both",
    linkSize: 4,
  });
  const [link] = viz.ctx.geomapCtx.flowLinks;
  const {d, arrows} = flowArrowEdge(viz, link, "#123456");
  assert.deepStrictEqual(
    arrows.map(n => n.key),
    ["geomap-link-NYC-LON-0-arrow-t", "geomap-link-NYC-LON-0-arrow-s"],
  );
  const runs = pathRuns(d);
  const stroke = runs.flat();
  const ends = {t: stroke[stroke.length - 1], s: stroke[0]};
  for (const node of arrows) {
    const {tip, base} = headOf(node);
    const end = node.key.endsWith("-t") ? ends.t : ends.s;
    assert.ok(offAxis(end, tip, base) < 0.01, "on the head's axis");
    const back = Math.hypot(end[0] - tip[0], end[1] - tip[1]);
    const size = Math.hypot(base[0] - tip[0], base[1] - tip[1]);
    assert.ok(
      Math.abs(back - arrowTrim(size, 4)) < 0.01 &&
        Math.abs(back - size) < 0.01,
      `at the head's base: ${back}`,
    );
    assert.strictEqual(node.paint.fill, "#123456");
  }
  // The tip clears the point at its end.
  const lon = [link.targetAt, link.target.r];
  const {tip} = headOf(arrows[0]);
  assert.ok(
    Math.abs(
      Math.hypot(tip[0] - lon[0][0], tip[1] - lon[0][1]) - (lon[1] + 1),
    ) < 0.5,
  );

  // With no heads, the 4px stroke stops with its corners on each point.
  viz.arrows(false);
  const bare = flowArrowEdge(viz, link, "#000");
  assert.deepStrictEqual(bare.arrows, []);
  const line = pathRuns(bare.d).flat();
  const reach = r => Math.sqrt(r * r - 4);
  const [s0, t0] = [link.sourceAt, link.targetAt];
  assert.ok(
    Math.abs(
      Math.hypot(line[0][0] - s0[0], line[0][1] - s0[1]) - reach(link.source.r),
    ) < 0.05,
  );
  const last = line[line.length - 1];
  assert.ok(
    Math.abs(Math.hypot(last[0] - t0[0], last[1] - t0[1]) - reach(lon[1])) <
      0.05,
  );
});

it("flowArrowEdge puts a head only on the end a globe draws, and the hit path keeps the whole link", () => {
  const far = {id: "TYO", name: "Tokyo", point: [139.7, 35.7], pop: 5};
  const viz = geomap({
    projection: "geoOrthographic",
    topojson: false,
    arrows: "both",
    links: [{source: "LON", target: "TYO"}],
  });
  viz._filteredData = [...cities, far];
  viz.projectionRotate([60, -30]);
  applyGeomapLayout({viz});
  const [link] = viz.ctx.geomapCtx.flowLinks;
  assert.strictEqual(link.targetAt, null, "Tokyo is behind the globe");
  const {arrows} = flowArrowEdge(viz, link, "#000");
  assert.deepStrictEqual(
    arrows.map(n => n.key),
    ["geomap-link-LON-TYO-0-arrow-s"],
  );
  const nodes = emitFlowLinks(viz, [link]);
  const hit = nodes.find(n => n.key.endsWith("::hit"));
  assert.strictEqual(hit.d, link.d);
  const stroke = nodes.find(n => n.key === "geomap-link-LON-TYO-0");
  assert.notStrictEqual(stroke.d, link.d, "the stroke is trimmed");
  assert.strictEqual(stroke.paint.strokeLinecap, "butt");
});
