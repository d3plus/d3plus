import {afterEach, it} from "vitest";
import assert from "assert";
import {select} from "d3-selection";

import {useJsdom} from "~test/jsdom.js";
import {
  pageIsDark,
  pageTheme,
  unwatchPageTheme,
  watchPage,
  watchPageTheme,
} from "../../src/charts/viz/pageTheme.ts";
import {resolveTheme} from "../../src/utils/theme.ts";

useJsdom();

const restore = [];
afterEach(() => {
  while (restore.length) restore.pop()();
});

/** Replaces a global for the rest of the test. */
const stub = (key, value) => {
  const had = Object.prototype.hasOwnProperty.call(globalThis, key);
  const prev = globalThis[key];
  globalThis[key] = value;
  restore.push(() => {
    if (had) globalThis[key] = prev;
    else delete globalThis[key];
  });
};

/** A page whose `<html>` declares `colorScheme`, and where the system prefers dark when `prefersDark`. */
const page = (colorScheme, prefersDark = false) => {
  const real = globalThis.getComputedStyle;
  stub("getComputedStyle", el => {
    const style = real(el);
    return el === document.documentElement
      ? {backgroundColor: style.backgroundColor, colorScheme}
      : style;
  });
  stub("matchMedia", () => ({
    matches: prefersDark,
    addEventListener() {},
    removeEventListener() {},
  }));
};

/** An svg inside a div with `background`. */
const mounted = background => {
  const host = document.body.appendChild(document.createElement("div"));
  if (background) host.style.backgroundColor = background;
  return {
    _select: select(
      host.appendChild(
        document.createElementNS("http://www.w3.org/2000/svg", "svg"),
      ),
    ),
  };
};

it("the first opaque background behind the chart decides", () => {
  assert.deepStrictEqual(pageTheme(mounted("rgb(33, 37, 41)")), {
    dark: true,
    background: "rgb(33, 37, 41)",
  });
  assert.deepStrictEqual(pageTheme(mounted("rgb(240, 240, 240)")), {
    dark: false,
    background: "rgb(240, 240, 240)",
  });
});

it("a transparent page is light and white by default", () => {
  page("");
  assert.deepStrictEqual(pageTheme(mounted()), {
    dark: false,
    background: "rgb(255, 255, 255)",
  });
});

it("a dark-only color-scheme makes a transparent page dark", () => {
  page("dark");
  assert.deepStrictEqual(pageTheme(mounted()), {dark: true});
  assert.strictEqual(pageIsDark(mounted()), true);
});

it("a light-and-dark color-scheme follows the system preference", () => {
  page("light dark", true);
  assert.strictEqual(pageIsDark(mounted()), true);
  restore.pop()();
  restore.pop()();
  page("light dark", false);
  assert.strictEqual(pageIsDark(mounted()), false);
});

it("an opaque background wins over the color-scheme", () => {
  page("dark");
  assert.strictEqual(pageIsDark(mounted("rgb(255, 255, 255)")), false);
});

it("server renders are light", () => {
  assert.deepStrictEqual(pageTheme({...mounted("#000"), _ssr: true}), {
    dark: false,
    background: "rgb(255, 255, 255)",
  });
});

it("watchPage calls back on an <html>/<body> attribute change, until unsubscribed", async () => {
  stub("MutationObserver", window.MutationObserver);
  let calls = 0;
  const stop = watchPage(() => calls++);
  document.body.setAttribute("class", "dark");
  await new Promise(r => setTimeout(r, 0));
  assert.ok(calls > 0, "called on a body change");
  const viaBody = calls;
  const ended = new window.Event("transitionend", {bubbles: true});
  Object.defineProperty(ended, "propertyName", {value: "background-color"});
  document.body.dispatchEvent(ended);
  assert.strictEqual(
    calls,
    viaBody + 1,
    "called when a background transition ends",
  );
  const other = new window.Event("transitionend", {bubbles: true});
  Object.defineProperty(other, "propertyName", {value: "opacity"});
  document.body.dispatchEvent(other);
  assert.strictEqual(calls, viaBody + 1, "other transitions are ignored");
  stop();
  const before = calls;
  document.documentElement.setAttribute("data-theme", "dark");
  await new Promise(r => setTimeout(r, 0));
  assert.strictEqual(calls, before, "silent once unsubscribed");
});

it("watchPageTheme redraws an auto chart only when the dark state flips", async () => {
  stub("MutationObserver", window.MutationObserver);
  const host = document.body.appendChild(document.createElement("div"));
  host.style.backgroundColor = "rgb(255, 255, 255)";
  const svg = host.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "svg"),
  );
  let renders = 0;
  const viz = {
    _select: select(svg),
    _theme: resolveTheme("auto", {dark: false}),
    render: () => renders++,
  };
  watchPageTheme(viz);
  assert.strictEqual(typeof viz._themeWatch, "function");
  const installed = viz._themeWatch;
  watchPageTheme(viz);
  assert.strictEqual(viz._themeWatch, installed, "installed once");

  document.body.setAttribute("data-x", "1");
  await new Promise(r => setTimeout(r, 0));
  assert.strictEqual(renders, 0, "no flip, no redraw");

  host.style.backgroundColor = "rgb(0, 0, 0)";
  document.body.setAttribute("data-x", "2");
  await new Promise(r => setTimeout(r, 0));
  assert.strictEqual(renders, 1, "redraws on a flip");

  viz._theme = resolveTheme("light");
  document.body.setAttribute("data-x", "3");
  await new Promise(r => setTimeout(r, 0));
  assert.strictEqual(renders, 1, "a forced theme never redraws");

  unwatchPageTheme(viz);
  assert.strictEqual(viz._themeWatch, undefined);
  unwatchPageTheme(viz);
});

it("watchPageTheme skips server renders", () => {
  const viz = {_ssr: true};
  watchPageTheme(viz);
  assert.strictEqual(viz._themeWatch, undefined);
});
