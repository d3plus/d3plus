import assert from "assert";
import {closeBrowser, render} from "../playwright.js";

/**
    Radar level rings + value labels (#769), rendered end to end in Chromium
    through the SVG and Canvas backends.
*/

after(closeBrowser);

const body = '<div id="viz" style="width:600px;height:450px;font-family:sans-serif;"></div>';

const data = [
  {id: "alpha", axis: "Central", number: 170.992}, {id: "alpha", axis: "Kirkdale", number: 40},
  {id: "alpha", axis: "Kensington", number: 240}, {id: "alpha", axis: "Everton", number: 90},
  {id: "alpha", axis: "Picton", number: 160},
  {id: "beta", axis: "Central", number: 320}, {id: "beta", axis: "Kirkdale", number: 97.5},
  {id: "beta", axis: "Kensington", number: 40}, {id: "beta", axis: "Everton", number: 110},
  {id: "beta", axis: "Picton", number: 40},
];

/** Renders a Radar (SVG) and reports its rings, spokes, and level labels. */
const probeSvg = ([rows, configSrc]) =>
  new Promise((resolve, reject) => {
    try {
      const config = new Function(`return (${configSrc});`)();
      const viz = new window.d3plus.Radar()
        .config({data: rows, groupBy: "id", metric: "axis", value: "number", legend: false, ...config})
        .duration(0)
        .select("#viz");
      viz.render(() => {
        const root = document.querySelector("#viz svg");
        const group = viz._chartScene.find(n => n.key === "radar-level-labels");
        const children = group ? group.children : [];
        // Document order of level label texts vs. data polygons (`M x y L …`).
        const labelSet = new Set(children.map(c => c.lines[0].text));
        const order = Array.from(root.querySelectorAll("text, path"))
          .map(el =>
            el.tagName === "text" && labelSet.has(el.textContent)
              ? "label"
              : el.tagName === "path" && /^M [-\d.]+ [-\d.]+ L/.test(el.getAttribute("d") || "")
                ? "polygon"
                : null,
          )
          .filter(Boolean);
        resolve({
          nodeTexts: children.filter(c => c.type === "text").map(c => c.lines[0].text),
          nodeTypes: Array.from(new Set(children.map(c => c.type))),
          lastLabel: order.lastIndexOf("label"),
          firstPolygon: order.indexOf("polygon"),
          positions: children
            .filter(c => c.type === "text")
            .map(c => ({...c.transform, anchor: c.font.anchor})),
          fontSize: children.find(c => c.type === "text")?.font.size,
          fontColor: children.find(c => c.type === "text")?.paint.fill,
          rings: viz._chartScene
            .find(n => n.key === "radar-radial-circles")
            ?.children.map(c => Math.round(c.r)),
          spokes: viz._chartScene.find(n => n.key === "radar-axis-spokes")?.children.map(c => c.d),
          domTexts: Array.from(root.querySelectorAll("text")).map(t => t.textContent),
        });
      });
    } catch (err) {
      reject(err);
    }
  });

it("Radar draws rings on nice values and labels them along the top by default", async function () {
  this.timeout(60000);
  const r = await render(body, probeSvg, [data, "{}"]);
  assert.deepStrictEqual(r.nodeTexts, ["0", "50", "100", "150", "200", "250", "300", "350"]);
  assert.deepStrictEqual(r.nodeTypes, ["text"], "labels are text only, no backdrops");
  assert.ok(r.firstPolygon > -1 && r.lastLabel > -1, "labels and polygons rendered");
  assert.ok(r.lastLabel < r.firstPolygon, "labels are drawn beneath the polygons");
  assert.strictEqual(r.rings.length, 7, "rings at 50, 100, …, 350");
  const step = r.rings[0];
  r.rings.forEach((ring, i) => assert.ok(Math.abs(ring - step * (i + 1)) <= 1, `ring ${i} evenly spaced`));
  r.positions.forEach((p, i) => {
    assert.strictEqual(p.anchor, "start", "text grows away from the vertical spoke");
    assert.ok(Math.abs(p.x - 3) < 1e-9, `labels start 3px right of the vertical spoke (${p.x})`);
    if (i) assert.ok(p.y < 0, "labels run up the chart");
  });
  for (let i = 1; i < r.positions.length; i++)
    assert.ok(r.positions[i].y < r.positions[i - 1].y, "labels climb ring by ring");
  ["100", "200", "300"].forEach(t => assert.ok(r.domTexts.includes(t), `SVG renders "${t}"`));
});

it("Radar spokes point at their axis labels", async function () {
  this.timeout(60000);
  const r = await render(body, probeSvg, [data, "{}"]);
  assert.strictEqual(r.spokes.length, 5);
  r.spokes.forEach(d => {
    const [, x, y] = d.match(/M0,0 (\S+),(\S+)/).map(Number);
    const angle = Math.atan2(y, x);
    const match = [0, 1, 2, 3, 4].some(i => {
      const a = (Math.PI * 2 * i) / 5;
      return Math.abs(Math.atan2(Math.sin(angle - a), Math.cos(angle - a))) < 1e-6;
    });
    assert.ok(match, `spoke ${d} runs along a metric direction`);
  });
  // The first metric's spoke runs to the right (3 o'clock).
  const [, x0, y0] = r.spokes[0].match(/M0,0 (\S+),(\S+)/).map(Number);
  assert.ok(x0 > 0 && Math.abs(y0) < 1e-6, `first spoke points right: ${r.spokes[0]}`);
});

it("levelLabels(false) hides the value labels but keeps the rings", async function () {
  this.timeout(60000);
  const r = await render(body, probeSvg, [data, "{levelLabels: false}"]);
  assert.deepStrictEqual(r.nodeTexts, []);
  assert.strictEqual(r.rings.length, 7);
  assert.ok(!r.domTexts.includes("300"));
});

it("levels accepts explicit ring values, and levelFormat formats the labels", async function () {
  this.timeout(60000);
  const r = await render(body, probeSvg, [
    data,
    "{levels: [0, 100, 200, 300, 400], levelFormat: d => d + ' pts'}",
  ]);
  assert.strictEqual(r.rings.length, 4, "a ring per non-center value");
  assert.deepStrictEqual(r.nodeTexts, ["0 pts", "100 pts", "200 pts", "300 pts", "400 pts"]);
  assert.ok(r.domTexts.includes("400 pts"));
});

it("levels as a count hint changes the ring spacing", async function () {
  this.timeout(60000);
  const r = await render(body, probeSvg, [data, "{levels: 3}"]);
  assert.strictEqual(r.rings.length, 4, "rings at 100, 200, 300, 400");
  assert.deepStrictEqual(r.nodeTexts, ["0", "100", "200", "300", "400"]);
});

it("levelLabelAngle moves the labels and levelLabelConfig styles them", async function () {
  this.timeout(60000);
  const r = await render(body, probeSvg, [
    data,
    "{levelLabelAngle: 180, levelLabelConfig: {fontSize: 14, fontColor: 'rgb(1, 2, 3)'}}",
  ]);
  assert.strictEqual(r.fontSize, 14);
  assert.strictEqual(r.fontColor, "rgb(1, 2, 3)");
  r.positions.forEach((p, i) => {
    assert.strictEqual(p.anchor, "end", "text grows leftward, away from the downward spoke");
    assert.ok(Math.abs(p.x + 3) < 1e-9, `labels end 3px left of the spoke (${p.x})`);
    if (i) assert.ok(p.y > 0, "180° runs down the chart");
  });
});

it("level labels read against a dark background", async function () {
  this.timeout(60000);
  const dark = '<div id="viz" style="width:600px;height:450px;background:rgb(20, 20, 20);"></div>';
  const r = await render(dark, probeSvg, [data, "{}"]);
  const hex = r.fontColor.replace("#", "");
  const [cr, cg, cb] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  assert.ok(cr + cg + cb > 600, `light text on a dark chart: ${r.fontColor}`);
});

/** Counts pure-red canvas pixels with the level labels painted red. */
const probeCanvas = ([rows, showLabels]) =>
  new Promise((resolve, reject) => {
    try {
      const viz = new window.d3plus.Radar()
        .config({
          data: rows,
          groupBy: "id",
          metric: "axis",
          value: "number",
          legend: false,
          levelLabels: showLabels,
          levelLabelConfig: {fontColor: "rgb(255, 0, 0)", fontSize: 16, fontWeight: 700},
          shapeConfig: {fill: "rgb(0, 0, 255)"},
        })
        .renderer("canvas")
        .duration(0)
        .select("#viz");
      viz.render(() => {
        const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
        if (!canvas) return reject(new Error("no canvas"));
        const px = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let red = 0;
        for (let i = 0; i < px.length; i += 4) {
          if (px[i] > 200 && px[i + 1] < 60 && px[i + 2] < 60 && px[i + 3] > 200) red++;
        }
        resolve(red);
      });
    } catch (err) {
      reject(err);
    }
  });

it("Canvas backend paints the level labels", async function () {
  this.timeout(60000);
  const withLabels = await render(body, probeCanvas, [data, true]);
  const without = await render(body, probeCanvas, [data, false]);
  assert.strictEqual(without, 0, "no red pixels without labels");
  assert.ok(withLabels > 50, `red label pixels painted: ${withLabels}`);
});

it("level labels default to the abbreviated axis number format", async function () {
  this.timeout(60000);
  const big = data.map(d => ({...d, number: d.number * 10000}));
  const r = await render(body, probeSvg, [big, "{}"]);
  assert.deepStrictEqual(r.nodeTexts, ["0", "500k", "1M", "1.5M", "2M", "2.5M", "3M", "3.5M"]);
});
