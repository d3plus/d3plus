import {it} from "vitest";
import assert from "assert";
import {
  compareCategories,
  finite,
  stepValue,
  WATERFALL_KINDS,
  waterfallKinds,
  waterfallStackOffset,
  waterfallStep,
  waterfallSteps,
} from "../../src/charts/Waterfall/steps.ts";

/**
    Waterfall's running-total math: steps, kinds, the subtotal value, and the
    d3-stack offset that floats each bar.
*/

const rows = [
  {item: "Start", amount: 100, sub: true},
  {item: "Sales", amount: 50},
  {item: "Costs", amount: -30},
  {item: "Gross", sub: true},
  {item: "Tax", amount: -10},
  {item: "End", sub: true},
];
const accessors = {
  category: d => d.item,
  series: () => "all",
  value: d => d.amount,
  subtotal: d => d.sub,
};

it("finite keeps finite numbers only", () => {
  assert.strictEqual(finite(3), 3);
  assert.strictEqual(finite(-0.5), -0.5);
  assert.strictEqual(finite(NaN), undefined);
  assert.strictEqual(finite(Infinity), undefined);
  assert.strictEqual(finite("4"), undefined);
  assert.strictEqual(finite(undefined), undefined);
  assert.strictEqual(finite(null), undefined);
});

it("compareCategories orders numbers and dates, and leaves text alone", () => {
  assert.ok(compareCategories(2019, 2020) < 0);
  assert.ok(
    compareCategories("10", "9") > 0,
    "numeric text compares as numbers",
  );
  assert.ok(compareCategories(new Date(2020, 0), new Date(2019, 0)) > 0);
  assert.strictEqual(compareCategories("Revenue", "Costs"), 0);
  assert.strictEqual(compareCategories("Revenue", 3), 0);
});

it("waterfallStep floats a change from the running total", () => {
  const up = waterfallStep(
    {category: "a", values: [20, 5], subtotal: false},
    100,
    {series: "s", index: 2},
  );
  assert.deepStrictEqual(up, {
    series: "s",
    index: 2,
    category: "a",
    kind: "increase",
    start: 100,
    end: 125,
    change: 25,
    joins: true,
  });
  const down = waterfallStep(
    {category: "b", values: [-40], subtotal: false},
    100,
    {series: "s", index: 0},
  );
  assert.strictEqual(down.kind, "decrease");
  assert.strictEqual(down.end, 60);
  assert.strictEqual(
    down.joins,
    false,
    "the first step continues from nothing",
  );
  const zero = waterfallStep(
    {category: "c", values: [0], subtotal: false},
    10,
    {series: "s", index: 1},
  );
  assert.strictEqual(zero.kind, "increase");
  assert.strictEqual(
    waterfallStep({category: "d", values: [undefined], subtotal: false}, 10, {
      series: "s",
      index: 1,
    }),
    undefined,
  );
});

it("waterfallStep draws subtotals from zero", () => {
  const shown = waterfallStep(
    {category: "t", values: [undefined], subtotal: true},
    80,
    {series: "s", index: 3},
  );
  assert.deepStrictEqual(shown, {
    series: "s",
    index: 3,
    category: "t",
    kind: "total",
    start: 0,
    end: 80,
    change: 0,
    joins: true,
  });
  const reset = waterfallStep(
    {category: "t", values: [120], subtotal: true},
    80,
    {series: "s", index: 3},
  );
  assert.strictEqual(
    reset.end,
    120,
    "a subtotal's own value resets the running total",
  );
  assert.strictEqual(reset.change, 40);
  assert.strictEqual(
    reset.joins,
    false,
    "a reset doesn't continue from the previous bar",
  );
  const matching = waterfallStep(
    {category: "t", values: [80], subtotal: true},
    80,
    {series: "s", index: 3},
  );
  assert.strictEqual(
    matching.joins,
    true,
    "a subtotal matching the running total still connects",
  );
  const negative = waterfallStep(
    {category: "t", values: [], subtotal: true},
    -15,
    {series: "s", index: 1},
  );
  assert.strictEqual(negative.end, -15);
});

it("waterfallSteps chains the running total through a series", () => {
  const steps = waterfallSteps(rows, accessors);
  const list = rows.map(d => steps.get(d));
  assert.deepStrictEqual(
    list.map(s => s.kind),
    ["total", "increase", "decrease", "total", "decrease", "total"],
  );
  assert.deepStrictEqual(
    list.map(s => [s.start, s.end]),
    [
      [0, 100],
      [100, 150],
      [150, 120],
      [0, 120],
      [120, 110],
      [0, 110],
    ],
  );
  assert.deepStrictEqual(
    list.map(s => s.index),
    [0, 1, 2, 3, 4, 5],
  );
  assert.deepStrictEqual(
    list.map(s => s.joins),
    [false, true, true, true, true, true],
  );
});

it("waterfallSteps keeps a running total per series and sums repeated categories", () => {
  const data = [
    {s: "A", c: "x", v: 10},
    {s: "B", c: "x", v: 5},
    {s: "A", c: "y", v: -4},
    {s: "A", c: "y", v: -1},
    {s: "B", c: "y", v: 7},
  ];
  const steps = waterfallSteps(data, {
    category: d => d.c,
    series: d => d.s,
    value: d => d.v,
  });
  assert.strictEqual(
    steps.get(data[2]),
    steps.get(data[3]),
    "rows sharing a category share a step",
  );
  assert.deepStrictEqual(
    [steps.get(data[2]).start, steps.get(data[2]).end],
    [10, 5],
  );
  assert.deepStrictEqual(
    [steps.get(data[4]).start, steps.get(data[4]).end],
    [5, 12],
  );
  assert.strictEqual(steps.get(data[4]).series, "B");
});

it("waterfallSteps orders categories as Plot's axis does, or by a sort", () => {
  const years = [
    {y: 2021, v: 3},
    {y: 2019, v: 10},
    {y: 2020, v: -2},
  ];
  const byYear = waterfallSteps(years, {
    category: d => d.y,
    series: () => "",
    value: d => d.v,
  });
  assert.deepStrictEqual(
    years.map(d => byYear.get(d).index),
    [2, 0, 1],
    "numbers ascend",
  );
  assert.strictEqual(byYear.get(years[0]).end, 11);
  const sorted = waterfallSteps(years, {
    category: d => d.y,
    series: () => "",
    value: d => d.v,
    sort: (a, b) => b.y - a.y,
  });
  assert.deepStrictEqual(
    years.map(d => sorted.get(d).index),
    [0, 2, 1],
    "a sort wins",
  );
  const dates = [
    {d: new Date(2020, 1), v: 1},
    {d: new Date(2020, 0), v: 2},
  ];
  const byDate = waterfallSteps(dates, {
    category: d => d.d,
    series: () => "",
    value: d => d.v,
  });
  assert.strictEqual(byDate.get(dates[1]).index, 0);
});

it("waterfallSteps skips rows with nothing to draw", () => {
  const data = [{c: "a", v: 5}, {c: "b"}, {c: "c", v: 2}];
  const steps = waterfallSteps(data, {
    category: d => d.c,
    series: () => "",
    value: d => d.v,
  });
  assert.strictEqual(steps.has(data[1]), false);
  assert.strictEqual(steps.get(data[2]).index, 1);
  assert.strictEqual(steps.get(data[2]).start, 5);
});

it("waterfallKinds lists the kinds drawn in legend order", () => {
  const steps = waterfallSteps(rows, accessors);
  assert.deepStrictEqual(waterfallKinds(steps.values()), [
    "increase",
    "decrease",
    "total",
  ]);
  assert.deepStrictEqual(
    waterfallKinds([{kind: "total"}, undefined, {kind: "increase"}]),
    ["increase", "total"],
  );
  assert.deepStrictEqual(waterfallKinds([]), []);
  assert.deepStrictEqual(WATERFALL_KINDS, ["increase", "decrease", "total"]);
});

it("stepValue reports a subtotal's running total in place of a missing value", () => {
  const total = {kind: "total", end: 42};
  assert.strictEqual(stepValue(undefined, total), 42);
  assert.strictEqual(stepValue(null, total), 42);
  assert.strictEqual(stepValue(10, total), 10, "a given value stands");
  assert.strictEqual(
    stepValue(undefined, {kind: "increase", end: 5}),
    undefined,
  );
  assert.strictEqual(stepValue(undefined, undefined), undefined);
});

it("waterfallStackOffset floats each stacked point between its step's ends", () => {
  const a = {data: {n: "a"}},
    b = {data: {n: "b"}};
  const steps = new Map([
    [a.data, {start: 100, end: 60}],
    [b.data, {start: 0, end: 30}],
  ]);
  const point = (v, group) => Object.assign([0, v], {data: group});
  const groupA = [{id: "a", ...a}];
  const groupB = [{id: "b", ...b}];
  const series = [
    Object.assign([point(-40, groupA), point(0, groupB)], {key: "a"}),
    Object.assign([point(0, groupA), point(30, groupB)], {key: "b"}),
  ];
  waterfallStackOffset(d => steps.get(d))(series, [0, 1]);
  assert.deepStrictEqual(
    Array.from(series[0][0]),
    [60, 100],
    "low value first",
  );
  assert.deepStrictEqual(
    Array.from(series[0][1]),
    [0, 0],
    "points without a step keep d3's values",
  );
  assert.deepStrictEqual(Array.from(series[1][1]), [0, 30]);
});
