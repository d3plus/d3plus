import assert from "assert";
import {default as saveElement} from "../es/src/saveElement.js";

it("default", () => {
  // early return when elem is falsy
  assert.strictEqual(saveElement(null), undefined, "null elem returns early");
  assert.strictEqual(saveElement(undefined), undefined, "undefined elem returns early");
  assert.strictEqual(saveElement(false), undefined, "false elem returns early");
});
