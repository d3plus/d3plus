import {it} from "vitest";
import assert from "assert";
import {
  isExpandOffset,
  marimekkoAxisDefaults,
  marimekkoFacetAxes,
  marimekkoFixedAxes,
  percentText,
} from "../../src/charts/Marimekko/axis.ts";
import {resolveStackOffset} from "../../src/charts/Plot/stackHelpers.ts";

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
  assert.deepStrictEqual(
    marimekkoAxisDefaults(fakeViz("expand", {stacked: false})),
    {},
  );
});

it("Marimekko axis: small multiples label the categories on every panel, the value axis on the outer edge", () => {
  assert.deepStrictEqual(marimekkoFacetAxes(fakeViz("expand")), {
    x: "all",
    y: "outer",
  });
  assert.deepStrictEqual(
    marimekkoFacetAxes(fakeViz("expand", {discrete: "y"})),
    {x: "outer", y: "all"},
  );
});

it("Marimekko axis: the value axis reads 0–100% in every panel only while stacked to 100%", () => {
  assert.deepStrictEqual(marimekkoFixedAxes(fakeViz("expand")), {y: true});
  assert.deepStrictEqual(
    marimekkoFixedAxes(fakeViz("expand", {discrete: "y"})),
    {x: true},
  );
  assert.deepStrictEqual(marimekkoFixedAxes(fakeViz("none")), {});
  assert.deepStrictEqual(
    marimekkoFixedAxes(fakeViz("expand", {stacked: false})),
    {},
  );
});
