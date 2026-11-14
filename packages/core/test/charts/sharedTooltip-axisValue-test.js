import {it} from "vitest";
import assert from "assert";

import {axisValue} from "../../src/charts/Plot/sharedTooltip.ts";

/** A Plot stand-in with a y tickFormat, continuous y, and no time axes. */
const viz = (tickFormat, labels) => ({
  _yConfig: {tickFormat},
  _tickLabelFormats: labels,
  schema: {discrete: "x", locale: "en-US"},
});

it("axisValue — a tickFormat formats the axis's values", () => {
  const format = v => `#${v}`;
  assert.strictEqual(axisValue(viz(format), "y", 3), "#3");
  assert.strictEqual(axisValue(viz(format, new Map()), "y", 3), "#3");
});

it("axisValue — a tickFormat that labels ticks applies only in their place", () => {
  const names = v => ["", "Prime", "Basic"][v];
  const chart = viz(names, new Map([[names, v => `#${v}`]]));
  assert.strictEqual(axisValue(chart, "y", 2), "#2", "its value format");
  assert.strictEqual(axisValue(chart, "y", 2, true), "Basic", "a tick's label");
  assert.strictEqual(
    axisValue({...chart, _yConfig: {tickFormat: v => `${v}th`}}, "y", 2),
    "2th",
    "a user's own tickFormat still formats values",
  );
});
