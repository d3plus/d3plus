import {it} from "vitest";
import assert from "assert";
import {binEdges} from "../../src/charts/Histogram/binData.ts";
import {
  binMarginal,
  boxMarginal,
  DENSITY_POINTS,
  densityMarginal,
  marginalScale,
  resolveMarginals,
} from "../../src/charts/Plot/marginalStats.ts";
import {
  MARGINAL_MAX,
  MARGINAL_MIN,
  MARGINAL_PADDING,
  marginalBands,
  marginalSize,
  plotMarginalLayout,
  resolveMarginalLayout,
} from "../../src/charts/Plot/marginalLayout.ts";
import {
  marginalGrouped,
  marginalSeries,
} from "../../src/charts/Plot/marginalSeries.ts";
import {
  MARGINAL_GROUP,
  emitMarginals,
  polygon,
} from "../../src/charts/Plot/marginalScene.ts";
import {
  marginalPaintDefaults,
  marginalPaintLayers,
  resolveMarginalPaint,
} from "../../src/charts/Plot/marginalPaint.ts";
import {
  marginalTitle,
  marginalTooltipRows,
} from "../../src/charts/Plot/marginalHover.ts";

/** Observations `{value, group, row}` from `[value, group]` pairs. */
const obs = pairs =>
  pairs.map(([value, group = ""], i) => ({value, group, row: {i, value}}));

it("binEdges: Sturges' edges across a fixed domain", () => {
  const edges = binEdges([1, 2, 3, 4, 5, 6, 7, 8, 9], {domain: [0, 10]});
  assert.strictEqual(edges[0], 0);
  assert.strictEqual(edges[edges.length - 1], 10);
  assert.ok(edges.length > 2);
  assert.deepStrictEqual(
    binEdges([1, 9], {domain: [0, 10], thresholds: [5]}),
    [0, 5, 10],
  );
  assert.deepStrictEqual(
    binEdges([1, 9], {domain: [0, 10], width: 5}),
    [0, 5, 10],
  );
});

it("resolveMarginals: a kind for both axes, or one per axis", () => {
  assert.deepStrictEqual(resolveMarginals("box"), {x: "box", y: "box"});
  assert.deepStrictEqual(resolveMarginals(true), {
    x: "histogram",
    y: "histogram",
  });
  assert.deepStrictEqual(resolveMarginals({x: "density"}), {
    x: "density",
    y: false,
  });
  assert.deepStrictEqual(resolveMarginals({x: "nope", y: "box"}), {
    x: false,
    y: "box",
  });
  for (const off of [false, undefined, null, "violin"])
    assert.deepStrictEqual(resolveMarginals(off), {x: false, y: false});
});

it("marginalScale: linear, log, time, and none for category axes", () => {
  const linear = marginalScale("linear");
  assert.strictEqual(linear.to(4), 4);
  assert.ok(Number.isNaN(linear.to("a")));
  assert.strictEqual(linear.from(4), 4);
  const log = marginalScale("log");
  assert.strictEqual(log.to(1000), 3);
  assert.ok(Number.isNaN(log.to(0)));
  assert.strictEqual(log.from(2), 100);
  const time = marginalScale("time");
  const date = new Date(Date.UTC(2020, 0, 1));
  assert.strictEqual(time.to(date), date.getTime());
  assert.ok(time.from(date.getTime()) instanceof Date);
  assert.strictEqual(marginalScale("Point"), null);
  assert.strictEqual(marginalScale("band"), null);
  assert.strictEqual(marginalScale("ordinal"), null);
});

it("binMarginal: shared edges, series stacked in order, empty bins skipped", () => {
  const points = obs([
    [1, "a"],
    [2, "a"],
    [2.5, "b"],
    [8, "b"],
    [9, "a"],
    [10, "b"],
    [42, "a"],
  ]);
  const {bins, max} = binMarginal(points, [10, 0], ["a", "b"], [5]);
  // The point outside the domain is left out; the domain's end is in the last bin.
  assert.deepStrictEqual(
    bins.map(b => [b.group, b.x0, b.x1, b.count, b.y0]),
    [
      ["a", 0, 5, 2, 0],
      ["b", 0, 5, 1, 2],
      ["a", 5, 10, 1, 0],
      ["b", 5, 10, 2, 1],
    ],
  );
  assert.strictEqual(max, 3);
  assert.deepStrictEqual(
    bins[0].rows.map(r => r.value),
    [1, 2],
  );
  assert.deepStrictEqual(binMarginal([], [0, 1], [""]), {bins: [], max: 0});
  assert.deepStrictEqual(binMarginal(points, [3, 3], ["a"]), {
    bins: [],
    max: 0,
  });
});

it("boxMarginal: quartiles, Tukey whiskers and outliers per series", () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 40];
  const boxes = boxMarginal(
    obs([...values.map(v => [v, "a"]), [5, "b"], [500, "b"]]),
    [0, 100],
    ["b", "a", "c"],
  );
  assert.deepStrictEqual(
    boxes.map(b => b.group),
    ["b", "a"],
    "in series order, without empty series",
  );
  const a = boxes[1];
  assert.strictEqual(a.rows.length, 10);
  assert.strictEqual(a.min, 1);
  assert.strictEqual(a.max, 40);
  assert.strictEqual(a.median, 5.5);
  assert.ok(a.first < a.median && a.median < a.third);
  assert.ok(a.upperLimit < 40, "the whisker stops short of the outlier");
  assert.deepStrictEqual(
    a.outliers.map(o => o.value),
    [40],
  );
  assert.strictEqual(boxes[0].rows.length, 1, "500 is outside the domain");
});

it("densityMarginal: one curve per series across the domain, scaled by share", () => {
  const points = obs([
    ...[1, 2, 2, 3, 3, 3, 4].map(v => [v, "a"]),
    ...[7, 8].map(v => [v, "b"]),
  ]);
  const {curves, max} = densityMarginal(points, [0, 10], ["b", "a"]);
  assert.deepStrictEqual(
    curves.map(c => c.group),
    ["b", "a"],
  );
  for (const c of curves) {
    assert.strictEqual(c.curve.length, DENSITY_POINTS);
    assert.strictEqual(c.curve[0][0], 0);
    assert.strictEqual(c.curve[c.curve.length - 1][0], 10);
  }
  assert.strictEqual(curves[1].rows.length, 7);
  const peak = c => Math.max(...c.curve.map(p => p[1]));
  assert.strictEqual(max, Math.max(...curves.map(peak)));
  // Scaled by its share, the larger series peaks higher.
  assert.ok(peak(curves[1]) > peak(curves[0]));
  assert.deepStrictEqual(densityMarginal([], [0, 1], [""]), {
    curves: [],
    max: 0,
  });
});

it("marginalSize: pixels, or a share of the shorter side within bounds", () => {
  assert.strictEqual(marginalSize(48, 600, 400), 48);
  assert.strictEqual(marginalSize(undefined, 600, 400), 60);
  assert.strictEqual(marginalSize(0.1, 600, 400), 40);
  assert.strictEqual(marginalSize(0.15, 100, 50), MARGINAL_MIN);
  assert.strictEqual(marginalSize(0.5, 2000, 2000), MARGINAL_MAX);
  assert.strictEqual(marginalSize(-3, 600, 400), 60);
});

/** A stub chart for the layout resolution. */
const layoutViz = (schema, swarm = null) => ({
  schema: {marginalConfig: {}, ...schema},
  _swarm: swarm,
});

it("resolveMarginalLayout: room above and beside for two continuous axes", () => {
  const area = {width: 600, height: 400};
  const types = {x: "linear", y: "log"};
  const both = resolveMarginalLayout(
    layoutViz({marginals: "histogram"}),
    area,
    types,
  );
  assert.strictEqual(both.size, 60);
  assert.strictEqual(both.padding, MARGINAL_PADDING);
  assert.strictEqual(both.top, 60 + MARGINAL_PADDING);
  assert.strictEqual(both.right, 60 + MARGINAL_PADDING);
  assert.strictEqual(both.scales.y.to(100), 2);
  const xOnly = resolveMarginalLayout(
    layoutViz({marginals: {x: "box"}, marginalConfig: {size: 30, padding: 0}}),
    area,
    types,
  );
  assert.deepStrictEqual(
    [xOnly.top, xOnly.right, xOnly.axes.y],
    [30, 0, false],
  );
  for (const viz of [
    layoutViz({marginals: false}),
    layoutViz({marginals: "box", discrete: "x"}),
    layoutViz({marginals: "box"}, {axis: "x"}),
  ])
    assert.strictEqual(resolveMarginalLayout(viz, area, types), null);
  assert.strictEqual(
    resolveMarginalLayout(layoutViz({marginals: "box"}), area, {
      x: "point",
      y: "linear",
    }),
    null,
  );
});

it("plotMarginalLayout: a category scale type wins over the axis's config scale", () => {
  const viz = layoutViz({marginals: "box"});
  const area = {width: 600, height: 400};
  const scales = (xScale, xConfigScale) => ({
    xScale,
    yScale: "Linear",
    xConfigScale,
    yConfigScale: "linear",
  });
  assert.strictEqual(
    plotMarginalLayout(viz, area, scales("Point", "linear")),
    null,
  );
  assert.ok(plotMarginalLayout(viz, area, scales("Time", "time")));
});

it("marginalBands: the top strip above the x2 axis, the right one past the y2 axis", () => {
  const plot = {xRange: [40, 500], yRange: [20, 320], x2Height: 20};
  const bands = marginalBands({size: 50, padding: 10}, plot);
  assert.deepStrictEqual(bands.x, {along: [40, 500], across: [-30, -80]});
  assert.deepStrictEqual(bands.y, {along: [0, 300], across: [510, 560]});
  const y2 = marginalBands({size: 50, padding: 10}, {...plot, y2Width: 30});
  assert.deepStrictEqual(y2.y.across, [540, 590]);
});

/** A stub chart whose points are colored by `group`. */
const seriesViz = (extra = {}) => ({
  schema: {
    shape: () => "Circle",
    shapeConfig: {fill: d => ({a: "#f00", b: "#00f"})[d.group] ?? "#0f0"},
    color: d => d.group,
    ...extra,
  },
  _legendDepth: 0,
  _drawLabel: d => `label ${d.id}`,
});

it("marginalGrouped: groups need several keys, one of them shared", () => {
  assert.strictEqual(marginalGrouped(["a", "a", "b"]), true);
  assert.strictEqual(marginalGrouped(["a", "b", "c"]), false);
  assert.strictEqual(marginalGrouped(["a", "a"]), false);
  assert.strictEqual(marginalGrouped([]), false);
});

it("marginalSeries: a series per legend entry, else one series", () => {
  const points = [
    {row: {id: 1, group: "a"}, i: 0},
    {row: {id: 2, group: "b"}, i: 1},
    {row: {id: 3, group: "a"}, i: 2},
  ];
  const grouped = marginalSeries(seriesViz(), points);
  assert.deepStrictEqual(
    grouped.series.map(s => [s.label, s.color]),
    [
      ["a", "#f00"],
      ["b", "#00f"],
    ],
  );
  assert.strictEqual(
    grouped.groupOf(points[2]),
    grouped.series[0].key,
    "the third point is in the first series",
  );
  // A color that is a CSS color names no category: the label names the row.
  const hex = marginalSeries(
    seriesViz({color: d => ({a: "#f00", b: "#00f"})[d.group]}),
    points,
  );
  assert.strictEqual(hex.series[0].label, "label 1");
  // Each point its own color: one gray series.
  const single = marginalSeries(seriesViz({color: d => d.id}), points);
  assert.strictEqual(single.series.length, 1);
  assert.strictEqual(single.series[0].label, "");
  assert.strictEqual(single.groupOf(points[1]), "");
  // A colorScale: one series, even with groups.
  const scaled = marginalSeries(seriesViz({colorScale: () => 1}), points);
  assert.strictEqual(scaled.series.length, 1);
  // Points sharing one fill keep it.
  const same = marginalSeries(
    seriesViz({color: d => d.id, shapeConfig: {fill: "#123456"}}),
    points,
  );
  assert.strictEqual(same.series[0].color, "#123456");
  assert.strictEqual(same.series[0].label, "");
  // Every point in one entry (the others hidden): one series, still named.
  const one = marginalSeries(
    seriesViz(),
    points.filter(p => p.row.group === "a"),
  );
  assert.deepStrictEqual(one.series, [{key: "", color: "#f00", label: "a"}]);
});

/** Every node of a subtree. */
const walk = node => [node, ...(node.children || []).flatMap(walk)];

/** A chart to emit marginals for: points 0–9 on both axes, two groups. */
function emitFixture(axes) {
  const rows = Array.from({length: 10}, (_, i) => ({
    id: i,
    group: i < 6 ? "a" : "b",
    v: i,
  }));
  const data = rows.map((d, i) => ({data: d, i, x: d.v, y: d.v}));
  const viz = {
    ...seriesViz(),
    _plotMarginals: {
      axes,
      scales: {x: marginalScale("linear"), y: marginalScale("linear")},
      size: 40,
      padding: 5,
      top: 45,
      right: 45,
    },
    _plotAxisDomains: {x: [0, 10], y: [0, 10]},
  };
  viz.schema.marginalConfig = {binThresholds: [5]};
  const frame = {
    x: v => v * 10,
    y: v => 100 - v * 10,
    xRange: [0, 100],
    yRange: [0, 100],
    x2Height: 0,
  };
  return {viz, data, rows, frame};
}

it("emitMarginals: nothing without a marginal layout", () => {
  const {viz, data, frame} = emitFixture({x: "histogram", y: false});
  assert.deepStrictEqual(
    emitMarginals({...viz, _plotMarginals: null}, data, frame),
    [],
  );
});

it("emitMarginals: histogram bins along each axis, drawn for their points", () => {
  const {viz, data, rows, frame} = emitFixture({
    x: "histogram",
    y: "histogram",
  });
  const [group] = emitMarginals(viz, data, frame);
  assert.strictEqual(group.key, "plot-marginals");
  const nodes = walk(group).slice(1);
  assert.ok(nodes.every(n => n.interactionGroup === MARGINAL_GROUP));
  assert.ok(nodes.every(n => n.datum === undefined && n.aria.hidden));
  const xs = nodes.filter(n => n.marginal.axis === "x");
  // Bins [0, 5) of "a" and [5, 10] of "a" and "b".
  assert.deepStrictEqual(
    xs.map(n => [n.marginal.series.label, n.marginal.rows.length]),
    [
      ["a", 5],
      ["a", 1],
      ["b", 4],
    ],
  );
  const first = xs[0];
  assert.deepStrictEqual(
    first.interactionPoints.map(p => p.datum),
    rows.slice(0, 5),
  );
  // The top strip sits above the plot, its tallest stack reaching the far edge.
  assert.ok(xs.every(n => n.y + n.height <= -5 + 1e-9 && n.y >= -45 - 1e-9));
  assert.ok(Math.abs(Math.min(...xs.map(n => n.y)) - -45) < 1e-9);
  assert.strictEqual(first.paint.fill, "#f00");
  // The right strip starts past the plot's right edge.
  const ys = nodes.filter(n => n.marginal.axis === "y");
  assert.ok(ys.length && ys.every(n => n.x >= 105 && n.x + n.width <= 145));
});

it("emitMarginals: boxes and density curves", () => {
  const {viz, data, frame} = emitFixture({x: "box", y: "density"});
  const nodes = walk(emitMarginals(viz, data, frame)[0]).slice(1);
  const boxes = nodes.filter(n => n.marginal.kind === "box");
  assert.deepStrictEqual(
    [...new Set(boxes.map(n => n.marginal.series.label))],
    ["a", "b"],
  );
  assert.ok(boxes.some(n => n.type === "rect"));
  assert.ok(boxes.filter(n => n.type === "line").length >= 5);
  const curves = nodes.filter(n => n.marginal.kind === "density");
  assert.deepStrictEqual(
    curves.map(n => n.type),
    ["path", "line", "path", "line"],
  );
  assert.ok(curves[0].enterD.startsWith("M"));
  assert.strictEqual(curves[1].paint.fill, "none");
  assert.ok(curves.every(n => n.marginal.axis === "y"));
});

it("polygon: out along the top line and back along the baseline", () => {
  assert.strictEqual(
    polygon(
      [
        [0, 5],
        [10, 2],
      ],
      [
        [0, 9],
        [10, 9],
      ],
    ),
    "M0,5L10,2L10,9L0,9Z",
  );
});

const mark = (kind = "box", color = "#f00") => ({
  axis: "x",
  kind,
  series: {key: "a", label: "a", color},
  rows: [],
});

it("marginalPaintDefaults: each kind in its series' color", () => {
  const defaults = marginalPaintDefaults();
  const d = mark();
  assert.strictEqual(defaults.histogram.fill(d), "#f00");
  assert.strictEqual(defaults.box.fillOpacity, 0.35);
  assert.strictEqual(defaults.box.stroke(d), "#f00");
  assert.deepStrictEqual(defaults.box.outlier, {
    fillOpacity: 1,
    stroke: "none",
    r: 2,
  });
  assert.strictEqual(defaults.density.strokeWidth, 1.5);
  assert.notStrictEqual(
    marginalPaintDefaults().box,
    defaults.box,
    "a fresh copy each call",
  );
});

it("marginalPaintLayers: defaults, then every mark, the kind, and the part", () => {
  const config = {
    fill: "top",
    size: 40,
    box: {stroke: "kind", median: {strokeWidth: 3}},
  };
  const layers = marginalPaintLayers(config, "box", "median");
  assert.strictEqual(layers.length, 4, "the median has no default layer");
  assert.strictEqual(layers[1], config);
  assert.strictEqual(layers[2], config.box);
  assert.deepStrictEqual(layers[3], {strokeWidth: 3});
  assert.strictEqual(marginalPaintLayers({}, "histogram").length, 2);
  assert.strictEqual(marginalPaintLayers({}, "box", "outlier").length, 3);
  // A part's defaults sit above the user's kind keys: outliers stay solid.
  const dots = resolveMarginalPaint(
    marginalPaintLayers(
      {box: {fillOpacity: 0.1, fill: "#0f0"}},
      "box",
      "outlier",
    ),
    "shape",
    mark(),
    0,
  ).paint;
  assert.deepStrictEqual([dots.fill, dots.fillOpacity], ["#0f0", 1]);
});

it("resolveMarginalPaint: last layer wins, accessors, and each role's keys", () => {
  const layers = marginalPaintLayers(
    {
      opacity: 0.8,
      box: {
        fill: (d, i) => `${d.series.key}-${i}`,
        strokeDasharray: "4 2",
        outlier: {r: 5},
      },
    },
    "box",
    "outlier",
  );
  const shape = resolveMarginalPaint(layers, "shape", mark(), 3);
  assert.deepStrictEqual(shape, {
    paint: {
      fill: "a-3",
      fillOpacity: 1,
      stroke: "none",
      strokeWidth: 1,
      strokeDasharray: [4, 2],
      opacity: 0.8,
    },
    r: 5,
  });
  const line = resolveMarginalPaint(layers, "line", mark(), 0).paint;
  assert.strictEqual(line.fill, "none");
  assert.strictEqual(line.fillOpacity, undefined);
  assert.strictEqual(line.stroke, "none");
  const fill = resolveMarginalPaint(
    marginalPaintLayers({}, "density"),
    "fill",
    mark("density", "#0a0"),
    0,
  ).paint;
  assert.deepStrictEqual(fill, {fill: "#0a0", fillOpacity: 0.3});
  assert.deepStrictEqual(
    resolveMarginalPaint(
      marginalPaintLayers({strokeDasharray: [3, "x", 1]}, "histogram"),
      "line",
      mark(),
      0,
    ).paint.strokeDasharray,
    [3, 1],
  );
});

it("emitMarginals: marginalConfig styles every mark, a kind, and a part", () => {
  const {viz, data, frame} = emitFixture({x: "box", y: "density"});
  const seen = [];
  viz.schema.marginalConfig = {
    opacity: 0.5,
    box: {
      fill: (d, i) => (seen.push([d.kind, d.series.label, i]), "#abc"),
      whisker: {strokeDasharray: "2 2"},
      outlier: {r: 4},
    },
    density: {stroke: "#123", fillOpacity: 0.6},
  };
  const nodes = walk(emitMarginals(viz, data, frame)[0]).slice(1);
  const rect = nodes.find(n => n.marginal.kind === "box" && n.type === "rect");
  assert.strictEqual(rect.paint.fill, "#abc");
  assert.strictEqual(rect.paint.opacity, 0.5);
  assert.strictEqual(rect.marginal.swatch, "#abc");
  const whisker = nodes.find(n => String(n.key).endsWith("whisker-low"));
  assert.deepStrictEqual(whisker.paint.strokeDasharray, [2, 2]);
  const median = nodes.find(n => String(n.key).endsWith("median"));
  assert.strictEqual(median.paint.strokeDasharray, undefined);
  assert.ok(
    seen.some(([kind, label, i]) => kind === "box" && label === "b" && i === 1),
  );
  const [fill, outline] = nodes.filter(n => n.marginal.kind === "density");
  assert.strictEqual(fill.paint.fillOpacity, 0.6);
  assert.strictEqual(fill.paint.stroke, undefined);
  assert.strictEqual(outline.paint.stroke, "#123");
  assert.strictEqual(outline.paint.opacity, 0.5);
});

/** A stub chart for the tooltip. */
const tipViz = () => ({
  schema: {locale: "en-US", translate: s => `t:${s}`},
  _xConfig: {},
  _xKey: "gdp",
  _yConfig: {title: "Life"},
  _plotMarginals: {
    scales: {x: marginalScale("log"), y: marginalScale("linear")},
  },
});

it("marginalTitle: the series, or the axis for one series", () => {
  const viz = tipViz();
  assert.strictEqual(
    marginalTitle(viz, {axis: "x", series: {label: "Asia"}}),
    "Asia",
  );
  assert.strictEqual(
    marginalTitle(viz, {axis: "y", series: {label: ""}}),
    "Life",
  );
});

it("marginalTooltipRows: a bin's range and count, a box's statistics", () => {
  const viz = tipViz();
  const rows = [{}, {}, {}];
  assert.deepStrictEqual(
    marginalTooltipRows(viz, {
      axis: "x",
      kind: "histogram",
      rows,
      bin: {x0: 2, x1: 3},
    }),
    [
      ["gdp", "100 – 1k"],
      ["t:Count", "3"],
    ],
  );
  const box = {
    lowerLimit: 1,
    first: 2,
    median: 3,
    third: 4,
    upperLimit: 5,
  };
  const out = marginalTooltipRows(viz, {axis: "y", kind: "box", rows, box});
  assert.deepStrictEqual(
    out.map(r => r[0]),
    [
      "t:Upper Whisker",
      "t:Upper Quartile",
      "t:Median",
      "t:Lower Quartile",
      "t:Lower Whisker",
      "t:Observations",
    ],
  );
  assert.deepStrictEqual(
    out.map(r => r[1]),
    ["5", "4", "3", "2", "1", "3"],
  );
  assert.deepStrictEqual(
    marginalTooltipRows(viz, {
      axis: "y",
      kind: "box",
      rows: [{}],
      box,
      outlier: {value: 9},
    }),
    [["Life", "9"]],
  );
  assert.deepStrictEqual(
    marginalTooltipRows(viz, {axis: "y", kind: "density", rows}, 7),
    [
      ["Life", "7"],
      ["t:Observations", "3"],
    ],
  );
  assert.deepStrictEqual(
    marginalTooltipRows(viz, {axis: "y", kind: "density", rows}),
    [["t:Observations", "3"]],
  );
});
