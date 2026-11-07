import {it} from "vitest";
import assert from "assert";
import {
  legendLargestFirst,
  rowLegend,
  shareRow,
} from "../../src/charts/features/sharedFields.ts";

function mockViz(extra = {}) {
  return {
    schema: {
      sum: d => d.size,
      value: d => d.amount,
      locale: "en-US",
      translate: s => `t:${s}`,
      legend: function (config, arr) {
        return `legend:${arr.length}`;
      },
      colorScale: undefined,
    },
    _filteredData: [{id: "a"}, {id: "b"}],
    ...extra,
  };
}

it("shareRow labels the row and formats a row's share", () => {
  const [label, value] = shareRow(mockViz(), "sum");
  assert.strictEqual(label(), "t:Share");
  assert.strictEqual(value({}, 0, {__d3plusShare: 0.25}), "25%");
  assert.strictEqual(
    value({}, 0, {__d3plusShare: [0.1, 0.15]}),
    "25%",
    "a merged row sums its members",
  );
  assert.strictEqual(value({}, 0, {}), "", "no share, no value");
});

it("rowLegend hides while every drawn row is its own entry", () => {
  const viz = mockViz();
  const legend = rowLegend(viz);
  assert.strictEqual(legend({}, [{}, {}]), false);
  assert.strictEqual(
    legend({}, [{}]),
    "legend:1",
    "grouped entries use the chart's legend",
  );
});

it("rowLegend keeps the legend when the chart's labels don't name every row", () => {
  const legend = rowLegend(mockViz(), () => false);
  assert.strictEqual(legend({}, [{}, {}]), "legend:2");
});

it("legendLargestFirst sorts by the chart's size accessor, read when sorting", () => {
  const viz = mockViz();
  const rows = [
    {size: 2, amount: 9},
    {size: 7, amount: 1},
    {size: 4, amount: 5},
  ];
  const sorted = key => rows.slice().sort(legendLargestFirst(viz, key));
  assert.deepStrictEqual(
    sorted("sum").map(d => d.size),
    [7, 4, 2],
  );
  assert.deepStrictEqual(
    sorted("value").map(d => d.amount),
    [9, 5, 1],
  );
  const bySum = legendLargestFirst(viz, "sum");
  viz.schema.sum = d => -d.size;
  assert.deepStrictEqual(
    rows
      .slice()
      .sort(bySum)
      .map(d => d.size),
    [2, 4, 7],
    "a later sum applies",
  );
});
