import {describe, it} from "vitest";
import assert from "assert";
import {color} from "d3-color";
import {interpolateRgb} from "d3-interpolate";

import {packNeutralPaint} from "../../src/charts/Pack/neutralPaint.ts";
import {fillStroke} from "../../src/charts/viz/fillStroke.ts";
import {markDefault} from "../../src/utils/configDefault.ts";

const theme = {background: "#ffffff", text: "#222222"};
const neutral = interpolateRgb(theme.background, theme.text)(0.7);
const defaultStroke = markDefault(() => "#000000");

/** A chart on `theme` whose shapeConfig is `shapeConfig`. */
const chart = shapeConfig => ({_theme: theme, schema: {shapeConfig}});

describe("fillStroke", () => {
  it("darkens a color a shade", () => {
    assert.strictEqual(
      fillStroke("#4c6ef5"),
      color("#4c6ef5").darker(0.25).toString(),
    );
  });

  it("keeps a fill that isn't a color", () => {
    assert.strictEqual(fillStroke("none"), "none");
  });
});

describe("packNeutralPaint", () => {
  it("fills with the neutral tone, stroked a shade darker by default", () => {
    assert.deepStrictEqual(packNeutralPaint(chart({stroke: defaultStroke})), {
      fill: neutral,
      stroke: fillStroke(neutral),
    });
  });

  it("leaves the stroke to a user's own, at either level", () => {
    for (const shapeConfig of [
      {stroke: "#123456"},
      {stroke: () => "#123456"},
      {stroke: defaultStroke, Circle: {stroke: "#123456"}},
    ])
      assert.deepStrictEqual(packNeutralPaint(chart(shapeConfig)), {
        fill: neutral,
      });
  });
});
