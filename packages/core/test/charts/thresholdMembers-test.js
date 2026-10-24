import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {StackedArea, Treemap, Waffle} from "../../index.ts";
import {
  appendThresholdMembers,
  MEMBER_LIMIT,
  MEMBERS_KEY,
  memberName,
  thresholdMemberList,
  thresholdMemberRows,
  thresholdMembers,
} from "../../src/charts/features/thresholdMembers.ts";
import {thresholdFunction} from "../../src/charts/Treemap/thresholdFunction.ts";
import {makeChart} from "../../src/charts/definition/makeChart.ts";
import Viz from "../../src/charts/viz/Viz.ts";
import accessor from "../../src/utils/accessor.ts";
import constant from "../../src/utils/constant.ts";

useJsdom();

/**
    #784: a threshold bucket needs two or more items, and lists them, with
    their values, in its tooltips.
*/

const key = accessor("id");
const value = accessor("value");

it("thresholdMembers: thresholdMemberList sums each item's rows, largest first", () => {
  const rows = [
    {id: "c", value: 1},
    {id: "d", value: 2},
    {id: "c", value: 3},
    {id: "e", value: -1},
  ];
  assert.deepStrictEqual(
    thresholdMemberList(rows, key, d => `name ${d.id}`, value),
    [
      {label: "name c", value: 4},
      {label: "name d", value: 2},
      {label: "name e", value: -1},
    ],
  );
  assert.deepStrictEqual(
    thresholdMemberList([{id: "x", value: "n/a"}], key, key, value),
    [{label: "x", value: 0}],
    "a value that isn't a number counts as 0",
  );
});

it("thresholdMembers: thresholdMembers reads a bucket row through its wrappers", () => {
  const members = [{label: "a", value: 1}];
  const row = {[MEMBERS_KEY]: members};
  assert.strictEqual(thresholdMembers(row), members);
  assert.strictEqual(
    thresholdMembers({__d3plus__: true, data: {__d3plus__: true, data: row}}),
    members,
  );
  assert.deepStrictEqual(
    thresholdMembers({[MEMBERS_KEY]: members[0]}),
    members,
    "a merge that unwrapped a one-item list",
  );
  assert.deepStrictEqual(thresholdMembers({id: "a"}), []);
  assert.deepStrictEqual(thresholdMembers(undefined), []);
});

/** A viz stub with the bits `thresholdMemberRows` reads. */
const stubViz = (extra = {}) => ({
  schema: {locale: "en-US", translate: s => `t:${s}`},
  ...extra,
});

it("thresholdMembers: thresholdMemberRows lists the members, then how many more", () => {
  const members = Array.from({length: 13}, (_, i) => ({
    label: `m${i}`,
    value: 1000 * (13 - i),
  }));
  const rows = thresholdMemberRows(stubViz(), {[MEMBERS_KEY]: members});
  assert.strictEqual(MEMBER_LIMIT, 10);
  assert.strictEqual(rows.length, 11);
  assert.deepStrictEqual(rows[0], [memberName("m0"), "13k"]);
  assert.deepStrictEqual(rows[10], [memberName("+3 t:more"), ""]);

  const short = thresholdMemberRows(
    stubViz({_thresholdMemberFormat: v => `$${v}`}),
    {[MEMBERS_KEY]: members.slice(0, 2)},
    1,
  );
  assert.deepStrictEqual(short, [
    [memberName("m0"), "$13000"],
    [memberName("+1 t:more"), ""],
  ]);
  assert.deepStrictEqual(thresholdMemberRows(stubViz(), {id: "a"}), []);
});

it("thresholdMembers: memberName indents a member's name", () => {
  assert.ok(memberName("Fox").includes(">Fox</span>"));
  assert.ok(memberName("Fox").includes("padding-left"));
});

/** A tooltip stub whose `tbody` reads and writes like Tooltip's. */
const stubTooltip = tbody => ({
  _tbody: tbody,
  tbody(_) {
    if (!arguments.length) return this._tbody;
    this._tbody = _;
    return this;
  },
});

it("thresholdMembers: appendThresholdMembers adds the member rows after a tooltip's own", () => {
  const bucket = {[MEMBERS_KEY]: [{label: "a", value: 2}]};
  const fromArray = stubTooltip([["Share", "1%"]]);
  appendThresholdMembers(fromArray, stubViz(), bucket);
  assert.deepStrictEqual(fromArray.tbody()({}, 0), [
    ["Share", "1%"],
    [memberName("a"), "2"],
  ]);

  const fromFn = stubTooltip((d, i) => [[`row ${d.id} ${i}`, ""]]);
  appendThresholdMembers(fromFn, stubViz(), bucket);
  assert.deepStrictEqual(fromFn.tbody()({id: "x"}, 3), [
    ["row x 3", ""],
    [memberName("a"), "2"],
  ]);

  const empty = stubTooltip(undefined);
  appendThresholdMembers(empty, stubViz(), bucket);
  assert.deepStrictEqual(empty.tbody()({}, 0), [[memberName("a"), "2"]]);

  const plain = stubTooltip([["Share", "1%"]]);
  appendThresholdMembers(plain, stubViz(), {id: "b"});
  assert.deepStrictEqual(plain.tbody(), [["Share", "1%"]], "not a bucket");
});

const items = [
  {id: "a", value: 60},
  {id: "b", value: 30},
  {id: "c", value: 4},
  {id: "d", value: 3},
  {id: "e", value: 3},
];
const inputs = {
  aggs: {},
  drawDepth: 0,
  groupBy: [key],
  threshold: constant(0.05),
  thresholdKey: value,
};

it("thresholdMembers: Treemap's threshold lists the items it buckets, largest first", () => {
  const out = thresholdFunction(items, inputs);
  const bucket = out.find(d => d._isAggregation);
  assert.deepStrictEqual(bucket[MEMBERS_KEY], [
    {label: "c", value: 4},
    {label: "d", value: 3},
    {label: "e", value: 3},
  ]);
  const named = thresholdFunction(items, {...inputs, label: d => `#${d.id}`});
  assert.deepStrictEqual(
    named.find(d => d._isAggregation)[MEMBERS_KEY].map(m => m.label),
    ["#c", "#d", "#e"],
  );
});

it("thresholdMembers: Treemap's threshold leaves a lone small item as itself", () => {
  const out = thresholdFunction(items.slice(0, 3), inputs);
  assert.deepStrictEqual(out, items.slice(0, 3));
  assert.ok(!out.some(d => d._isAggregation));
});

it("thresholdMembers: a Treemap and a Waffle fold their legend into the bucket", () => {
  for (const Chart of [Treemap, Waffle]) {
    const chart = new Chart()
      .data(items)
      .groupBy("id")
      .sum("value")
      .threshold(0.05);
    chart._preDraw();
    assert.deepStrictEqual(
      chart._legendData.map(d => chart._drawLabel(d)),
      ["a", "b", "Values < 5%"],
      Chart.name,
    );
    const bucket = chart._legendData[2];
    assert.deepStrictEqual(chart._id(bucket), ["c", "d", "e"]);
    assert.strictEqual(bucket[MEMBERS_KEY].length, 3);
  }
});

it("thresholdMembers: makeChart folds the legend through the def's threshold, else the base chart's", () => {
  const Own = makeChart({
    name: "Own",
    emit: () => [],
    thresholdFunction: (viz, data, all) => [...data, {all: all.length}],
  });
  const legend = [{id: 1}, {id: 2}];
  assert.deepStrictEqual(new Own()._thresholdLegend(legend), [
    ...legend,
    {all: 2},
  ]);
  const Child = makeChart({name: "Child", emit: () => []}, Own);
  assert.strictEqual(new Child()._thresholdLegend(legend).length, 3);
  const Plain = makeChart({name: "Plain", emit: () => []}, Viz);
  assert.strictEqual(new Plain()._thresholdLegend(legend), legend);
});

it("thresholdMembers: a stacked Plot formats member values like its value axis", () => {
  const chart = new StackedArea().yConfig({tickFormat: d => `${d} units`});
  assert.strictEqual(chart._thresholdMemberFormat(4), "4 units");
});
