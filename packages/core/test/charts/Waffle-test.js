import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

// The Viz render pipeline awaits browser layout that never resolves under
// jsdom, so the chart is rendered in a headless browser instead.
after(async () => {
  await closeBrowser();
});

const data = [
  {source: "Gas", region: "East", value: 43},
  {source: "Nuclear", region: "East", value: 19},
  {source: "Coal", region: "East", value: 16},
  {source: "Wind", region: "East", value: 10},
  {source: "Hydro", region: "East", value: 6},
  {source: "Solar", region: "East", value: 4},
  {source: "Other", region: "East", value: 2},
  {source: "Gas", region: "West", value: 30},
  {source: "Nuclear", region: "West", value: 10},
  {source: "Coal", region: "West", value: 5},
  {source: "Wind", region: "West", value: 20},
  {source: "Hydro", region: "West", value: 25},
  {source: "Solar", region: "West", value: 10},
];

/** In-page helpers shared by every test: build + render a Waffle, and route a scene event at a node. */
const setup = `
  window.build = (opts = {}) => new Promise(resolve => {
    const chart = new window.d3plus.Waffle()
      .select("#viz")
      .data(window.DATA.filter(d => opts.facet || d.region === "East").map(d => ({...d})))
      .groupBy("source")
      .sum("value")
      .duration(0)
      .width(600).height(400);
    if (opts.renderer) chart.renderer(opts.renderer);
    if (opts.config) chart.config(opts.config);
    chart.render(() => resolve(chart));
  });
  window.cells = chart => {
    const out = [];
    const walk = nodes => nodes.forEach(n => {
      if (n.type === "group") walk(n.children || []);
      else if ((n.type === "rect" || n.type === "circle") && String(n.key).includes("waffle-")) out.push(n);
    });
    walk(chart._chartScene);
    return out;
  };
  window.route = (chart, type, node) => chart._routeSceneEvent({
    type,
    point: [1, 1],
    pick: {node, datum: node.datum, index: node.index},
    nativeEvent: {stopPropagation() {}, clientX: 10, clientY: 10},
  });
  window.wait = ms => new Promise(resolve => setTimeout(resolve, ms));
`;

const page = (fn, arg) =>
  render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    new Function("arg", `window.DATA = arg.data; ${setup}; return (${fn})(arg.arg);`),
    {data, arg},
  );

it("Waffle: draws 100 cells, one per percent, with a legend", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build();
    const cells = window.cells(chart);
    const counts = {};
    for (const c of cells) counts[c.datum.source] = (counts[c.datum.source] || 0) + 1;
    const xs = [...new Set(cells.map(c => c.x))].length;
    const ys = [...new Set(cells.map(c => c.y))].length;
    return {
      cells: cells.length,
      svg: document.querySelectorAll("#viz svg.d3plus-render-svg rect[data-key^='waffle-']").length,
      counts,
      xs,
      ys,
      square: cells.every(c => c.width === c.height),
      legend: chart._legendClass.data().map(d => d.source),
    };
  });
  assert.strictEqual(out.cells, 100);
  assert.strictEqual(out.svg, 100, "every cell reached the SVG");
  assert.deepStrictEqual(out.counts, {Gas: 43, Nuclear: 19, Coal: 16, Wind: 10, Hydro: 6, Solar: 4, Other: 2});
  assert.deepStrictEqual([out.xs, out.ys], [10, 10]);
  assert.ok(out.square, "square cells");
  assert.deepStrictEqual(out.legend, ["Gas", "Nuclear", "Coal", "Wind", "Hydro", "Solar", "Other"]);
});

it("Waffle: hovering a cell highlights its whole category, with value and share in the tooltip", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build();
    const target = window.cells(chart).find(c => c.datum.source === "Wind");
    window.route(chart, "mouseenter", target);
    window.route(chart, "mousemove", target);
    await window.wait(50);
    const bright = window.cells(chart).filter(n => chart._hover(n.datum, n.index));
    const tooltip = document.querySelector(".d3plus-tooltip");
    return {
      bright: bright.length,
      sources: [...new Set(bright.map(n => n.datum.source))],
      tooltip: tooltip ? tooltip.textContent : "",
    };
  });
  assert.strictEqual(out.bright, 10, "all ten Wind cells");
  assert.deepStrictEqual(out.sources, ["Wind"]);
  assert.ok(out.tooltip.includes("Wind"), out.tooltip);
  assert.ok(/Value\s*10/.test(out.tooltip), out.tooltip);
  assert.ok(/Share\s*10%/.test(out.tooltip), out.tooltip);
});

it("Waffle: legend tooltips show value and share", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build();
    const row = chart._legendClass.data().find(d => d.source === "Nuclear");
    const tbody = chart.schema.legendTooltip.tbody;
    return {
      labels: tbody.map(r => r[0]()),
      cells: tbody.map(r => r[1](row, 0, row)),
    };
  });
  assert.deepStrictEqual(out.labels, ["Value", "Share"]);
  assert.deepStrictEqual(out.cells, ["19", "19%"]);
});

it("Waffle: one cell per unit grows the grid along the fill direction", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const byRow = await window.build({config: {unit: 4, columns: 5}});
    const rowGrid = byRow.ctx.waffleGrid;
    const rowCells = window.cells(byRow).length;
    const byColumn = await window.build({config: {unit: 4, rows: 3, fillDirection: "column", fillStart: "bottom-left"}});
    const first = window.cells(byColumn)[0];
    const maxY = Math.max(...window.cells(byColumn).map(c => c.y));
    return {rowGrid, rowCells, columnGrid: byColumn.ctx.waffleGrid, firstAtBottom: first.y === maxY};
  });
  assert.strictEqual(out.rowCells, 25, "100 / 4");
  assert.deepStrictEqual(out.rowGrid, {rows: 5, columns: 5});
  assert.deepStrictEqual(out.columnGrid, {rows: 3, columns: 9});
  assert.ok(out.firstAtBottom, "the first cell sits in the bottom row");
});

it("Waffle: draws rounded and circular cells, and icons in pictogram mode", async function () {
  this.timeout(60000);
  const icon = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 2'><circle cx='1' cy='1' r='1'/></svg>");
  const out = await page(async src => {
    const rounded = await window.build({config: {cellShape: "rounded"}});
    const rx = window.cells(rounded)[0].rx;
    const svgRx = document.querySelector("#viz rect[data-key^='waffle-']").getAttribute("rx");
    const circles = await window.build({config: {cellShape: "circle"}});
    const circleCount = window.cells(circles).filter(n => n.type === "circle").length;
    const icons = await window.build({config: {icon: src}});
    return {
      rx,
      svgRx,
      circleCount,
      images: document.querySelectorAll("#viz image").length,
      transparent: window.cells(icons).every(n => n.paint.fill === "transparent"),
    };
  }, icon);
  assert.ok(out.rx > 0);
  assert.strictEqual(Number(out.svgRx), out.rx);
  assert.strictEqual(out.circleCount, 100);
  assert.strictEqual(out.images, 100, "one icon per cell");
  assert.ok(out.transparent, "icons replace the fill");
});

it("Waffle: facet draws one waffle per panel", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({facet: true, config: {facet: "region"}});
    const cells = window.cells(chart);
    return {
      cells: cells.length,
      west: cells.filter(c => c.datum.region === "West" && c.datum.source === "Hydro").length,
    };
  });
  assert.strictEqual(out.cells, 200, "two panels of 100");
  assert.strictEqual(out.west, 25, "the West panel's own shares");
});

it("Waffle: renders on Canvas and hit-tests a real hover", async function () {
  this.timeout(60000);
  const out = await page(async () => {
    const chart = await window.build({renderer: "canvas"});
    const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
    const target = window.cells(chart).find(c => c.datum.source === "Coal");
    const t = chart._chartTransform;
    const rect = canvas.getBoundingClientRect();
    const clientX = rect.left + t.x + target.x + target.width / 2;
    const clientY = rect.top + t.y + target.y + target.height / 2;
    canvas.dispatchEvent(new MouseEvent("mousemove", {clientX, clientY, bubbles: true}));
    await window.wait(150);
    return {
      canvas: Boolean(canvas),
      svgCells: document.querySelectorAll("#viz rect[data-key^='waffle-']").length,
      hovered: typeof chart._hover === "function"
        ? window.cells(chart).filter(n => chart._hover(n.datum, n.index)).length
        : 0,
    };
  });
  assert.ok(out.canvas, "painted to a canvas");
  assert.strictEqual(out.svgCells, 0, "no SVG cells");
  assert.strictEqual(out.hovered, 16, "every Coal cell");
});
