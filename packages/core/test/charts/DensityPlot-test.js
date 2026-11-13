import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import DensityPlot, {
  DENSITY_POINT,
  curvesBeforePreDraw,
  densityPlotDef,
  densityPointMeta,
  densityPointTooltipRows,
} from "../../src/charts/DensityPlot/index.ts";
import Treemap from "../../src/charts/Treemap/index.ts";
import {drawnRawRows} from "../../src/charts/pipeline/preDrawData.ts";
import {spanTicks} from "../../src/charts/Plot/discreteSpan.ts";
import {valueField} from "../../src/charts/helpers/valueTitle.ts";
import {rugGroups, rugSegments} from "../../src/charts/DensityPlot/rug.ts";

useJsdom();

const rows = [
  {g: "a", v: 1, year: 2020},
  {g: "a", v: 2, year: 2021},
  {g: "a", v: 3, year: 2021},
  {g: "b", v: 8, year: 2021},
  {g: "b", v: 9, year: 2021},
  {g: "b", v: 11, year: 2021},
];

/** A DensityPlot over `data`, configured by `configure`, with its curves estimated. */
function curves(data, configure = v => v) {
  const viz = configure(new DensityPlot().data(data).groupBy("g").value("v"));
  curvesBeforePreDraw(viz);
  return viz;
}

/** The rows of `viz._data` for group `g`. */
const series = (viz, g) => viz._data.filter(d => d.g === g);

it("DensityPlot defaults: overlaid, densityScale by stacking", () => {
  const viz = new DensityPlot();
  assert.strictEqual(viz.stacked(), false);
  assert.strictEqual(viz.densityScale(), undefined);
  assert.deepStrictEqual(viz.densityConfig(), {
    kernel: "gaussian",
    points: 100,
    cut: 3,
  });
  assert.strictEqual(viz.baseline(), 0);
  assert.strictEqual(viz.discrete(), "x");
  assert.strictEqual(densityPlotDef.name, "DensityPlot");
  assert.deepStrictEqual(
    densityPlotDef.thresholdFunction(viz, rows),
    rows,
    "threshold folds nothing",
  );
});

it("curvesBeforePreDraw: one row per curve point, on one grid", () => {
  const viz = curves(rows);
  const a = series(viz, "a"),
    b = series(viz, "b");
  assert.ok(a.length > 50);
  assert.strictEqual(a.length, b.length);
  assert.deepStrictEqual(
    a.map(d => d.x),
    b.map(d => d.x),
  );
  a.forEach(d => {
    assert.strictEqual(d.v, undefined, "the value key is dropped");
    assert.strictEqual(densityPointMeta(d).summary.n, 3);
    assert.strictEqual(d.y, densityPointMeta(d).density, "area: unscaled");
  });
  assert.strictEqual(viz._xConfig.title, "v");
  assert.strictEqual(viz._yConfig.title, "Density");
  assert.strictEqual(viz._sourceData, rows);
  // A redraw estimates from the raw rows again, not from the curve points.
  const first = viz._data.length;
  curvesBeforePreDraw(viz);
  assert.strictEqual(viz._data.length, first);
  assert.ok(viz._filterApplied(viz._data[0]));
  assert.ok(!viz._filterApplied(rows[0]));
  assert.deepStrictEqual(viz._discreteExtent({x: 4}), [4, 4]);
  assert.strictEqual(viz._xConfig.rounding, "outside");
});

it("curvesBeforePreDraw: stacked curves share each group's weight", () => {
  const viz = curves(rows, v => v.stacked(true));
  series(viz, "a").forEach(d =>
    assert.ok(Math.abs(d.y - densityPointMeta(d).density * 0.5) < 1e-12),
  );
  const width = curves(rows, v => v.densityScale("width"));
  const peak = Math.max(...series(width, "b").map(d => d.y));
  assert.ok(Math.abs(peak - 1) < 1e-12, "width: each curve peaks at 1");
  assert.strictEqual(width._yConfig.title, "Relative Density");
  // A user title is kept.
  const titled = curves(rows, v => v.yConfig({title: "Mine"}));
  assert.strictEqual(titled._yConfig.title, "Mine");
});

it("curvesBeforePreDraw: filter, time, ungrouped data, and facets", () => {
  const filtered = curves(rows, v => v.filter(d => d.v !== 1));
  assert.strictEqual(densityPointMeta(series(filtered, "a")[0]).summary.n, 2);

  // The latest period is estimated; the others stay in the data as given.
  const timed = curves(rows, v => v.time("year"));
  assert.strictEqual(densityPointMeta(series(timed, "a")[0]).summary.n, 2);
  assert.ok(timed._data.includes(rows[0]));

  const single = new DensityPlot().data(rows).value("v");
  curvesBeforePreDraw(single);
  assert.deepStrictEqual(
    Array.from(new Set(single._data.map(d => d.id))),
    ["v"],
    "ungrouped rows become one series named after the value",
  );

  const faceted = curves(rows, v => v.facet("year").stacked(true));
  const a2020 = faceted._data.filter(d => d.g === "a" && d.year === 2020);
  const a2021 = faceted._data.filter(d => d.g === "a" && d.year === 2021);
  assert.ok(a2020.length && a2021.length, "one curve per group per panel");
  assert.strictEqual(densityPointMeta(a2020[0]).summary.n, 1);
  // Each panel's shares are of its own observations.
  assert.ok(
    Math.abs(a2020[10].y - densityPointMeta(a2020[10]).density) < 1e-12,
  );
  assert.ok(
    Math.abs(a2021[10].y - densityPointMeta(a2021[10]).density * 0.4) < 1e-12,
  );
});

it("densityPointMeta / densityPointTooltipRows: the group's summary", () => {
  const viz = curves(rows);
  const point = series(viz, "b")[0];
  const wrapped = {__d3plus__: true, data: point};
  assert.strictEqual(densityPointMeta(wrapped), point[DENSITY_POINT]);
  assert.strictEqual(densityPointMeta({g: "a"}), undefined);
  assert.strictEqual(densityPointMeta({[DENSITY_POINT]: [1, 2]}), undefined);
  assert.deepStrictEqual(densityPointTooltipRows(viz, wrapped), [
    ["Observations", "3"],
    ["Median", "9"],
  ]);
  assert.deepStrictEqual(densityPointTooltipRows(viz, {g: "a"}), []);
});

it("drawnRawRows: the selected period's rows that pass filter", () => {
  const yearly = [2019, 2020, 2021].map(year => ({id: `${year}`, year}));
  const viz = new Treemap().data(yearly).groupBy("id").time("year");
  const {drawn, offstage} = drawnRawRows(viz, yearly);
  assert.deepStrictEqual(
    drawn.map(d => d.year),
    [2021],
  );
  assert.deepStrictEqual(
    offstage.map(d => d.year),
    [2019, 2020],
  );
  viz.filter(d => d.year !== 2021).timeFilter(d => d.year >= 2020);
  const again = drawnRawRows(viz, yearly);
  assert.deepStrictEqual(
    again.drawn.map(d => d.year),
    [2020],
  );
  assert.deepStrictEqual(
    again.offstage.map(d => d.year),
    [2019],
  );
  const plain = new Treemap().data(yearly).groupBy("id");
  assert.deepStrictEqual(drawnRawRows(plain, yearly), {
    drawn: yearly,
    offstage: [],
  });
});

it("spanTicks: span edges, or the axis's own ticks for point spans", () => {
  const viz = {_discreteExtent: d => [d.x0, d.x1]};
  const row = (x0, x1) => ({data: {x0, x1}});
  assert.deepStrictEqual(
    spanTicks(viz, [row(0, 5), row(5, 10), {}]),
    [0, 5, 10],
  );
  assert.strictEqual(spanTicks(viz, [row(1, 1), row(2, 2)]), null);
  assert.deepStrictEqual(spanTicks(viz, []), []);
});

it("valueField: strings read a key, functions pass through", () => {
  const field = valueField();
  assert.strictEqual(field.key, "value");
  assert.strictEqual(field.default({value: 3}), 3);
  assert.strictEqual(field.coerce("v")({v: 4}), 4);
  const fn = d => d.w;
  assert.strictEqual(field.coerce(fn), fn);
  assert.strictEqual(field.coerce(7)(), 7);
});

it("rugGroups / rugSegments: each group's observations as ticks", () => {
  const viz = curves(rows);
  // Plot hands the emitter its formatted rows, which carry the series id.
  const groups = rugGroups(
    viz._data.map(d => ({__d3plus__: true, data: d, id: d.g})),
  );
  assert.deepStrictEqual([...groups.keys()], ["a", "b"]);
  assert.deepStrictEqual(groups.get("a").values, [1, 2, 3]);
  assert.deepStrictEqual(groups.get("b").values, [8, 9, 11]);
  assert.strictEqual(groups.get("a").datum.data.g, "a");
  assert.deepStrictEqual(rugGroups([{id: "x"}]).size, 0);
  assert.deepStrictEqual(
    rugSegments([1, 2, NaN], v => v * 10, 100, 8),
    [
      [
        [10, 100],
        [10, 92],
      ],
      [
        [20, 100],
        [20, 92],
      ],
    ],
  );
});

it("DensityPlot rug defaults: off, 8px ticks", () => {
  const viz = new DensityPlot();
  assert.strictEqual(viz.rug(), false);
  assert.deepStrictEqual(viz.rugConfig(), {
    size: 8,
    strokeWidth: 1,
    opacity: 0.7,
  });
});
