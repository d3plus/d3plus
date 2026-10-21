import assert from "assert";
import {rgb} from "d3-color";

import {closeBrowser, render} from "../playwright.js";

/**
    Legend labels pick a text color that reads against the chart's own
    background, like the axis labels do: dark text on a light page, light
    text when the chart sits on a dark background.
*/

after(async () => {
  await closeBrowser();
});

/** Renders a three-group Plot inside a parent with `background`, and returns its legend label fills. */
const labelFills = (background, extra = "") =>
  render(`<div id="viz" style="width:800px;height:400px;background:${background}"></div>`, src =>
    new Promise((resolve, reject) => {
      const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus).duration(0).select("#viz");
      viz.render(() => {
        try {
          const fills = [];
          const walk = (n, inLegend) => {
            const here = inLegend || n.key === "viz-legend";
            if (here && n.type === "text") fills.push(n.paint && n.paint.fill);
            (n.children || []).forEach(c => walk(c, here));
          };
          walk(viz.toScene().root, false);
          resolve(fills);
        } catch (e) {
          reject(e);
        }
      });
    }), `lib => new lib.Plot()
      .data([{id: "alpha", x: 1, y: 2}, {id: "beta", x: 2, y: 1}, {id: "gamma", x: 3, y: 3}])
      .groupBy("id").x("x").y("y")${extra}`);

const lightness = color => {
  const {r, g, b} = rgb(color);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

it("legend labels are dark on a light background", async () => {
  const fills = await labelFills("#ffffff");
  assert.ok(fills.length >= 3, `labels found (${fills.length})`);
  for (const f of fills) assert.ok(lightness(f) < 0.5, `${f} reads on white`);
});

it("legend labels are light on a dark background", async () => {
  const fills = await labelFills("#212529");
  assert.ok(fills.length >= 3, `labels found (${fills.length})`);
  for (const f of fills) assert.ok(lightness(f) > 0.5, `${f} reads on #212529`);
});

it("a legend label fontColor the user sets still wins", async () => {
  const fills = await labelFills("#212529", `.legendConfig({shapeConfig: {labelConfig: {fontColor: "#ff0000"}}})`);
  assert.ok(fills.length >= 3);
  for (const f of fills) assert.strictEqual(rgb(f).formatHex(), "#ff0000");
});
