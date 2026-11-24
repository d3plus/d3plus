import {describe, it} from "vitest";
import assert from "assert";

import {contrastRatio} from "../../../color/src/oklab.ts";
import {
  isDarkColor,
  resolveTheme,
  scalePole,
  signalColor,
  themedColorDefaults,
  themed,
  themeDark,
  themeLight,
  themeStyle,
  withOpacity,
} from "../../src/utils/theme.ts";

describe("theme presets", () => {
  it("dark text tokens read at WCAG AA on their backgrounds", () => {
    const pairs = [
      [themeDark.text, themeDark.background],
      [themeDark.textMuted, themeDark.background],
      [themeDark.axis, themeDark.background],
      [themeDark.tooltip.text, themeDark.tooltip.background],
      [themeDark.table.text, themeDark.table.background],
    ];
    for (const [text, bg] of pairs)
      assert.ok(contrastRatio(text, bg) >= 4.5, `${text} on ${bg}`);
  });

  it("light text tokens read at WCAG AA on their backgrounds", () => {
    const pairs = [
      [themeLight.text, themeLight.background],
      [themeLight.textMuted, themeLight.background],
      [themeLight.tooltip.text, themeLight.tooltip.background],
      [themeLight.table.text, themeLight.table.background],
    ];
    for (const [text, bg] of pairs)
      assert.ok(contrastRatio(text, bg) >= 4.5, `${text} on ${bg}`);
  });

  it("the presets are frozen", () => {
    assert.ok(Object.isFrozen(themeLight));
    assert.ok(Object.isFrozen(themeDark.tooltip));
  });
});

describe("resolveTheme", () => {
  it('"light" paints the light preset', () => {
    const t = resolveTheme("light", {dark: true, background: "#000"});
    assert.strictEqual(t.painted, true);
    assert.strictEqual(t.dark, false);
    assert.strictEqual(t.background, themeLight.background);
    assert.strictEqual(t.text, themeLight.text);
    assert.deepStrictEqual(t.tooltip, themeLight.tooltip);
  });

  it('"dark" paints the dark preset on any page', () => {
    const t = resolveTheme("dark", {dark: false, background: "#fff"});
    assert.strictEqual(t.painted, true);
    assert.strictEqual(t.dark, true);
    assert.strictEqual(t.background, themeDark.background);
    assert.strictEqual(t.gridline, themeDark.gridline);
    assert.deepStrictEqual(t.table, themeDark.table);
  });

  it("a custom object layers its tokens over its base", () => {
    const t = resolveTheme({
      base: "dark",
      background: "#123",
      tooltip: {background: "#000"},
    });
    assert.strictEqual(t.painted, true);
    assert.strictEqual(t.dark, true);
    assert.strictEqual(t.background, "#123");
    assert.strictEqual(t.text, themeDark.text);
    assert.strictEqual(t.tooltip.background, "#000");
    assert.strictEqual(t.tooltip.text, themeDark.tooltip.text);
    assert.ok(!("base" in t));
  });

  it("a custom object without a base follows its background's lightness", () => {
    assert.strictEqual(resolveTheme({background: "#123"}).dark, true);
    assert.strictEqual(resolveTheme({background: "#eee"}).dark, false);
    assert.strictEqual(resolveTheme({accent: "red"}).dark, false);
    assert.strictEqual(
      resolveTheme({base: "light", background: "#123"}).dark,
      false,
    );
  });

  it('"auto" on a light page keeps the page background and dark ink', () => {
    const t = resolveTheme("auto", {
      dark: false,
      background: "rgb(255, 255, 255)",
    });
    assert.strictEqual(t.painted, false);
    assert.strictEqual(t.dark, false);
    assert.strictEqual(t.background, "rgb(255, 255, 255)");
    assert.strictEqual(t.text, themeLight.text);
    assert.strictEqual(t.gridline, themeLight.gridline);
    assert.deepStrictEqual(t.overlay, themeLight.overlay);
  });

  it('"auto" on a dark page takes the dark overlays and light ink', () => {
    const t = resolveTheme("auto", {dark: true, background: "rgb(0, 0, 0)"});
    assert.strictEqual(t.painted, false);
    assert.strictEqual(t.dark, true);
    assert.strictEqual(t.background, "rgb(0, 0, 0)");
    assert.strictEqual(t.text, themeDark.text);
    assert.strictEqual(t.axis, themeDark.text);
    assert.strictEqual(t.gridline, themeDark.gridline);
    assert.deepStrictEqual(t.tooltip, themeDark.tooltip);
  });

  it('"auto" picks its ink from the chart\'s colorDefaults', () => {
    const t = resolveTheme(
      "auto",
      {dark: true, background: "rgb(0, 0, 0)"},
      {dark: "#111", light: "#eee"},
    );
    assert.strictEqual(t.text, "#eee");
    assert.strictEqual(t.gridline, themeDark.gridline);
  });

  it('"auto" without a page background uses the preset\'s', () => {
    assert.strictEqual(
      resolveTheme("auto", {dark: true}).background,
      themeDark.background,
    );
    assert.strictEqual(resolveTheme().background, themeLight.background);
  });

  it("an unknown setting resolves like auto", () => {
    assert.strictEqual(resolveTheme("sepia", {dark: false}).painted, false);
  });

  it("the resolved theme is frozen", () => {
    assert.ok(Object.isFrozen(resolveTheme("dark")));
  });
});

describe("themed", () => {
  it("keeps the fallback without a theme or on the light preset", () => {
    assert.strictEqual(
      themed(undefined, t => t.link, "#ddd"),
      "#ddd",
    );
    assert.strictEqual(
      themed(resolveTheme("light"), t => t.link, "#ddd"),
      "#ddd",
    );
  });

  it("takes a dark or custom token", () => {
    assert.strictEqual(
      themed(resolveTheme("dark"), t => t.link, "#ddd"),
      themeDark.link,
    );
    assert.strictEqual(
      themed(resolveTheme({link: "red"}), t => t.link, "#ddd"),
      "red",
    );
  });
});

describe("themeStyle", () => {
  const defaults = {background: "white", color: "black", padding: "2px"};

  it("swaps entries still at their default", () => {
    const out = themeStyle(defaults, defaults, {
      background: "#000",
      color: "#fff",
    });
    assert.deepStrictEqual(out, {
      background: "#000",
      color: "#fff",
      padding: "2px",
    });
  });

  it("keeps entries the user changed, and skips undefined overrides", () => {
    const out = themeStyle({...defaults, background: "pink"}, defaults, {
      background: "#000",
      color: undefined,
    });
    assert.deepStrictEqual(out, {
      background: "pink",
      color: "black",
      padding: "2px",
    });
  });

  it("does not mutate the style", () => {
    const style = {...defaults};
    themeStyle(style, defaults, {background: "#000"});
    assert.strictEqual(style.background, "white");
  });
});

describe("color helpers", () => {
  it("withOpacity replaces a color's own opacity", () => {
    assert.strictEqual(
      withOpacity("rgba(0, 0, 0, 0.75)", 0.15),
      "rgba(0, 0, 0, 0.15)",
    );
    assert.strictEqual(withOpacity("#fff", 0.5), "rgba(255, 255, 255, 0.5)");
  });

  it("isDarkColor splits on CIELAB lightness", () => {
    assert.strictEqual(isDarkColor("#212529"), true);
    assert.strictEqual(isDarkColor("rgb(255, 255, 255)"), false);
    assert.strictEqual(isDarkColor("not a color"), false);
  });
});

describe("signal colors", () => {
  const builtIn = {
    off: "#c92a2a",
    caution: "#f08c00",
    on: "#2b8a3e",
    sequential: "#1c7ed6",
    neutral: "#f8f9fa",
  };
  const host = (theme, own) => ({
    schema: {colorDefaults: {...builtIn, ...own}},
    _theme: theme,
    _ownColorDefaults: own,
  });

  it("the presets: the built-in colors on light, a step brighter on dark", () => {
    assert.deepStrictEqual(
      [themeLight.off, themeLight.caution, themeLight.on],
      ["#c92a2a", "#f08c00", "#2b8a3e"],
    );
    assert.deepStrictEqual(
      [themeDark.off, themeDark.caution, themeDark.on],
      ["#ff6b6b", "#f59f00", "#40c057"],
    );
    for (const key of ["off", "caution", "on"])
      assert.ok(
        contrastRatio(themeDark[key], themeDark.background) >= 4.5,
        `${key} reads on the dark background`,
      );
  });

  it("signalColor: the chart's own colorDefaults, then the theme, then the built-in", () => {
    assert.strictEqual(signalColor(host(undefined), "on"), "#2b8a3e");
    assert.strictEqual(
      signalColor(host(resolveTheme("light")), "on"),
      "#2b8a3e",
    );
    assert.strictEqual(
      signalColor(host(resolveTheme("dark")), "on"),
      "#40c057",
    );
    assert.strictEqual(
      signalColor(
        host(resolveTheme({base: "dark", caution: "#ffe066"})),
        "caution",
      ),
      "#ffe066",
      "a custom theme's token",
    );
    assert.strictEqual(
      signalColor(host(resolveTheme({caution: "#ffe066"})), "caution"),
      "#ffe066",
      "on a light base too",
    );
    assert.strictEqual(
      signalColor(host(resolveTheme("dark"), {on: "#00ff00"}), "on"),
      "#00ff00",
      "the chart's own colorDefaults win over the theme",
    );
    assert.strictEqual(
      signalColor(host(resolveTheme("dark"), {on: "#00ff00"}), "off"),
      "#ff6b6b",
      "only for the keys it set",
    );
    assert.strictEqual(
      signalColor({schema: {}}, "caution"),
      "#f08c00",
      "the built-in default",
    );
  });

  it("themedColorDefaults: a copy with themed signals, or the same object", () => {
    const light = host(resolveTheme("light"));
    assert.strictEqual(themedColorDefaults(light), light.schema.colorDefaults);
    const dark = host(resolveTheme("dark"));
    const out = themedColorDefaults(dark);
    assert.notStrictEqual(out, dark.schema.colorDefaults);
    assert.deepStrictEqual(
      [out.off, out.caution, out.on],
      ["#ff6b6b", "#f59f00", "#40c057"],
    );
    assert.strictEqual(themedColorDefaults(dark), out, "cached per theme");
    assert.strictEqual(
      dark.schema.colorDefaults.on,
      "#2b8a3e",
      "left as it was",
    );
  });
});

describe("sequential and the color scale's poles", () => {
  const host = (theme, own = {}) => ({
    schema: {colorDefaults: {off: "#c92a2a", sequential: "#1c7ed6", ...own}},
    _theme: theme,
    _ownColorDefaults: own,
  });

  it("sequential: the built-in hue on light, blue 400 on dark", () => {
    assert.strictEqual(themeLight.sequential, "#1c7ed6");
    assert.strictEqual(themeDark.sequential, "#4dabf7");
    assert.ok(contrastRatio(themeDark.sequential, themeDark.background) >= 4.5);
    assert.strictEqual(
      signalColor(host(resolveTheme("dark")), "sequential"),
      "#4dabf7",
    );
    assert.strictEqual(
      signalColor(
        host(resolveTheme("dark"), {sequential: "#123456"}),
        "sequential",
      ),
      "#123456",
      "the chart's own wins",
    );
  });

  it("colorScale.min and max are the theme's off and sequential, unless set", () => {
    for (const preset of [themeLight, themeDark]) {
      assert.strictEqual(preset.colorScale.min, preset.off);
      assert.strictEqual(preset.colorScale.max, preset.sequential);
    }
    const custom = resolveTheme({
      base: "dark",
      off: "#e8590c",
      sequential: "#15aabf",
    });
    assert.strictEqual(custom.colorScale.min, "#e8590c", "min follows off");
    assert.strictEqual(
      custom.colorScale.max,
      "#15aabf",
      "max follows sequential",
    );
    const explicit = resolveTheme({
      base: "dark",
      off: "#e8590c",
      colorScale: {min: "#862e9c"},
    });
    assert.strictEqual(
      explicit.colorScale.min,
      "#862e9c",
      "a set min wins over off",
    );
    assert.strictEqual(explicit.colorScale.mid, themeDark.colorScale.mid);
  });

  it("scalePole: the chart's own colorDefaults, then the theme's pole, then the built-in", () => {
    assert.strictEqual(scalePole(host(undefined), "min"), "#c92a2a");
    assert.strictEqual(
      scalePole(host(resolveTheme("light")), "max"),
      "#1c7ed6",
    );
    assert.strictEqual(scalePole(host(resolveTheme("dark")), "min"), "#ff6b6b");
    assert.strictEqual(scalePole(host(resolveTheme("dark")), "max"), "#4dabf7");
    assert.strictEqual(
      scalePole(host(resolveTheme("dark"), {off: "#123456"}), "min"),
      "#123456",
      "the chart's own off",
    );
    assert.strictEqual(
      scalePole(host(resolveTheme({colorScale: {max: "#654321"}})), "max"),
      "#654321",
      "a theme's own pole",
    );
  });
});

describe("the neutral fill and the color scale's midpoint", () => {
  const host = (theme, own = {}) => ({
    schema: {colorDefaults: {light: "#f8f9fa", neutral: "#f8f9fa", ...own}},
    _theme: theme,
    _ownColorDefaults: own,
  });

  it("neutral: colorDefaults.neutral on light, the dark midpoint gray on dark", () => {
    assert.strictEqual(themeLight.neutral, "#f8f9fa");
    assert.strictEqual(themeDark.neutral, "#343a40");
    assert.ok(!("light" in themeDark), "no light token: light is text");
  });

  it("colorScale.mid is the theme's neutral, unchanged on both presets", () => {
    assert.strictEqual(themeLight.colorScale.mid, "#f8f9fa", "as before");
    assert.strictEqual(themeDark.colorScale.mid, "#343a40", "as before");
    assert.strictEqual(themeLight.tooltip.background, "#f8f9fa", "as before");
    for (const preset of [themeLight, themeDark])
      assert.strictEqual(preset.colorScale.mid, preset.neutral);
    assert.strictEqual(
      resolveTheme({base: "dark", neutral: "#495057"}).colorScale.mid,
      "#495057",
      "mid follows a custom neutral",
    );
    assert.strictEqual(
      resolveTheme({
        base: "dark",
        neutral: "#495057",
        colorScale: {mid: "#000"},
      }).colorScale.mid,
      "#000",
      "a set mid wins",
    );
    assert.strictEqual(
      resolveTheme("auto", {dark: true}).colorScale.mid,
      "#343a40",
      "auto on a dark page",
    );
  });

  it("scalePole mid: the chart's own neutral, then the theme, then the built-in", () => {
    assert.strictEqual(scalePole(host(undefined), "mid"), "#f8f9fa");
    assert.strictEqual(scalePole(host(resolveTheme("dark")), "mid"), "#343a40");
    assert.strictEqual(
      scalePole(host(resolveTheme("dark"), {neutral: "#ffffff"}), "mid"),
      "#ffffff",
      "the chart's own neutral",
    );
    assert.strictEqual(
      signalColor(host(resolveTheme("dark")), "neutral"),
      "#343a40",
    );
  });

  it("colorDefaults.light is text: it never moves the scale's midpoint", () => {
    for (const theme of [
      undefined,
      resolveTheme("light"),
      resolveTheme("dark"),
    ]) {
      const plain = scalePole(host(theme), "mid");
      assert.strictEqual(
        scalePole(host(theme, {light: "#123456"}), "mid"),
        plain,
        `${theme ? (theme.dark ? "dark" : "light") : "no theme"}`,
      );
    }
  });

  it("themedColorDefaults themes neutral and leaves light alone", () => {
    const out = themedColorDefaults(host(resolveTheme("dark")));
    assert.strictEqual(out.neutral, "#343a40");
    assert.strictEqual(out.light, "#f8f9fa");
  });
});
