import assert from "assert";
import {default as strip} from "../src/strip.js";

it("strip", () => {

  assert.strictEqual(strip("one two"), "one-two", "Strips Spaces");
  assert.strictEqual(strip("one two", " "), "one two", "Changes Spacer Argument");
  assert.strictEqual(strip("one@two"), "onetwo", "Strips Non-character");
  assert.strictEqual(strip("á"), "a", "Strips Diacritic");
  assert.strictEqual(strip("والاجتماعية"), "والاجتماعية", "Keeps Arabic");

});
