import assert from "assert";
import {default as merge} from "../src/merge.js";

it("merge", () => {

  const obj = merge([
    {
      id: "foo", group: "A", value: 10, agg: 1, links: [1, 2],
      bool: false, undef: undefined, null: null, missing: 42
    },
    {
      id: "bar", group: "A", value: 20, agg: 1, links: [1, 3],
      bool: false, undef: undefined, null: null
    }
  ], {agg: (a, cb) => cb(a[0])});

  assert.strictEqual(obj.group, "A", "Unique String");
  assert.ok(obj.links.length === 3 && obj.links[0] === 1 && obj.links[1] === 2 && obj.links[2] === 3, "Multiple Arrays");
  assert.ok(obj.id.length === 2 && obj.id[0] === "foo" && obj.id[1] === "bar", "Multiple Strings");
  assert.strictEqual(obj.value, 30, "Number Summation");
  assert.strictEqual(obj.agg, 1, "Custom Aggregation");
  assert.strictEqual(obj.bool, false, "False Summation");
  assert.strictEqual(obj.undef, void 0, "Undefined Summation");
  assert.strictEqual(obj.null, null, "Null Summation");
  assert.strictEqual(obj.missing, 42, "Missing Summation");

});
