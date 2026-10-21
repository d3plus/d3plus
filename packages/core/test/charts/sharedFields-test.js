import assert from "assert";
import {rowLegend, shareRow} from "../../es/src/charts/features/sharedFields.js";

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
  assert.strictEqual(value({}, 0, {__d3plusShare: [0.1, 0.15]}), "25%", "a merged row sums its members");
  assert.strictEqual(value({}, 0, {}), "", "no share, no value");
});

it("rowLegend hides while every drawn row is its own entry", () => {
  const viz = mockViz();
  const legend = rowLegend(viz);
  assert.strictEqual(legend({}, [{}, {}]), false);
  assert.strictEqual(legend({}, [{}]), "legend:1", "grouped entries use the chart's legend");
});

it("rowLegend keeps the legend when the chart's labels don't name every row", () => {
  const legend = rowLegend(mockViz(), () => false);
  assert.strictEqual(legend({}, [{}, {}]), "legend:2");
});
