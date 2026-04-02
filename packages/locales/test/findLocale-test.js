import assert from "assert";
import {default as findLocale} from "../es/src/findLocale.js";

it("findLocale", () => {
  assert.strictEqual(findLocale("en"), "en-US", "default country");
});
