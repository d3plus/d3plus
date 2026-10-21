import assert from "assert";
import {default as grayscale} from "../es/src/grayscale.js";

it("grayscale", () => {
  assert.strictEqual(grayscale("#ff0000"), "rgb(128, 128, 128)", "keeps lightness");
  assert.strictEqual(grayscale("#000000"), "rgb(0, 0, 0)");
  assert.strictEqual(grayscale("rgba(255, 0, 0, 0.5)"), "rgba(128, 128, 128, 0.5)", "keeps alpha");
  assert.strictEqual(grayscale("transparent"), "transparent", "a transparent fill stays transparent");
  assert.strictEqual(grayscale("none"), "none", "unparseable values pass through");
});
