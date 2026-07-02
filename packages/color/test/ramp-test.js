import assert from "assert";
import {default as ramp} from "../es/src/ramp.js";
import {colorToOklch} from "../es/src/oklab.js";

it("ramp", () => {
  // Length + edge cases.
  assert.deepStrictEqual(ramp("#1c7ed6", 0), [], "n=0 → empty");
  assert.deepStrictEqual(ramp("#1c7ed6", 1), ["#1c7ed6"], "n=1 → base");
  assert.strictEqual(ramp("#1c7ed6", 6).length, 6, "n steps");

  // A continuous ramp ends exactly on the base color (no round-trip drift).
  const seq = ramp("#1c7ed6", 6);
  assert.strictEqual(seq[seq.length - 1], "#1c7ed6", "dark end is the base");

  // Steps run light → dark (monotone decreasing OKLCH lightness).
  const Ls = seq.map(c => colorToOklch(c).l);
  for (let i = 1; i < Ls.length; i++) {
    assert.ok(Ls[i] < Ls[i - 1], "lightness decreases toward the base");
  }

  // Single hue: every step shares the base hue (no HSL-style drift to white).
  const hues = seq.slice(0, -1).map(c => colorToOklch(c).h);
  const baseHue = colorToOklch("#1c7ed6").h;
  for (const h of hues) {
    assert.ok(Math.abs(h - baseHue) < 12, "hue stays within the base family");
  }
});
