import assert from "assert";
import {thresholdScott} from "d3-array";
import binData from "../../es/src/charts/Histogram/binData.js";

const rows = values => values.map(value => ({value}));
const value = d => d.value;
const sum = arr => arr.reduce((a, b) => a + b, 0);
const edgesOf = bins => [bins[0].x0, ...bins.map(b => b.x1)];

it("Histogram binData: explicit edges count every value", () => {
  const bins = binData(rows([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), {value, thresholds: [5], domain: [0, 10]});
  assert.deepStrictEqual(edgesOf(bins), [0, 5, 10]);
  assert.deepStrictEqual(bins.map(b => b.count), [5, 6]);
  assert.deepStrictEqual(bins.map(b => b.x), [2.5, 7.5]);
  assert.deepStrictEqual(bins.map(b => b.y), [5, 6]);
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
  const bins = binData(rows([1, 3, 7, 12, 19]), {value, width: 5, thresholds: 50});
  assert.deepStrictEqual(edgesOf(bins), [0, 5, 10, 15, 20]);
  assert.deepStrictEqual(bins.map(b => b.count), [2, 1, 1, 1]);
});

it("Histogram binData: groups share edges and every group gets every bin", () => {
  const data = [
    ...[1, 2, 3].map(value => ({g: "a", value})),
    ...[8, 9].map(value => ({g: "b", value})),
  ];
  const bins = binData(data, {value, group: d => d.g, width: 5});
  const a = bins.filter(b => b.g === "a"), b = bins.filter(b => b.g === "b");
  assert.deepStrictEqual(edgesOf(a), edgesOf(b));
  assert.deepStrictEqual(a.map(d => d.count), [3, 0]);
  assert.deepStrictEqual(b.map(d => d.count), [0, 2]);
});

it("Histogram binData: density integrates to 1 and relative sums to 1", () => {
  const data = [
    ...Array.from({length: 30}, (_, i) => ({g: "a", value: i % 10})),
    ...Array.from({length: 20}, (_, i) => ({g: "b", value: 5 + (i % 10)})),
  ];
  const group = d => d.g;
  const density = binData(data, {value, group, width: 2.5, normalize: "density"});
  assert.ok(Math.abs(sum(density.map(b => b.y * (b.x1 - b.x0))) - 1) < 1e-9);
  const relative = binData(data, {value, group, width: 2.5, normalize: "relative"});
  assert.ok(Math.abs(sum(relative.map(b => b.y)) - 1) < 1e-9);
});

it("Histogram binData: drops non-finite values and handles a single value", () => {
  const bins = binData(rows([1, NaN, "x", undefined, Infinity, 2]), {value, width: 1});
  assert.strictEqual(sum(bins.map(b => b.count)), 2);

  const single = binData(rows([4, 4, 4]), {value});
  assert.strictEqual(sum(single.map(b => b.count)), 3);
  assert.ok(single.every(b => b.x1 > b.x0));

  assert.deepStrictEqual(binData([], {value}), []);
});
