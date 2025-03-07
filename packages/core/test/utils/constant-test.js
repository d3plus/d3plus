import assert from "assert";
import {default as constant} from "../../src/utils/constant.js";

it("constant", () => {

  assert.strictEqual(constant(42)(), 42, "Number");
  assert.strictEqual(constant("value")(), "value", "String");
  const arr = [1, 2, 3];
  assert.strictEqual(constant(arr)(), arr, "Array");
  const obj = {foo: "bar"};
  assert.strictEqual(constant(obj)(), obj, "Object");

});
