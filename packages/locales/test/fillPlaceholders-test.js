import {it} from "vitest";
import assert from "assert";
import {default as fillPlaceholders} from "../src/fillPlaceholders.ts";

it("fillPlaceholders fills numbered placeholders from its arguments", () => {
  assert.strictEqual(fillPlaceholders("{0} hidden", ["Oslo"]), "Oslo hidden");
  assert.strictEqual(
    fillPlaceholders("已隐藏{0}", ["Oslo"]),
    "已隐藏Oslo",
    "wherever the language puts it",
  );
  assert.strictEqual(
    fillPlaceholders("{1} of {0}", ["Oslo", 3]),
    "3 of Oslo",
    "in any order, numbers as text",
  );
  assert.strictEqual(
    fillPlaceholders("{0} and {0}", ["Oslo"]),
    "Oslo and Oslo",
    "a repeated placeholder is filled each time",
  );
});

it("fillPlaceholders leaves placeholders without arguments as written", () => {
  assert.strictEqual(fillPlaceholders("{0} hidden", []), "{0} hidden");
  assert.strictEqual(
    fillPlaceholders("{0} and {1}", ["Oslo"]),
    "Oslo and {1}",
    "a missing argument",
  );
  assert.strictEqual(
    fillPlaceholders("{0} and {1}", [undefined, null]),
    "{0} and {1}",
    "undefined and null",
  );
  assert.strictEqual(
    fillPlaceholders("Back", ["Oslo"]),
    "Back",
    "text without placeholders is unchanged",
  );
  assert.strictEqual(
    fillPlaceholders("{a} {} {0", ["Oslo"]),
    "{a} {} {0",
    "only numbered placeholders",
  );
  assert.strictEqual(fillPlaceholders("{0}", [0]), "0", "falsy values fill");
});
