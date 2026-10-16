import assert from "assert";
import {isExpandOffset, marimekkoAxisDefaults, percentText} from "../../es/src/charts/Marimekko/axis.js";
import {resolveStackOffset} from "../../es/src/charts/Plot/stackHelpers.js";

const fakeViz = (offset, schema = {}) => ({
  _stackOffset: resolveStackOffset(offset),
  schema: {discrete: "x", locale: "en-US", stacked: true, ...schema},
});

it("Marimekko axis: isExpandOffset detects a 100% stack", () => {
  assert.strictEqual(isExpandOffset(fakeViz("expand")), true);
  assert.strictEqual(isExpandOffset(fakeViz("none")), false);
  assert.strictEqual(isExpandOffset(fakeViz("diverging")), false);
});

it("Marimekko axis: percentText formats a fraction as a percentage", () => {
  assert.strictEqual(percentText(0.25), "25%");
  assert.strictEqual(percentText(1), "100%");
  assert.strictEqual(percentText(0), "0%");
});

it("Marimekko axis: marimekkoAxisDefaults formats the value axis while expanded", () => {
  const vertical = marimekkoAxisDefaults(fakeViz("expand"));
  assert.deepStrictEqual(Object.keys(vertical), ["y"]);
  assert.strictEqual(vertical.y.rounding, "none");
  assert.strictEqual(vertical.y.tickFormat(0.5), "50%");

  const horizontal = marimekkoAxisDefaults(fakeViz("expand", {discrete: "y"}));
  assert.deepStrictEqual(Object.keys(horizontal), ["x"]);

  assert.deepStrictEqual(marimekkoAxisDefaults(fakeViz("none")), {});
  assert.deepStrictEqual(marimekkoAxisDefaults(fakeViz("expand", {stacked: false})), {});
});
