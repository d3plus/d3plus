import {it} from "vitest";
import assert from "assert";
import {readFileSync} from "node:fs";

import {pathRings} from "@d3plus/render";

import {useJsdom} from "~test/jsdom.js";
import {Geomap} from "../../index.ts";
import {applyGeomapLayout} from "../../src/charts/Geomap/applyLayout.ts";
import {
  DotScatter,
  dotCounts,
  dotsPathD,
  insideRings,
  niceCeil,
  ringsBounds,
  seededRandom,
} from "../../src/charts/Geomap/dotDensity.ts";
import {
  DOT_DEFAULTS,
  DOT_MAX,
  dotDensitySettings,
  geomapDotDensity,
} from "../../src/charts/Geomap/dotDensityLayout.ts";
import {
  GEO_BIN_RADIUS,
  geoBinColorRows,
  geoBinMeta,
  geoBinOrigin,
  geoBinPoints,
  geoBinRows,
  geoBinTitle,
  geoBinTooltipRows,
  geoBinValue,
  geoHexbinSettings,
} from "../../src/charts/Geomap/geoHexbin.ts";
import {
  geomapDensity,
  geomapRegionRows,
} from "../../src/charts/Geomap/densityLayout.ts";
import {
  densityTooltipRows,
  geomapTooltipConfig,
  dotTooltipRows,
  noteDotRows,
} from "../../src/charts/Geomap/densityTooltip.ts";
import {
  densityFields,
  densityLegend,
  syncDensityColorScale,
} from "../../src/charts/Geomap/densityFields.ts";
import {
  dotFill,
  emitBins,
  emitDots,
} from "../../src/charts/Geomap/densityEmit.ts";
import {ownColorScale} from "../../src/charts/features/colorScaleValue.ts";

useJsdom();

/**
    Geomap's `dotDensity` and `hexbin`: seeded dots scattered inside each
    region, their counts and cap, and coordinate points binned into
    hexagons colored on the colorScale.
*/

const read = file =>
  JSON.parse(
    readFileSync(new URL(`../../dev/charts/Geomap/${file}`, import.meta.url)),
  );
const states = read("State.json");
const population = read("state-population.json");

const square = [
  [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ],
];
const hole = [
  [
    [3, 3],
    [7, 3],
    [7, 7],
    [3, 7],
  ],
];

it("seededRandom gives the same numbers in [0, 1) for the same key", () => {
  const a = seededRandom("06|"),
    b = seededRandom("06|"),
    c = seededRandom("48|");
  const xs = Array.from({length: 50}, a);
  assert.deepStrictEqual(xs, Array.from({length: 50}, b));
  assert.notDeepStrictEqual(xs, Array.from({length: 50}, c));
  assert.ok(xs.every(x => x >= 0 && x < 1));
  assert.ok(new Set(xs).size === xs.length, "no repeats");
});

it("insideRings follows the even-odd rule: holes cut out, parts add up", () => {
  assert.ok(insideRings(1, 1, square));
  assert.ok(!insideRings(11, 1, square));
  assert.ok(!insideRings(5, 5, [...square, ...hole]), "inside the hole");
  assert.ok(insideRings(1, 5, [...square, ...hole]), "around the hole");
  const far = [
    [
      [20, 20],
      [30, 20],
      [30, 30],
    ],
  ];
  assert.ok(insideRings(28, 22, [...square, ...far]), "a second part");
  assert.ok(!insideRings(15, 15, [...square, ...far]), "between the parts");
});

it("ringsBounds is the box around every ring", () => {
  assert.deepStrictEqual(ringsBounds([...square, [[-2, 4]]]), [-2, 0, 10, 10]);
  assert.strictEqual(ringsBounds([]), null);
});

it("DotScatter places dots inside the shape, the same way every time", () => {
  const rings = [...square, ...hole];
  const dots = new DotScatter(rings, "k").take(200);
  assert.strictEqual(dots.length, 200);
  assert.ok(dots.every(([x, y]) => insideRings(x, y, rings)));
  assert.deepStrictEqual(new DotScatter(rings, "k").take(200), dots);
  assert.notDeepStrictEqual(new DotScatter(rings, "j").take(200), dots);
});

it("DotScatter keeps the dots already placed when asked for more", () => {
  const scatter = new DotScatter(square, "k");
  const few = scatter.take(10);
  const more = scatter.take(30);
  assert.deepStrictEqual(more.slice(0, 10), few);
  assert.deepStrictEqual(scatter.take(5), few.slice(0, 5));
  assert.deepStrictEqual(new DotScatter(square, "k").take(30), more);
});

it("DotScatter keeps each dot in place when the shape is moved and scaled", () => {
  const moved = square.map(ring =>
    ring.map(([x, y]) => [x * 3 + 100, y * 3 - 5]),
  );
  const a = new DotScatter(square, "k").take(40);
  const b = new DotScatter(moved, "k").take(40);
  a.forEach(([x, y], i) => {
    assert.ok(Math.abs(b[i][0] - (x * 3 + 100)) < 1e-9);
    assert.ok(Math.abs(b[i][1] - (y * 3 - 5)) < 1e-9);
  });
});

it("DotScatter gives up on a shape too thin to hold dots", () => {
  const line = [
    [
      [0, 0],
      [10, 0],
      [5, 0],
    ],
  ];
  assert.deepStrictEqual(new DotScatter(line, "k").take(5), []);
  assert.deepStrictEqual(new DotScatter([], "k").take(5), []);
});

it("niceCeil rounds up to 1, 2, 2.5 or 5 times a power of ten", () => {
  assert.strictEqual(niceCeil(1000), 1000);
  assert.strictEqual(niceCeil(1001), 2000);
  assert.strictEqual(niceCeil(2100), 2500);
  assert.strictEqual(niceCeil(3000), 5000);
  assert.strictEqual(niceCeil(7000), 10000);
  assert.strictEqual(niceCeil(0.03), 0.05);
  assert.strictEqual(niceCeil(0), 1);
});

it("dotCounts rounds each value to dots, and holds the total to the cap", () => {
  assert.deepStrictEqual(dotCounts([2400, 2600, -5, NaN], 1000, 100), {
    counts: [2, 3, 0, 0],
    per: 1000,
  });
  const {counts, per} = dotCounts([60000, 30000, 10000], 100, 500);
  assert.strictEqual(per, 200);
  assert.deepStrictEqual(counts, [300, 150, 50]);
  assert.ok(counts.reduce((a, b) => a + b) <= 500);
  assert.deepStrictEqual(dotCounts([5], 0, 0), {counts: [5], per: 1});
});

it("dotsPathD draws each dot as a circle of two arcs", () => {
  const d = dotsPathD(
    [
      [10, 20],
      [30.123, 40],
    ],
    1.5,
  );
  assert.strictEqual(
    d,
    "M8.5,20a1.5,1.5 0 1,0 3,0a1.5,1.5 0 1,0 -3,0M28.62,40a1.5,1.5 0 1,0 3,0a1.5,1.5 0 1,0 -3,0",
  );
  assert.strictEqual(dotsPathD([], 2), "");
});

it("dotDensitySettings reads dotDensity, with defaults, off without a value or under a cartogram", () => {
  const viz = new Geomap();
  assert.strictEqual(dotDensitySettings(viz), null);
  viz.dotDensity({per: 10});
  assert.strictEqual(dotDensitySettings(viz), null, "no value");
  viz.dotDensity({value: "Population"});
  const s = dotDensitySettings(viz);
  assert.strictEqual(s.per, DOT_DEFAULTS.per);
  assert.strictEqual(s.r, DOT_DEFAULTS.r);
  assert.strictEqual(s.fillOpacity, DOT_DEFAULTS.fillOpacity);
  assert.strictEqual(s.max, DOT_MAX.svg);
  assert.strictEqual(s.valueName, "Population");
  assert.strictEqual(s.value({Population: 5}), 5);
  viz._renderer = "canvas";
  assert.strictEqual(dotDensitySettings(viz).max, DOT_MAX.canvas);
  viz.dotDensity({value: d => d.n, per: 5, r: 2, fillOpacity: 3, max: 9});
  const t = dotDensitySettings(viz);
  assert.deepStrictEqual(
    [t.per, t.r, t.fillOpacity, t.max, t.valueName],
    [5, 2, 1, 9, undefined],
  );
  viz.cartogram("dorling");
  assert.strictEqual(dotDensitySettings(viz), null, "a cartogram wins");
});

/** Runs Geomap's layout over the states with `config`. */
function laidOut(config = {}, rows = population, depth = 0) {
  const viz = new Geomap().config({
    width: 800,
    height: 500,
    tiles: false,
    topojson: states,
    projection: "geoAlbersUsa",
    groupBy: "State ID",
    legend: false,
    ...config,
  });
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._filteredData = rows;
  viz._drawDepth = depth;
  viz._id = d => d["State ID"];
  viz._ids = d =>
    depth ? [d.Category, d["State ID"]].map(String) : [d["State ID"]];
  viz._drawLabel = (d, i, k) =>
    k === 0 && depth ? d.Category : (d.Abbr ?? d.id);
  applyGeomapLayout({viz});
  return viz;
}

/** The states split into two categories, a third and two thirds of each. */
const split = population.flatMap(d => [
  {...d, Category: "A", Population: d.Population / 3},
  {...d, Category: "B", Population: (2 * d.Population) / 3},
]);

it("geomapDotDensity scatters each state's dots inside it, one per `per`", () => {
  const viz = laidOut({dotDensity: {value: "Population", per: 100000}});
  const {dots} = viz.ctx.geomapCtx.density;
  assert.strictEqual(dots.categories, false);
  assert.strictEqual(dots.per, 100000);
  assert.strictEqual(dots.groups.length, population.length);
  const ca = dots.groups.find(g => g.region === "04000US06");
  assert.strictEqual(ca.points.length, Math.round(39538223 / 100000));
  const topo = viz.ctx.geomapCtx.topoData.find(t => t.id === "04000US06");
  const rings = pathRings(viz.ctx.geomapCtx.pathFn(topo));
  assert.ok(ca.points.every(([x, y]) => insideRings(x, y, rings)));
  // The same layout again keeps every dot.
  const again = laidOut({dotDensity: {value: "Population", per: 100000}});
  const ca2 = again.ctx.geomapCtx.density.dots.groups.find(
    g => g.region === "04000US06",
  );
  assert.deepStrictEqual(ca2.points, ca.points);
});

it("geomapDotDensity keeps every dot in place through a resize", () => {
  const small = laidOut({dotDensity: {value: "Population", per: 200000}});
  const big = laidOut({
    width: 1200,
    height: 750,
    dotDensity: {value: "Population", per: 200000},
  });
  const tx = v =>
    v.ctx.geomapCtx.density.dots.groups.find(g => g.region === "04000US48")
      .points;
  const a = tx(small),
    b = tx(big);
  assert.strictEqual(a.length, b.length);
  // The map scales about a shifted origin: every dot keeps its spot.
  const k = (b[1][0] - b[0][0]) / (a[1][0] - a[0][0]);
  assert.ok(k > 1.4, `scale ${k}`);
  a.forEach(([x, y], i) => {
    assert.ok(Math.abs(b[i][0] - (b[0][0] + (x - a[0][0]) * k)) < 0.01);
    assert.ok(Math.abs(b[i][1] - (b[0][1] + (y - a[0][1]) * k)) < 0.01);
  });
});

it("geomapDotDensity raises `per` to a round number past the cap", () => {
  const viz = laidOut({
    dotDensity: {value: "Population", per: 1000, max: 5000},
  });
  const {dots} = viz.ctx.geomapCtx.density;
  assert.strictEqual(dots.per, 100000);
  const total = dots.groups.reduce((s, g) => s + g.points.length, 0);
  assert.ok(total <= 5000 && total > 2000, `${total} dots`);
});

it("geomapDotDensity gives each category its own dots, and the state its rows merged", () => {
  const viz = laidOut(
    {
      groupBy: ["Category", "State ID"],
      dotDensity: {value: "Population", per: 100000},
    },
    split,
    1,
  );
  const {dots} = viz.ctx.geomapCtx.density;
  assert.strictEqual(dots.categories, true);
  const ca = dots.groups.filter(g => g.region === "04000US06");
  assert.deepStrictEqual(
    ca.map(g => g.key),
    ["04000US06|A", "04000US06|B"],
  );
  assert.notDeepStrictEqual(ca[0].points[0], ca[1].points[0], "own streams");
  assert.ok(Math.abs(ca[1].points.length - 2 * ca[0].points.length) <= 1);
  const datum = viz.ctx.geomapCtx.topoData.find(t => t.id === "04000US06").data;
  assert.ok(Math.abs(datum.Population - 39538223) < 1, "merged");
});

it("geomapRegionRows groups the region rows by id and leaves out points", () => {
  const viz = new Geomap().groupBy("id");
  viz._filteredData = [
    {id: 1, v: 1},
    {id: 1, v: 2},
    {id: 2, v: 3},
    {id: 3, point: [0, 0]},
  ];
  viz._id = d => `${d.id}`;
  viz._drawDepth = 0;
  const {rows, data} = geomapRegionRows(viz);
  assert.deepStrictEqual([...rows.keys()], ["1", "2"]);
  assert.deepStrictEqual(
    rows.get("1").map(r => r.index),
    [0, 1],
  );
  assert.strictEqual(data["1"].v, 2, "the last row, without dot density");
  viz.dotDensity({value: "v"});
  viz._drawDepth = 1;
  assert.strictEqual(geomapRegionRows(viz).data["1"].v, 3, "summed");
});

const cities = [
  {id: "a", point: [-122.4, 37.8], amount: 10},
  {id: "b", point: [-122.41, 37.79], amount: 30},
  {id: "c", point: [-74, 40.7], amount: 5},
  {id: "d", point: [-95.4, 29.8]},
];

it("geoHexbinSettings resolves hexbin, off under a cartogram", () => {
  const viz = new Geomap();
  assert.strictEqual(geoHexbinSettings(viz), null);
  viz.hexbin(true);
  assert.deepStrictEqual(
    {...geoHexbinSettings(viz), weight: undefined},
    {radius: GEO_BIN_RADIUS, agg: "count", measure: "Count", weight: undefined},
  );
  viz.hexbin({radius: 20, value: "amount", agg: "mean"});
  const s = geoHexbinSettings(viz);
  assert.deepStrictEqual(
    [s.radius, s.agg, s.measure],
    [20, "mean", "Mean amount"],
  );
  viz.hexbin({value: "amount", label: "Sales"});
  assert.strictEqual(geoHexbinSettings(viz).measure, "Sales");
  viz.hexbin({label: "Stores"});
  assert.strictEqual(geoHexbinSettings(viz).measure, "Stores");
  viz.cartogram("demers");
  assert.strictEqual(geoHexbinSettings(viz), null);
});

it("geoBinRows bins points into hexagons, measuring each", () => {
  const points = [
    {x: 1, y: 1, row: {id: 1}, weight: 2},
    {x: 2, y: 2, row: {id: 2}, weight: 4},
    {x: 100, y: 100, row: {id: 3}, weight: 6},
  ];
  const rows = geoBinRows(points, {radius: 10, agg: "sum"});
  assert.strictEqual(rows.length, 2);
  const metas = rows.map(geoBinMeta).sort((a, b) => b.count - a.count);
  assert.deepStrictEqual(
    metas.map(m => [m.count, m.value]),
    [
      [2, 6],
      [1, 6],
    ],
  );
  assert.strictEqual(pathRings(metas[0].path)[0].length, 6, "a hexagon");
  assert.deepStrictEqual(metas[0].rows, [{id: 1}, {id: 2}]);
  assert.strictEqual(geoBinValue(rows[0]), geoBinMeta(rows[0]).value);
  assert.strictEqual(geoBinValue({id: 1}), undefined);
  assert.strictEqual(
    geoBinMeta({__d3plus__: true, data: rows[0]}),
    geoBinMeta(rows[0]),
  );
  // A mean with nothing to average is left out.
  assert.strictEqual(
    geoBinRows([{x: 0, y: 0, row: {}}], {radius: 5, agg: "mean"}).length,
    0,
  );
});

it("geoBinPoints projects the rows with a coordinate", () => {
  const viz = new Geomap().projection("geoAlbersUsa").point(d => d.point);
  const pts = geoBinPoints(viz, cities, {
    weight: d => d.amount,
  });
  assert.strictEqual(pts.length, 4);
  assert.deepStrictEqual(
    pts.map(p => p.weight),
    [10, 30, 5, NaN],
  );
  const off = geoBinPoints(viz, [{point: [0, 0]}, {point: "x"}], {});
  assert.strictEqual(off.length, 0, "clipped or not a coordinate");
  assert.deepStrictEqual(geoBinOrigin(viz), viz.projection().translate());
});

it("the hexbin layout bins the visible points and lays the colorScale over the bins", () => {
  const viz = laidOut(
    {hexbin: {radius: 15, value: "amount"}, point: d => d.point},
    cities,
  );
  const {bins} = viz.ctx.geomapCtx.density;
  assert.strictEqual(bins.length, 3, "San Francisco's two share a bin");
  assert.deepStrictEqual(viz.ctx.geomapCtx.pointData, [], "no circles");
  assert.strictEqual(viz._sizeLegendFinal, null);
  const sf = bins.map(geoBinMeta).find(m => m.count === 2);
  assert.strictEqual(sf.value, 40);
  syncDensityColorScale(viz);
  assert.strictEqual(ownColorScale(viz), geoBinValue);
  assert.strictEqual(viz._colorScaleRows().length, 3);
  viz.hexbin(false);
  syncDensityColorScale(viz);
  assert.strictEqual(ownColorScale(viz), undefined);
  assert.strictEqual(viz._colorScaleRows, undefined);
});

it("geoBinColorRows reads every small-multiples panel's points", () => {
  const viz = laidOut({hexbin: true, point: d => d.point}, cities);
  const settings = geoHexbinSettings(viz);
  assert.strictEqual(geoBinColorRows(viz, settings).length, 3);
  viz.ctx.geomapPanels = [cities.slice(0, 2), cities.slice(2)];
  assert.strictEqual(geoBinColorRows(viz, settings).length, 3, "not a facet");
  viz._facetStep = "panel";
  assert.strictEqual(geoBinColorRows(viz, settings).length, 3);
  viz.ctx.geomapPanels = [cities, cities];
  assert.strictEqual(geoBinColorRows(viz, settings).length, 6);
});

it("bin tooltips name the measure, and the count when it measures more", () => {
  const viz = laidOut({hexbin: {value: "amount"}, point: d => d.point}, cities);
  const bin = viz.ctx.geomapCtx.density.bins.find(
    b => geoBinMeta(b).count === 2,
  );
  assert.strictEqual(geoBinTitle(viz, bin), "Total amount: 40");
  assert.deepStrictEqual(geoBinTooltipRows(viz, bin), [["Count", "2"]]);
  const tooltip = geomapTooltipConfig(viz);
  assert.strictEqual(tooltip.title(bin, 0), "Total amount: 40");
  assert.deepStrictEqual(tooltip.tbody(bin, 0), [["Count", "2"]]);
  assert.deepStrictEqual(densityTooltipRows(viz, bin), [["Count", "2"]]);
  assert.strictEqual(geoBinTitle(viz, cities[0]), undefined);
  // Any other row is titled and listed as on a map without bins.
  assert.strictEqual(tooltip.title(cities[0], 0), "a");
  assert.deepStrictEqual(tooltip.tbody(cities[0], 0), []);
  viz.hexbin(true);
  assert.deepStrictEqual(geoBinTooltipRows(viz, bin), [], "a count");
});

it("dot tooltips list a state's categories, its dots, and what each stands for", () => {
  const viz = laidOut(
    {
      groupBy: ["Category", "State ID"],
      dotDensity: {value: "Population", per: 1000000},
    },
    split,
    1,
  );
  const ca = viz.ctx.geomapCtx.topoData.find(t => t.id === "04000US06").data;
  const rows = densityTooltipRows(viz, ca);
  assert.deepStrictEqual(
    rows.map(r => r[0]),
    ["B", "A", "Dots", "Each dot"],
  );
  assert.deepStrictEqual(rows.slice(2), [
    ["Dots", "39"],
    ["Each dot", "1M"],
  ]);
  const b = split.find(d => d.Abbr === "CA" && d.Category === "B");
  assert.deepStrictEqual(densityTooltipRows(viz, b), [
    ["B", "26.4M"],
    ["Dots", "26"],
    ["Each dot", "1M"],
  ]);
  assert.deepStrictEqual(densityTooltipRows(viz, {}), []);
});

it("dotTooltipRows names the value without categories, and noteDotRows feeds the tooltip", () => {
  const viz = new Geomap();
  viz.schema.translate = s => `~${s}`;
  const groups = [
    {row: {n: 1}, index: 0, value: 1500, points: [[0, 0]]},
    {row: {n: 2}, index: 1, value: 500, points: []},
  ];
  const dots = {
    groups,
    per: 1000,
    categories: false,
    settings: {valueName: undefined},
  };
  assert.deepStrictEqual(dotTooltipRows(viz, dots, groups), [
    ["~Value", "2k"],
    ["~Dots", "1"],
    ["~Each dot", "1k"],
  ]);
  const region = {n: 3};
  noteDotRows(viz, dots, new Map([[region, groups]]));
  assert.deepStrictEqual(densityTooltipRows(viz, region)[0], ["~Value", "2k"]);
  assert.deepStrictEqual(densityTooltipRows(viz, groups[1].row)[0], [
    "~Value",
    "500",
  ]);
});

it("dotFill takes dotDensity.fill, else the category color, else the text color", () => {
  const viz = laidOut(
    {
      groupBy: ["Category", "State ID"],
      dotDensity: {value: "Population"},
      shapeConfig: {Circle: {fill: d => (d.Category === "A" ? "red" : "blue")}},
    },
    split,
    1,
  );
  const {dots} = viz.ctx.geomapCtx.density;
  const g = dots.groups[0];
  assert.strictEqual(dotFill(viz, dots, g), "red");
  assert.strictEqual(
    dotFill(
      viz,
      {...dots, settings: {...dots.settings, fill: () => "green"}},
      g,
    ),
    "green",
  );
  const ink = dotFill(viz, {...dots, categories: false}, g);
  assert.ok(ink && ink !== "red");
});

it("emitDots draws a path of dots per group, and emitBins a hexagon per bin", () => {
  const viz = laidOut({dotDensity: {value: "Population", per: 1000000}});
  const {dots} = viz.ctx.geomapCtx.density;
  const nodes = emitDots(viz, dots);
  const drawn = dots.groups.filter(g => g.points.length);
  assert.strictEqual(nodes.length, drawn.length);
  const ca = nodes.find(n => n.key === "geomap-dots-04000US06|");
  assert.strictEqual(ca.type, "path");
  assert.strictEqual(ca.d.split("M").length - 1, 40);
  assert.strictEqual(ca.paint.fillOpacity, DOT_DEFAULTS.fillOpacity);
  assert.ok(ca.datum["State ID"] === "04000US06");
  assert.ok(ca.aria.label.includes("40"));
  assert.deepStrictEqual(emitDots(viz, null), []);

  const binned = laidOut({hexbin: true, point: d => d.point}, cities);
  // The colorScale reads the bins once the draw points it at them.
  syncDensityColorScale(binned);
  applyGeomapLayout({viz: binned});
  const bins = emitBins(binned, binned.ctx.geomapCtx.density.bins);
  assert.strictEqual(bins.length, 3);
  assert.ok(
    bins.every(n => n.type === "path" && n.key.startsWith("geomap-bin-")),
  );
  assert.ok(
    bins.every(n => n.paint.fill),
    "filled from the colorScale",
  );
  assert.deepStrictEqual(emitBins(binned, null), []);
});

it("geomapDensity lays out nothing with both off", () => {
  const viz = laidOut();
  assert.deepStrictEqual(viz.ctx.geomapCtx.density, {dots: null, bins: null});
  assert.deepStrictEqual(
    geomapDensity(viz, {
      regions: [],
      rows: new Map(),
      pathD: () => null,
      points: [],
    }),
    {dots: null, bins: null},
  );
  assert.strictEqual(
    geomapDotDensity(viz, [], new Map(), () => null),
    null,
  );
});

it("densityFields declares dotDensity and hexbin, off by default", () => {
  const keys = densityFields().map(f => f.key);
  assert.deepStrictEqual(keys, ["dotDensity", "hexbin"]);
  const viz = new Geomap();
  assert.strictEqual(viz.dotDensity(), false);
  assert.strictEqual(viz.hexbin(), false);
});

it("densityLegend hides the legend under hexbin bins, or one-color dots", () => {
  const viz = new Geomap();
  const legend = densityLegend(viz);
  viz.schema.legend = () => true;
  const arr = [{}, {}];
  viz._drawDepth = 0;
  viz._legendDepth = 0;
  // The wrapper calls the legend it wrapped, the chart's default.
  assert.strictEqual(typeof legend({}, arr), "boolean");
  viz.hexbin(true);
  assert.strictEqual(legend({}, arr), false);
  viz.hexbin(false).dotDensity({value: "v"});
  assert.strictEqual(legend({}, arr), false);
  viz._drawDepth = 1;
  assert.notStrictEqual(legend({}, arr), false);
});
