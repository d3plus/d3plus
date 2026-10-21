import assert from "assert";
import {rgb} from "d3-color";

import {closeBrowser, render} from "../playwright.js";

/**
    Axis breaks alongside the chart's background ink (axes inked for dark
    pages) and a short Plot's x-axis end labels.
*/

after(async () => {
  await closeBrowser();
});

/** Renders `src` into a `width`×`height` parent with `background`, and reports break glyph, axis, and end-label details. */
const probe = (src, {background = "#ffffff", width = 600, height = 400} = {}) =>
  render(
    `<div id="viz" style="width:${width}px;height:${height}px;background:${background}"></div>`,
    src =>
      new Promise((resolve, reject) => {
        const viz = new Function("lib", `return (${src})(lib);`)(window.d3plus).duration(0).select("#viz");
        viz.render(() => {
          try {
            const out = {bar: [], marks: [], lines: [], endLabels: [], masks: 0};
            const walk = (n, path) => {
              const key = String(n.key);
              if (n.type === "line" && key === "bar") out.bar.push(n.paint.stroke);
              if (n.type === "line" && /^(baseline-)?break-\d*-?[01]$/.test(key)) out.marks.push(n.paint.stroke);
              if (key.startsWith("break-line")) out.lines.push({stroke: n.paint.stroke, points: n.points});
              if (key.startsWith("plot-break-mask")) out.masks++;
              if (n.type === "text" && path.includes("plot-x-end-labels"))
                out.endLabels.push({text: n.lines.map(l => l.text).join(" "), x: n.transform.x, width: n.width});
              (n.children || []).forEach(c => walk(c, path.concat(key)));
            };
            walk(viz._paintedScene.root, []);
            out.area = viz._plotArea;
            out.xMode = viz._xAxis && viz._xAxis._breaks ? viz._xAxis._breaks.length : 0;
            resolve(out);
          } catch (e) {
            reject(e);
          }
        });
      }),
    src,
  );

const light = c => rgb(c).r > 150 && rgb(c).g > 150 && rgb(c).b > 150;

it("on a dark background, break marks and lines take the axis line's ink", async function () {
  this.timeout(60000);
  const data = `[{id: "A", v: 42}, {id: "B", v: 58}, {id: "C", v: 960}]`;
  for (const extra of [`.yBreak([80, 900])`, `.data(${data}.map(d => ({...d, v: d.v + 1100}))).yDomain([1100, 2200])`]) {
    const out = await probe(`lib => new lib.BarChart().data(${data}).groupBy("id").x("id").y("v")${extra}`, {background: "#212529"});
    assert.ok(out.marks.length >= 2, `marks drawn (${extra})`);
    assert.ok(out.lines.length === 2, `lines drawn (${extra})`);
    const axisInk = out.bar.find(light);
    assert.ok(axisInk, `the axis line is inked light (${out.bar})`);
    out.marks.forEach(s => assert.strictEqual(rgb(s).formatHex(), rgb(axisInk).formatHex(), `mark ${s} matches the axis line`));
    out.lines.forEach(l => assert.strictEqual(rgb(l.stroke).formatHex(), rgb(axisInk).formatHex(), "line matches the axis line"));
  }
});

it("a short horizontal BarChart with a baseline break labels its x ends from 0, flush to the plot", async function () {
  this.timeout(60000);
  const out = await probe(
    `lib => new lib.BarChart().data([{id: "A", v: 1500}, {id: "B", v: 1900}]).groupBy("id").discrete("y").y("id").x("v").xConfig({domain: [1100, 2100]}).legend(false)`,
    {width: 420, height: 140},
  );
  assert.strictEqual(out.endLabels.length, 2, "two end labels");
  const [start, end] = out.endLabels.sort((a, b) => a.x - b.x);
  assert.strictEqual(start.text, "0", "the start label is the baseline the axis starts at");
  assert.ok(Math.abs(start.x - out.area.x) < 1, "start label flush with the plot's left edge");
  assert.ok(Math.abs(end.x + end.width - (out.area.x + out.area.width)) < 1, "end label flush with the right edge");
  assert.strictEqual(out.xMode, 1, "the x axis still breaks");
  assert.strictEqual(out.lines.length, 2, "break lines drawn across the short plot");
});

it("a short scatter Plot with an xBreak keeps its end labels and masks the break", async function () {
  this.timeout(60000);
  const out = await probe(
    `lib => new lib.Plot().data([1, 2, 3, 9, 10].map(x => ({id: \`p\${x}\`, x, y: x}))).groupBy("id").x("x").y("y").xBreak([4, 8]).legend(false)`,
    {width: 420, height: 140},
  );
  assert.strictEqual(out.endLabels.length, 2);
  const [start, end] = out.endLabels.sort((a, b) => a.x - b.x);
  assert.ok(Math.abs(start.x - out.area.x) < 1 && Math.abs(end.x + end.width - (out.area.x + out.area.width)) < 1, "flush");
  assert.strictEqual(out.xMode, 1, "the x axis breaks");
  assert.strictEqual(out.lines.length, 2, "break lines");
  assert.strictEqual(out.masks, 1, "the plot content is masked");
});
