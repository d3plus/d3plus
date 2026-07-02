import assert from "assert";
import {
  colorToOklab,
  colorToOklch,
  contrastRatio,
  oklabToColor,
  oklchToColor,
  relativeLuminance,
} from "../es/src/oklab.js";

it("oklab", () => {
  // White and black anchor the lightness axis at 1 and 0.
  assert.ok(Math.abs(colorToOklab("#ffffff").l - 1) < 1e-3, "white L≈1");
  assert.ok(colorToOklab("#000000").l < 1e-3, "black L≈0");

  // Round-trips through OKLab and OKLCH return the original hex.
  for (const hex of ["#4c6ef5", "#e67700", "#1098ad", "#2f9e44"]) {
    assert.strictEqual(oklabToColor(colorToOklab(hex)), hex, `oklab round-trip ${hex}`);
    assert.strictEqual(oklchToColor(colorToOklch(hex)), hex, `oklch round-trip ${hex}`);
  }

  // Any CSS color parses (named / rgb / short hex), not only 6-digit hex.
  assert.strictEqual(oklabToColor(colorToOklab("red")), "#ff0000", "named color");
  assert.strictEqual(oklabToColor(colorToOklab("#f00")), "#ff0000", "short hex");

  // Hue is stable when lightening the way a ramp does (raise L, ease chroma
  // down together) — this stays in gamut, unlike HSL's drift toward white.
  const blue = colorToOklch("#1c7ed6");
  const lighter = colorToOklch(oklchToColor({...blue, l: 0.8, c: blue.c * 0.4}));
  assert.ok(Math.abs(lighter.h - blue.h) < 3, "hue preserved when lightened");
});

it("luminance + contrast", () => {
  assert.ok(Math.abs(relativeLuminance("#ffffff") - 1) < 1e-6, "white lum 1");
  assert.ok(relativeLuminance("#000000") < 1e-6, "black lum 0");
  assert.ok(Math.abs(contrastRatio("#000", "#fff") - 21) < 0.1, "black/white 21:1");
  assert.ok(Math.abs(contrastRatio("#abc", "#abc") - 1) < 1e-6, "same color 1:1");
  // Symmetric.
  assert.strictEqual(contrastRatio("#123", "#eee"), contrastRatio("#eee", "#123"), "symmetric");
});
