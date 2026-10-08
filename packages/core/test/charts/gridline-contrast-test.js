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

/** Renders a titled LinePlot inside a parent with `background`, and returns the axis groups' text fills and non-grid line strokes. */
const axisInk = (background, extra = "") =>
  render(`<div id="viz" style="width:600px;height:400px;background:${background}"></div>`, src =>
    new Promise((resolve, reject) => {
      const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus).duration(0).select("#viz");
      viz.render(() => {
        try {
          const out = {text: [], line: [], titleFill: null};
          const walk = (n, inAxis) => {
            const here = inAxis || /^plot-[xy]2?-axis$/.test(n.key);
            if (here && n.type === "text") out.text.push(n.paint && n.paint.fill);
            if (here && n.type === "line" && !/^grid-/.test(n.key) && n.paint && n.paint.stroke && n.paint.stroke !== "transparent")
              out.line.push(n.paint.stroke);
            if (n.key === "viz-title" && n.type === "text") out.titleFill = n.paint && n.paint.fill;
            (n.children || []).forEach(c => walk(c, here));
          };
          walk(viz.toScene().root, false);
          resolve(out);
        } catch (e) {
          reject(e);
        }
      });
    }), `lib => new lib.LinePlot()
      .data([{id: "a", x: 1, y: 2}, {id: "a", x: 2, y: 5}, {id: "a", x: 3, y: 3}])
      .groupBy("id").x("x").y("y").title("Title")${extra}`);

it("axis lines, ticks, labels, and titles match the chart title's ink on a dark background", async () => {
  const out = await axisInk("#212529");
  assert.ok(out.text.length >= 4, `axis texts found (${out.text.length})`);
  assert.ok(out.line.length >= 2, `axis lines found (${out.line.length})`);
  for (const f of out.text) assert.strictEqual(hex(f), hex(out.titleFill), `axis text ${f}`);
  for (const s of out.line) assert.strictEqual(hex(s), hex(out.titleFill), `axis line ${s}`);
});

it("axis ink stays dark on a light background", async () => {
  const out = await axisInk("#ffffff");
  for (const f of out.text) assert.strictEqual(hex(f), hex(out.titleFill), `axis text ${f}`);
  for (const s of out.line) assert.strictEqual(hex(s), hex(out.titleFill), `axis line ${s}`);
});

it("an axis color the user sets still wins on a dark background", async () => {
  const out = await axisInk("#212529", `.yConfig({barConfig: {stroke: "#ff0000"}, shapeConfig: {labelConfig: {fontColor: "#00ff00"}}})`);
  assert.ok(out.line.some(s => hex(s) === "#ff0000"), "user axis line stroke is used");
  assert.ok(out.text.some(f => hex(f) === "#00ff00"), "user label color is used");
});
