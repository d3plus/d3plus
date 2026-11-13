import {it} from "vitest";
import assert from "assert";
import {default as movingAverage, movingWindow} from "../src/movingAverage.ts";
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

it("movingAverage: defaults to a window of 5, and is null without a full window", () => {
  const points = [1, 2, 3, 4, 5, 6].map(x => [x, x]);
  const result = movingAverage(points);
  assert.strictEqual(result.window, 5);
  assert.deepStrictEqual(
    result.points.map(p => p.x),
    [5, 6],
  );
  assert.strictEqual(movingAverage(points.slice(0, 4)), null);
  assert.strictEqual(movingAverage([]), null);
  assert.strictEqual(
    movingAverage(points, {window: 0}).window,
    1,
    "at least one point",
  );
  assert.strictEqual(movingAverage(points, {window: 2.7}).window, 2);
});
