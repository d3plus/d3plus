import {it} from "vitest";
import assert from "assert";
import {default as rampDark} from "../src/rampDark.ts";
import {colorToOklch} from "../src/oklab.ts";

const L = c => colorToOklch(c).l;
const background = "#212529";

it("rampDark: length and edge cases", () => {
  assert.deepStrictEqual(rampDark("#4dabf7", 0), [], "n=0 → empty");
  assert.deepStrictEqual(rampDark("#4dabf7", -2), [], "negative n → empty");
  assert.deepStrictEqual(rampDark("#4dabf7", 1), ["#4dabf7"], "n=1 → base");
  assert.strictEqual(rampDark("#4dabf7", 7).length, 7, "n steps");
});

it("rampDark: dim → bright, ending on the base", () => {
  const seq = rampDark("#4dabf7", 6, {background});
  assert.strictEqual(seq[5], "#4dabf7", "bright end is the base");
  const Ls = seq.map(L);
  for (let i = 1; i < Ls.length; i++)
    assert.ok(Ls[i] > Ls[i - 1], "lightness increases toward the base");
  // Even steps in OKLab lightness.
  const gaps = Ls.slice(1).map((l, i) => l - Ls[i]);
  for (const g of gaps) assert.ok(Math.abs(g - gaps[0]) < 0.01, "even steps");
});

it("rampDark: dim end sits just above the background", () => {
  const [low] = rampDark("#4dabf7", 5, {background});
  const lift = L(low) - L(background);
  assert.ok(lift > 0.08 && lift < 0.2, `lift ${lift} above the background`);
  // Low chroma, but still the base hue (reads as data, not as gray).
  const {c, h} = colorToOklch(low);
  assert.ok(c > 0.03 && c < colorToOklch("#4dabf7").c, "low-chroma tint");
  assert.ok(Math.abs(h - colorToOklch("#4dabf7").h) < 12, "same hue");
  // The default background is gray 900.
  assert.deepStrictEqual(
    rampDark("#4dabf7", 5),
    rampDark("#4dabf7", 5, {background}),
  );
});

it("rampDark: high end is bright", () => {
  const seq = rampDark("#4dabf7", 5, {background});
  assert.ok(L(seq[4]) > 0.65, "bright end");
});

it("rampDark: follows a darker or lighter background", () => {
  const black = rampDark("#4dabf7", 5, {background: "#000"});
  const slate = rampDark("#4dabf7", 5, {background: "#343a40"});
  assert.ok(L(black[0]) < L(slate[0]), "dim end tracks the background");
});

it("rampDark: single hue across the range", () => {
  const baseHue = colorToOklch("#ff6b6b").h;
  for (const c of rampDark("#ff6b6b", 6)) {
    const diff = Math.abs(colorToOklch(c).h - baseHue);
    assert.ok(Math.min(diff, 360 - diff) < 12, "hue stays in the family");
  }
});

it("rampDark: a dim base still ramps upward", () => {
  const seq = rampDark("#1864ab", 5, {background});
  const Ls = seq.map(L);
  for (let i = 1; i < Ls.length; i++) assert.ok(Ls[i] >= Ls[i - 1]);
  assert.ok(Ls[0] > L(background), "dim end stays above the background");
  assert.strictEqual(seq[4], "#1864ab");
});

it("rampDark: ordinal ramps lift the dim end and keep a span", () => {
  const cont = rampDark("#4dabf7", 5, {background});
  const ord = rampDark("#4dabf7", 5, {background, ordinal: true});
  assert.ok(L(ord[0]) > L(cont[0]), "ordinal dim end is brighter");
  assert.ok(L(ord[4]) - L(ord[0]) > 0.22, "ordinal span");
  // A dim base still gets a bright top step.
  const dim = rampDark("#1c7ed6", 4, {background, ordinal: true});
  assert.ok(L(dim[3]) - L(dim[0]) > 0.22);
});
