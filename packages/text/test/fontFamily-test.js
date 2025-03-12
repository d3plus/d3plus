import assert from "assert";
import {fontFamilyStringify} from "../src/fontFamily.js";

it("fontFamily", () => {

  assert.strictEqual(fontFamilyStringify(["Helvetica Neue", "Helvetica", "sans-serif"]), "'Helvetica Neue', 'Helvetica', sans-serif", "quote and no quote");
  assert.strictEqual(fontFamilyStringify(["ui-monospace", "monospace"]), "ui-monospace, monospace", "no quotes");

});
