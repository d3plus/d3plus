import assert from "assert";
import {default as contrast} from "../es/src/contrast.js";
import {default as defaults} from "../es/src/defaults.js";

it("contrast", () => {
  // Text color is chosen to MAXIMIZE the WCAG contrast ratio against the
  // background — the more legible of the two text tokens wins.

  // Backgrounds where light text is more legible.
  for (const bg of ["#000", "#777", "#c00", "#00f", "#880", "#c0c", "#888", "#990"]) {
    assert.strictEqual(contrast(bg), defaults.light, `light on ${bg}`);
  }

  // Backgrounds where dark text is more legible (bright/pale colors).
  for (const bg of ["#0b0", "#0aa", "#fff", "#fcc", "#8c8", "#0bb", "#fcf"]) {
    assert.strictEqual(contrast(bg), defaults.dark, `dark on ${bg}`);
  }

  assert.strictEqual(contrast("#000", {light: "#eee"}), "#eee", "custom light override");
  assert.strictEqual(contrast("#fff", {dark: "#111"}), "#111", "custom dark override");
});
