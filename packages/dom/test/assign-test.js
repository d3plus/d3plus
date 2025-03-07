import assert from "assert";
import {default as assign} from "../src/assign.js";

it("assign", () => {

  const a = {id: "foo", deep: {group: "A"}},
        b = {id: "bar", deep: {value: 20}},
        c = {deep: {group: "B"}, other: 2};

  const obj = assign({}, a, b, c);

  assert.strictEqual(obj.id, "bar", "base value");
  assert.strictEqual(obj.deep.value, 20, "deep value");
  assert.strictEqual(obj.deep.group, "B", "deep value overwrite");
  assert.strictEqual(a.deep.group, "A", "non-destructive");
  assert.strictEqual(a.deep.value, undefined, "non-additive");
  assert.strictEqual(assign(a, undefined, null, false, "string", 42), a, "filters out non-objects");

});
