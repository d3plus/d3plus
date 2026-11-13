import {it} from "vitest";
import assert from "assert";
import {
  default as movingAverage,
  movingSpan,
  movingWindow,
} from "../src/movingAverage.ts";
import {movingAverage as fromIndex} from "../index.ts";

const close = (actual, expected, msg) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${msg}: ${actual} vs ${expected}`,
  );

it("movingWindow: trailing windows end at the point, centered ones straddle it", () => {
  assert.deepStrictEqual(movingWindow(2, 10, 3), [0, 2]);
  assert.strictEqual(movingWindow(1, 10, 3), null, "no full window yet");
  assert.deepStrictEqual(movingWindow(2, 10, 5, true), [0, 4]);
  assert.strictEqual(movingWindow(1, 10, 5, true), null);
  assert.strictEqual(movingWindow(8, 10, 5, true), null, "runs past the end");
  assert.deepStrictEqual(
    movingWindow(2, 10, 4, true),
    [0, 3],
    "an even window starts half its width before the point",
  );
  assert.deepStrictEqual(movingWindow(0, 1, 1), [0, 0]);
});

it("movingAverage: a trailing mean from the first full window on", () => {
  const points = [1, 2, 3, 4, 5].map(x => [x, x * 2]);
  const result = movingAverage(points, {window: 3});
  assert.strictEqual(result.type, "movingAverage");
  assert.strictEqual(fromIndex, movingAverage);
  assert.deepStrictEqual(
    result.points.map(p => [p.x, p.mean]),
    [
      [3, 4],
      [4, 6],
      [5, 8],
    ],
  );
  assert.strictEqual(result.window, 3);
  assert.strictEqual(result.center, false);
  assert.strictEqual(result.n, 5);
  assert.deepStrictEqual(result.extent, [1, 5]);
});

it("movingAverage: a centered window averages either side of each point", () => {
  const points = [1, 2, 3, 4, 5].map(x => [x, x * 2]);
  const result = movingAverage(points, {window: 3, center: true});
  assert.deepStrictEqual(
    result.points.map(p => [p.x, p.mean]),
    [
      [2, 4],
      [3, 6],
      [4, 8],
    ],
  );
  assert.strictEqual(result.center, true);
});

it("movingAverage: bands sit a number of population standard deviations out", () => {
  const points = [
    [0, 2],
    [1, 4],
    [2, 4],
    [3, 4],
    [4, 5],
    [5, 5],
    [6, 7],
    [7, 9],
  ];
  const result = movingAverage(points, {window: 8});
  const [p] = result.points;
  close(p.mean, 5, "mean");
  close(p.deviation, 2, "population standard deviation");
  close(p.lower, 1, "two below by default");
  close(p.upper, 9, "two above by default");
  const wide = movingAverage(points, {window: 8, deviations: 3}).points[0];
  close(wide.upper, 11, "three deviations");
  const none = movingAverage(points, {window: 8, deviations: 0}).points[0];
  assert.strictEqual(none.lower, none.mean, "no bands at 0");
  const negative = movingAverage(points, {window: 8, deviations: -1});
  assert.strictEqual(negative.deviations, 0, "a negative width clamps to 0");
});

it("movingAverage: sorts by x, merges points at one x, and skips non-finite pairs", () => {
  const result = movingAverage(
    [
      [3, 30],
      [1, 10],
      [2, 10],
      [2, 30],
      [4, NaN],
      [NaN, 5],
    ],
    {window: 2},
  );
  assert.deepStrictEqual(
    result.points.map(p => [p.x, p.mean]),
    [
      [2, 15],
      [3, 25],
    ],
  );
  assert.strictEqual(result.n, 3, "three distinct x values");
});

it("movingAverage: defaults to a window of 7, and is null without a full window", () => {
  const points = [1, 2, 3, 4, 5, 6, 7, 8].map(x => [x, x]);
  const result = movingAverage(points);
  assert.strictEqual(result.window, 7);
  assert.strictEqual(result.spanned, false);
  assert.deepStrictEqual(
    result.points.map(p => p.x),
    [7, 8],
  );
  assert.strictEqual(movingAverage(points.slice(0, 6)), null);
  assert.strictEqual(movingAverage([]), null);
  assert.strictEqual(
    movingAverage(points, {window: 0}).window,
    1,
    "at least one point",
  );
  assert.strictEqual(movingAverage(points, {window: 2.7}).window, 2);
});

it("movingSpan: the points within a stretch of x ending at (or centered on) a point", () => {
  const xs = [0, 1, 2, 4, 8, 9, 10];
  const back3 = x => x - 3;
  assert.deepStrictEqual(movingSpan(xs, 3, back3), [2, 3], "(1, 4]");
  assert.deepStrictEqual(movingSpan(xs, 4, back3), [4, 4], "a gap leaves one");
  assert.deepStrictEqual(movingSpan(xs, 6, back3), [4, 6], "(7, 10]");
  assert.strictEqual(movingSpan(xs, 2, back3), null, "reaches before 0");
  assert.deepStrictEqual(movingSpan(xs, 2, back3, true), [1, 2], "(0.5, 3.5]");
  assert.strictEqual(movingSpan(xs, 6, back3, true), null, "past the end");
  assert.strictEqual(
    movingSpan(xs, 3, x => x),
    null,
    "an empty stretch",
  );
});

it("movingAverage: a span averages the points in a stretch of x, however they're spaced", () => {
  const points = [
    [0, 10],
    [1, 20],
    [2, 30],
    [4, 40],
    [8, 50],
    [9, 60],
    [10, 70],
  ];
  const result = movingAverage(points, {span: x => x - 3, deviations: 0});
  assert.strictEqual(result.spanned, true);
  assert.strictEqual(result.window, 0);
  assert.deepStrictEqual(
    result.points.map(p => [p.x, p.mean]),
    [
      [4, 35],
      [8, 50],
      [9, 55],
      [10, 60],
    ],
    "the gap before 8 leaves it alone in its stretch",
  );
  const centered = movingAverage(points, {
    span: x => x - 4,
    center: true,
    deviations: 0,
  });
  assert.deepStrictEqual(
    centered.points.map(p => [p.x, p.mean]),
    [
      [2, 30],
      [4, 40],
      [8, 60],
    ],
  );
});
