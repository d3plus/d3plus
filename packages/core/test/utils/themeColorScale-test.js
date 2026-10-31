import {describe, it} from "vitest";
import assert from "assert";

import {colorDefaults, colorRamp, colorRampDark} from "@d3plus/color";
import {colorToOklch} from "../../../color/src/oklab.ts";
import {ColorScale} from "../../index.ts";
import {computeColorScale} from "../../src/components/ColorScale/colorScaleScale.ts";
import {configureOrdinalColor} from "../../src/charts/viz/ordinalColor.ts";
import {
  resolveTheme,
  themeDark,
  themeLight,
  themeRamp,
  themeScaleColor,
} from "../../src/utils/theme.ts";

const L = c => colorToOklch(c).l;

/** A ColorScale over `values` with the given theme, scale solved. */
function solve(values, theme, config = {}) {
  const cs = new ColorScale()
    .data(values.map(value => ({value})))
    .config(config);
  cs._theme = theme;
  const result = computeColorScale(cs);
  return {cs, result, color: v => cs._colorScale(v)};
}

const SEQ = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
const DIV = [-40, -20, -10, -5, 0, 5, 10, 20, 40];

describe("colorScale theme tokens", () => {
  it("the light preset keeps the colorDefaults poles", () => {
    assert.deepStrictEqual(
      {...themeLight.colorScale},
      {
        max: colorDefaults.sequential,
        mid: colorDefaults.light,
        min: colorDefaults.off,
      },
    );
    assert.strictEqual(themeLight.colorScale.missing, undefined);
  });

  it("the dark preset has bright poles and a dark midpoint", () => {
    const {max, mid, min, missing} = themeDark.colorScale;
    const bg = L(themeDark.background);
    assert.ok(L(max) > 0.65, "bright high pole");
    assert.ok(L(min) > 0.65, "bright low pole");
    assert.ok(Math.abs(L(max) - L(min)) < 0.05, "balanced poles");
    assert.ok(L(mid) > bg && L(mid) < bg + 0.15, "midpoint near background");
    assert.strictEqual(missing, undefined);
    assert.ok(Object.isFrozen(themeDark.colorScale));
  });

  it("resolveTheme carries and merges the colorScale group", () => {
    assert.deepStrictEqual(
      resolveTheme("dark").colorScale,
      themeDark.colorScale,
    );
    assert.deepStrictEqual(
      resolveTheme("auto", {dark: true}).colorScale,
      themeDark.colorScale,
    );
    const custom = resolveTheme({
      base: "dark",
      colorScale: {max: "#ffd43b", missing: "#111"},
    });
    assert.strictEqual(custom.colorScale.max, "#ffd43b");
    assert.strictEqual(custom.colorScale.mid, themeDark.colorScale.mid);
    assert.strictEqual(custom.colorScale.missing, "#111");
    assert.ok(!("colorScale" in themeLight.tooltip));
  });
});

describe("themeScaleColor", () => {
  it("keeps the chart's own default on light", () => {
    assert.strictEqual(themeScaleColor(undefined, "max", "#abc"), "#abc");
    assert.strictEqual(
      themeScaleColor(resolveTheme("light"), "max", "#abc"),
      "#abc",
    );
    assert.strictEqual(
      themeScaleColor(resolveTheme("auto", {dark: false}), "mid", "#def"),
      "#def",
    );
  });

  it("takes the dark or custom token", () => {
    const dark = resolveTheme("dark");
    assert.strictEqual(
      themeScaleColor(dark, "max", "#abc"),
      themeDark.colorScale.max,
    );
    assert.strictEqual(
      themeScaleColor(dark, "mid", "#abc"),
      themeDark.colorScale.mid,
    );
    assert.strictEqual(
      themeScaleColor(dark, "min", "#abc"),
      themeDark.colorScale.min,
    );
    const custom = resolveTheme({base: "light", colorScale: {max: "#0b7285"}});
    assert.strictEqual(themeScaleColor(custom, "max", "#abc"), "#0b7285");
    assert.strictEqual(themeScaleColor(custom, "min", "#abc"), "#abc");
  });
});

describe("themeRamp", () => {
  it("is colorRamp on light", () => {
    assert.deepStrictEqual(
      themeRamp(undefined, "#1c7ed6", 5),
      colorRamp("#1c7ed6", 5),
    );
    assert.deepStrictEqual(
      themeRamp(resolveTheme("light"), "#1c7ed6", 4, true),
      colorRamp("#1c7ed6", 4, {ordinal: true}),
    );
  });

  it("is colorRampDark against the theme's background on dark", () => {
    const dark = resolveTheme("dark");
    assert.deepStrictEqual(
      themeRamp(dark, "#4dabf7", 5),
      colorRampDark("#4dabf7", 5, {background: dark.background}),
    );
    const page = resolveTheme("auto", {dark: true, background: "#000000"});
    assert.deepStrictEqual(
      themeRamp(page, "#4dabf7", 3, true),
      colorRampDark("#4dabf7", 3, {background: "#000000", ordinal: true}),
    );
  });
});

describe("ColorScale on a theme", () => {
  for (const scale of ["jenks", "linear", "buckets", "quantile"]) {
    it(`${scale}: low values recede on dark and stand out on light`, () => {
      const light = solve(SEQ, undefined, {scale});
      const dark = solve(SEQ, resolveTheme("dark"), {scale});
      assert.ok(
        L(light.color(1)) > L(light.color(89)),
        "light: lowest is lighter",
      );
      assert.ok(L(dark.color(1)) < L(dark.color(89)), "dark: lowest is darker");
      assert.ok(
        L(dark.color(1)) > L(themeDark.background),
        "dark: lowest still above the background",
      );
    });
  }

  it("light output is unchanged by a light theme", () => {
    const none = solve(SEQ, undefined);
    const light = solve(SEQ, resolveTheme("light"));
    const auto = solve(SEQ, resolveTheme("auto", {dark: false}));
    assert.deepStrictEqual(light.result.colors, none.result.colors);
    assert.deepStrictEqual(auto.result.colors, none.result.colors);
    assert.strictEqual(
      none.result.colors.at(-1),
      colorDefaults.sequential,
      "light ramp ends on colorDefaults.sequential",
    );
  });

  it("the dark ramp ends on the dark max token", () => {
    const {result} = solve(SEQ, resolveTheme("dark"));
    assert.strictEqual(result.colors.at(-1), themeDark.colorScale.max);
  });

  it("auto on a dark page gets the dark ramp", () => {
    const {result} = solve(
      SEQ,
      resolveTheme("auto", {dark: true, background: "#101113"}),
    );
    assert.strictEqual(result.colors.at(-1), themeDark.colorScale.max);
    assert.ok(L(result.colors[0]) < L(result.colors.at(-1)));
  });

  it("a user colorMax wins in dark, on a dark ramp", () => {
    const {result} = solve(SEQ, resolveTheme("dark"), {colorMax: "#e8590c"});
    assert.strictEqual(result.colors.at(-1), "#e8590c");
    assert.ok(L(result.colors[0]) < L(result.colors.at(-1)));
  });

  it("a custom theme's max token drives the ramp", () => {
    const {result} = solve(
      SEQ,
      resolveTheme({base: "dark", colorScale: {max: "#ffd43b"}}),
    );
    assert.strictEqual(result.colors.at(-1), "#ffd43b");
  });

  it("an explicit color array is used as given", () => {
    const colors = ["#111111", "#555555", "#999999"];
    const {result} = solve(SEQ, resolveTheme("dark"), {
      color: colors,
      scale: "buckets",
      buckets: 3,
    });
    assert.deepStrictEqual(result.colors.slice(1), colors);
  });

  it("a single color expands to a dark ramp on dark", () => {
    const {result} = solve(SEQ, resolveTheme("dark"), {
      color: "#40c057",
      scale: "buckets",
    });
    const steps = result.colors.slice(1);
    assert.strictEqual(steps.at(-1), "#40c057");
    assert.ok(L(steps[0]) < L(steps.at(-1)));
  });

  it("an all-negative scale puts the bright pole on the most negative value", () => {
    const values = [-50, -30, -20, -10, -5];
    const dark = solve(values, resolveTheme("dark"), {scale: "buckets"});
    assert.ok(L(dark.color(-50)) > L(dark.color(-5)));
    assert.strictEqual(dark.color(-50), themeDark.colorScale.min);
  });

  for (const scale of ["linear", "jenks"]) {
    it(`${scale} diverging: the midpoint is dark on dark and light on light`, () => {
      const dark = solve(DIV, resolveTheme("dark"), {scale});
      const light = solve(DIV, undefined, {scale});
      const bg = L(themeDark.background);
      assert.ok(L(dark.color(0)) < bg + 0.2, "dark midpoint near background");
      assert.ok(L(dark.color(40)) > L(dark.color(0)), "positive pole glows");
      assert.ok(L(dark.color(-40)) > L(dark.color(0)), "negative pole glows");
      assert.ok(L(light.color(0)) > L(light.color(40)), "light midpoint pale");
    });
  }

  it("a user colorMid wins in dark", () => {
    const {color} = solve(DIV, resolveTheme("dark"), {
      scale: "linear",
      colorMid: "#ffffff",
    });
    assert.strictEqual(color(0), "rgb(255, 255, 255)");
  });
});

describe("colorOrdinal on a theme", () => {
  const ordinalViz = theme => ({
    schema: {colorOrdinal: true, color: d => d.tier},
    _filteredData: [{tier: 1}, {tier: 2}, {tier: 3}],
    _theme: theme,
  });

  it("runs dim→bright on dark and light→dark on light", () => {
    const dark = ordinalViz(resolveTheme("dark"));
    configureOrdinalColor(dark);
    const [d1, , d3] = ["1", "2", "3"].map(dark._ordinalColorScale);
    assert.ok(L(d1) < L(d3), "dark: tier 1 is dimmer");

    const light = ordinalViz(resolveTheme("light"));
    configureOrdinalColor(light);
    const [l1, , l3] = ["1", "2", "3"].map(light._ordinalColorScale);
    assert.ok(L(l1) > L(l3), "light: tier 1 is lighter");
    assert.deepStrictEqual(
      light._ordinalColorScale.range(),
      colorRamp(colorDefaults.sequential, 3, {ordinal: true}),
    );
  });
});
