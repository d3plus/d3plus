import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BarChart, LinePlot, Scatter} from "../../index.ts";
import {runStages} from "../../internal.ts";
import {
  computePlotAxisValues,
  computePlotInitialDomains,
  formatPlotData,
} from "../../src/charts/Plot/pipeline.ts";
import {
  confidenceCrossAxis,
  confidenceValueAxis,
  crossAxisValues,
  crossBounds,
  resolveConfidenceAxes,
  rowCrossConfidence,
  syncConfidenceAxes,
} from "../../src/charts/Plot/confidenceAxes.ts";
import {
  appendPointConfidence,
  axisBoundRows,
  confidenceRows,
  confidenceTooltipEnabled,
} from "../../src/charts/Plot/confidenceTooltip.ts";
import {
  errorBarDefaults,
  errorBarExtent,
} from "../../src/charts/Plot/barConfidence.ts";
import {
  emitPointConfidence,
  pointErrorPath,
} from "../../src/charts/Plot/pointConfidence.ts";

useJsdom();

/**
    `confidence({x: [lower, upper], y: [lower, upper]})`: bounds on each
    axis. The value axis's bounds draw as lines' bands and bars' error bars;
    the other axis's draw on points (a cross with both), widen that axis,
    and list in tooltips.
*/

const rows = [
  {id: "a", x: 10, xl: 8, xh: 13, y: 5, yl: 4, yh: 7},
  {id: "b", x: 20, xl: 15, xh: 21, y: 9, yl: 6, yh: 11},
];

/** Runs a Plot's data → domain stages. */
function domains(viz) {
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  return runStages({viz}, [
    formatPlotData,
    computePlotAxisValues,
    computePlotInitialDomains,
  ]).plotInitialDomains;
}

it("resolveConfidenceAxes: a {x, y} setting by axis; anything else is null", () => {
  const axes = resolveConfidenceAxes({x: ["xl", "xh"], y: [false, "yh"]});
  assert.strictEqual(axes.x.lower(rows[0]), 8);
  assert.strictEqual(axes.x.upper(rows[0]), 13);
  assert.strictEqual(axes.y.lower, false);
  assert.strictEqual(axes.y.upper(rows[0]), 7);
  assert.deepStrictEqual(
    Object.keys(resolveConfidenceAxes({x: {lower: "xl", upper: "xh"}})),
    ["x"],
  );
  assert.deepStrictEqual(resolveConfidenceAxes({x: false}), {});
  for (const other of [["lo", "hi"], {lower: "lo", upper: "hi"}, false, null])
    assert.strictEqual(resolveConfidenceAxes(other), null);
  // A band object that happens to have an x key stays a band.
  assert.strictEqual(resolveConfidenceAxes({lower: "lo", x: 1}), null);
});

it("confidenceValueAxis / confidenceCrossAxis: y and x, swapped by discrete y", () => {
  assert.deepStrictEqual(
    [confidenceValueAxis(new Scatter()), confidenceCrossAxis(new Scatter())],
    ["y", "x"],
  );
  const bars = new BarChart().discrete("y");
  assert.deepStrictEqual(
    [confidenceValueAxis(bars), confidenceCrossAxis(bars)],
    ["x", "y"],
  );
});

it("syncConfidenceAxes: the value axis's bounds become the pair, the other the cross bounds", () => {
  const viz = new Scatter().confidence({x: ["xl", "xh"], y: ["yl", "yh"]});
  syncConfidenceAxes(viz);
  assert.strictEqual(viz._confidence[0](rows[0]), 4);
  assert.strictEqual(viz._confidenceCross[1](rows[0]), 13);
  viz.discrete("y");
  syncConfidenceAxes(viz);
  assert.strictEqual(viz._confidence[0](rows[0]), 8);
  assert.strictEqual(viz._confidenceCross[0](rows[0]), 4);
  // x only on a Scatter: no value-axis pair, only cross bounds.
  viz.discrete(undefined).confidence({x: ["xl", "xh"]});
  syncConfidenceAxes(viz);
  assert.strictEqual(viz._confidence, false);
  assert.ok(viz._confidenceCross);
  // An array setting has no cross bounds.
  viz.confidence(["yl", "yh"]);
  syncConfidenceAxes(viz);
  assert.strictEqual(viz._confidenceCross, false);
});

it("Plot.confidence(): returns a {x, y} setting's axes", () => {
  const viz = new Scatter().confidence({x: ["xl", "xh"]});
  assert.deepStrictEqual(Object.keys(viz.confidence()), ["x"]);
  viz.confidence(false);
  assert.strictEqual(viz.confidence(), false);
});

it("rowCrossConfidence / crossBounds: a row's cross bounds", () => {
  const viz = new Scatter().confidence({x: ["xl", "xh"], y: ["yl", "yh"]});
  assert.deepStrictEqual(rowCrossConfidence(viz, rows[1], 1), {
    lower: 15,
    upper: 21,
  });
  assert.deepStrictEqual(crossBounds(viz, rows[1], 1), {clci: 15, chci: 21});
  assert.deepStrictEqual(rowCrossConfidence(viz, {}, 0), {});
  const plain = new Scatter().confidence(["yl", "yh"]);
  assert.deepStrictEqual(crossBounds(plain, rows[1], 1), {});
  assert.deepStrictEqual(rowCrossConfidence(plain, rows[1], 1), {});
});

it("crossAxisValues: cross bounds widen only the cross axis", () => {
  const viz = new Scatter().confidence({x: ["xl", "xh"]});
  const plotted = [
    {clci: 8, chci: 13},
    {clci: 15, chci: NaN},
  ];
  assert.deepStrictEqual(crossAxisValues(viz, plotted, "x"), [8, 13, 15]);
  assert.deepStrictEqual(crossAxisValues(viz, plotted, "x2"), [8, 13, 15]);
  assert.deepStrictEqual(crossAxisValues(viz, plotted, "y"), []);
});

it("Scatter: each axis widens for its own bounds only", () => {
  const base = () => new Scatter().data(rows).groupBy("id").x("x").y("y");
  const both = domains(base().confidence({x: ["xl", "xh"], y: ["yl", "yh"]}));
  assert.deepStrictEqual(
    [both.x, both.y],
    [
      [8, 21],
      [4, 11],
    ],
  );
  // An array widens y alone; it no longer stretches x by y's bounds.
  const yOnly = domains(base().confidence(["yl", "yh"]));
  assert.deepStrictEqual(
    [yOnly.x, yOnly.y],
    [
      [10, 20],
      [4, 11],
    ],
  );
  const xOnly = domains(base().confidence({x: ["xl", "xh"]}));
  assert.deepStrictEqual(
    [xOnly.x, xOnly.y],
    [
      [8, 21],
      [5, 9],
    ],
  );
});

it("BarChart and LinePlot: a {x, y} setting draws its value-axis bounds", () => {
  const bars = new BarChart()
    .data(rows)
    .groupBy("id")
    .discrete("y")
    .y("id")
    .x("x")
    .confidence({x: ["xl", "xh"], y: ["yl", "yh"]});
  // The initial domain spans the bounds; the baseline joins it later.
  assert.deepStrictEqual(domains(bars).x, [8, 21]);
  const lines = new LinePlot()
    .data(rows)
    .groupBy("id")
    .x("x")
    .y("y")
    .confidence({y: ["yl", "yh"]});
  assert.deepStrictEqual(domains(lines).y, [4, 11]);
});

it("axisBoundRows / confidenceRows: both axes' bounds, named for their axes", () => {
  const viz = new Scatter()
    .x("x")
    .y("y")
    .confidence({x: ["xl", "xh"], y: ["yl", "yh"]});
  syncConfidenceAxes(viz);
  const fmt = v => `${v}`;
  const expected = [
    ["Lower Bound (x)", "8"],
    ["Upper Bound (x)", "13"],
    ["Lower Bound (y)", "4"],
    ["Upper Bound (y)", "7"],
  ];
  assert.deepStrictEqual(axisBoundRows(viz, rows[0], 0, fmt), expected);
  assert.deepStrictEqual(confidenceRows(viz, rows[0], 0, fmt), expected);
  // Cross bounds alone still show in tooltips.
  viz.confidence({x: ["xl", "xh"]});
  syncConfidenceAxes(viz);
  assert.ok(confidenceTooltipEnabled(viz));
  assert.deepStrictEqual(
    confidenceRows(viz, rows[0], 0, fmt),
    expected.slice(0, 2),
  );
  viz.confidenceConfig({tooltip: false});
  assert.deepStrictEqual(confidenceRows(viz, rows[0], 0, fmt), []);
});

it("pointErrorPath: a capped stroke through the point along each bounded axis", () => {
  const caps = {lower: true, upper: true};
  const bars = {
    key: "a",
    x: 50,
    y: 40,
    size: 10,
    bounds: {y: {lower: 60, upper: 20, caps}, x: {lower: 30, upper: 70, caps}},
  };
  assert.strictEqual(
    pointErrorPath(bars, 10),
    "M50,60L50,20M45,60L55,60M45,20L55,20" +
      "M30,40L70,40M30,35L30,45M70,35L70,45",
  );
  assert.strictEqual(
    pointErrorPath({...bars, bounds: {x: bars.bounds.x}}, 0),
    "M30,40L70,40",
  );
});

it("errorBarDefaults: a stroke darker than the shape's own fill, then the shared fill", () => {
  const viz = new Scatter().shapeConfig({
    fill: "#ff0000",
    Circle: {fill: "#0000ff"},
  });
  const circle = errorBarDefaults(viz, "Circle");
  assert.strictEqual(circle.capWidth, "50%");
  assert.strictEqual(circle.stroke({}, 0), "#000095");
  assert.strictEqual(errorBarDefaults(viz).stroke({}, 0), "#950000");
});

it("errorBarExtent: the value axis's domain in pixels, inside the plot's clamp", () => {
  const scale = v => v * 10;
  const ctx = {
    viz: {_yAxis: {_d3Scale: {domain: () => [0, 10]}}},
    valueExtent: [20, 200],
  };
  assert.deepStrictEqual(errorBarExtent(ctx, "y", scale), [20, 100]);
  assert.deepStrictEqual(
    errorBarExtent({viz: {}, valueExtent: [1, 2]}, "x", scale),
    [1, 2],
  );
});

it("emitPointConfidence: nothing without confidence or bounds", () => {
  const ctx = {viz: new Scatter(), values: []};
  assert.deepStrictEqual(emitPointConfidence(ctx, []), []);
});

it("appendPointConfidence: a point's tooltip lists its bounds after its own rows", () => {
  const viz = new Scatter().x("x").y("y").confidence(["yl", "yh"]);
  syncConfidenceAxes(viz);
  let tbody = (d, i) => [["own", `${i}`]];
  const tip = {
    tbody(_) {
      if (!arguments.length) return tbody;
      tbody = _;
      return this;
    },
  };
  appendPointConfidence(tip, viz, rows[0], 0, "Bar");
  assert.deepStrictEqual(tbody(rows[0], 0), [["own", "0"]], "only points");
  appendPointConfidence(tip, viz, rows[0], 0, "Circle");
  assert.deepStrictEqual(tbody(rows[0], 0), [
    ["own", "0"],
    ["Lower Bound", "4"],
    ["Upper Bound", "7"],
  ]);
  // Without bounds, the tooltip is left as it was.
  const before = tbody;
  appendPointConfidence(tip, new Scatter(), rows[0], 0, "Circle");
  assert.strictEqual(tbody, before);
});
