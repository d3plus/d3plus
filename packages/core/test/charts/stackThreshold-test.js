import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {
  AreaPlot,
  BarChart,
  Histogram,
  LinePlot,
  Pyramid,
  StackedArea,
  Treemap,
  Waterfall,
} from "../../index.ts";
import {facetFilteredData, facetTimeFilter} from "../../internal.ts";
import {makeChart} from "../../src/charts/definition/makeChart.ts";
import {buildLegendData} from "../../src/charts/features/featuresLegend.ts";
import {
  computePlotAxisValues,
  computePlotInitialDomains,
  formatPlotData,
} from "../../src/charts/Plot/pipeline.ts";
import {
  orderLast,
  resolveStackOrder,
  stackOffsetDiverging,
} from "../../src/charts/Plot/stackHelpers.ts";
import Viz from "../../src/charts/viz/Viz.ts";
import accessor from "../../src/utils/accessor.ts";
import constant from "../../src/utils/constant.ts";
import {
  foldStackRows,
  plotStackInputs,
  plotStackThreshold,
  plotStackThresholdLegend,
  seriesIdentity,
  stackThresholdBucket,
} from "../../src/charts/Plot/stackThreshold.ts";

useJsdom();

/**
    #784: `threshold` on stacked Plot charts folds the series whose summed
    value, over every position, is under that share of the chart's total
    into one bucket series.
*/

const id = accessor("id");
const year = accessor("year");
const value = accessor("value");

// Big series a/b; tiny series c/d (c skips 2021).
const rows = [
  {id: "a", group: "G1", year: 2020, value: 50},
  {id: "b", group: "G1", year: 2020, value: 40},
  {id: "c", group: "G2", year: 2020, value: 1},
  {id: "d", group: "G2", year: 2020, value: 2},
  {id: "a", group: "G1", year: 2021, value: 60},
  {id: "b", group: "G1", year: 2021, value: 45},
  {id: "d", group: "G2", year: 2021, value: 2},
];
const inputs = {
  id,
  position: [year],
  threshold: constant(0.05),
  value,
};

it("stackThreshold: seriesIdentity keeps the non-numeric fields that name each series", () => {
  const identity = seriesIdentity(
    [
      [
        {id: "c", group: "G2", year: 2020, value: 1, note: "x"},
        {id: "c", group: "G2", year: 2021, value: 3, note: "y"},
      ],
      [{id: "d", group: "G2", year: 2020, value: 2, note: "z"}],
    ],
    [year],
  );
  assert.deepStrictEqual(identity, {id: ["c", "d"], group: "G2"});
});

it("stackThreshold: seriesIdentity leaves out a string position field", () => {
  const identity = seriesIdentity(
    [[{id: "c", year: "2020"}], [{id: "d", year: "2021"}]],
    [year],
  );
  assert.deepStrictEqual(identity, {id: ["c", "d"]});
});

it("stackThreshold: seriesIdentity compares array and Date fields by value", () => {
  const identity = seriesIdentity(
    [
      [
        {id: "c", tags: ["x", "y"], start: new Date(2020, 0, 1)},
        {id: "c", tags: ["x", "y"], start: new Date(2020, 0, 1)},
      ],
    ],
    [],
  );
  assert.deepStrictEqual(identity.tags, ["x", "y"]);
  assert.strictEqual(+identity.start, +new Date(2020, 0, 1));
});

it("stackThreshold: stackThresholdBucket finds the series under the threshold", () => {
  const bucket = stackThresholdBucket(rows, inputs);
  assert.deepStrictEqual([...bucket.members], ["c", "d"]);
  assert.strictEqual(bucket.percent, 0.05);
  assert.deepStrictEqual(bucket.identity, {id: ["c", "d"], group: "G2"});
});

it("stackThreshold: stackThresholdBucket is null when off or when nothing is under it", () => {
  assert.strictEqual(
    stackThresholdBucket(rows, {...inputs, threshold: constant(0)}),
    null,
  );
  assert.strictEqual(
    stackThresholdBucket(rows, {...inputs, threshold: constant(NaN)}),
    null,
  );
  assert.strictEqual(
    stackThresholdBucket(rows, {...inputs, threshold: constant(0.001)}),
    null,
  );
  assert.strictEqual(
    stackThresholdBucket(
      rows.map(d => ({...d, value: 0})),
      inputs,
    ),
    null,
    "a zero total folds nothing",
  );
  assert.strictEqual(stackThresholdBucket([], inputs), null);
});

it("stackThreshold: stackThresholdBucket weighs negative values by size and caps the threshold at 1", () => {
  const signed = rows.map(d => (d.id === "a" ? {...d, value: -d.value} : d));
  assert.deepStrictEqual(
    [...stackThresholdBucket(signed, inputs).members],
    ["c", "d"],
  );
  const all = stackThresholdBucket(rows, {...inputs, threshold: constant(5)});
  assert.strictEqual(all.percent, 1);
  assert.strictEqual(all.members.size, 4);
});

it("stackThreshold: foldStackRows merges the bucket's rows at each position", () => {
  const bucket = stackThresholdBucket(rows, inputs);
  const folded = foldStackRows(rows, bucket, inputs);
  assert.deepStrictEqual(
    folded.filter(d => !d._isAggregation).map(d => [d.id, d.year]),
    [
      ["a", 2020],
      ["b", 2020],
      ["a", 2021],
      ["b", 2021],
    ],
    "kept rows stay in order, ahead of the bucket",
  );
  const other = folded.filter(d => d._isAggregation);
  assert.deepStrictEqual(
    other.map(d => [d.id, d.group, d.year, d.value, d._threshold]),
    [
      [["c", "d"], "G2", 2020, 3, 0.05],
      [["c", "d"], "G2", 2021, 2, 0.05],
    ],
    "one id at every position, even where c has no row",
  );
  assert.ok(!("_isAggregation" in rows[2]), "source rows untouched");
});

it("stackThreshold: foldStackRows keeps a bucket row's position fields", () => {
  const bucket = stackThresholdBucket(rows, inputs);
  const folded = foldStackRows(rows, bucket, inputs);
  assert.deepStrictEqual(
    folded.filter(d => d._isAggregation).map(d => d.year),
    [2020, 2021],
    "the year is not summed across the bucket's series",
  );
});

it("stackThreshold: foldStackRows returns the rows as they are when none are in the bucket", () => {
  const bucket = stackThresholdBucket(rows, inputs);
  const big = rows.filter(d => d.id === "a" || d.id === "b");
  assert.strictEqual(foldStackRows(big, bucket, inputs), big);
});

it("stackThreshold: foldStackRows with no position folds every bucket row into one", () => {
  const bucket = stackThresholdBucket(rows, inputs);
  const folded = foldStackRows(rows, bucket, {...inputs, position: []});
  const other = folded.filter(d => d._isAggregation);
  assert.strictEqual(other.length, 1);
  assert.strictEqual(other[0].value, 5);
  assert.strictEqual(other[0]._threshold, 0.05);
});

it("stackThreshold: plotStackInputs reads the stacked value, the discrete axis, and the time", () => {
  const chart = new StackedArea()
    .groupBy("id")
    .x("year")
    .y("value")
    .threshold(0.05);
  chart._id = (d, i) => id(d, i);
  const read = plotStackInputs(chart);
  assert.strictEqual(read.value({value: 4, year: 1}), 4);
  assert.deepStrictEqual(
    read.position.map(p => p({value: 4, year: 1})),
    [1],
  );
  assert.strictEqual(read.threshold(), 0.05);
  assert.strictEqual(read.id({id: "q"}, 0), "q");

  chart.time("year").thresholdKey("weight");
  const timed = plotStackInputs(chart);
  assert.strictEqual(timed.position.length, 2);
  assert.strictEqual(timed.value({value: 4, weight: 9}), 9);

  const bars = new BarChart().discrete("y").groupBy("id").x("value").y("year");
  const horizontal = plotStackInputs(bars);
  assert.strictEqual(horizontal.value({value: 4, year: 1}), 4);
  assert.strictEqual(horizontal.position[0]({value: 4, year: 1}), 1);
});

it("stackThreshold: plotStackThreshold folds only while stacked, deciding from every row", () => {
  const chart = new StackedArea()
    .groupBy("id")
    .x("year")
    .y("value")
    .threshold(0.05);
  chart._id = (d, i) => id(d, i);
  const folded = plotStackThreshold(chart, rows);
  assert.strictEqual(folded.filter(d => d._isAggregation).length, 2);

  // With a and b hidden, c and d are still the bucket: the drawn rows
  // don't decide it.
  const shown = rows.filter(d => d.id === "c" || d.id === "d");
  const kept = plotStackThreshold(chart, shown, rows);
  assert.deepStrictEqual(
    kept.map(d => d.id),
    [
      ["c", "d"],
      ["c", "d"],
    ],
  );
  assert.strictEqual(
    plotStackThreshold(chart, shown).length,
    3,
    "weighed alone, neither is under 5%",
  );

  chart.stacked(false);
  assert.strictEqual(plotStackThreshold(chart, rows), rows);
});

it("stackThreshold: plotStackThresholdLegend folds the bucket into one legend row", () => {
  const chart = new StackedArea()
    .groupBy("id")
    .x("year")
    .y("value")
    .threshold(0.05);
  chart._id = (d, i) => id(d, i);
  const legend = plotStackThresholdLegend(chart, rows);
  assert.deepStrictEqual(
    legend.map(d => d.id),
    ["a", "b", "a", "b", ["c", "d"]],
  );
  assert.strictEqual(plotStackThresholdLegend(chart, []).length, 0);
  chart.stacked(false);
  assert.strictEqual(plotStackThresholdLegend(chart, rows), rows);
});

it("stackThreshold: a StackedArea's preDraw folds the drawn rows and the legend", () => {
  const chart = new StackedArea()
    .data(rows)
    .groupBy("id")
    .x("year")
    .y("value")
    .threshold(0.05);
  chart._preDraw();
  const other = chart._filteredData.filter(d => d._isAggregation);
  assert.deepStrictEqual(
    other.map(d => [chart._id(d), chart._drawLabel(d), d.value]),
    [
      [["c", "d"], "Values < 5%", 3],
      [["c", "d"], "Values < 5%", 2],
    ],
  );
  assert.deepStrictEqual(
    chart._legendData.map(d => chart._drawLabel(d)),
    ["a", "a", "b", "b", "Values < 5%"],
  );

  // Hiding the bucket's series keeps it in the legend and drops its rows.
  chart._hidden = ["c", "d"];
  chart._preDraw();
  assert.ok(!chart._filteredData.some(d => d._isAggregation));
  assert.strictEqual(chart._legendData.filter(d => d._isAggregation).length, 1);
});

it("stackThreshold: without a threshold, a stacked Plot draws every series", () => {
  const chart = new StackedArea().data(rows).groupBy("id").x("year").y("value");
  assert.strictEqual(chart.threshold()(), 0, "off by default on Plot charts");
  chart._preDraw();
  assert.ok(!chart._filteredData.some(d => d._isAggregation));
  assert.strictEqual(chart._legendData.length, rows.length);
  assert.strictEqual(new Treemap().threshold()(), 0.0001, "Treemap unchanged");
});

it("stackThreshold: AreaPlot, LinePlot and BarChart fold when stacked", () => {
  for (const Chart of [AreaPlot, LinePlot, BarChart]) {
    const chart = new Chart()
      .data(rows)
      .groupBy("id")
      .x("year")
      .y("value")
      .threshold(0.05);
    chart._preDraw();
    assert.ok(
      !chart._filteredData.some(d => d._isAggregation),
      `${Chart.name}: not stacked`,
    );
    chart.stacked(true)._preDraw();
    assert.strictEqual(
      chart._filteredData.filter(d => d._isAggregation).length,
      2,
      `${Chart.name}: stacked`,
    );
  }
});

it("stackThreshold: Histogram, Pyramid and Waterfall stacks fold nothing", () => {
  for (const Chart of [Histogram, Pyramid, Waterfall]) {
    const chart = new Chart().threshold(0.5);
    assert.deepStrictEqual(
      chart._thresholdFunction(rows, undefined, rows),
      rows,
      Chart.name,
    );
  }
});

it("stackThreshold: each small-multiple panel folds the whole chart's bucket", () => {
  // c is tiny overall but the only series in its panel.
  const data = rows.map(d => ({...d, panel: d.id === "c" ? "P2" : "P1"}));
  const chart = new StackedArea()
    .data(data)
    .groupBy("id")
    .x("year")
    .y("value")
    .facet("panel")
    .threshold(0.05);
  chart._preDraw();
  const filter = facetTimeFilter(chart);
  const p2 = facetFilteredData(
    chart,
    data.filter(d => d.panel === "P2"),
    filter,
  );
  assert.deepStrictEqual(
    p2.map(d => d.id),
    [["c", "d"]],
    "c folds into the chart's bucket, with the chart's bucket id",
  );
});

it("stackThreshold: orderLast moves the named series to the top, keeping the rest in order", () => {
  const series = ["a", "b", "c", "d"].map(key => Object.assign([], {key}));
  const order = orderLast(() => [2, 0, 3, 1], new Set(["c", "b"]));
  assert.deepStrictEqual(order(series), [0, 3, 2, 1]);
  assert.deepStrictEqual(
    orderLast(() => [1, 0], new Set())(series.slice(0, 2)),
    [1, 0],
  );
});

/** Runs Plot's stacking stages over `data` with `stackOrder`, returning the stack keys bottom to top. */
function stackedKeys(data, stackOrder) {
  const viz = {
    _filteredData: data,
    _data: [],
    _ids: d => [`${d.id}`],
    _drawDepth: 0,
    _axisPersist: false,
    _confidence: false,
    _size: false,
    _x: accessor("x"),
    _y: accessor("y"),
    _x2: accessor("x2"),
    _y2: accessor("y2"),
    _xConfig: {},
    _x2Config: {},
    _yConfig: {},
    _y2Config: {},
    _baseline: 0,
    _margin: {top: 0, right: 0, bottom: 0, left: 0},
    _stackOrder: resolveStackOrder(stackOrder),
    _stackOffset: stackOffsetDiverging,
    schema: {
      discrete: "x",
      stacked: true,
      shape: () => "Area",
      time: false,
      groupBy: [accessor("id")],
      sizeScale: "sqrt",
      sizeMax: 10,
      sizeMin: 5,
      height: 300,
      width: 400,
    },
  };
  const fmt = formatPlotData({viz});
  const av = computePlotAxisValues({viz, ...fmt});
  const {plotStackData} = computePlotInitialDomains({viz, ...fmt, ...av});
  // The series' place in the stack: by the bottom of its first point.
  return plotStackData
    .slice()
    .sort((a, b) => a[0][0] - b[0][0])
    .map(s => s.key);
}

it("stackThreshold: the bucket stacks on top under any stackOrder", () => {
  const data = [
    {id: "big", x: 1, y: 10},
    {id: "mid", x: 1, y: 5},
    {id: ["c", "d"], x: 1, y: 2, _isAggregation: true},
  ];
  assert.deepStrictEqual(stackedKeys(data, "descending"), [
    "big",
    "mid",
    "c,d",
  ]);
  assert.deepStrictEqual(stackedKeys(data, "ascending"), ["mid", "big", "c,d"]);
  assert.deepStrictEqual(stackedKeys(data, ["c,d", "mid", "big"]), [
    "mid",
    "big",
    "c,d",
  ]);
});

it("stackThreshold: makeChart hands a def every row, and falls back to the base chart's threshold", () => {
  const calls = [];
  const Own = makeChart({
    name: "Own",
    emit: () => [],
    thresholdFunction: (viz, data, all) => {
      calls.push(all);
      return data.slice(1);
    },
  });
  const all = [{id: 1}, {id: 2}, {id: 3}];
  assert.deepStrictEqual(
    new Own()._thresholdFunction(all.slice(0, 2), undefined, all),
    [{id: 2}],
  );
  assert.strictEqual(calls[0], all);

  const Child = makeChart({name: "Child", emit: () => []}, Own);
  assert.deepStrictEqual(new Child()._thresholdFunction(all, undefined, all), [
    {id: 2},
    {id: 3},
  ]);
  const Plain = makeChart({name: "Plain", emit: () => []}, Viz);
  assert.strictEqual(new Plain()._thresholdFunction(all), all);
});

it("stackThreshold: the legend shows a bucket entry, last, however many series it holds", () => {
  const chart = new StackedArea()
    .data([
      ...rows,
      {id: "e", group: "G3", year: 2020, value: 1},
      {id: "f", group: "G3", year: 2020, value: 1},
    ])
    .groupBy("id")
    .x("year")
    .y("value")
    .threshold(0.05)
    .legendSort((a, b) => (a._isAggregation ? -1 : b._isAggregation ? 1 : 0));
  chart._preDraw();
  const {legendData} = buildLegendData(chart);
  assert.deepStrictEqual(
    legendData.map(d => chart._drawLabel(d)),
    ["a", "b", "Values < 5%"],
  );
  assert.strictEqual(
    chart.legend()(chart.legendConfig(), legendData),
    true,
    "a bucket of four series still shows the legend",
  );
  assert.strictEqual(
    chart.legend()(chart.legendConfig(), [{id: "a"}, {id: ["b", "c", "d"]}]),
    false,
    "other entries that merge several groups still hide it",
  );
});
