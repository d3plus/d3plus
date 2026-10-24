import {it} from "vitest";
import assert from "assert";
import accessor from "../../src/utils/accessor.ts";
import {
  fieldAccessor,
  fieldNameOf,
  markField,
} from "../../src/utils/fieldAccessor.ts";

it("fieldAccessor reads its field and remembers the name", () => {
  const fn = fieldAccessor("value");
  assert.strictEqual(fn({value: 3}), 3);
  assert.strictEqual(fieldNameOf(fn), "value");
});

it("fieldAccessor remembers only string keys", () => {
  const fn = fieldAccessor(2);
  assert.strictEqual(fn({2: "b"}), "b");
  assert.strictEqual(fieldNameOf(fn), undefined);
});

it("fieldNameOf ignores plain accessors and non-functions", () => {
  assert.strictEqual(fieldNameOf(accessor("value")), undefined);
  assert.strictEqual(
    fieldNameOf(d => d.value),
    undefined,
  );
  assert.strictEqual(fieldNameOf("value"), undefined);
  assert.strictEqual(fieldNameOf(undefined), undefined);
});

it("markField names the field a function reads", () => {
  const compare = (a, b) => a - b;
  assert.strictEqual(markField(compare, "share"), compare);
  assert.strictEqual(fieldNameOf(compare), "share");
});
