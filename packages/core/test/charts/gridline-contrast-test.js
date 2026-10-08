import assert from "assert";
import {rgb} from "d3-color";

import {closeBrowser, render} from "../playwright.js";

/**
    Default gridlines sit one faint step off the chart's background on both
    light and dark pages, rather than standing out on dark ones.
*/

after(async () => {
  await closeBrowser();
});

/** Renders a LinePlot inside a parent with `background`, and returns its visible gridline strokes. */
const gridStrokes = (background, extra = "") =>
  render(`<div id="viz" style="width:600px;height:400px;background:${background}"></div>`, src =>
    new Promise((resolve, reject) => {
      const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus).duration(0).select("#viz");
      viz.render(() => {
        try {
          const strokes = [];
          const walk = n => {
            if (n.type === "line" && /^grid-/.test(n.key) && n.paint && n.paint.stroke !== "transparent")
              strokes.push(n.paint.stroke);
            (n.children || []).forEach(walk);
          };
          walk(viz.toScene().root);
          resolve(strokes);
        } catch (e) {
          reject(e);
        }
      });
    }), `lib => new lib.LinePlot()
      .data([{id: "a", x: 1, y: 2}, {id: "a", x: 2, y: 5}, {id: "a", x: 3, y: 3}])
      .groupBy("id").x("x").y("y")${extra}`);

const hex = c => rgb(c).formatHex();

it("gridlines are gray-200 on a light background", async () => {
  const strokes = await gridStrokes("#ffffff");
  assert.ok(strokes.length > 0, "gridlines found");
  for (const s of strokes) assert.strictEqual(hex(s), "#e9ecef");
});

it("gridlines are gray-800 on a dark background", async () => {
  const strokes = await gridStrokes("#212529");
  assert.ok(strokes.length > 0, "gridlines found");
  for (const s of strokes) assert.strictEqual(hex(s), "#343a40");
});

it("a gridConfig stroke the user sets still wins", async () => {
  const strokes = await gridStrokes("#212529", `.yConfig({gridConfig: {stroke: "#ff0000"}})`);
  assert.ok(strokes.some(s => hex(s) === "#ff0000"), "the user stroke is used");
});
