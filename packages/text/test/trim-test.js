import assert from "assert";
import {trim, trimLeft, trimRight} from "../src/trim.js";

it("trim", () => {

  assert.strictEqual(trim("  word  "), "word", "trim");
  assert.strictEqual(trimLeft("  word  "), "word  ", "trimLeft");
  assert.strictEqual(trimRight("  word  "), "  word", "trimRight");
  assert.strictEqual(trim(42), "42", "numeric");

});
