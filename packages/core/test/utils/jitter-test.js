import {it} from "vitest";
import assert from "assert";
import {
  DEFAULT_JITTER,
  jitterOffset,
  jitterWidth,
} from "../../src/utils/jitter.ts";

/**
    Seeded jitter: `jitterWidth` reads a `jitter` setting as a share of the
    band, and `jitterOffset` gives each key a fixed offset across it.
*/

it("jitterWidth: true is the default share, a number is clamped, anything else is none", () => {
  assert.strictEqual(DEFAULT_JITTER, 0.6);
  assert.strictEqual(jitterWidth(true), 0.6);
  assert.strictEqual(jitterWidth(0.25), 0.25);
  assert.strictEqual(jitterWidth(2), 1);
  assert.strictEqual(jitterWidth(-1), 0);
  for (const off of [false, undefined, null, NaN, "0.5", {}])
    assert.strictEqual(jitterWidth(off), 0, String(off));
});

it("jitterOffset: the same key always lands at the same offset, inside [-0.5, 0.5)", () => {
  const keys = Array.from({length: 2000}, (_, i) => `point ${i}`);
  const offsets = keys.map(jitterOffset);
  assert.deepStrictEqual(keys.map(jitterOffset), offsets);
  for (const o of offsets) assert.ok(o >= -0.5 && o < 0.5, `${o}`);
  assert.strictEqual(jitterOffset(""), jitterOffset(""));
});

it("jitterOffset: neighboring keys spread evenly across the band", () => {
  const offsets = Array.from({length: 4000}, (_, i) => jitterOffset(`${i}`));
  const bins = [0, 0, 0, 0];
  for (const o of offsets) bins[Math.min(3, Math.floor((o + 0.5) * 4))]++;
  for (const n of bins) assert.ok(n > 850 && n < 1150, `bin of ${n}`);
  // Consecutive ids don't land side by side.
  const steps = offsets.slice(1).map((o, i) => Math.abs(o - offsets[i]));
  const mean = steps.reduce((a, b) => a + b, 0) / steps.length;
  assert.ok(mean > 0.25, `mean step ${mean}`);
});
