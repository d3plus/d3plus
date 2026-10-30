import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {Treemap} from "../../index.ts";
import {
  applyOverlayColorScheme,
  applyVizTheme,
  themeBackground,
  themeBackgroundNode,
  themeColorScheme,
  themeOverlayStyle,
} from "../../src/charts/viz/vizTheme.ts";
import {
  backgroundInk,
  chartBackground,
  chartGridline,
} from "../../src/charts/viz/backgroundInk.ts";
import {resolveTheme, themeDark, themeLight} from "../../src/utils/theme.ts";

useJsdom();

it("theme defaults to auto", () => {
  assert.strictEqual(new Treemap().theme(), "auto");
});

it("applyVizTheme resolves the theme onto the chart and its components", () => {
  const viz = new Treemap().theme("dark");
  const theme = applyVizTheme(viz);
  assert.strictEqual(viz._theme, theme);
  assert.strictEqual(theme.painted, true);
  for (const child of [
    viz._legendClass,
    viz._tooltipClass,
    viz._timelineClass,
    viz._titleClass,
    viz._colorScaleClass,
  ])
    assert.strictEqual(child._theme, theme);
  assert.strictEqual(
    viz._themeWatch,
    undefined,
    "a forced theme never watches",
  );
});

it("applyVizTheme watches the page in auto mode, and stops once forced", () => {
  const viz = new Treemap();
  applyVizTheme(viz);
  assert.strictEqual(viz._theme.painted, false);
  assert.strictEqual(typeof viz._themeWatch, "function");
  viz.theme("light");
  applyVizTheme(viz);
  assert.strictEqual(viz._themeWatch, undefined);
  viz.theme("auto");
  applyVizTheme(viz);
  viz.destroy();
  assert.strictEqual(viz._themeWatch, undefined, "destroy unsubscribes");
});

it("chart ink reads the resolved theme", () => {
  const viz = new Treemap().theme({base: "dark", background: "#123"});
  applyVizTheme(viz);
  assert.strictEqual(chartBackground(viz), "#123");
  assert.strictEqual(backgroundInk(viz), themeDark.text);
  assert.strictEqual(chartGridline(viz), themeDark.gridline);
});

it("themeBackgroundNode paints only a forced theme", () => {
  const viz = new Treemap().width(300).height(200);
  assert.strictEqual(themeBackgroundNode(viz), undefined);
  viz._theme = resolveTheme("auto", {dark: true});
  assert.strictEqual(themeBackgroundNode(viz), undefined);
  viz._theme = resolveTheme("dark");
  assert.deepStrictEqual(themeBackgroundNode(viz), {
    type: "rect",
    key: "viz-background",
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    interactive: false,
    paint: {fill: themeDark.background},
  });
});

it("themeBackgroundNode frames a Geomap's basemap", () => {
  const viz = {
    _theme: resolveTheme("dark"),
    _tileGroup: {},
    _margin: {top: 10, right: 20, bottom: 30, left: 40},
    schema: {width: 300, height: 200},
  };
  const node = themeBackgroundNode(viz);
  assert.strictEqual(node.type, "path");
  assert.strictEqual(node.d, "M0,0H300V200H0ZM40,10V170H280V10Z");
  assert.strictEqual(node.paint.fill, themeDark.background);
  viz._ssr = true;
  assert.strictEqual(
    themeBackgroundNode(viz).type,
    "rect",
    "SSR paints it all",
  );
});

it("themeBackground lists the background node, if any", () => {
  const viz = new Treemap().width(300).height(200);
  assert.deepStrictEqual(themeBackground(viz), []);
  viz._theme = resolveTheme({background: "#123"});
  assert.deepStrictEqual(
    themeBackground(viz).map(n => n.paint.fill),
    ["#123"],
  );
});

it("themeColorScheme is the theme's own when forced or dark", () => {
  assert.strictEqual(themeColorScheme(undefined), "");
  assert.strictEqual(themeColorScheme(resolveTheme("auto", {dark: false})), "");
  assert.strictEqual(
    themeColorScheme(resolveTheme("auto", {dark: true})),
    "dark",
  );
  assert.strictEqual(themeColorScheme(resolveTheme("light")), "light");
  assert.strictEqual(themeColorScheme(resolveTheme("dark")), "dark");
});

it("applyOverlayColorScheme sets the overlay host's color-scheme", () => {
  const host = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const viz = {
    _theme: resolveTheme("dark"),
    _sceneRenderer: {elements: () => [svg, host]},
  };
  applyOverlayColorScheme(viz);
  assert.strictEqual(host.style.colorScheme, "dark");
  viz._theme = resolveTheme("auto", {dark: false});
  applyOverlayColorScheme(viz);
  assert.strictEqual(host.style.colorScheme, "");
  applyOverlayColorScheme({});
});

it("themeOverlayStyle swaps untouched defaults for overlay tokens", () => {
  const defaults = {background: "white", color: "black", gap: "4px"};
  const keys = {background: o => o.background, color: o => o.text};
  const light = {_theme: resolveTheme("light")};
  assert.deepStrictEqual(
    themeOverlayStyle(light, defaults, defaults, keys),
    defaults,
    "the light preset keeps the built-in style",
  );
  const dark = {_theme: resolveTheme("dark")};
  assert.deepStrictEqual(themeOverlayStyle(dark, defaults, defaults, keys), {
    background: themeDark.overlay.background,
    color: themeDark.overlay.text,
    gap: "4px",
  });
  assert.strictEqual(
    themeOverlayStyle(dark, {...defaults, color: "red"}, defaults, keys).color,
    "red",
    "a user value wins",
  );
  assert.notStrictEqual(themeLight.overlay.text, themeDark.overlay.text);
});
