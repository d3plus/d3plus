/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    #781: `confidence` on a BarChart draws an error bar per bar — a stroke from
    the lower to the upper bound, centered across the bar, capped at each end —
    on both renderers, and the error bar hovers, dims, and clicks as part of
    its bar.
*/

after(closeBrowser);

const data = [
  {id: "Alpha", q: "Q1", v: 10, lo: 8, hi: 13},
  {id: "Alpha", q: "Q2", v: 20, lo: 17, hi: 24},
  {id: "Beta", q: "Q1", v: 5, lo: 3, hi: 9},
  {id: "Beta", q: "Q2", v: 15, lo: 12, hi: 17},
];

/** Renders a BarChart and reports its bars, error bars, and value scale. */
const draw = ([config, data]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.BarChart()
      .data(data)
      .groupBy("id")
      .config(config)
      .width(500).height(400)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const nodes = flat(viz._chartScene);
      const row = n => n.datum && n.datum.data ? n.datum.data : n.datum;
      const discrete = viz.schema.discrete;
      const scale = discrete === "y" ? viz._xFunc : viz._yFunc;
      const bars = nodes.filter(n => n.type === "rect" && n.shapeType === "Bar")
        .map(n => ({key: n.key, row: row(n), x: n.transform.x + n.x, y: n.transform.y + n.y, width: n.width, height: n.height, fill: n.paint.fill}))
        .map(b => ({...b, px: Object.fromEntries(["lo", "hi", "v"].map(k => [k, scale(b.row[k])]))}));
      const errorBars = nodes.filter(n => /::confidence$/.test(`${n.key}`))
        .map(n => ({key: n.key, type: n.type, shapeType: n.shapeType, row: row(n), d: n.d, paint: n.paint}));
      const hits = nodes.filter(n => /::confidence::hit$/.test(`${n.key}`)).length;
      const svg = document.querySelector("#viz svg.d3plus-render-svg");
      resolve({
        bars,
        errorBars,
        hits,
        domain: (discrete === "y" ? viz._xAxis : viz._yAxis)._d3Scale.domain(),
        dom: svg ? Array.from(svg.querySelectorAll("path[data-key$='::confidence']")).length : null,
      });
    });
  });

const run = (config, rows = data) =>
  render("<div id='viz' style='width:500px;height:400px'></div>", draw, [config, rows]);

/** Parses an error bar path into its [x1, y1, x2, y2] segments. */
const segments = d => d.split("M").filter(Boolean).map(s => s.split(/[L,]/).map(Number));

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.01, `${msg}: ${a} vs ${b}`);

it("vertical grouped bars — one capped error bar per bar, centered on it", async function () {
  this.timeout(60000);
  const r = await run({x: "q", y: "v", confidence: ["lo", "hi"]});
  assert.strictEqual(r.errorBars.length, 4, "an error bar per bar");
  assert.strictEqual(r.hits, 4, "each with a hover target");
  assert.strictEqual(r.dom, 4, "painted as SVG paths");
  for (const e of r.errorBars) {
    const bar = r.bars.find(b => `${b.key}::confidence` === e.key);
    assert.ok(bar, `${e.key} belongs to a bar`);
    assert.deepStrictEqual(e.row, bar.row, "shares its bar's datum");
    assert.strictEqual(e.type, "path");
    assert.strictEqual(e.shapeType, "Bar", "stamped as part of its bar");
    assert.strictEqual(e.paint.fill, "none");
    assert.strictEqual(e.paint.strokeWidth, 1.5);
    assert.notStrictEqual(e.paint.stroke, bar.fill, "a shade darker than the bar");
    const [stem, lowerCap, upperCap] = segments(e.d);
    const center = bar.x + bar.width / 2;
    near(stem[0], center, "stem centered on the bar");
    near(stem[2], center, "and vertical");
    near(stem[1], bar.px.lo, "from the lower bound");
    near(stem[3], bar.px.hi, "to the upper bound");
    near(lowerCap[1], bar.px.lo, "lower cap at the lower bound");
    near(upperCap[1], bar.px.hi, "upper cap at the upper bound");
    near(upperCap[2] - upperCap[0], bar.width / 2, "caps span half the bar");
    near((upperCap[0] + upperCap[2]) / 2, center, "caps centered");
  }
  assert.ok(Math.max(...r.domain) >= 24, `the axis fits the highest bound (${r.domain})`);
});

it("horizontal bars — error bars run along x", async function () {
  this.timeout(60000);
  const r = await run({discrete: "y", x: "v", y: "q", confidence: ["lo", "hi"]});
  assert.strictEqual(r.errorBars.length, 4);
  for (const e of r.errorBars) {
    const bar = r.bars.find(b => `${b.key}::confidence` === e.key);
    const [stem, lowerCap] = segments(e.d);
    const center = bar.y + bar.height / 2;
    near(stem[1], center, "stem centered on the bar");
    near(stem[3], center, "and horizontal");
    near(stem[0], bar.px.lo, "from the lower bound");
    near(stem[2], bar.px.hi, "to the upper bound");
    near(lowerCap[0], lowerCap[2], "caps run across the bar");
    near(lowerCap[3] - lowerCap[1], bar.height / 2, "caps span half the bar");
  }
  assert.ok(Math.max(...r.domain) >= 24, `the axis fits the highest bound (${r.domain})`);
});

it("stacked bars — error bars sit around each bar's stacked end", async function () {
  this.timeout(60000);
  const r = await run({x: "q", y: "v", stacked: true, confidence: ["lo", "hi"]});
  assert.strictEqual(r.errorBars.length, 4);
  for (const e of r.errorBars) {
    const bar = r.bars.find(b => `${b.key}::confidence` === e.key);
    const [stem] = segments(e.d);
    // The bar's top is its stacked end; a bound keeps its distance from the value.
    const end = bar.y;
    near(stem[1] - end, bar.px.lo - bar.px.v, "lower bound offset from the stacked end");
    near(stem[3] - end, bar.px.hi - bar.px.v, "upper bound offset from the stacked end");
  }
  assert.ok(Math.max(...r.domain) >= 35 + 2, `the axis fits the top stack's bound (${r.domain})`);
});

it("confidenceConfig — styles the error bars, with Bar-nested keys winning", async function () {
  this.timeout(60000);
  const r = await run({
    x: "q", y: "v",
    confidence: ["lo", "hi"],
    confidenceConfig: {stroke: "red", strokeWidth: 3, capWidth: 6, Bar: {stroke: "green"}},
  });
  for (const e of r.errorBars) {
    assert.strictEqual(e.paint.stroke, "green");
    assert.strictEqual(e.paint.strokeWidth, 3);
    const [, cap] = segments(e.d);
    near(cap[2] - cap[0], 6, "a fixed cap width in pixels");
  }
});

it("one-sided confidence and missing bounds", async function () {
  this.timeout(60000);
  const rows = data.map((d, i) => i === 0 ? {...d, hi: undefined} : d);
  const r = await run({x: "q", y: "v", confidence: [false, "hi"]}, rows);
  assert.strictEqual(r.errorBars.length, 3, "a bar without a bound draws none");
  for (const e of r.errorBars) {
    const bar = r.bars.find(b => `${b.key}::confidence` === e.key);
    const parts = segments(e.d);
    assert.strictEqual(parts.length, 2, "a stem and the upper cap");
    assert.ok(Math.abs(parts[0][1] - bar.y) < 1, "stem starts at the bar's end");
  }
});

it("no confidence — no error bars", async function () {
  this.timeout(60000);
  const r = await run({x: "q", y: "v"});
  assert.strictEqual(r.errorBars.length, 0);
  assert.strictEqual(r.hits, 0);
});

/**
    Hovers (and clicks) Beta's Q1 error bar just under its upper cap — above
    the bar itself — through the renderer's real pointer path.
*/
const hover = ([renderer]) =>
  new Promise(resolve => {
    const clicks = [];
    const viz = new window.d3plus.BarChart()
      .data([
        {id: "Alpha", q: "Q1", v: 10, lo: 8, hi: 13},
        {id: "Alpha", q: "Q2", v: 20, lo: 17, hi: 24},
        {id: "Beta", q: "Q1", v: 5, lo: 3, hi: 9},
        {id: "Beta", q: "Q2", v: 15, lo: 12, hi: 17},
      ])
      .groupBy("id").x("q").y("v")
      .confidence(["lo", "hi"])
      .renderer(renderer)
      .on("click.Bar", d => clicks.push(d.id))
      .width(500).height(400).duration(0)
      .select("#viz");
    viz.render(() => {
      const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const nodes = flat(viz._chartScene);
      const bar = nodes.find(n => n.key === "Beta_Q1");
      const errorBar = nodes.find(n => n.key === "Beta_Q1::confidence");
      const [x, y] = errorBar.d.split(/[ML,]/).filter(Boolean).map(Number).slice(2, 4);
      const c = viz._chartTransform;
      const host = renderer === "canvas"
        ? document.querySelector("#viz canvas.d3plus-render-canvas")
        : document.querySelector("#viz svg.d3plus-render-svg [data-key='Beta_Q1::confidence::hit']");
      const box = (renderer === "canvas" ? host : host.ownerSVGElement).getBoundingClientRect();
      const at = {clientX: box.left + c.x + x, clientY: box.top + c.y + y + 2, bubbles: true};
      host.dispatchEvent(new MouseEvent("mousemove", at));
      requestAnimationFrame(() => setTimeout(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        const swatch = tip && tip.querySelector(".d3plus-tooltip-title .d3plus-tooltip-swatch");
        const opacity = {};
        const walk = n => {
          if (n.key !== undefined) opacity[n.key] = n.paint && typeof n.paint.opacity === "number" ? n.paint.opacity : 1;
          (n.children || []).forEach(walk);
        };
        walk(viz._paintedScene.root);
        const crosshair = flat([viz._paintedScene.root]).find(n => n.key === "crosshair");
        host.dispatchEvent(new MouseEvent("click", at));
        resolve({
          title: tip ? tip.querySelector(".d3plus-tooltip-title").textContent : null,
          swatch: swatch ? swatch.style.backgroundColor : null,
          barFill: bar.paint.fill,
          barCenter: bar.transform.x + bar.x + bar.width / 2,
          crosshair: crosshair ? crosshair.transform.x : null,
          opacity,
          clicks,
        });
      }, 50));
    });
  });

const toRgb = hex => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer} — an error bar hovers, dims, and clicks as part of its bar`, async function () {
    this.timeout(60000);
    const r = await render("<div id='viz' style='width:500px;height:400px'></div>", hover, [renderer]);
    assert.ok(r.title && r.title.includes("Beta"), `tooltip titled by the bar (${r.title})`);
    assert.strictEqual(r.swatch, toRgb(r.barFill), "the title swatch is the bar's color, not the error bar's");
    assert.strictEqual(r.opacity["Beta_Q1"], 1, "the hovered bar stays bright");
    assert.strictEqual(r.opacity["Beta_Q1::confidence"], 1, "so does its error bar");
    assert.ok(r.opacity["Alpha_Q1"] < 1, "other bars dim");
    assert.ok(r.opacity["Alpha_Q1::confidence"] < 1, "and their error bars with them");
    assert.deepStrictEqual(r.clicks, ["Beta"], "click.Bar fires on the error bar");
    near(r.crosshair, r.barCenter, "the hover crosshair snaps to the bar's center");
  });
}

/** Renders a BarChart and reports its error bars, their mask ancestry, and the value axis range. */
const drawBroken = ([config, rows]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.BarChart()
      .data(rows).groupBy("id").x("id").y("v")
      .confidence(["lo", "hi"])
      .config(config)
      .width(500).height(400).duration(0)
      .select("#viz");
    viz.render(() => {
      const errorBars = [];
      const walk = (nodes, masks) => nodes.forEach(n => {
        const inMask = masks.concat(String(n.key).startsWith("plot-break-mask") && n.clip ? [n.key] : []);
        if (/::confidence$/.test(`${n.key}`)) errorBars.push({key: n.key, d: n.d, masks: inMask});
        if (n.children) walk(n.children, inMask);
      });
      walk(viz._chartScene, []);
      resolve({errorBars, range: viz._yAxis._getRange(), domain: viz._yAxis._d3Scale.domain()});
    });
  });

it("an error bar crossing a yBreak is cut by the break mask, like its bar", async function () {
  this.timeout(60000);
  const rows = [
    {id: "North", v: 42, lo: 38, hi: 47},
    {id: "Online", v: 960, lo: 850, hi: 990},
    {id: "West", v: 51, lo: 45, hi: 56},
  ];
  const r = await render("<div id='viz' style='width:500px;height:400px'></div>", drawBroken, [{yBreak: [80, 900]}, rows]);
  assert.strictEqual(r.errorBars.length, 3);
  for (const e of r.errorBars)
    assert.ok(e.masks.length, `${e.key} sits inside the break mask`);
  const online = r.errorBars.find(e => e.key === "Online_Online::confidence");
  assert.strictEqual(segments(online.d).length, 2, "the bound inside the break (850) gets no cap");
  assert.ok(Math.max(...r.domain) >= 990, `the axis fits the upper bound (${r.domain})`);
});

it("a baseline break's yDomain clamps error bars to the axis, uncapping cut-off bounds", async function () {
  this.timeout(60000);
  const rows = [
    {id: "North", v: 52, lo: 45, hi: 58},
    {id: "South", v: 57, lo: 54, hi: 66},
  ];
  const r = await render("<div id='viz' style='width:500px;height:400px'></div>", drawBroken, [{yDomain: [50, 60]}, rows]);
  const [top, bottom] = [Math.min(...r.range), Math.max(...r.range)];
  for (const e of r.errorBars) {
    const parts = segments(e.d);
    const ys = parts.flatMap(p => [p[1], p[3]]);
    assert.ok(ys.every(y => y >= top - 1 && y <= bottom + 1), `${e.key} stays on the axis (${ys} in ${top}–${bottom})`);
    assert.strictEqual(parts.length, 2, `${e.key} keeps only the cap of the bound it reaches`);
  }
});
