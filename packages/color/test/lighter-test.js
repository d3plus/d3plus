import assert from "assert";
import {default as lighter} from "../src/lighter.js";

it("lighter", () => {
  assert.strictEqual("rgb(207, 82, 82)", lighter("#440000"));
  assert.strictEqual("rgb(82, 207, 82)", lighter("#004400"));
  assert.strictEqual("rgb(82, 82, 207)", lighter("#000044"));
});

