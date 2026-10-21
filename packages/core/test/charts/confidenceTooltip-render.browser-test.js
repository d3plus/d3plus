/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    #781: a Plot's tooltips list its `confidence` bounds — "Lower Bound" and
    "Upper Bound" rows on a single mark's tooltip, a range after each series'
    value in the shared tooltip — and `confidence(false)` turns the interval
    off entirely. Driven in Chromium through real pointer events.
*/

after(closeBrowser);

const data = [];
["Alpha", "Beta"].forEach((id, s) =>
  [2010, 2011, 2012].forEach((year, k) => {
    const value = 10 * (s + 1) + k;
    data.push({id, year, value, lo: value - 2, hi: value + 3});
  }),
);

/**
    Renders `kind`, hovers `target` (a mark's data-key) or else empty plot
    space at `fx` across the plot, and reads the tooltip.
*/
const probe = ([kind, config, rows, target, fx, prefix]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[kind]()
      .data(rows)
      .groupBy("id")
      .x("year")
      .y("value")
      .config(config)
      .config(prefix ? {yConfig: {tickFormat: d => `${prefix}${d}`}} : {})
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const svg = document.querySelector("#viz svg.d3plus-render-svg");
      const r = svg.getBoundingClientRect();
      const a = viz._plotArea, c = viz._chartTransform;
      const node = target && svg.querySelector(`[data-key="${target}"]`);
      const box = node && node.getBoundingClientRect();
      const clientX = box ? box.left + box.width / 2 : r.left + c.x + a.x + a.width * fx;
      const clientY = box ? box.top + box.height / 2 : r.top + c.y + a.y + 4;
      const surface = svg.querySelector('[data-key="plot-hover-surface"]');
      (node || surface || svg).dispatchEvent(new MouseEvent("mousemove", {clientX, clientY, bubbles: true}));
      requestAnimationFrame(() => setTimeout(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        resolve({
          title: tip ? tip.querySelector(".d3plus-tooltip-title").textContent : null,
          rows: tip
            ? Array.from(tip.querySelectorAll("tbody tr")).map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.textContent))
            : [],
          errorBars: svg.querySelectorAll("[data-key$='::confidence']").length,
          bands: (function count(nodes) {
            return nodes.reduce((n, d) => n + (d.shapeType === "Area" ? 1 : 0) + count(d.children || []), 0);
          })(viz._chartScene),
          domain: viz._yAxis._d3Scale.domain(),
        });
      }, 50));
    });
  });

const run = (kind, config, {rows = data, target = null, fx = 0.5, prefix = null} = {}) =>
  render('<div id="viz" style="width:600px;height:400px"></div>', probe, [kind, config, rows, target, fx, prefix]);

const confidence = ["lo", "hi"];

it("BarChart — a hovered bar's tooltip lists its bounds after its value", async function () {
  this.timeout(60000);
  const r = await run("BarChart", {confidence}, {target: "Beta_2011"});
  assert.strictEqual(r.title, "Beta");
  assert.deepStrictEqual(r.rows, [["year", "2011"], ["value", "21"], ["Lower Bound", "19"], ["Upper Bound", "24"]]);
});

it("BarChart — a one-sided interval lists only its bound; a row without bounds lists none", async function () {
  this.timeout(60000);
  const rows = data.map(d => (d.id === "Alpha" ? {...d, hi: undefined} : d));
  const one = await run("BarChart", {confidence: [false, "hi"]}, {rows, target: "Beta_2011"});
  assert.deepStrictEqual(one.rows.slice(2), [["Upper Bound", "24"]]);
  const none = await run("BarChart", {confidence: [false, "hi"]}, {rows, target: "Alpha_2011"});
  assert.deepStrictEqual(none.rows, [["year", "2011"], ["value", "11"]]);
});

it("BarChart — the bounds use the value's own formatter", async function () {
  this.timeout(60000);
  const r = await run("BarChart", {confidence}, {target: "Beta_2011", prefix: "$"});
  assert.deepStrictEqual(r.rows, [["year", "2011"], ["value", "$21"], ["Lower Bound", "$19"], ["Upper Bound", "$24"]]);
});

it("BarChart — stacked bars list each segment's raw bounds as a range", async function () {
  this.timeout(60000);
  const r = await run("BarChart", {confidence, stacked: true}, {target: "Beta_2011"});
  assert.deepStrictEqual(r.rows, [["Beta", "21 (19 – 24)"], ["Alpha", "11 (9 – 14)"]],
    "the user's bounds, not where the stacked error bar is drawn");
});

it("LinePlot — the shared tooltip lists each series' range; one series gets bound rows", async function () {
  this.timeout(60000);
  const shared = await run("LinePlot", {confidence}, {fx: 0.5});
  assert.deepStrictEqual(shared.rows, [["Beta", "21 (19 – 24)"], ["Alpha", "11 (9 – 14)"]]);
  const single = await run("LinePlot", {confidence}, {rows: data.filter(d => d.id === "Alpha"), fx: 0.9});
  assert.deepStrictEqual(single.rows, [["year", "2012"], ["value", "12"], ["Lower Bound", "10"], ["Upper Bound", "15"]],
    "the nearest point's bounds");
});

it("confidenceConfig.tooltip: false leaves the bounds out", async function () {
  this.timeout(60000);
  const bar = await run("BarChart", {confidence, confidenceConfig: {tooltip: false}}, {target: "Beta_2011"});
  assert.deepStrictEqual(bar.rows, [["year", "2011"], ["value", "21"]]);
  assert.strictEqual(bar.errorBars, 6, "the error bars still draw");
  const line = await run("LinePlot", {confidence, confidenceConfig: {tooltip: false}}, {fx: 0.5});
  assert.deepStrictEqual(line.rows, [["Beta", "21"], ["Alpha", "11"]]);
});

it("confidence: false — no error bars, band, axis widening, or tooltip bounds", async function () {
  this.timeout(60000);
  const on = await run("BarChart", {confidence}, {target: "Beta_2011"});
  const off = await run("BarChart", {confidence: false}, {target: "Beta_2011"});
  assert.strictEqual(on.errorBars, 6);
  assert.strictEqual(off.errorBars, 0);
  assert.ok(Math.max(...on.domain) > Math.max(...off.domain), `axis narrows (${on.domain} → ${off.domain})`);
  assert.deepStrictEqual(off.rows, [["year", "2011"], ["value", "21"]]);
  const lineOn = await run("LinePlot", {confidence}, {fx: 0.5});
  const lineOff = await run("LinePlot", {confidence: false}, {fx: 0.5});
  assert.ok(lineOn.bands > 0, "a band while on");
  assert.strictEqual(lineOff.bands, 0, "the band is gone");
  assert.deepStrictEqual(lineOff.rows, [["Beta", "21"], ["Alpha", "11"]]);
});
