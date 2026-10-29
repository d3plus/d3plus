import {it} from "vitest";
import assert from "assert";
import {hsl} from "d3-color";
import {select} from "d3-selection";

import {colorDefaults, colorGray, colorLegible} from "@d3plus/color";
import {useJsdom} from "~test/jsdom.js";
import BaseClass from "../../src/utils/BaseClass.ts";
import {resolveTheme} from "../../src/utils/theme.ts";
import {
  cascadeTheme,
  gridStroke,
  inkAxis,
  inkBackground,
  inkGrid,
  inkText,
  legibleOn,
} from "../../src/utils/themeInk.ts";

useJsdom();

/** An svg inside a div with `background`, as a d3 selection. */
const mounted = background => {
  const host = document.body.appendChild(document.createElement("div"));
  host.style.backgroundColor = background;
  return select(
    host.appendChild(
      document.createElementNS("http://www.w3.org/2000/svg", "svg"),
    ),
  );
};

it("inkBackground reads the theme, then the DOM, then white", () => {
  const dark = resolveTheme("dark");
  assert.strictEqual(inkBackground({_theme: dark}), dark.background);
  assert.strictEqual(
    inkBackground({_select: mounted("rgb(1, 2, 3)")}),
    "rgb(1, 2, 3)",
  );
  assert.strictEqual(inkBackground({}), "rgb(255, 255, 255)");
});

it("inkText contrasts with the DOM background without a theme", () => {
  const schema = {colorDefaults};
  assert.strictEqual(
    inkText({_select: mounted("rgb(0, 0, 0)"), schema}),
    colorDefaults.light,
  );
  assert.strictEqual(inkText({schema}), colorDefaults.dark);
});

it("inkText, inkAxis, and inkGrid take a theme's tokens", () => {
  const _theme = resolveTheme({base: "dark", axis: "#f00", gridline: "#0f0"});
  const obj = {_theme, schema: {colorDefaults}};
  assert.strictEqual(inkText(obj), _theme.text);
  assert.strictEqual(inkAxis(obj), "#f00");
  assert.strictEqual(inkGrid(obj), "#0f0");
});

it("inkAxis and inkGrid follow the background without a theme", () => {
  const obj = {_select: mounted("rgb(0, 0, 0)"), schema: {colorDefaults}};
  assert.strictEqual(inkAxis(obj), colorDefaults.light);
  assert.strictEqual(inkGrid(obj), colorGray[800]);
});

it("gridStroke is a faint step off the background", () => {
  assert.strictEqual(gridStroke("#ffffff"), colorGray[200]);
  assert.strictEqual(gridStroke("#212529", colorDefaults), colorGray[800]);
});

it("legibleOn darkens on light backgrounds and lightens on dark ones", () => {
  assert.strictEqual(legibleOn("#ffd43b", false), colorLegible("#ffd43b"));
  assert.ok(hsl(legibleOn("#1c3d5a", true)).l >= 0.65 - 1e-9);
  assert.strictEqual(
    hsl(legibleOn("#ffec99", true)).l.toFixed(3),
    hsl("#ffec99").l.toFixed(3),
  );
  assert.strictEqual(legibleOn("none", true), "none");
});

it("cascadeTheme reaches owned components but not other charts", () => {
  const root = new BaseClass();
  const child = new BaseClass();
  const grandchild = new BaseClass();
  const other = new BaseClass();
  other._preDraw = () => undefined;
  root._child = child;
  root.ctx.other = other;
  child.ctx.inner = grandchild;
  child._back = root;
  const theme = resolveTheme("dark");
  cascadeTheme(root, theme);
  assert.strictEqual(root._theme, theme);
  assert.strictEqual(child._theme, theme);
  assert.strictEqual(grandchild._theme, theme);
  assert.strictEqual(other._theme, undefined);
});
