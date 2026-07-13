import assert from "assert";
import it from "../jsdom.js";
import {BarChart, LinePlot, Plot} from "../../es/index.js";
import {runStages} from "../../es/internal.js";
import {
  computePlotAxisValues,
  computePlotInitialDomains,
  computePlotScales,
  formatPlotData,
} from "../../es/src/charts/Plot/pipeline.js";

/**
    Regression coverage for d3plus/d3plus#776 — a `NaN` (or `null`, or the
    empty-array sentinel `merge` yields for an all-NaN numeric aggregate) on a
    Plot axis used to survive into the shape layer. On the aggregated path it
    coerced to 0 (a phantom bar/point at the baseline); on the raw-leaves Line
    path (base `Plot` with `shape: "Line"` and no `discrete`) it reached the
    line generator and emitted `…L268.75,NaN`, which the browser rejects with
    `<path> attribute d: Expected number`.

    `formatPlotData` now filters non-plottable rows out of `_formattedData`
    before any downstream stage reads it, so the offending point is dropped
    rather than mis-plotted. Each case below drives the data→scale stage chain
    and asserts (a) the bad row is gone from the formatted data and (b) every
    plotted coordinate is a finite number.
*/

function pipeline(viz) {
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  return runStages({viz}, [
    formatPlotData,
    computePlotAxisValues,
    computePlotInitialDomains,
    computePlotScales,
  ]);
}

/** Every x/y pixel coordinate the shape layer would scale from this row set. */
function pixelCoords(ctx) {
  const {x, y} = ctx.plotScales;
  return ctx.plotFormattedData.flatMap(d => [x(d.x), y(d.y)]);
}

const scenarios = [
  {
    name: "base Plot + Line shape, no discrete (raw-leaves path)",
    build: () =>
      new Plot()
        .groupBy("id")
        .shape(() => "Line")
        .data([
          {value: 10, id: "alpha", q: 1},
          {value: 30, id: "alpha", q: 2},
          {value: 50, id: "alpha", q: 3},
          {value: 20, id: "beta", q: 1},
          {value: 40, id: "beta", q: 2},
          {value: NaN, id: "beta", q: 3},
        ]),
    keptRows: 5,
  },
  {
    name: "LinePlot with a NaN measure",
    build: () =>
      new LinePlot()
        .groupBy("id")
        .data([
          {value: 10, id: "alpha", q: 1},
          {value: 30, id: "alpha", q: 2},
          {value: 20, id: "beta", q: 1},
          {value: NaN, id: "beta", q: 2},
        ]),
    keptRows: 3,
  },
  {
    name: "BarChart with a NaN measure (aggregated)",
    build: () =>
      new BarChart()
        .groupBy("id")
        .data([
          {value: 10, id: "alpha", q: "Q1"},
          {value: 30, id: "alpha", q: "Q2"},
          {value: 20, id: "beta", q: "Q1"},
          {value: NaN, id: "beta", q: "Q2"},
        ]),
    keptRows: 3,
  },
  {
    name: "Plot scatter with a NaN measure",
    build: () =>
      new Plot()
        .groupBy("id")
        .data([
          {value: 10, id: "a", q: 1},
          {value: 30, id: "b", q: 2},
          {value: NaN, id: "c", q: 3},
        ]),
    keptRows: 2,
  },
];

for (const {name, build, keptRows} of scenarios) {
  it(`#776 drops non-plottable rows: ${name}`, () => {
    const viz = build().x(d => d.q).y("value").width(600).height(400).duration(0);
    const ctx = pipeline(viz);

    assert.strictEqual(
      ctx.plotFormattedData.length,
      keptRows,
      "the NaN row should be filtered out of the formatted data",
    );
    const coords = pixelCoords(ctx);
    const bad = coords.filter(c => typeof c !== "number" || !Number.isFinite(c));
    assert.deepStrictEqual(bad, [], "every plotted coordinate is a finite number");
  });
}

it("#776 does not drop rows when x2/y2 are legitimately undefined", () => {
  const viz = new LinePlot()
    .groupBy("id")
    .data([
      {value: 10, id: "alpha", q: 1},
      {value: 30, id: "alpha", q: 2},
      {value: 20, id: "beta", q: 1},
      {value: 40, id: "beta", q: 2},
    ])
    .x("q")
    .y("value")
    .width(600)
    .height(400)
    .duration(0);
  const ctx = pipeline(viz);
  assert.strictEqual(ctx.plotFormattedData.length, 4, "all valid rows are kept");
});
