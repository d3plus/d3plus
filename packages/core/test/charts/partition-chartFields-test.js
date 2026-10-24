import {it} from "vitest";
import assert from "assert";
import {
  partitionDefaultSort,
  partitionLegendSort,
  partitionSetup,
  partitionSortDecorate,
  partitionSumCoerce,
  partitionSumOnSet,
  partitionThreshold,
} from "../../src/charts/partition/chartFields.ts";
import {icicleInteraction} from "../../src/charts/Icicle/interaction.ts";

const key = k => d => d[k];

function mockViz(extra = {}) {
  return {
    schema: {
      groupBy: [key("group"), key("item")],
      sum: d => d.value,
      locale: "en-US",
      translate: s => `t:${s}`,
      color: "c",
      shapeConfig: {fill: "f"},
      tooltipConfig: {tbody: [["share-row"]]},
      on: {mouseenter: () => undefined, "mousemove.shape": () => undefined},
      legend: function () {
        return "legend";
      },
      threshold: () => 0.2,
      thresholdKey: d => d.value,
    },
    _filteredData: [{value: 1}, {value: 2}],
    _drawDepth: 1,
    _drawLabel: d => d.item,
    ctx: {},
    ...extra,
  };
}

it("partition chartFields: partitionThreshold buckets small branches", () => {
  const viz = mockViz();
  const data = [
    {group: "A", item: "a1", value: 90},
    {group: "A", item: "a2", value: 5},
    {group: "A", item: "a3", value: 5},
  ];
  const out = partitionThreshold(viz, data);
  assert.ok(out.length < data.length, "the small items merged");
  const bucket = out.find(d => d._isAggregation);
  assert.ok(bucket);
  assert.deepStrictEqual(bucket.__d3plusMembers, [
    {label: "a2", value: 5},
    {label: "a3", value: 5},
  ]);
});

it("partition chartFields: partitionThreshold leaves a lone small branch as itself", () => {
  const viz = mockViz();
  const data = [
    {group: "A", item: "a1", value: 90},
    {group: "A", item: "a2", value: 10},
  ];
  assert.deepStrictEqual(partitionThreshold(viz, data), data);
});

it("partition chartFields: partitionDefaultSort and partitionSortDecorate order largest first, bucket last", () => {
  assert.ok(partitionDefaultSort({value: 1}, {value: 3}) > 0);
  assert.strictEqual(partitionDefaultSort({}, {}), 0);
  const sort = partitionSortDecorate(null, partitionDefaultSort);
  const bucket = {value: 100, data: {rows: [{_isAggregation: true}]}};
  const small = {value: 1, data: {rows: [{}]}};
  assert.ok(sort(bucket, small) > 0, "the bucket goes last despite its value");
});

it("partition chartFields: partitionSumCoerce and partitionSumOnSet", () => {
  const fn = d => d.v;
  assert.strictEqual(partitionSumCoerce(fn), fn);
  assert.strictEqual(partitionSumCoerce("v")({v: 4}), 4);
  const viz = mockViz();
  partitionSumOnSet(viz, fn);
  assert.strictEqual(viz.schema.thresholdKey, fn);
});

it("partition chartFields: partitionLegendSort orders by summed value", () => {
  const sort = partitionLegendSort(mockViz());
  assert.deepStrictEqual(
    [{value: 1}, {value: 3}, {value: 2}].sort(sort).map(d => d.value),
    [3, 2, 1],
  );
});

it("partition chartFields: partitionSetup records the default colors and installs the handlers", () => {
  const viz = mockViz();
  partitionSetup(viz, icicleInteraction);
  assert.strictEqual(viz.ctx.icicleDefaultColor, "c");
  assert.strictEqual(viz.ctx.icicleDefaultFill, "f");
  for (const k of ["mouseenter", "mousemove.shape", "click.shape"])
    assert.strictEqual(typeof viz.schema.on[k], "function", k);
});
