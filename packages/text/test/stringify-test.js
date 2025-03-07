import assert from "assert";
import {default as stringify} from "../src/stringify.js";

it("stringify", () => {

  assert.strictEqual(stringify(true), "true");
  assert.strictEqual(stringify(false), "false");
  assert.strictEqual(stringify(undefined), "undefined");
  assert.strictEqual(stringify(42), "42", "integer");
  assert.strictEqual(stringify(3.14159265), "3.14159265", "float");
  assert.strictEqual(stringify("string"), "string");

});
