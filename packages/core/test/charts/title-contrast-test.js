import assert from "assert";
import {rgb} from "d3-color";

import {closeBrowser, render} from "../playwright.js";

/**
    The title, subtitle, and total pick a text color that reads against the
    chart's own background, like the legend and axis labels do: dark text on
    a light page, light text when the chart sits on a dark background.
*/

after(async () => {
  await closeBrowser();
});

const KEYS = ["viz-title", "viz-subtitle", "viz-total"];

/** Renders a titled Plot inside a parent with `background`, and returns `{key: fill}` for its text blocks. */
const blockFills = (background, extra = "") =>
  render(`<div id="viz" style="width:800px;height:400px;background:${background}"></div>`, ({src, keys}) =>
    new Promise((resolve, reject) => {
      const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus).duration(0).select("#viz");
      viz.render(() => {
        try {
          const fills = {};
          const walk = n => {
            if (keys.includes(n.key) && n.type === "text") fills[n.key] = n.paint && n.paint.fill;
            (n.children || []).forEach(walk);
          };
          walk(viz.toScene().root);
          resolve(fills);
        } catch (e) {
          reject(e);
        }
      });
    }), {keys: KEYS, src: `lib => new lib.Plot()
      .data([{id: "alpha", x: 1, y: 2}, {id: "beta", x: 2, y: 1}, {id: "gamma", x: 3, y: 3}])
      .groupBy("id").x("x").y("y")
      .title("Title").subtitle("Subtitle").total("y")${extra}`});

const lightness = color => {
  const {r, g, b} = rgb(color);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

it("title, subtitle, and total are dark on a light background", async () => {
  const fills = await blockFills("#ffffff");
  for (const key of KEYS) {
    assert.ok(fills[key], `${key} rendered`);
    assert.ok(lightness(fills[key]) < 0.5, `${key} ${fills[key]} reads on white`);
  }
});

it("title, subtitle, and total are light on a dark background", async () => {
  const fills = await blockFills("#212529");
  for (const key of KEYS) {
    assert.ok(fills[key], `${key} rendered`);
    assert.ok(lightness(fills[key]) > 0.5, `${key} ${fills[key]} reads on #212529`);
  }
});

it("a fontColor the user sets still wins", async () => {
  const fills = await blockFills(
    "#212529",
    `.titleConfig({fontColor: "#ff0000"}).subtitleConfig({fontColor: "#00ff00"}).totalConfig({fontColor: "#0000ff"})`,
  );
  assert.strictEqual(rgb(fills["viz-title"]).formatHex(), "#ff0000");
  assert.strictEqual(rgb(fills["viz-subtitle"]).formatHex(), "#00ff00");
  assert.strictEqual(rgb(fills["viz-total"]).formatHex(), "#0000ff");
});
