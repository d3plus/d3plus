import assert from "assert";
import {default as assign} from "../es/src/assign.js";
import {default as defaults} from "../es/src/defaults.js";

it("assign", () => {
  assert.strictEqual(defaults.missing, assign(null), "null");
  assert.strictEqual(defaults.missing, assign(undefined), "undefined");

  assert.strictEqual(defaults.on, assign(true), "true");
  assert.strictEqual(defaults.off, assign(false), "false");

  const range = defaults.scale.range();
  assert.ok(
    range[0] === assign("Alpha") &&
      range[1] === assign("Beta") &&
      range[2] === assign(45) &&
      range[3] === assign(85.235),
    "value scale",
  );

  assert.strictEqual(assign("#ff0000"), "#ff0000", "valid hex color passthrough");
  assert.strictEqual(assign("rgb(0, 128, 255)"), "rgb(0, 128, 255)", "valid rgb color passthrough");
  assert.strictEqual(assign("red"), "red", "valid named color passthrough");

  const customMissing = assign(null, {missing: "#000"});
  assert.strictEqual(customMissing, "#000", "custom missing override");
  const customOn = assign(true, {on: "#0f0"});
  assert.strictEqual(customOn, "#0f0", "custom on override");
  const customOff = assign(false, {off: "#00f"});
  assert.strictEqual(customOff, "#00f", "custom off override");
});
