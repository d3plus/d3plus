import {it} from "vitest";
import assert from "assert";
import {default as constant, constantValue} from "../../src/utils/constant.ts";

it("constant", () => {
  assert.strictEqual(constant(42)(), 42, "Number");
  assert.strictEqual(constant("value")(), "value", "String");
  const arr = [1, 2, 3];
  assert.strictEqual(constant(arr)(), arr, "Array");
  const obj = {foo: "bar"};
  assert.strictEqual(constant(obj)(), obj, "Object");
});

it("constantValue: the value a constant returns, or undefined", () => {
  const values = [false, 0, "", null, undefined, 42, {foo: "bar"}];
  for (const value of values)
    assert.deepStrictEqual(constantValue(constant(value)), {value});
  assert.strictEqual(
    constantValue(() => false),
    undefined,
  );
  assert.strictEqual(constantValue(false), undefined);
  assert.strictEqual(constantValue(undefined), undefined);
  assert.strictEqual(constantValue({}), undefined);
});
