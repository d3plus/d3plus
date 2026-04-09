import assert from "assert";
import {default as getProp} from "../../es/src/utils/getProp.js";

it("getProp", () => {
  const ctx = {
    _color: (d, i) => `color-${i}`,
    _size: d => d.value * 2,
  };

  // returns data's own property when present
  assert.strictEqual(
    getProp.call(ctx, "color", {color: "red"}, 0),
    "red",
    "returns own property",
  );

  // falls back to instance method when property is missing
  assert.strictEqual(
    getProp.call(ctx, "color", {id: "a"}, 3),
    "color-3",
    "falls back to _color method",
  );

  assert.strictEqual(
    getProp.call(ctx, "size", {value: 5}, 0),
    10,
    "falls back to _size method with data",
  );
});
