import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BarChart, LinePlot} from "../../index.ts";
import {
  axisNumbers,
  drawnRows,
  isComputed,
  isStatistic,
  numericValue,
  resolveReferenceBands,
  resolveReferenceLine,
  resolveReferenceLines,
  resolveValue,
  seriesColor,
  seriesRows,
  stackAxis,
  STATISTIC_NAMES,
  statisticOf,
} from "../../src/charts/features/referenceValues.ts";
import {
  collectReferenceHighlight,
  referenceHighlightRows,
} from "../../src/charts/features/referenceHighlight.ts";
import {referenceHighlightPredicate} from "../../src/charts/viz/referenceHighlightPredicate.ts";
import {plotAnnotationList} from "../../src/charts/features/plotAnnotationList.ts";
import {referenceDomainValues} from "../../src/charts/Plot/referenceDomains.ts";

useJsdom();

// Reference values computed from the drawn rows: statistics, functions,
// one line or one per series, highlighting, and the domains they widen.

const data = [
  {id: "a", x: 1, y: 10},
  {id: "a", x: 2, y: 20},
  {id: "b", x: 1, y: 40},
  {id: "b", x: 2, y: 50},
];
/** The drawn rows a Plot formats `data` into. */
const rows = data.map((d, i) => ({data: d, i, id: d.id, x: d.x, y: d.y}));

/** A LinePlot with `data` as its drawn rows. */
function chart(Chart = LinePlot) {
  const viz = new Chart().data(data).groupBy("id");
  viz._filteredData = data;
  viz._formattedData = rows;
  viz._drawLabel = d => d.id;
  return viz;
}

it("isStatistic: the four statistic names", () => {
  ["mean", "median", "min", "max"].forEach(s =>
    assert.strictEqual(isStatistic(s), true),
  );
  assert.strictEqual(isStatistic("average"), false);
  assert.strictEqual(isStatistic(4), false);
  assert.deepStrictEqual(Object.keys(STATISTIC_NAMES), [
    "mean",
    "median",
    "min",
    "max",
  ]);
});

it("numericValue: numbers, dates, and numeric strings", () => {
  assert.strictEqual(numericValue(4), 4);
  assert.strictEqual(numericValue(new Date(5)), 5);
  assert.strictEqual(numericValue("6"), 6);
  assert.ok(Number.isNaN(numericValue("A")));
  assert.ok(Number.isNaN(numericValue("")));
  assert.ok(Number.isNaN(numericValue(null)));
});

it("statisticOf: mean, median (odd and even), min, max over finite values", () => {
  const values = [3, 1, NaN, 4, 2];
  assert.strictEqual(statisticOf("mean", values), 2.5);
  assert.strictEqual(statisticOf("median", values), 2.5);
  assert.strictEqual(statisticOf("median", [5, 1, 3]), 3);
  assert.strictEqual(statisticOf("min", values), 1);
  assert.strictEqual(statisticOf("max", values), 4);
  assert.ok(Number.isNaN(statisticOf("mean", [NaN])));
});

it("drawnRows: the formatted rows, none without data", () => {
  const viz = chart();
  assert.strictEqual(drawnRows(viz), rows);
  viz._filteredData = [];
  assert.deepStrictEqual(drawnRows(viz), []);
});

it("seriesRows: each series' rows, in first-seen order", () => {
  assert.deepStrictEqual(
    seriesRows(rows).map(g => g.map(d => d.y)),
    [
      [10, 20],
      [40, 50],
    ],
  );
});

it("axisNumbers: each row's value, or each stack's total", () => {
  assert.deepStrictEqual(axisNumbers(rows, "y"), [10, 20, 40, 50]);
  assert.deepStrictEqual(axisNumbers(rows, "y", "x"), [50, 70]);
});

it("isComputed: statistics and functions, unless the name is a drawn category", () => {
  assert.strictEqual(isComputed("mean", rows, "y"), true);
  assert.strictEqual(
    isComputed(() => 1, rows, "y"),
    true,
  );
  assert.strictEqual(isComputed(30, rows, "y"), false);
  assert.strictEqual(
    isComputed("max", [{data: {}, i: 0, id: "a", x: "max"}], "x"),
    false,
  );
});

it("resolveValue: statistics, stacks, dates, functions, and constants", () => {
  assert.strictEqual(resolveValue("mean", rows, "y"), 30);
  assert.strictEqual(resolveValue("max", rows, "y", "x"), 70);
  assert.strictEqual(resolveValue(12, rows, "y"), 12);
  assert.strictEqual(
    resolveValue(r => r.length * 10, rows, "y"),
    40,
    "a function gets the data rows",
  );
  assert.strictEqual(
    resolveValue(() => null, rows, "y"),
    null,
  );
  assert.strictEqual(resolveValue("mean", [], "y"), null);
  const dates = [
    {data: {}, i: 0, id: "a", x: new Date(0)},
    {data: {}, i: 1, id: "a", x: new Date(100)},
  ];
  assert.deepStrictEqual(resolveValue("mean", dates, "x"), new Date(50));
});

it("stackAxis: the discrete axis, for a stacked chart's value axis", () => {
  const viz = chart(BarChart);
  assert.strictEqual(stackAxis(viz, "y"), undefined, "not stacked");
  viz.stacked(true);
  assert.strictEqual(stackAxis(viz, "y"), "x");
  assert.strictEqual(stackAxis(viz, "x"), undefined);
  viz.discrete("y");
  assert.strictEqual(stackAxis(viz, "x"), "y");
});

it("seriesColor: the series' fill", () => {
  const viz = chart().color(() => "#ff0000");
  assert.strictEqual(seriesColor(viz, rows[0]), "#ff0000");
});

it("resolveReferenceLine: one line over every row, labeled with the statistic", () => {
  const viz = chart();
  const [line] = resolveReferenceLine(
    viz,
    {shape: "ReferenceLine", y: "mean"},
    rows,
  );
  assert.strictEqual(line.y, 30);
  assert.strictEqual(line.label, "Mean");
  assert.strictEqual(line.drawnRows, rows);
  viz.locale("es-ES");
  assert.strictEqual(
    resolveReferenceLine(viz, {shape: "ReferenceLine", y: "median"}, rows)[0]
      .label,
    "Mediana",
  );
});

it("resolveReferenceLine: perSeries draws one line per series in its color", () => {
  const viz = chart().color(d => (d.id === "a" ? "#111111" : "#222222"));
  const lines = resolveReferenceLine(
    viz,
    {shape: "ReferenceLine", y: "max", perSeries: true},
    rows,
  );
  assert.deepStrictEqual(
    lines.map(l => [l.y, l.stroke, l.label]),
    [
      [20, "#111111", "a"],
      [50, "#222222", "b"],
    ],
  );
  const own = resolveReferenceLine(
    viz,
    {shape: "ReferenceLine", y: "max", perSeries: true, stroke: "red"},
    rows,
  );
  assert.deepStrictEqual(
    own.map(l => l.stroke),
    ["red", "red"],
  );
});

it("resolveReferenceLine: constants stay, labels may be functions, empty values drop", () => {
  const viz = chart();
  const [constant] = resolveReferenceLine(
    viz,
    {shape: "ReferenceLine", y: 15},
    rows,
  );
  assert.strictEqual(constant.y, 15);
  assert.strictEqual("label" in constant, false, "no default label");
  const [fn] = resolveReferenceLine(
    viz,
    {shape: "ReferenceLine", y: "min", label: (v, r) => `${v} of ${r.length}`},
    rows,
  );
  assert.strictEqual(fn.label, "10 of 4");
  assert.strictEqual(
    resolveReferenceLine(viz, {shape: "ReferenceLine", label: "none"}, rows)
      .length,
    1,
    "no axis: unchanged",
  );
  assert.deepStrictEqual(
    resolveReferenceLine(viz, {shape: "ReferenceLine", y: () => null}, rows),
    [],
  );
  const [off] = resolveReferenceLine(
    viz,
    {shape: "ReferenceLine", y: "mean", label: false},
    rows,
  );
  assert.strictEqual(off.label, false);
});

it("resolveReferenceLines: every entry against the drawn rows", () => {
  const lines = resolveReferenceLines(chart(), [
    {shape: "ReferenceLine", y: "mean"},
    {shape: "ReferenceLine", x: "max"},
  ]);
  assert.deepStrictEqual(
    lines.map(l => [l.x, l.y]),
    [
      [undefined, 30],
      [2, undefined],
    ],
  );
});

it("resolveReferenceBands: both ends on every axis, dropping a band without one", () => {
  const viz = chart();
  const [band] = resolveReferenceBands(viz, [
    {shape: "ReferenceBand", y: ["min", "mean"], x: [1, "max"]},
  ]);
  assert.deepStrictEqual(band.y, [10, 30]);
  assert.deepStrictEqual(band.x, [1, 2]);
  assert.deepStrictEqual(
    resolveReferenceBands(viz, [{shape: "ReferenceBand", y: [0, () => null]}]),
    [],
  );
});

it("referenceHighlightRows: the rows strictly above or below each line", () => {
  const lines = [
    {shape: "ReferenceLine", y: 20, highlight: "above", drawnRows: rows},
  ];
  assert.deepStrictEqual(referenceHighlightRows(lines), [data[2], data[3]]);
  assert.deepStrictEqual(
    referenceHighlightRows([{...lines[0], highlight: "below"}]),
    [data[0]],
  );
  assert.strictEqual(
    referenceHighlightRows([{shape: "ReferenceLine", y: 20}]),
    null,
  );
  assert.deepStrictEqual(
    referenceHighlightRows([{...lines[0], ref: "plot"}]),
    [],
    "a plot fraction compares nothing",
  );
});

it("collectReferenceHighlight + referenceHighlightPredicate: a predicate over the highlighted rows", () => {
  const viz = chart();
  assert.strictEqual(referenceHighlightPredicate(viz), null);
  collectReferenceHighlight(viz, [{shape: "ReferenceLine", y: 20}]);
  assert.strictEqual(referenceHighlightPredicate(viz), null, "none set");
  collectReferenceHighlight(viz, [
    {shape: "ReferenceLine", y: 45, highlight: "above", drawnRows: rows},
  ]);
  collectReferenceHighlight(viz, [
    {shape: "ReferenceLine", y: 15, highlight: "below", drawnRows: rows},
  ]);
  const match = referenceHighlightPredicate(viz);
  assert.deepStrictEqual(
    data.map(d => match(d)),
    [true, false, false, true],
  );
});

it("plotAnnotationList: quadrants, then bands, then lines, then callouts, resolved", () => {
  const viz = chart()
    .quadrants({topLeft: {label: "TL"}})
    .referenceBands([{y: ["min", 15]}])
    .referenceLines([{y: "max"}])
    .annotations([{shape: "Callout", select: "max"}]);
  const list = plotAnnotationList(viz);
  assert.deepStrictEqual(
    list.map(a => a.shape),
    ["Quadrants", "ReferenceBand", "ReferenceLine", "Callout"],
  );
  assert.deepStrictEqual([list[0].x, list[0].y], [1.5, 30]);
  assert.deepStrictEqual(list[1].y, [10, 15]);
  assert.strictEqual(list[2].y, 50);
  assert.deepStrictEqual(list[3].data[0].y, 50);
});

it("referenceDomainValues: partial line ends, 2D bands, and quadrant centers", () => {
  const values = referenceDomainValues([
    {shape: "ReferenceLine", y: 100, from: 2, to: 9},
    {shape: "ReferenceBand", x: [1, 3], y: [4, 5]},
    {shape: "Quadrants", x: 0, y: -1},
    {shape: "Quadrants", x: 0.5, y: 0.5, ref: "plot"},
  ]);
  assert.deepStrictEqual(values, {
    x: [2, 9, 1, 3, 0],
    y: [100, 4, 5, -1],
    x2: [],
    y2: [],
  });
});
