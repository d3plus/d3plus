import {it} from "vitest";
import assert from "assert";
import {merge} from "@d3plus/data";
import {
  groupLevelAccessor,
  groupLevelAgg,
  groupLevelKey,
  keepGroupLevels,
} from "../../src/charts/viz/groupByLevels.ts";
import {Treemap} from "../../index.ts";

const zone = d => (d.lon < -90 ? "West" : "East");
// Both rows lie East; their summed lon (-130) would lie West.
const rows = [
  {slug: "a", lon: -60},
  {slug: "b", lon: -70},
];

it("groupLevelKey — an internal key per level", () => {
  assert.strictEqual(groupLevelKey(0), "__d3plusGroupBy0");
  assert.notStrictEqual(groupLevelKey(0), groupLevelKey(1));
});

it("groupLevelAccessor — a merged row's kept value, else the function's", () => {
  const accessor = groupLevelAccessor(zone, 1);
  assert.strictEqual(accessor(rows[0], 0), "East");
  assert.strictEqual(accessor({lon: -130, [groupLevelKey(1)]: "East"}), "East");
  assert.strictEqual(
    accessor({lon: -130, [groupLevelKey(0)]: "East"}),
    "West",
    "another level's key",
  );
});

it("groupLevelAgg — the shared value, else the unique ones", () => {
  const read = d => d.v;
  assert.strictEqual(groupLevelAgg([{v: "a"}, {v: "a"}], read), "a");
  assert.deepStrictEqual(groupLevelAgg([{v: "a"}, {v: "b"}], read), ["a", "b"]);
  assert.deepStrictEqual(
    groupLevelAgg([{v: ["a", "b"]}, {v: "b"}], read),
    ["a", "b"],
    "merged rows' lists",
  );
});

it("keepGroupLevels — keeps each function level's value on the merged row", () => {
  const groupBy = [groupLevelAccessor(zone, 0), d => d.slug];
  const merged = merge(rows);
  assert.strictEqual(zone(merged), "West", "the summed lon misleads zone");
  keepGroupLevels(groupBy, merged, rows, d => rows.indexOf(d));
  assert.strictEqual(merged[groupLevelKey(0)], "East");
  assert.strictEqual(groupBy[0](merged, 0), "East");
  assert.ok(!(groupLevelKey(1) in merged), "a plain accessor keeps nothing");
  // Merging merged rows carries the kept values through `aggs`.
  const other = {slug: "c", lon: -120, [groupLevelKey(0)]: "West"};
  const again = merge([merged, other], {[groupLevelKey(0)]: groupLevelAgg});
  assert.deepStrictEqual(again[groupLevelKey(0)], ["East", "West"]);
});

it("keepGroupLevels — leaves a row that is one of its own leaves alone", () => {
  const groupBy = [groupLevelAccessor(zone, 0)];
  const row = {...rows[0]};
  keepGroupLevels(groupBy, row, [row], () => 0);
  assert.ok(!(groupLevelKey(0) in row), "the user's row is untouched");
});

it("groupBy — a function installs its level accessor and aggregator", () => {
  const viz = new Treemap().groupBy([zone, "slug"]);
  const [level0, level1] = viz.groupBy();
  assert.strictEqual(level0(rows[0], 0), "East");
  assert.strictEqual(level0({lon: -60, [groupLevelKey(0)]: "West"}, 0), "West");
  assert.strictEqual(level1(rows[0], 0), "a");
  assert.strictEqual(viz.schema.aggs[groupLevelKey(0)], groupLevelAgg);
});
