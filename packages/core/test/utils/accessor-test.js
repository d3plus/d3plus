import assert from "assert";
import {default as accessor} from "../../src/utils/accessor.js";

it("accessor", () => {

  const obj = {id: "test", null: null, zero: 0, false: false};
  assert.strictEqual(accessor("id")(obj), "test", "String");
  assert.strictEqual(accessor("null")(obj), null, "null");
  assert.strictEqual(accessor("zero")(obj), 0, "0");
  assert.strictEqual(accessor("false")(obj), false, "false");

  assert.strictEqual(accessor("id", "default")(obj), "test", "String w/ default");
  assert.strictEqual(accessor("null", "default")(obj), null, "null w/ default");
  assert.strictEqual(accessor("zero", "default")(obj), 0, "0 w/ default");
  assert.strictEqual(accessor("false", "default")(obj), false, "false w/ default");

  assert.strictEqual(accessor("missing", "default")(obj), "default", "String as default");
  assert.strictEqual(accessor("missing", null)(obj), null, "null as default");
  assert.strictEqual(accessor("missing", 0)(obj), 0, "0 as default");
  assert.strictEqual(accessor("missing", false)(obj), false, "false as default");

});
