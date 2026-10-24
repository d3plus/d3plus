import {it} from "vitest";
import assert from "assert";
import {
  canWarnOnce,
  configWarnings,
  warnConfigOnce,
} from "../../src/utils/configWarnings.ts";
import {captureWarnings} from "~test/helpers.js";

it("warnConfigOnce logs once per owner and id", () => {
  const a = {};
  const b = {};
  const warnings = captureWarnings(() => {
    warnConfigOnce(a, "y", "first");
    warnConfigOnce(a, "y", "first, reworded");
    warnConfigOnce(a, "x", "second");
    warnConfigOnce(b, "y", "first");
  });
  assert.deepStrictEqual(warnings, ["first", "second", "first"]);
});

it("canWarnOnce tells whether warnConfigOnce would log", () => {
  const owner = {};
  assert.strictEqual(canWarnOnce(owner, "y"), true);
  captureWarnings(() => warnConfigOnce(owner, "y", "warned"));
  assert.strictEqual(canWarnOnce(owner, "y"), false);
  assert.strictEqual(canWarnOnce(owner, "x"), true);
});

it("configWarnings(false) silences warnConfigOnce", () => {
  const owner = {};
  configWarnings(false);
  let warnings;
  try {
    assert.strictEqual(canWarnOnce(owner, "y"), false);
    warnings = captureWarnings(() => warnConfigOnce(owner, "y", "silenced"));
  } finally {
    configWarnings(true);
  }
  assert.deepStrictEqual(warnings, []);
  assert.strictEqual(canWarnOnce(owner, "y"), true, "nothing was recorded");
});
