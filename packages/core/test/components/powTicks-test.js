import {it} from "vitest";
import assert from "assert";
import {scalePow} from "d3-scale";
import {
  powExponent,
  powTicks,
  roundWithin,
} from "../../src/components/Axis/powTicks.ts";

/** #768: a `"pow"` axis's exponent, and ticks spaced along a power scale. */

it("powExponent — a positive number, else 1", () => {
  assert.strictEqual(powExponent(0.3), 0.3);
  assert.strictEqual(powExponent(2), 2);
  assert.strictEqual(powExponent(undefined), 1);
  assert.strictEqual(powExponent(0), 1, "0 flattens the axis");
  assert.strictEqual(powExponent(-1), 1);
  assert.strictEqual(powExponent(NaN), 1);
  assert.strictEqual(powExponent(Infinity), 1);
  assert.strictEqual(powExponent("0.5"), 1, "strings aren't read");
});

it("roundWithin — the roundest number within the tolerance", () => {
  assert.strictEqual(roundWithin(110000, 20000), 100000);
  assert.strictEqual(roundWithin(820, 22), 800);
  assert.strictEqual(roundWithin(910, 22), 900);
  assert.strictEqual(roundWithin(2580, 645), 2000);
  assert.strictEqual(roundWithin(-2580, 645), -2000, "keeps the sign");
  assert.strictEqual(roundWithin(0, 5), 0);
  assert.strictEqual(roundWithin(1.2345e-7, 1e-8), 1.2e-7, "tiny values");
  assert.strictEqual(roundWithin(123, 0), 123, "no tolerance");
  assert.strictEqual(roundWithin(123, NaN), 123);
});

it("powTicks — even steps along the axis, rounded", () => {
  const ticks = powTicks([0, 1e6], 0.3, 6);
  assert.deepStrictEqual(
    ticks,
    [0, 2000, 20000, 100000, 300000, 500000, 1000000],
  );
  // Spaced near-evenly on screen, unlike value-spaced ticks.
  const scale = scalePow().exponent(0.3).domain([0, 1e6]).range([0, 600]);
  const gaps = ticks.slice(1).map((t, i) => scale(t) - scale(ticks[i]));
  assert.ok(
    gaps.every(g => g > 50 && g < 160),
    `pixel gaps ${gaps.map(Math.round)}`,
  );
});

it("powTicks — minor ticks hold every major tick", () => {
  for (const [domain, exponent] of [
    [[0, 1e6], 0.3],
    [[0, 1000], 2],
    [[-500, 500], 0.5],
    [[1000, 1200], 0.3],
  ]) {
    const major = powTicks(domain, exponent, 5);
    const minor = powTicks(domain, exponent, 5, true);
    assert.ok(minor.length > major.length, `${domain} has minor ticks`);
    assert.ok(
      major.every(d => minor.includes(d)),
      `${domain}^${exponent}: ${major} ⊂ ${minor}`,
    );
  }
});

it("powTicks — exponents above 1 crowd the top, negatives mirror", () => {
  assert.deepStrictEqual(
    powTicks([0, 1000], 2, 6),
    [0, 400, 600, 700, 800, 900, 1000],
  );
  assert.deepStrictEqual(
    powTicks([-500, 500], 0.5, 6),
    [-500, -200, -50, 0, 50, 200, 500],
  );
});

it("powTicks — follows a high-to-low domain and stays inside it", () => {
  assert.deepStrictEqual(
    powTicks([1e6, 0], 0.3, 6),
    powTicks([0, 1e6], 0.3, 6).reverse(),
  );
  const ticks = powTicks([3, 997], 0.5, 4, true);
  assert.ok(
    ticks.every(d => d >= 3 && d <= 997),
    `${ticks}`,
  );
});

it("powTicks — degenerate domains", () => {
  assert.deepStrictEqual(powTicks([5, 5], 0.5, 4), [5]);
  assert.deepStrictEqual(powTicks([NaN, 5], 0.5, 4), []);
  assert.deepStrictEqual(powTicks([0, 10], 0, 4), []);
  assert.deepStrictEqual(
    powTicks([0, 10], 0.5, 0),
    [0, 10],
    "at least one step",
  );
});
