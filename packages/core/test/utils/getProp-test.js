import assert from "assert";
import {default as getProp} from "../../es/src/utils/getProp.js";

it("getProp", () => {
  const ctx = {
    schema: {
      color: (d, i) => `color-${i}`,
      size: d => d.value * 2,
    },
  };

  // returns data's own property when present
  assert.strictEqual(
    getProp.call(ctx, "color", {color: "red"}, 0),
    "red",
    "returns own property",
  );

  // falls back to schema accessor when property is missing
  assert.strictEqual(
    getProp.call(ctx, "color", {id: "a"}, 3),
    "color-3",
    "falls back to schema.color accessor",
  );

  assert.strictEqual(
    getProp.call(ctx, "size", {value: 5}, 0),
    10,
    "falls back to schema.size accessor with data",
  );
});
