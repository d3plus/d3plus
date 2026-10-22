import assert from "assert";
import {default as finite} from "../es/src/finite.js";

it("finite", () => {
  [0, -0, 3, -2.5, Number.MAX_VALUE].forEach(v => assert.strictEqual(finite(v), true, `${v}`));
  [NaN, Infinity, -Infinity, "3", null, undefined, [1], {}, true].forEach(v =>
    assert.strictEqual(finite(v), false, `${String(v)}`),
  );
});
