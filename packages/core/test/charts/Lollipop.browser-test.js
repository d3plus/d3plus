/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Lollipop in a real browser: each row draws a stem from the baseline to a
    head at its value, laid out like the bars of a BarChart (bands, dodged
    series, baseline breaks, negative values), on both renderers, with the
    stem hovering, dimming, and clicking as part of its head.
*/

const sales = [
  {year: "2024", quarter: "Q1", v: 10},
  {year: "2024", quarter: "Q2", v: 20},
  {year: "2025", quarter: "Q1", v: 15},
  {year: "2025", quarter: "Q2", v: -5},
];

/** Renders a Lollipop and reports its stems, heads, and axes. */
const draw = ([config, rows]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Lollipop()
      .data(rows)
      .config(config)
      .width(500).height(400)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const nodes = flat(viz._chartScene);
      const row = n => (n.datum && n.datum.data ? n.datum.data : n.datum);
      const numbers = d => d.split(/[^\d.e-]+/).filter(Boolean).map(Number);
      const stems = nodes
        .filter(n => /::stem$/.test(`${n.key}`))
        .map(n => {
          const [x0, y0, x1, y1] = numbers(n.d);
          const t = n.transform || {};
          return {
            key: n.key, type: n.type, shapeType: n.shapeType, row: row(n),
            stroke: n.paint.stroke, strokeWidth: n.paint.strokeWidth,
            from: [x0 + (t.x || 0), y0 + (t.y || 0)], to: [x1 + (t.x || 0), y1 + (t.y || 0)],
          };
        });
      const heads = nodes
        .filter(n => n.type === "circle" && n.shapeType === "Circle" && n.datum)
        .map(n => ({key: n.key, row: row(n), x: n.transform.x, y: n.transform.y, r: n.r, fill: n.paint.fill}));
      const discrete = viz.schema.discrete;
      const value = discrete === "y" ? viz._xFunc : viz._yFunc;
      const category = discrete === "y" ? viz._yFunc : viz._xFunc;
      resolve({
        stems,
        heads,
        hits: nodes.filter(n => /::stem::hit$/.test(`${n.key}`)).length,
        rects: nodes.filter(n => n.type === "rect" && n.shapeType === "Bar").length,
        labels: nodes.filter(n => n.type === "text" && n.datum && row(n) && row(n).v !== undefined).length,
        px: rows.map((d, i) => ({
          value: value(discrete === "y" ? viz._x(d, i) : viz._y(d, i)),
          category: category(discrete === "y" ? viz._y(d, i) : viz._x(d, i)),
        })),
        zero: value(0),
        domain: (discrete === "y" ? viz._xAxis : viz._yAxis)._d3Scale.domain(),
        breaks: !!(discrete === "y" ? viz._xAxis : viz._yAxis)._baselineBreak,
        legend: flat(viz.toScene().root.children)
          .filter(n => n.interactionGroup === "legend" && n.shapeType && !/::hit$/.test(`${n.key}`))
          .map(n => n.type),
      });
    });
  });

const run = (config, rows = sales) =>
  render("<div id='viz' style='width:500px;height:400px'></div>", draw, [config, rows]);

const near = (a, b, msg, tol = 0.51) => assert.ok(Math.abs(a - b) < tol, `${msg}: ${a} vs ${b}`);

it("Lollipop — a stem from the baseline to a head at each value, no bars", async function () {
  const rows = [
    {id: "a", v: 10},
    {id: "b", v: 25},
    {id: "c", v: 5},
  ];
  const r = await run({groupBy: "id", x: "id", y: "v"}, rows);
  assert.strictEqual(r.rects, 0, "the bar layout is not drawn");
  assert.strictEqual(r.stems.length, 3);
  assert.strictEqual(r.heads.length, 3);
  assert.strictEqual(r.hits, 3, "each stem has a hover target");
  r.heads.forEach(h => {
    const stem = r.stems.find(s => s.key === `${h.key}::stem`);
    assert.ok(stem, `stem for ${h.key}`);
    assert.strictEqual(stem.row, h.row, "the stem shares its head's row");
    assert.strictEqual(stem.shapeType, "Circle", "and its shape type");
    assert.strictEqual(stem.stroke, h.fill, "and its color");
    near(stem.to[0], h.x, "stem ends under the head (x)");
    near(stem.to[1], h.y, "stem ends at the head (y)");
    near(stem.from[0], h.x, "stems are vertical");
    near(stem.from[1], r.zero, "stems start at the baseline");
    assert.strictEqual(h.r, 5, "heads default to sizeMin");
  });
  rows.forEach((d, i) => {
    const head = r.heads.find(h => h.row.id === d.id);
    near(head.y, r.px[i].value, `${d.id} head sits at its value`);
    near(head.x, r.px[i].category, `${d.id} head sits on its category`);
  });
  assert.deepStrictEqual(r.legend, [], "no legend when entries repeat the category axis");
  assert.ok(r.domain[0] > 25, "the value axis makes room for the top head");
});

it("Lollipop — series sharing a category dodge like grouped bars", async function () {
  const r = await run({groupBy: "year", x: "quarter", y: "v"});
  const at = (year, quarter) => r.heads.find(h => h.row.year === year && h.row.quarter === quarter);
  const q1 = [at("2024", "Q1"), at("2025", "Q1")];
  assert.ok(q1[0].x < q1[1].x, "the first series sits left of the second");
  const center = (q1[0].x + q1[1].x) / 2;
  const band = r.px[0].category;
  near(center, band, "the pair centers on its category");
  assert.deepStrictEqual(r.legend, ["circle", "circle"], "a legend of dots, one per series");
  const negative = at("2025", "Q2");
  assert.ok(negative.y > r.zero, "a negative value hangs below the baseline");
  const stem = r.stems.find(s => s.row === negative.row);
  near(stem.from[1], r.zero, "its stem still starts at the baseline");
});

it("Lollipop — horizontal stems with discrete: \"y\"", async function () {
  const rows = [
    {id: "a", x: 10, y: "A"},
    {id: "b", x: 30, y: "B"},
  ];
  const r = await run({groupBy: "id", discrete: "y", x: "x", y: "y"}, rows);
  r.stems.forEach(s => {
    near(s.from[1], s.to[1], "stems are horizontal");
    near(s.from[0], r.zero, "from the baseline");
  });
  const b = r.heads.find(h => h.row.id === "b");
  near(b.x, r.px[1].value, "the head sits at its value");
  near(b.y, r.px[1].category, "centered on its category");
});

it("Lollipop — a broken value axis starts the stems at the break", async function () {
  const rows = [
    {id: "a", v: 1010},
    {id: "b", v: 1020},
  ];
  const r = await run({groupBy: "id", x: "id", y: "v", yDomain: [1000, 1025]}, rows);
  assert.ok(r.breaks, "the axis breaks above zero");
  r.stems.forEach(s => assert.ok(Number.isFinite(s.from[1]) && s.from[1] > s.to[1], "stems run up from the axis"));
});

it("Lollipop — stems and heads take shapeConfig.Line and shapeConfig.Circle", async function () {
  const rows = [{id: "a", v: 10}];
  const r = await run({
    groupBy: "id", x: "id", y: "v",
    shapeConfig: {Circle: {r: 9, fill: "#123456"}, Line: {stroke: "#abcdef", strokeWidth: 4}},
  }, rows);
  assert.strictEqual(r.heads[0].r, 9);
  assert.strictEqual(r.heads[0].fill, "#123456");
  assert.strictEqual(r.stems[0].stroke, "#abcdef");
  assert.strictEqual(r.stems[0].strokeWidth, 4);
});

it("Lollipop — a size accessor scales the heads", async function () {
  const rows = [
    {id: "a", v: 10, s: 1},
    {id: "b", v: 20, s: 100},
  ];
  const r = await run({groupBy: "id", x: "id", y: "v", size: "s", sizeMin: 4, sizeMax: 14}, rows);
  const a = r.heads.find(h => h.row.id === "a");
  const b = r.heads.find(h => h.row.id === "b");
  assert.strictEqual(a.r, 4);
  assert.strictEqual(b.r, 14);
});

it("Lollipop — confidence keeps the bars' error bars", async function () {
  const rows = [{id: "a", v: 10, lo: 8, hi: 12}];
  const out = await render("<div id='viz' style='width:500px;height:400px'></div>", rows => new Promise(resolve => {
    const viz = new window.d3plus.Lollipop().data(rows).groupBy("id").x("id").y("v")
      .confidence(["lo", "hi"]).width(500).height(400).duration(0).select("#viz");
    viz.render(() => {
      const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const keys = flat(viz._chartScene).map(n => `${n.key}`);
      resolve({
        error: keys.indexOf("a_a::confidence"),
        stem: keys.indexOf("a_a::stem"),
        head: keys.indexOf("a_a"),
      });
    });
  }), rows);
  assert.ok(out.error > -1, "the error bar is drawn");
  assert.ok(out.stem < out.error && out.error < out.head, "between the stem and the head");
});

it("Lollipop — draws as small multiples", async function () {
  const rows = ["East", "West"].flatMap(region => sales.map(d => ({...d, region})));
  const out = await render("<div id='viz' style='width:600px;height:400px'></div>", rows => new Promise(resolve => {
    const viz = new window.d3plus.Lollipop().data(rows).groupBy("year").x("quarter").y("v")
      .facet("region").width(600).height(400).duration(0).select("#viz");
    viz.render(() => {
      const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const nodes = flat(viz._chartScene);
      resolve({
        stems: nodes.filter(n => /::stem$/.test(`${n.key}`)).length,
        heads: nodes.filter(n => n.type === "circle" && n.shapeType === "Circle" && n.datum).length,
        nan: nodes.filter(n => JSON.stringify({d: n.d, t: n.transform}).includes("NaN")).length,
      });
    });
  }), rows);
  assert.strictEqual(out.stems, 8);
  assert.strictEqual(out.heads, 8);
  assert.strictEqual(out.nan, 0);
});

/**
    Hovers (and clicks) the middle of one stem, through the renderer's real
    pointer path, with the shared tooltip off.
*/
const hover = ([renderer]) =>
  new Promise(resolve => {
    const clicks = [];
    const viz = new window.d3plus.Lollipop()
      .data([
        {id: "Alpha", v: 10},
        {id: "Beta", v: 20},
        {id: "Gamma", v: 15},
      ])
      .groupBy("id").x("id").y("v")
      .tooltipShared(false)
      .renderer(renderer)
      .on("click.Circle", d => clicks.push(d.id))
      .width(500).height(400).duration(0)
      .select("#viz");
    viz.render(() => {
      const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const nodes = flat(viz._chartScene);
      const head = nodes.find(n => n.key === "Beta_Beta");
      const stem = nodes.find(n => n.key === "Beta_Beta::stem");
      const ys = stem.d.split(/[^\d.e-]+/).filter(Boolean).map(Number);
      const c = viz._chartTransform;
      const x = head.transform.x;
      const y = stem.transform.y + (ys[1] + ys[3]) / 2;
      const host = renderer === "canvas"
        ? document.querySelector("#viz canvas.d3plus-render-canvas")
        : document.querySelector("#viz svg.d3plus-render-svg [data-key='Beta_Beta::stem::hit']");
      const box = (renderer === "canvas" ? host : host.ownerSVGElement).getBoundingClientRect();
      const at = {clientX: box.left + c.x + x, clientY: box.top + c.y + y, bubbles: true};
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
        host.dispatchEvent(new MouseEvent("click", at));
        resolve({
          title: tip ? tip.querySelector(".d3plus-tooltip-title").textContent : null,
          swatch: swatch ? swatch.style.backgroundColor : null,
          round: swatch ? swatch.style.borderRadius : null,
          headFill: head.paint.fill,
          opacity,
          clicks,
        });
      }, 50));
    });
  });

const toRgb = hex => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

for (const renderer of ["svg", "canvas"]) {
  it(`Lollipop ${renderer} — a stem hovers, dims, and clicks as part of its head`, async function () {
    const r = await render("<div id='viz' style='width:500px;height:400px'></div>", hover, [renderer]);
    assert.ok(r.title && r.title.includes("Beta"), `tooltip titled by the row (${r.title})`);
    assert.strictEqual(r.swatch, toRgb(r.headFill), "the swatch is the head's color");
    assert.strictEqual(r.round, "50%", "and a dot");
    assert.strictEqual(r.opacity["Beta_Beta"], 1, "the hovered head stays bright");
    assert.strictEqual(r.opacity["Beta_Beta::stem"], 1, "so does its stem");
    assert.ok(r.opacity["Alpha_Alpha"] < 1, "other heads dim");
    assert.ok(r.opacity["Alpha_Alpha::stem"] < 1, "and their stems");
    assert.deepStrictEqual(r.clicks, ["Beta"], "click.Circle fires on the stem");
  });
}

it("Lollipop — the shared tooltip lists every series at a category", async function () {
  const out = await render("<div id='viz' style='width:500px;height:400px'></div>", rows => new Promise(resolve => {
    const viz = new window.d3plus.Lollipop().data(rows).groupBy("year").x("quarter").y("v")
      .width(500).height(400).duration(0).select("#viz");
    viz.render(() => {
      const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const head = flat(viz._chartScene).find(n => n.type === "circle" && n.datum && n.datum.data.quarter === "Q1");
      const c = viz._chartTransform;
      const host = document.querySelector("#viz svg.d3plus-render-svg");
      const box = host.getBoundingClientRect();
      host.dispatchEvent(new MouseEvent("mousemove", {clientX: box.left + c.x + head.transform.x, clientY: box.top + c.y + head.transform.y + 20, bubbles: true}));
      requestAnimationFrame(() => setTimeout(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        resolve(tip ? tip.textContent : null);
      }, 50));
    });
  }), sales);
  assert.ok(out && out.includes("2024") && out.includes("2025"), `both series listed (${out})`);
});
