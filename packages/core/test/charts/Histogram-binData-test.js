import {it} from "vitest";
import assert from "assert";
import {thresholdScott} from "d3-array";
import binData, {
  accumulate,
  cumulativeNormalize,
} from "../../src/charts/Histogram/binData.ts";
import {heightLabel} from "../../src/charts/Histogram/labels.ts";

const rows = values => values.map(value => ({value}));
const value = d => d.value;
const sum = arr => arr.reduce((a, b) => a + b, 0);
const edgesOf = bins => [bins[0].x0, ...bins.map(b => b.x1)];

it("Histogram binData: explicit edges count every value", () => {
  const bins = binData(rows([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), {
    value,
    thresholds: [5],
    domain: [0, 10],
  });
  assert.deepStrictEqual(edgesOf(bins), [0, 5, 10]);
  assert.deepStrictEqual(
    bins.map(b => b.count),
    [5, 6],
  );
  assert.deepStrictEqual(
    bins.map(b => b.x),
    [2.5, 7.5],
  );
  assert.deepStrictEqual(
    bins.map(b => b.y),
    [5, 6],
  );
});

it("Histogram binData: count and generator thresholds", () => {
  const data = rows(Array.from({length: 200}, (_, i) => (i * 37) % 100));
  const byCount = binData(data, {value, thresholds: 10});
  assert.strictEqual(byCount.length, 10);
  assert.strictEqual(sum(byCount.map(b => b.count)), 200);

  const byFn = binData(data, {value, thresholds: thresholdScott});
  assert.ok(byFn.length > 1);
  assert.strictEqual(sum(byFn.map(b => b.count)), 200);
});

it("Histogram binData: binWidth overrides thresholds with uniform edges", () => {
  const bins = binData(rows([1, 3, 7, 12, 19]), {
    value,
    width: 5,
    thresholds: 50,
  });
  assert.deepStrictEqual(edgesOf(bins), [0, 5, 10, 15, 20]);
  assert.deepStrictEqual(
    bins.map(b => b.count),
    [2, 1, 1, 1],
  );
});

it("Histogram binData: groups share edges and every group gets every bin", () => {
  const data = [
    ...[1, 2, 3].map(value => ({g: "a", value})),
    ...[8, 9].map(value => ({g: "b", value})),
  ];
  const bins = binData(data, {value, group: d => d.g, width: 5});
  const a = bins.filter(b => b.g === "a"),
    b = bins.filter(b => b.g === "b");
  assert.deepStrictEqual(edgesOf(a), edgesOf(b));
  assert.deepStrictEqual(
    a.map(d => d.count),
    [3, 0],
  );
  assert.deepStrictEqual(
    b.map(d => d.count),
    [0, 2],
  );
});

it("Histogram binData: density integrates to 1 and relative sums to 1", () => {
  const data = [
    ...Array.from({length: 30}, (_, i) => ({g: "a", value: i % 10})),
    ...Array.from({length: 20}, (_, i) => ({g: "b", value: 5 + (i % 10)})),
  ];
  const group = d => d.g;
  const density = binData(data, {
    value,
    group,
    width: 2.5,
    normalize: "density",
  });
  assert.ok(Math.abs(sum(density.map(b => b.y * (b.x1 - b.x0))) - 1) < 1e-9);
  const relative = binData(data, {
    value,
    group,
    width: 2.5,
    normalize: "relative",
  });
  assert.ok(Math.abs(sum(relative.map(b => b.y)) - 1) < 1e-9);
});

it("Histogram binData: drops non-finite values and handles a single value", () => {
  const bins = binData(rows([1, NaN, "x", undefined, Infinity, 2]), {
    value,
    width: 1,
  });
  assert.strictEqual(sum(bins.map(b => b.count)), 2);

  const single = binData(rows([4, 4, 4]), {value});
  assert.strictEqual(sum(single.map(b => b.count)), 3);
  assert.ok(single.every(b => b.x1 > b.x0));

  assert.deepStrictEqual(binData([], {value}), []);
});

it("Histogram binData: panels bin and normalize their own rows", () => {
  const data = [
    ...[1, 2, 3, 12].map(value => ({p: "a", g: "x", value})),
    ...[21, 22, 33].map(value => ({p: "b", g: "x", value})),
    {p: "b", g: "y", value: 24},
  ];
  const panel = d => d.p,
    group = d => d.g;
  const own = binData(data, {
    value,
    group,
    panel,
    width: 10,
    normalize: "relative",
  });
  const a = own.filter(b => b.p === "a"),
    b = own.filter(b => b.p === "b");
  assert.deepStrictEqual(edgesOf(a), [0, 10, 20]);
  assert.deepStrictEqual(
    a.map(d => d.count),
    [3, 1],
  );
  assert.deepStrictEqual(
    a.map(d => d.y),
    [0.75, 0.25],
  );
  const bx = b.filter(d => d.g === "x"),
    by = b.filter(d => d.g === "y");
  assert.deepStrictEqual(edgesOf(bx), [20, 30, 40]);
  assert.deepStrictEqual(
    edgesOf(by),
    [20, 30, 40],
    "a panel's groups share its edges",
  );
  assert.deepStrictEqual(
    bx.map(d => d.y),
    [0.5, 0.25],
  );
  assert.deepStrictEqual(
    by.map(d => d.y),
    [0.25, 0],
    "a panel normalizes across its groups",
  );

  const shared = binData(data, {value, panel, width: 10, sharedEdges: true});
  for (const p of ["a", "b"])
    assert.deepStrictEqual(
      edgesOf(shared.filter(d => d.p === p)),
      [0, 10, 20, 30, 40],
    );
  assert.deepStrictEqual(
    shared.filter(d => d.p === "b").map(d => d.count),
    [0, 0, 3, 1],
  );
});

it("Histogram binData: cumulative counts run from the lowest bin", () => {
  // Bins of width 10: [0,10)→1, [10,20)→0, [20,30)→4, [30,40]→3.
  const bins = binData(rows([5, 21, 22, 25, 29, 31, 35, 40]), {
    value,
    width: 10,
    domain: [0, 40],
    cumulative: true,
  });
  assert.deepStrictEqual(
    bins.map(b => b.count),
    [1, 0, 4, 3],
    "each bin keeps its own count",
  );
  assert.deepStrictEqual(
    bins.map(b => b.y),
    [1, 1, 5, 8],
    "an empty bin carries the running count forward",
  );
  assert.deepStrictEqual(
    bins.map(b => b.cumulativeCount),
    [1, 1, 5, 8],
  );
  assert.ok(
    binData(rows([1, 2, 2]), {value, width: 1}).every(
      b => !("cumulativeCount" in b),
    ),
    "non-cumulative bins carry no running count",
  );
});

it("Histogram binData: cumulative relative is an empirical CDF ending at 1", () => {
  const data = rows(Array.from({length: 7}, (_, i) => i * 3));
  const bins = binData(data, {
    value,
    width: 5,
    normalize: "relative",
    cumulative: true,
  });
  assert.strictEqual(bins[bins.length - 1].y, 1, "ends at exactly 1");
  bins.slice(1).forEach((b, i) => assert.ok(b.y >= bins[i].y, "monotone"));
  assert.deepStrictEqual(
    bins.map(b => b.y),
    bins.map(b => b.cumulativeCount / 7),
  );
});

it("Histogram binData: reverse cumulative counts values at or above each bin", () => {
  const bins = binData(rows([5, 21, 22, 25, 29, 31, 35, 40]), {
    value,
    width: 10,
    domain: [0, 40],
    cumulative: "reverse",
  });
  assert.deepStrictEqual(
    bins.map(b => b.y),
    [8, 7, 7, 3],
  );
  const relative = binData(rows([5, 21, 22, 25, 29, 31, 35, 40]), {
    value,
    width: 10,
    domain: [0, 40],
    normalize: "relative",
    cumulative: "reverse",
  });
  assert.strictEqual(relative[0].y, 1, "starts at exactly 1");
});

it("Histogram binData: cumulative density draws as cumulative relative", () => {
  const data = rows([1, 2, 3, 12, 13, 27]);
  const density = binData(data, {
    value,
    width: 10,
    normalize: "density",
    cumulative: true,
  });
  const relative = binData(data, {
    value,
    width: 10,
    normalize: "relative",
    cumulative: true,
  });
  assert.deepStrictEqual(
    density.map(b => b.y),
    relative.map(b => b.y),
  );
  assert.strictEqual(density[density.length - 1].y, 1);
});

it("Histogram binData: each group accumulates on its own", () => {
  const data = [
    ...[1, 2, 13].map(value => ({g: "a", value})),
    ...[8, 25, 26, 27].map(value => ({g: "b", value})),
  ];
  const bins = binData(data, {
    value,
    group: d => d.g,
    width: 10,
    cumulative: true,
  });
  const a = bins.filter(b => b.g === "a"),
    b = bins.filter(b => b.g === "b");
  assert.deepStrictEqual(
    a.map(d => d.y),
    [2, 3, 3],
  );
  assert.deepStrictEqual(
    b.map(d => d.y),
    [1, 1, 4],
  );
  const relative = binData(data, {
    value,
    group: d => d.g,
    width: 10,
    normalize: "relative",
    cumulative: true,
  });
  const top = relative.filter(d => d.x0 === 20).reduce((s, d) => s + d.y, 0);
  assert.ok(
    Math.abs(top - 1) < 1e-12,
    "stacked relative groups end at 1 together",
  );
});

it("Histogram binData: accumulate runs forward, in reverse, or not at all", () => {
  const counts = [2, 0, 3, 1];
  assert.deepStrictEqual(accumulate(counts, true), [2, 2, 5, 6]);
  assert.deepStrictEqual(accumulate(counts, "reverse"), [6, 4, 4, 1]);
  const copy = accumulate(counts, false);
  assert.deepStrictEqual(copy, counts);
  assert.notStrictEqual(copy, counts, "returns a copy");
  assert.deepStrictEqual(accumulate([], true), []);
});

it("Histogram binData: cumulativeNormalize reads a cumulative density as relative", () => {
  assert.strictEqual(cumulativeNormalize("density", true), "relative");
  assert.strictEqual(cumulativeNormalize("density", "reverse"), "relative");
  assert.strictEqual(cumulativeNormalize("density", false), "density");
  assert.strictEqual(cumulativeNormalize("count", true), "count");
  assert.strictEqual(cumulativeNormalize("relative", true), "relative");
  assert.strictEqual(cumulativeNormalize(), "count");
});

it("Histogram heightLabel names the bar height for each mode", () => {
  assert.strictEqual(heightLabel(), "Count");
  assert.strictEqual(heightLabel("density"), "Density");
  assert.strictEqual(heightLabel("relative"), "Relative Frequency");
  assert.strictEqual(heightLabel("count", true), "Cumulative Count");
  assert.strictEqual(heightLabel("count", "reverse"), "Cumulative Count");
  assert.strictEqual(
    heightLabel("relative", true),
    "Cumulative Relative Frequency",
  );
  assert.strictEqual(
    heightLabel("density", true),
    "Cumulative Relative Frequency",
  );
  assert.strictEqual(heightLabel("bogus"), "Count");
});
