import {it} from "vitest";
import assert from "assert";
import {quantile} from "d3-array";
import {boxStats, whiskerPair} from "../../src/shapes/boxStats.ts";

const values = [20, 40, 74, 80, 125, 140, 150, 160, 170, 180, 300, 900];

it("whiskerPair: a single mode applies to both ends", () => {
  assert.deepStrictEqual(whiskerPair("extent"), ["extent", "extent"]);
  assert.deepStrictEqual(whiskerPair(0.1), [0.1, 0.1]);
  assert.deepStrictEqual(whiskerPair(["tukey", 0.9]), ["tukey", 0.9]);
});

it("boxStats: quartiles, with Tukey whiskers clamped to the extreme values", () => {
  assert.deepStrictEqual(boxStats(values, ["tukey", "tukey"]), {
    first: 78.5,
    median: 145,
    third: 172.5,
    lowerLimit: 20,
    upperLimit: 313.5,
  });
  const narrow = [10, 11, 12, 13, 14];
  assert.deepStrictEqual(
    [
      boxStats(narrow, ["tukey", "tukey"]).lowerLimit,
      boxStats(narrow, ["tukey", "tukey"]).upperLimit,
    ],
    [10, 14],
  );
});

it("boxStats: extent and quantile whiskers, per side", () => {
  const s = boxStats(values, ["extent", 0.9]);
  assert.strictEqual(s.lowerLimit, 20);
  assert.strictEqual(s.upperLimit, quantile(values, 0.9));
  assert.strictEqual(boxStats(values, [0.05, "extent"]).upperLimit, 900);
  assert.strictEqual(boxStats(values, ["nope", "tukey"]).lowerLimit, undefined);
});
