import {it} from "vitest";
import assert from "assert";
import {
  isAggregatedBranch,
  mergeBranch,
  nestPartition,
  partitionLayout,
  partitionLineage,
  partitionSort,
} from "../../src/charts/partition/hierarchy.ts";

const key = k => d => d[k];
const sum = d => d.value;
const rows = [
  {group: "A", item: "a1", value: 30},
  {group: "A", item: "a2", value: 10},
  {group: "B", item: "b1", value: 60},
];
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);

it("partition hierarchy: nestPartition nests one branch per key path", () => {
  const {children, own} = nestPartition(rows, [key("group"), key("item")]);
  assert.deepStrictEqual(own, []);
  assert.deepStrictEqual(
    children.map(c => [c.key, c.level, c.path, c.rows.length]),
    [
      ["A", 0, ["A"], 2],
      ["B", 0, ["B"], 1],
    ],
  );
  assert.deepStrictEqual(
    children[0].children.map(c => c.path),
    [
      ["A", "a1"],
      ["A", "a2"],
    ],
  );
});

it("partition hierarchy: nestPartition ends a row without a deeper key at its parent", () => {
  const ragged = [...rows, {group: "A", value: 5}];
  const {children} = nestPartition(ragged, [key("group"), key("item")]);
  assert.deepStrictEqual(children[0].own, [ragged[3]]);
  assert.deepStrictEqual(nestPartition(rows, []), {children: [], own: rows});
});

it("partition hierarchy: isAggregatedBranch and partitionSort put the threshold bucket last", () => {
  const bucket = {data: {rows: [{_isAggregation: true}]}};
  const plain = {data: {rows: [{}]}};
  assert.strictEqual(isAggregatedBranch(bucket), true);
  assert.strictEqual(isAggregatedBranch(plain), false);
  assert.strictEqual(
    isAggregatedBranch({data: {rows: [{_isAggregation: true}], children: []}}),
    false,
  );
  const sort = partitionSort(() => -1);
  assert.strictEqual(sort(bucket, plain), 1);
  assert.strictEqual(sort(plain, bucket), -1);
  assert.strictEqual(sort(plain, plain), -1, "falls back to the base sort");
});

it("partition hierarchy: mergeBranch drops bucket markers and stamped shares", () => {
  const merged = mergeBranch([
    {group: "A", value: 1, _isAggregation: true, _threshold: 0.1},
    {group: "A", value: 2, share: 0.4, __d3plusShare: 0.4},
  ]);
  assert.strictEqual(merged.value, 3);
  assert.ok(!("_isAggregation" in merged));
  assert.ok(!("_threshold" in merged));
  assert.ok(!("__d3plusShare" in merged));
  assert.ok(!("share" in merged), "a stamped share is not data");
});

it("partition hierarchy: partitionLayout spans 0–1 by default and places each node via the callback", () => {
  const seen = [];
  const nodes = partitionLayout(
    {data: rows, keys: [key("group"), key("item")], firstLevel: 0, focusPath: [], sum},
    f => {
      seen.push(f.id);
      return {mid: (f.x0 + f.x1) / 2};
    },
  );
  assert.strictEqual(nodes.length, 5, "2 groups + 3 items; the whole is not drawn");
  assert.deepStrictEqual(seen, nodes.map(n => n.id));
  const b = nodes.find(n => n.id === JSON.stringify(["B"]));
  close(b.x0, 0.4, "data order without a sort");
  close(b.x1, 1, "B's share");
  close(b.mid, 0.7, "placement added");
  assert.strictEqual(b.depth, 1);
  assert.strictEqual(b.level, 0);
  assert.strictEqual(b.hasChildren, true);
  const a1 = nodes.find(n => n.id === JSON.stringify(["A", "a1"]));
  assert.strictEqual(a1.parent.id, JSON.stringify(["A"]));
  assert.strictEqual(a1.datum, rows[0], "a single-row leaf keeps its row");
  assert.strictEqual(a1.i, 0);
  close(a1.share, 0.3, "share of the whole");
  close(a1.parentShare, 0.75, "share of the parent");
});

it("partition hierarchy: partitionLayout honors breadth, a focus, and skips zero values", () => {
  const nodes = partitionLayout(
    {
      data: [rows[0], rows[1], {group: "A", item: "a3", value: 0}],
      keys: [key("item")],
      firstLevel: 1,
      focusPath: ["A"],
      sum,
      breadth: 10,
    },
    () => ({}),
  );
  assert.strictEqual(nodes[0].id, JSON.stringify(["A"]));
  assert.strictEqual(nodes[0].depth, 0);
  assert.deepStrictEqual([nodes[0].x0, nodes[0].x1], [0, 10]);
  assert.ok(!nodes.some(n => n.path[1] === "a3"), "zero-value branch left out");
  assert.deepStrictEqual(
    partitionLayout({data: [], keys: [], firstLevel: 0, focusPath: [], sum}, () => ({})),
    [],
  );
});

it("partition hierarchy: partitionLineage walks a node up to the drawn root", () => {
  const root = {id: "r"};
  const mid = {id: "m", parent: root};
  const leaf = {id: "l", parent: mid};
  assert.deepStrictEqual(partitionLineage(leaf).map(n => n.id), ["l", "m", "r"]);
  assert.deepStrictEqual(partitionLineage(root), [root]);
});
