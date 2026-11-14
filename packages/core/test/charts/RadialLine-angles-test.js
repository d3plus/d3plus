import {it} from "vitest";
import assert from "assert";
import {
  RADIAL_MAX_TICKS,
  radialAngleScale,
  radialKey,
  radialPeriod,
  radialThin,
} from "../../src/charts/RadialLine/angles.ts";

const TAU = Math.PI * 2;
const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ""} ${a} ≈ ${b}`);

it("radialKey reads a date by its time and anything else as text", () => {
  assert.strictEqual(
    radialKey(new Date(Date.UTC(2020, 0, 1))),
    "1577836800000",
  );
  assert.strictEqual(radialKey(3), "3");
  assert.strictEqual(radialKey("Jan"), "Jan");
  assert.strictEqual(radialKey(undefined), "undefined");
});

it("radialPeriod ends one step past the largest value, so the last sits short of the first", () => {
  assert.deepStrictEqual(radialPeriod([0, 1, 2, 23]), [0, 24]);
  assert.deepStrictEqual(radialPeriod([0, 30, 60, 330]), [0, 360]);
  assert.deepStrictEqual(radialPeriod([5]), [5, 6], "one value: a step of 1");
  assert.deepStrictEqual(radialPeriod([]), [0, 1], "no values");
});

it("radialPeriod takes either end the domain sets", () => {
  assert.deepStrictEqual(radialPeriod([1, 2, 3], [0, 12]), [0, 12]);
  assert.deepStrictEqual(radialPeriod([1, 2, 3], [0]), [0, 4]);
  assert.deepStrictEqual(radialPeriod([1, 2, 3], [undefined, 10]), [1, 10]);
  assert.deepStrictEqual(
    radialPeriod([1, 2, 3], [5, 2]),
    [5, 6],
    "an empty period falls back to one step",
  );
});

it("radialThin keeps every few entries, starting with the first", () => {
  const items = Array.from({length: 10}, (_v, k) => k);
  assert.deepStrictEqual(radialThin(items, 20), items);
  assert.deepStrictEqual(radialThin(items, 5), [0, 2, 4, 6, 8]);
  assert.deepStrictEqual(radialThin(items, 4), [0, 3, 6, 9]);
  assert.deepStrictEqual(radialThin(items, 0), items, "no limit");
});

it("radialAngleScale spreads numbers by value over their period, clockwise from 12 o'clock", () => {
  const hours = Array.from({length: 24}, (_v, h) => h);
  const scale = radialAngleScale(hours);
  assert.strictEqual(scale.continuous, true);
  assert.deepStrictEqual(scale.period, [0, 24]);
  close(scale.angleOf(0), 0, "0 at 12 o'clock");
  close(scale.angleOf(6), TAU / 4, "6 at 3 o'clock");
  close(scale.angleOf(23), (TAU * 23) / 24);
  close(scale.angleOf(24), 0, "the period wraps");
  close(scale.angleOf(-6), (TAU * 3) / 4, "below the period wraps too");
  assert.strictEqual(scale.angleOf("x"), undefined);
  assert.strictEqual(scale.angleOf(Number.NaN), undefined);
  assert.strictEqual(scale.ticks.length, 24, "every hour is labeled");
  assert.deepStrictEqual(scale.categories, []);
});

it("radialAngleScale leaves gaps where numbers are missing", () => {
  const scale = radialAngleScale([0, 6, 12], {domain: [0, 24]});
  close(scale.angleOf(6), TAU / 4);
  close(scale.angleOf(12), TAU / 2);
  assert.deepStrictEqual(
    scale.ticks.map(t => t.value),
    [0, 6, 12],
  );
});

it("radialAngleScale thins dense numbers to round ticks within the period", () => {
  const minutes = Array.from({length: 60}, (_v, m) => m);
  const scale = radialAngleScale(minutes, {domain: [0, 60]});
  assert.ok(scale.ticks.length <= RADIAL_MAX_TICKS);
  assert.ok(scale.ticks.every(t => t.value >= 0 && t.value < 60));
  assert.ok(
    scale.ticks.every(t => t.value % 5 === 0),
    "round values",
  );
});

it("radialAngleScale spaces categories evenly from the start, in first-seen order", () => {
  const scale = radialAngleScale(["Jan", "Feb", "Mar", "Jan", "Apr"]);
  assert.strictEqual(scale.continuous, false);
  assert.deepStrictEqual(scale.categories, ["Jan", "Feb", "Mar", "Apr"]);
  close(scale.angleOf("Jan"), 0);
  close(scale.angleOf("Mar"), TAU / 2);
  assert.strictEqual(scale.angleOf("May"), undefined);
  assert.deepStrictEqual(
    scale.ticks.map(t => t.key),
    ["Jan", "Feb", "Mar", "Apr"],
  );
  assert.strictEqual(scale.period, undefined);
});

it("radialAngleScale orders categories by the domain and sorts dates by time", () => {
  const ordered = radialAngleScale(["b", "a", "c"], {
    domain: ["c", "a", "b", "a"],
  });
  assert.deepStrictEqual(ordered.categories, ["c", "a", "b"]);
  close(ordered.angleOf("a"), TAU / 3);
  const d = m => new Date(2024, m, 1);
  const dates = radialAngleScale([d(2), d(0), d(1)]);
  assert.deepStrictEqual(
    dates.categories.map(v => v.getMonth()),
    [0, 1, 2],
  );
  close(dates.angleOf(d(1)), TAU / 3, "a date matches by its time");
});

it("radialAngleScale starts at `start` and runs counterclockwise when asked", () => {
  const scale = radialAngleScale(["a", "b", "c", "d"], {
    start: Math.PI / 2,
    clockwise: false,
  });
  close(scale.angleOf("a"), Math.PI / 2);
  close(scale.angleOf("b"), 0, "a quarter turn back");
  const numbers = radialAngleScale([0, 1, 2, 3], {clockwise: false});
  close(numbers.angleOf(1), -TAU / 4);
});

it("radialAngleScale thins crowded categories and ignores missing values", () => {
  const many = Array.from({length: 48}, (_v, k) => `c${k}`);
  const scale = radialAngleScale([...many, null, undefined], {maxTicks: 12});
  assert.strictEqual(scale.categories.length, 48);
  assert.strictEqual(scale.ticks.length, 12);
  assert.strictEqual(scale.ticks[1].key, "c4");
  const mixed = radialAngleScale([1, "a", 2]);
  assert.strictEqual(
    mixed.continuous,
    false,
    "any non-number makes categories",
  );
});
