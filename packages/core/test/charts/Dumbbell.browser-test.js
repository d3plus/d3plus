/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {near} from "~test/helpers.js";

/**
    Dumbbell in a real browser: a dot per (category, series) row and a
    connector from each category's smallest to its largest value, horizontal
    or vertical, sorted by gap, on both renderers, with the shared tooltip
    listing every series of the hovered category.
*/

const life = [
  {country: "Japan", year: "2000", v: 81},
  {country: "Japan", year: "2020", v: 84},
  {country: "Ethiopia", year: "2000", v: 51},
  {country: "Ethiopia", year: "2020", v: 65},
  {country: "Brazil", year: "2000", v: 70},
  {country: "Brazil", year: "2020", v: 75},
];

/** Renders a Dumbbell and reports its connectors, points, and category order. */
const draw = ([config, rows]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Dumbbell()
      .data(rows)
      .config(config)
      .width(500).height(400)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const nodes = flat(viz._chartScene);
      const numbers = d => d.split(/[^\d.e-]+/).filter(Boolean).map(Number);
      const connectors = nodes
        .filter(n => /::connector/.test(`${n.key}`))
        .map(n => {
          const [x0, y0, x1, y1] = numbers(n.d);
          const t = n.transform || {};
          return {
            key: n.key, interactive: n.interactive, datum: n.datum === undefined ? null : "set",
            stroke: n.paint.stroke, strokeWidth: n.paint.strokeWidth,
            from: [x0 + (t.x || 0), y0 + (t.y || 0)], to: [x1 + (t.x || 0), y1 + (t.y || 0)],
          };
        });
      const points = nodes
        .filter(n => n.type === "circle" && n.shapeType === "Circle" && n.datum)
        .map(n => ({key: n.key, row: n.datum.data, x: n.transform.x, y: n.transform.y, fill: n.paint.fill}));
      const discrete = viz.schema.discrete;
      const axis = discrete === "y" ? viz._yAxis : viz._xAxis;
      const position = c => (discrete === "y" ? viz._yFunc(c) : viz._xFunc(c));
      // Small multiples keep no single category axis.
      const categories = config.facet ? [] : axis._d3Scale.domain().slice().sort((a, b) => position(a) - position(b));
      resolve({connectors, points, categories, nan: nodes.filter(n => JSON.stringify({d: n.d, t: n.transform}).includes("NaN")).length});
    });
  });

const run = (config, rows = life) =>
  render("<div id='viz' style='width:500px;height:400px'></div>", draw, [config, rows]);

it("Dumbbell — a dot per row and a connector between each category's extremes", async function () {
  const r = await run({groupBy: "year", x: "v", y: "country"});
  assert.strictEqual(r.points.length, 6);
  assert.strictEqual(new Set(r.points.map(p => p.key)).size, 6, "each point keyed by its series and category");
  assert.strictEqual(r.connectors.length, 3);
  assert.strictEqual(r.nan, 0);
  r.connectors.forEach(c => {
    assert.strictEqual(c.interactive, false, "connectors take no pointer events");
    assert.strictEqual(c.datum, null, "nor carry a datum of their own");
    assert.strictEqual(c.stroke, "#adb5bd");
    assert.strictEqual(c.strokeWidth, 3);
    const country = c.key.replace("::connector", "");
    const [lo, hi] = r.points.filter(p => p.row.country === country).sort((a, b) => a.x - b.x);
    near(Math.min(c.from[0], c.to[0]), lo.x, 0.51, `${country} connector starts at its low dot`);
    near(Math.max(c.from[0], c.to[0]), hi.x, 0.51, `${country} connector ends at its high dot`);
    near(c.from[1], lo.y, 0.51, "on the category's line");
    near(c.to[1], lo.y, 0.51, "horizontal");
  });
  const years = r.points.filter(p => p.row.country === "Japan").map(p => p.fill);
  assert.notStrictEqual(years[0], years[1], "series are colored apart");
});

it("Dumbbell — gapSort orders the categories by their gap", async function () {
  const top = async order => (await run({groupBy: "year", x: "v", y: "country", gapSort: order})).categories;
  assert.deepStrictEqual(await top("descending"), ["Ethiopia", "Brazil", "Japan"], "widest gap at the top");
  assert.deepStrictEqual(await top("ascending"), ["Japan", "Brazil", "Ethiopia"], "narrowest gap at the top");
  const vertical = await run({groupBy: "year", discrete: "x", x: "country", y: "v", gapSort: "descending"});
  assert.deepStrictEqual(vertical.categories, ["Ethiopia", "Brazil", "Japan"], "widest gap at the left");
});

it("Dumbbell — vertical, with three points per category", async function () {
  const rows = ["Jan", "Feb"].flatMap((month, i) => [
    {month, stat: "Low", t: -2 + i},
    {month, stat: "Mean", t: 3 + i},
    {month, stat: "High", t: 8 + i},
  ]);
  const r = await run({groupBy: "stat", discrete: "x", x: "month", y: "t"}, rows);
  assert.strictEqual(r.points.length, 6);
  assert.strictEqual(r.connectors.length, 2, "one connector per category");
  r.connectors.forEach(c => {
    const month = c.key.replace("::connector", "");
    const ys = r.points.filter(p => p.row.month === month).map(p => p.y);
    near(c.from[0], c.to[0], 0.51, "vertical");
    near(Math.min(c.from[1], c.to[1]), Math.min(...ys), 0.51, "reaches the top dot");
    near(Math.max(c.from[1], c.to[1]), Math.max(...ys), 0.51, "and the bottom dot");
  });
});

it("Dumbbell — connectors take shapeConfig.Line", async function () {
  const r = await run({groupBy: "year", x: "v", y: "country", shapeConfig: {Circle: {r: 8}, Line: {stroke: "#123456", strokeWidth: 6}}});
  assert.ok(r.connectors.every(c => c.stroke === "#123456" && c.strokeWidth === 6));
});

it("Dumbbell — draws as small multiples", async function () {
  const rows = ["East", "West"].flatMap(region => life.map(d => ({...d, region})));
  const r = await run({groupBy: "year", x: "v", y: "country", facet: "region", gapSort: "descending"}, rows);
  assert.strictEqual(r.points.length, 12);
  assert.strictEqual(r.connectors.length, 6);
  assert.strictEqual(r.nan, 0);
});

/** Hovers just beside one dot through the renderer's real pointer path. */
const hover = ([renderer, rows]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Dumbbell()
      .data(rows)
      .groupBy("year").x("v").y("country")
      .renderer(renderer)
      .width(500).height(400).duration(0)
      .select("#viz");
    viz.render(() => {
      const flat = nodes => nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
      const nodes = flat(viz._chartScene);
      const dot = nodes.find(n => n.type === "circle" && n.datum && n.datum.data.country === "Ethiopia");
      const c = viz._chartTransform;
      const host = renderer === "canvas"
        ? document.querySelector("#viz canvas.d3plus-render-canvas")
        : document.querySelector("#viz svg.d3plus-render-svg");
      const box = host.getBoundingClientRect();
      const at = {clientX: box.left + c.x + dot.transform.x + 20, clientY: box.top + c.y + dot.transform.y, bubbles: true};
      host.dispatchEvent(new MouseEvent("mousemove", at));
      requestAnimationFrame(() => setTimeout(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        resolve(tip ? tip.textContent : null);
      }, 50));
    });
  });

for (const renderer of ["svg", "canvas"]) {
  it(`Dumbbell ${renderer} — the shared tooltip lists the category's series`, async function () {
    const text = await render("<div id='viz' style='width:500px;height:400px'></div>", hover, [renderer, life]);
    assert.ok(text && text.includes("Ethiopia"), `titled by the category (${text})`);
    assert.ok(text.includes("2000") && text.includes("2020"), "with a row per series");
  });
}
