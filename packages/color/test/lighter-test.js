import assert from "assert";
import {default as lighter} from "../es/src/lighter.js";

it("lighter", () => {
  assert.strictEqual("rgb(207, 82, 82)", lighter("#440000"));
  assert.strictEqual("rgb(82, 207, 82)", lighter("#004400"));
  assert.strictEqual("rgb(82, 82, 207)", lighter("#000044"));

  const custom = lighter("#440000", 0.2);
  assert.ok(custom.startsWith("rgb("), "custom intensity value");
  assert.notStrictEqual(custom, lighter("#440000"), "different intensity produces different result");

  const zero = lighter("#440000", 0);
  assert.ok(zero.startsWith("rgb("), "zero intensity");

  const full = lighter("#440000", 1);
  assert.ok(full.startsWith("rgb("), "full intensity");
});
