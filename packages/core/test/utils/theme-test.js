import {describe, it} from "vitest";
import assert from "assert";

import {contrastRatio} from "../../../color/src/oklab.ts";
import {
  isDarkColor,
  resolveTheme,
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
