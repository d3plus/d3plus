import {it} from "vitest";
import assert from "assert";
import configValue from "../../src/utils/configValue.ts";
import constant from "../../src/utils/constant.ts";

it("configValue: returns a constant as it is", () => {
  const obj = {foo: "bar"};
  for (const value of [30, 0, "Arial", "", obj, null, undefined])
    assert.strictEqual(configValue(value, {id: "a"}, 1), value);
});

it("configValue: calls a function with the arguments it is given", () => {
  const seen = [];
  const fn = (...args) => {
    seen.push(args);
    return 30;
  };
  const d = {id: "a"};
  assert.strictEqual(configValue(fn, d, 2), 30);
  assert.strictEqual(configValue(fn), 30);
  assert.deepStrictEqual(seen, [[d, 2], []]);
  assert.strictEqual(configValue(constant(12)), 12, "a d3plus constant");
});
