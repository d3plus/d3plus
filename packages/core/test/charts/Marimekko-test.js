/* global requestAnimationFrame, setTimeout */
import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Marimekko draws one bar per category, as wide as the category's measure
    (by default its total), laid end to end, with each bar's groupBy segments
    stacked to 100% of its height. BarChart gains the same variable widths
    through `barWidth`.
*/

after(async () => {
  await closeBrowser();
});

// Category A totals 30 (a 10, b 20); B totals 10 (a 5, b 5).
const data = [
  {cat: "A", g: "a", v: 10, size: 1},
  {cat: "A", g: "b", v: 20, size: 1},
  {cat: "B", g: "a", v: 5, size: 3},
  {cat: "B", g: "b", v: 5, size: 3},
];

/** Renders a chart into a fresh element and reads back its bars, axes, and scene. */
const draw = ([kind, config, rows, hoverKey]) =>
  new Promise(resolve => {
    // Functions can't cross into the page; `maxAggs` names an aggs key to merge with max.
    if (config.maxAggs) config = {...config, aggs: {[config.maxAggs]: (a, c) => Math.max(...a.map(c))}};
    delete config.maxAggs;
    const el = document.createElement("div");
    document.body.appendChild(el);
    const viz = new window.d3plus[kind]()
      .select(el)
      .data(rows)
      .groupBy("g")
      .x("cat")
      .y("v")
      .duration(0)
      .width(800)
      .height(500)
      .config(config);
    viz.render(() => {
      const bars = [...el.querySelectorAll("g[data-key='plot-zoom-content'] rect.d3plus-render-rect")]
        .filter(r => /^[ab]_/.test(r.getAttribute("data-key") || ""))
        .map(r => {
          const b = r.getBoundingClientRect();
          return {key: r.getAttribute("data-key"), left: b.left, right: b.right, top: b.top, bottom: b.bottom};
        });
      const text = selector =>
        [...el.querySelectorAll(`${selector} text`)].map(t => t.textContent).filter(Boolean);
      const sceneRects = [];
      const walk = node => {
        if (!node) return;
        if (node.type === "rect" && node.shapeType === "Bar") sceneRects.push({key: node.key, width: node.width, height: node.height});
        (node.children || []).forEach(walk);
      };
      (viz._chartScene || []).forEach(walk);
      const nan = [...el.querySelectorAll("*")].filter(n =>
        [...n.attributes].some(a => a.value.includes("NaN")),
      ).length;
      const out = {
        bars,
        sceneRects,
        nan,
        canvas: el.querySelectorAll("canvas").length,
        xLabels: text("[data-key$='plot-x-axis']"),
        yLabels: text("[data-key$='plot-y-axis']"),
        spans: viz._barSpans ? viz._barSpans.spans.map(s => [s.value, s.start, s.end]) : null,
      };
      const target = hoverKey && el.querySelector(`[data-key='${hoverKey}']`);
      if (!target) return resolve(out);
      const box = target.getBoundingClientRect();
      target.dispatchEvent(new MouseEvent("mousemove", {
        clientX: box.left + box.width / 2,
        clientY: box.top + box.height / 2,
        bubbles: true,
      }));
      requestAnimationFrame(() => setTimeout(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        out.tooltip = tip
          ? [...tip.querySelectorAll("tbody tr")].map(tr => [...tr.querySelectorAll("td")].map(td => td.textContent))
          : [];
        resolve(out);
      }, 50));
    });
  });

const near = (a, b, tolerance, message) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${message} (${a} vs ${b})`);

/** Each column's [left, right, top, bottom] extent, keyed by its left edge. */
function columns(bars) {
  const out = new Map();
  for (const b of bars) {
    const key = Math.round(b.left);
    const c = out.get(key) || {left: b.left, right: b.right, top: Infinity, bottom: -Infinity, segments: []};
    c.top = Math.min(c.top, b.top);
    c.bottom = Math.max(c.bottom, b.bottom);
    c.segments.push(b);
    out.set(key, c);
  }
  return [...out.values()].sort((a, b) => a.left - b.left);
}

it("Marimekko: bars as wide as their totals, segments stacked to 100%", async function () {
  this.timeout(60000);
  const out = await render("", draw, ["Marimekko", {}, data, "b_A"]);
  assert.strictEqual(out.nan, 0, "no NaN attributes");
  assert.strictEqual(out.bars.length, 4, "one segment per row");
  assert.deepStrictEqual(out.spans, [["A", 0, 30], ["B", 30, 40]]);

  const [a, b] = columns(out.bars);
  const wa = a.right - a.left, wb = b.right - b.left;
  near(wa / wb, 3, 0.15, "width ∝ total");
  near(a.top, b.top, 1, "columns share a top");
  near(a.bottom, b.bottom, 1, "columns share a bottom");
  const heights = a.segments.map(s => s.bottom - s.top).sort((x, y) => x - y);
  near(heights[1] / heights[0], 2, 0.1, "segment height ∝ share");

  assert.deepStrictEqual(out.xLabels, ["A", "B"], "categories labeled");
  assert.ok(out.yLabels.includes("100%") && out.yLabels.includes("0%"), `percent ticks: ${out.yLabels}`);

  const rows = Object.fromEntries(out.tooltip);
  assert.strictEqual(rows.cat, "A");
  assert.strictEqual(rows.v, "20");
  assert.strictEqual(rows["Bar Total"], "30 (75%)");
  assert.ok(/^66\.7/.test(rows.Share), `share row: ${rows.Share}`);
});

it("Marimekko: hovering a segment's label shows the segment's tooltip", async function () {
  this.timeout(60000);
  const out = await render("", draw, ["Marimekko", {}, data, "b_A_0"]);
  const rows = Object.fromEntries(out.tooltip);
  assert.strictEqual(rows.cat, "A");
  assert.strictEqual(rows["Bar Total"], "30 (75%)");
});

it("Marimekko: the series largest overall stacks lowest in every bar", async function () {
  this.timeout(60000);
  const out = await render("", draw, ["Marimekko", {}, data]);
  const bottom = key => out.bars.find(b => b.key === key).bottom;
  assert.ok(bottom("b_A") > bottom("a_A"), "b (25 overall) below a in A");
  assert.ok(bottom("b_B") > bottom("a_B"), "b below a in B, though tied there");
});

it("Marimekko: barWidth measures, absolute heights, and barWidth(false)", async function () {
  this.timeout(60000);
  const measured = await render("", draw, ["Marimekko", {barWidth: "size", maxAggs: "size"}, data, "a_B"]);
  const [a, b] = columns(measured.bars);
  near((b.right - b.left) / (a.right - a.left), 3, 0.15, "width ∝ barWidth");
  assert.strictEqual(Object.fromEntries(measured.tooltip).size, "3 (75%)");

  const absolute = await render("", draw, ["Marimekko", {stackOffset: "none"}, data]);
  const [aa, ab] = columns(absolute.bars);
  near((aa.bottom - aa.top) / (ab.bottom - ab.top), 3, 0.1, "height ∝ total");
  assert.ok(!absolute.yLabels.some(l => l.includes("%")), "value ticks");

  const plain = await render("", draw, ["Marimekko", {barWidth: false}, data]);
  const [pa, pb] = columns(plain.bars);
  near(pa.right - pa.left, pb.right - pb.left, 1, "equal widths without barWidth");
  assert.strictEqual(plain.spans, null);
});

it("Marimekko: horizontal bars span the y axis", async function () {
  this.timeout(60000);
  const out = await render("", draw, ["Marimekko", {discrete: "y", x: "v", y: "cat"}, data]);
  assert.strictEqual(out.nan, 0);
  const rows = new Map();
  for (const bar of out.bars) {
    const key = Math.round(bar.top);
    rows.set(key, Math.max(rows.get(key) || 0, bar.bottom - bar.top));
  }
  const sizes = [...rows.values()].sort((x, y) => x - y);
  assert.strictEqual(sizes.length, 2);
  near(sizes[1] / sizes[0], 3, 0.15, "height ∝ total");
  assert.ok(out.xLabels.includes("100%"), "percent value axis");
  assert.deepStrictEqual(out.yLabels.slice().sort(), ["A", "B"]);
});

it("BarChart: barWidth makes each bar as wide as its measure", async function () {
  this.timeout(60000);
  const rows = [
    {g: "a", cat: "A", v: 4, pop: 100},
    {g: "b", cat: "B", v: 2, pop: 300},
  ];
  const out = await render("", draw, ["BarChart", {barWidth: "pop"}, rows, "b_B"]);
  const [a, b] = columns(out.bars);
  near((b.right - b.left) / (a.right - a.left), 3, 0.15, "width ∝ pop");
  near(b.left - a.right, 0, 6, "bars sit end to end");
  assert.deepStrictEqual(out.xLabels, ["A", "B"]);
  assert.strictEqual(Object.fromEntries(out.tooltip).pop, "300 (75%)");
});

it("Marimekko: draws on the Canvas renderer", async function () {
  this.timeout(60000);
  const out = await render("", draw, ["Marimekko", {renderer: "canvas"}, data]);
  assert.ok(out.canvas >= 1, "a canvas surface");
  assert.strictEqual(out.sceneRects.length, 4);
  const width = key => out.sceneRects.find(r => r.key.startsWith(key)).width;
  near(width("a_A") / width("a_B"), 3, 0.15, "width ∝ total");
  assert.ok(out.sceneRects.every(r => Number.isFinite(r.width) && Number.isFinite(r.height)));
});

it("Marimekko: facet draws one mosaic per panel", async function () {
  this.timeout(60000);
  const rows = data.flatMap(d => [{...d, panel: "P1"}, {...d, panel: "P2", v: d.v * 2}]);
  const out = await render("", draw, ["Marimekko", {facet: "panel"}, rows]);
  assert.strictEqual(out.nan, 0);
  assert.ok(out.sceneRects.length >= 8, `segments in both panels (${out.sceneRects.length})`);
  // Each panel labels its bars by category, not by cumulative width.
  const xLabels = [...out.xLabels].sort();
  assert.deepStrictEqual(xLabels, ["A", "A", "B", "B"], `panel category labels: ${out.xLabels}`);
});

// Two unstacked series per category; A is three times as wide as B.
const series = [
  {cat: "A", g: "a", v: 4, size: 3},
  {cat: "A", g: "b", v: 2, size: 3},
  {cat: "B", g: "a", v: 3, size: 1},
  {cat: "B", g: "b", v: 5, size: 1},
];

it("BarChart: unstacked series split each variable-width bar side by side", async function () {
  this.timeout(60000);
  const out = await render("", draw, ["BarChart", {barWidth: "size", maxAggs: "size", barPadding: 4}, series]);
  assert.strictEqual(out.nan, 0);
  const bar = key => out.bars.find(b => b.key === key);
  const width = b => b.right - b.left;
  const [aA, bA, aB, bB] = ["a_A", "b_A", "a_B", "b_B"].map(bar);
  // barPadding spaces the series as it does grouped bars: (2 * 4 + 1) / (2 - 1).
  near(bA.left - aA.right, 9, 1.5, "series sit side by side, barPadding apart");
  near(bB.left - aB.right, 9, 1.5, "in every bar");
  near(width(aA), width(bA), 0.5, "series share a bar equally");
  near((bA.right - aA.left) / (bB.right - aB.left), 3, 0.2, "each pair fills its bar's width");
  assert.ok(bA.right < aB.left, "bars stay within their spans");

  const stacked = await render("", draw, ["BarChart", {barWidth: "size", maxAggs: "size", stacked: true}, series]);
  const s = key => stacked.bars.find(b => b.key === key);
  near(s("a_A").left, s("b_A").left, 0.5, "stacked segments still span the whole bar");

  const canvas = await render("", draw, ["BarChart", {barWidth: "size", maxAggs: "size", barPadding: 4, renderer: "canvas"}, series]);
  const rect = key => canvas.sceneRects.find(r => r.key === key);
  near(rect("a_A").width, rect("b_A").width, 0.5, "canvas: series share a bar equally");
  near(rect("a_A").width / rect("a_B").width, 3, 0.25, "canvas: widths follow each bar's measure");
});
