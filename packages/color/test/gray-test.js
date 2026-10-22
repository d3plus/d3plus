import {it} from "vitest";
import assert from "assert";
import {colorDefaults, colorGray} from "../index.ts";
import {hsl} from "d3-color";

it("colorGray", () => {
  const steps = Object.keys(colorGray).map(Number);
  assert.deepStrictEqual(
    steps,
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    "steps 50 through 900",
  );
  const lightness = steps.map(s => hsl(colorGray[s]).l);
  assert.ok(
    lightness.every((l, i) => i === 0 || l < lightness[i - 1]),
    "darkens with each step",
  );
  assert.strictEqual(colorDefaults.dark, colorGray[700], "dark default");
  assert.strictEqual(colorDefaults.light, colorGray[50], "light default");
  assert.strictEqual(colorDefaults.missing, colorGray[400], "missing default");
});
