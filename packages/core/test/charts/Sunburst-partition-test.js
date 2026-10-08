import assert from "assert";
import {
  isAggregatedBranch,
  mergeBranch,
  nestSunburst,
  sunburstLayout,
  sunburstLineage,
  sunburstSort,
} from "../../es/src/charts/Sunburst/partition.js";
import {sunburstRadii} from "../../es/src/charts/Sunburst/geometry.js";

const TAU = Math.PI * 2;
const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} vs ${b}`);
const key = k => d => d[k];
const rows = [
  {group: "A", item: "a1", value: 30},
  {group: "A", item: "a2", value: 10},
  {group: "B", item: "b1", value: 40},
  {group: "B", item: "b2", value: 20},
];
const sum = d => d.value;
const bySize = sunburstSort((a, b) => b.value - a.value);

function layout(extra = {}) {
  return sunburstLayout({
    data: rows,
    keys: [key("group"), key("item")],
    firstLevel: 0,
    focusPath: [],
    sum,
    sort: bySize,
    radii: sunburstRadii(150, 2),
    ...extra,
  });
}

it("Sunburst partition: nestSunburst: nests one branch per key path, recording each branch's level and path", () => {
  const {children, own} = nestSunburst(rows, [key("group"), key("item")]);
  assert.deepStrictEqual(own, []);
  assert.deepStrictEqual(
    children.map(c => c.key),
    ["A", "B"],
  );
  const a = children[0];
  assert.strictEqual(a.level, 0);
  assert.strictEqual(a.rows.length, 2);
  assert.deepStrictEqual(
    a.children.map(c => c.path),
    [
      ["A", "a1"],
      ["A", "a2"],
    ],
  );
  assert.strictEqual(a.children[0].level, 1);
  assert.deepStrictEqual(a.children[0].own, [rows[0]]);
});

it("Sunburst partition: nestSunburst: ends a row without a deeper key at its parent", () => {
  const ragged = [...rows, {group: "A", value: 5}];
  const {children} = nestSunburst(ragged, [key("group"), key("item")]);
  assert.deepStrictEqual(children[0].own, [ragged[4]]);
  assert.strictEqual(children[0].children.length, 2);
});

it("Sunburst partition: nestSunburst: starts from a given level and path", () => {
  const {children} = nestSunburst(rows.slice(0, 2), [key("item")], {
    level: 1,
    path: ["A"],
  });
  assert.deepStrictEqual(
    children.map(c => [c.level, c.path]),
    [
      [1, ["A", "a1"]],
      [1, ["A", "a2"]],
    ],
  );
});

it("Sunburst partition: sunburstLayout: sizes every arc's angle by its summed value", () => {
  const nodes = layout();
  const total = 100;
  for (const n of nodes)
    close(n.endAngle - n.startAngle, (n.value / total) * TAU, n.id);
  const b = nodes.find(n => n.id === JSON.stringify(["B"]));
  assert.strictEqual(b.value, 60);
  close(b.share, 0.6, "share of the whole");
});

it("Sunburst partition: sunburstLayout: draws children within their parent's angles, one ring further out", () => {
  const nodes = layout();
  for (const n of nodes.filter(d => d.parent)) {
    assert.ok(
      n.startAngle >= n.parent.startAngle - 1e-9 &&
        n.endAngle <= n.parent.endAngle + 1e-9,
    );
    assert.strictEqual(n.innerRadius, n.parent.outerRadius);
    assert.strictEqual(n.depth, n.parent.depth + 1);
  }
  assert.deepStrictEqual(
    nodes.filter(n => n.depth === 1).map(n => [n.innerRadius, n.outerRadius]),
    [
      [50, 100],
      [50, 100],
    ],
  );
});

it("Sunburst partition: sunburstLayout: leaves the center empty without a focus and orders largest first", () => {
  const nodes = layout();
  assert.ok(nodes.every(n => n.depth > 0));
  assert.deepStrictEqual(
    nodes.filter(n => n.depth === 1).map(n => n.path[0]),
    ["B", "A"],
  );
  close(nodes[0].startAngle, 0, "largest starts at 12 o'clock");
});

it("Sunburst partition: sunburstLayout: records each arc's share of its parent", () => {
  const nodes = layout();
  const a1 = nodes.find(n => n.id === JSON.stringify(["A", "a1"]));
  close(a1.parentShare, 0.75, "a1 of A");
  close(a1.share, 0.3, "a1 of all");
  assert.strictEqual(a1.hasChildren, false);
  assert.strictEqual(a1.parent.hasChildren, true);
});

it("Sunburst partition: sunburstLayout: uses source rows for leaves and merged rows for parents", () => {
  const nodes = layout();
  const a1 = nodes.find(n => n.id === JSON.stringify(["A", "a1"]));
  assert.strictEqual(a1.datum, rows[0]);
  assert.strictEqual(a1.i, 0);
  const a = nodes.find(n => n.id === JSON.stringify(["A"]));
  assert.notStrictEqual(a.datum, rows[0]);
  assert.strictEqual(a.datum.group, "A");
  assert.strictEqual(a.i, undefined);
});

it("Sunburst partition: sunburstLayout: draws a focused node as the full center disc, keeping ids stable", () => {
  const focusRows = rows.slice(0, 2);
  const nodes = sunburstLayout({
    data: focusRows,
    keys: [key("item")],
    firstLevel: 1,
    focusPath: ["A"],
    sum,
    radii: sunburstRadii(150, 1),
  });
  const center = nodes[0];
  assert.strictEqual(center.id, JSON.stringify(["A"]));
  assert.strictEqual(center.depth, 0);
  assert.strictEqual(center.level, 0);
  assert.deepStrictEqual(
    [center.startAngle, center.endAngle, center.innerRadius],
    [0, TAU, 0],
  );
  assert.deepStrictEqual(
    nodes
      .slice(1)
      .map(n => n.id)
      .sort(),
    [JSON.stringify(["A", "a1"]), JSON.stringify(["A", "a2"])],
  );
  close(nodes[1].share, 0.75, "share of the focused whole");
});

it("Sunburst partition: sunburstLayout: skips zero-value branches and empty data", () => {
  const nodes = sunburstLayout({
    data: [...rows, {group: "C", item: "c1", value: 0}],
    keys: [key("group"), key("item")],
    firstLevel: 0,
    focusPath: [],
    sum,
    radii: sunburstRadii(150, 2),
  });
  assert.ok(!nodes.some(n => n.path[0] === "C"));
  assert.deepStrictEqual(
    sunburstLayout({
      data: [],
      keys: [],
      firstLevel: 0,
      focusPath: [],
      sum,
      radii: [],
    }),
    [],
  );
});

const bucket = {
  group: "A",
  item: ["a2", "a3"],
  value: 4,
  _isAggregation: true,
  _threshold: 0.05,
};

it("Sunburst partition: threshold buckets: sorts the bucket last regardless of value", () => {
  const nodes = sunburstLayout({
    data: [{group: "A", item: "a1", value: 1}, bucket],
    keys: [key("group"), key("item")],
    firstLevel: 0,
    focusPath: [],
    sum,
    sort: bySize,
    radii: sunburstRadii(150, 2),
  });
  const ring = nodes.filter(n => n.depth === 2);
  assert.strictEqual(ring[ring.length - 1].datum, bucket);
});

it("Sunburst partition: threshold buckets: recognizes only a leaf holding a single bucket row", () => {
  assert.strictEqual(isAggregatedBranch({data: {rows: [bucket]}}), true);
  assert.strictEqual(
    isAggregatedBranch({data: {rows: [bucket], children: [{}]}}),
    false,
  );
  assert.strictEqual(isAggregatedBranch({data: {rows: [rows[0]]}}), false);
});

it("Sunburst partition: threshold buckets: keeps bucket markers out of merged parents", () => {
  const merged = mergeBranch([bucket]);
  assert.strictEqual(merged._isAggregation, undefined);
  assert.strictEqual(merged._threshold, undefined);
  assert.strictEqual(merged.value, 4);
  assert.strictEqual(bucket._isAggregation, true, "source row untouched");
});

it("Sunburst partition: sunburstLineage walks from a node out to its outermost drawn ancestor", () => {
  const nodes = layout();
  const a2 = nodes.find(n => n.id === JSON.stringify(["A", "a2"]));
  assert.deepStrictEqual(
    sunburstLineage(a2).map(n => n.id),
    [a2.id, JSON.stringify(["A"])],
  );
});

it("Sunburst partition: mergeBranch drops a share d3plus stamped on its rows but keeps a data field named share", () => {
  const stamped = [
    {group: "A", value: 3, share: 0.3, __d3plusShare: 0.3},
    {group: "A", value: 7, share: 0.7, __d3plusShare: 0.7},
  ];
  const merged = mergeBranch(stamped);
  assert.strictEqual(
    merged.__d3plusShare,
    undefined,
    "no earlier draw's share folded in",
  );
  assert.strictEqual(merged.share, undefined);
  assert.strictEqual(merged.value, 10);
  assert.strictEqual(stamped[0].__d3plusShare, 0.3, "source rows untouched");
  const own = mergeBranch([
    {group: "A", value: 3, share: 12, __d3plusShare: 0.3},
    {group: "A", value: 7, share: 30, __d3plusShare: 0.7},
  ]);
  assert.strictEqual(
    own.share,
    42,
    "the user's own share field merges as data",
  );
});
