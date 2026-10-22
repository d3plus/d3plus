/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Lollipop and Dumbbell hover emphasis in a real browser, on both renderers:
    hovering a column, through the plot's snapped hover or directly over a
    mark, keeps that column's stems, heads, and connectors at full opacity
    with an emphasized stroke, and dims every other column's.
*/

const coffee = [
  {country: "Finland", kg: 12},
  {country: "Norway", kg: 9.9},
  {country: "Iceland", kg: 9},
  {country: "Denmark", kg: 8.7},
];

const sales = [
  {quarter: "Q1", year: "2024", sales: 42},
  {quarter: "Q1", year: "2025", sales: 48},
  {quarter: "Q2", year: "2024", sales: 51},
  {quarter: "Q2", year: "2025", sales: 49},
  {quarter: "Q3", year: "2024", sales: 47},
  {quarter: "Q3", year: "2025", sales: 58},
];

const life = [
  {country: "Japan", year: "2000", v: 81},
  {country: "Japan", year: "2021", v: 84},
  {country: "China", year: "2000", v: 71},
  {country: "China", year: "2021", v: 78},
  {country: "India", year: "2000", v: 63},
  {country: "India", year: "2021", v: 67},
];

/**
    Renders `chart`, moves the pointer to `at` (the mean position of the
    `keys` marks, nudged by `dx`/`dy`), dispatched on the mark named by
    `target` (SVG picks from the event target; `null` is the plot's hover
    surface), and reports each mark's painted opacity and stroke width next
    to its stroke width before the hover.
*/
const hover = ([chart, config, renderer, at, target]) =>
  new Promise(resolve => {
    const viz = new window.d3plus[chart]()
      .config(config)
      .renderer(renderer)
      .width(500)
      .height(400)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const body = document.querySelector("#viz [data-key='viz-chart-body']");
      let host = body
        ? body.ownerSVGElement
        : document.querySelector("#viz canvas.d3plus-render-canvas");
      while (host.ownerSVGElement) host = host.ownerSVGElement;
      const box = host.getBoundingClientRect();
      const placed = {};
      const walk = (n, x, y) => {
        const t = n.transform || {};
        const nx = x + (t.x || 0),
          ny = y + (t.y || 0);
        if (n.key !== undefined)
          placed[n.key] = {node: n, x: nx + (n.cx || 0), y: ny + (n.cy || 0)};
        (n.children || []).forEach(c => walk(c, nx, ny));
      };
      walk(viz._paintedScene.root, 0, 0);
      const base = Object.fromEntries(
        Object.entries(placed).map(([k, p]) => [
          k,
          p.node.paint && p.node.paint.strokeWidth,
        ]),
      );
      const mean = axis =>
        at.keys.reduce((s, k) => s + placed[k][axis], 0) / at.keys.length;
      const point = {
        clientX: box.left + mean("x") + (at.dx || 0),
        clientY: box.top + mean("y") + (at.dy || 0),
        bubbles: true,
      };
      const el =
        renderer === "canvas"
          ? host
          : host.querySelector(
              `[data-key='${target || "plot-hover-surface"}']`,
            );
      el.dispatchEvent(new MouseEvent("mousemove", point));
      requestAnimationFrame(() =>
        setTimeout(() => {
          const marks = {};
          const read = n => {
            if (
              n.key !== undefined &&
              /(_|::)/.test(`${n.key}`) &&
              !/::hit$/.test(`${n.key}`)
            ) {
              const paint = n.paint || {};
              marks[n.key] = {
                opacity: typeof paint.opacity === "number" ? paint.opacity : 1,
                strokeWidth: paint.strokeWidth,
                base: base[n.key],
              };
            }
            (n.children || []).forEach(read);
          };
          read(viz._paintedScene.root);
          resolve({marks, hovered: typeof viz._hover === "function"});
        }, 50),
      );
    });
  });

const run = (chart, config, renderer, at, target = null) =>
  render("<div id='viz' style='width:500px;height:400px'></div>", hover, [
    chart,
    config,
    renderer,
    at,
    target,
  ]);

/** Asserts `keys` stay bright with an emphasized stroke. */
function bright(r, keys) {
  assert.ok(r.hovered, "a hover is set");
  keys.forEach(k => {
    const m = r.marks[k];
    assert.ok(m, `${k} is drawn`);
    assert.strictEqual(m.opacity, 1, `${k} stays bright`);
    assert.ok(
      m.strokeWidth > (m.base || 0),
      `${k} is emphasized (${m.base} -> ${m.strokeWidth})`,
    );
  });
}

/** Asserts `keys` dim. */
function dim(r, keys) {
  keys.forEach(k => {
    const m = r.marks[k];
    assert.ok(m, `${k} is drawn`);
    assert.ok(m.opacity < 1, `${k} dims (${m.opacity})`);
  });
}

const vertical = {data: coffee, groupBy: "country", x: "country", y: "kg"};
const grouped = {data: sales, groupBy: "year", x: "quarter", y: "sales"};
const dumbbell = {data: life, groupBy: "year", x: "v", y: "country"};

const lollipop = id => [`${id}_${id}`, `${id}_${id}::stem`];
const others = ["Finland", "Norway", "Denmark"].flatMap(lollipop);
const quarter = q =>
  ["2024", "2025"].flatMap(y => [`${y}_${q}`, `${y}_${q}::stem`]);
const country = c => [`2000_${c}`, `2021_${c}`, `${c}::connector`];

for (const renderer of ["svg", "canvas"]) {
  it(`Lollipop ${renderer} — the snapped hover beside a lollipop highlights it`, async function () {
    const r = await run("Lollipop", vertical, renderer, {
      keys: ["Iceland_Iceland"],
      dx: 14,
      dy: -20,
    });
    bright(r, lollipop("Iceland"));
    dim(r, others);
  });

  it(`Lollipop ${renderer} — hovering a head highlights its lollipop`, async function () {
    const r = await run(
      "Lollipop",
      vertical,
      renderer,
      {keys: ["Iceland_Iceland"]},
      "Iceland_Iceland",
    );
    bright(r, lollipop("Iceland"));
    dim(r, others);
  });

  it(`Lollipop ${renderer} — hovering a stem highlights its lollipop`, async function () {
    const r = await run(
      "Lollipop",
      vertical,
      renderer,
      {keys: ["Iceland_Iceland"], dy: 40},
      "Iceland_Iceland::stem::hit",
    );
    bright(r, lollipop("Iceland"));
    dim(r, others);
  });

  it(`Lollipop ${renderer} — the snapped hover over a category of dodged series highlights them`, async function () {
    const r = await run("Lollipop", grouped, renderer, {
      keys: ["2024_Q2", "2025_Q2"],
      dy: -30,
    });
    bright(r, quarter("Q2"));
    dim(r, [...quarter("Q1"), ...quarter("Q3")]);
  });

  it(`Lollipop ${renderer} — hovering one of a category's dodged heads highlights the category`, async function () {
    const r = await run(
      "Lollipop",
      grouped,
      renderer,
      {keys: ["2024_Q2"]},
      "2024_Q2",
    );
    bright(r, quarter("Q2"));
    dim(r, [...quarter("Q1"), ...quarter("Q3")]);
  });

  it(`Dumbbell ${renderer} — the snapped hover along a dumbbell highlights its points and connector`, async function () {
    const r = await run("Dumbbell", dumbbell, renderer, {
      keys: ["2000_China", "2021_China"],
      dy: 8,
    });
    bright(r, country("China"));
    dim(r, [...country("Japan"), ...country("India")]);
  });

  it(`Dumbbell ${renderer} — hovering a point highlights its dumbbell`, async function () {
    const r = await run(
      "Dumbbell",
      dumbbell,
      renderer,
      {keys: ["2000_China"]},
      "2000_China",
    );
    bright(r, country("China"));
    dim(r, [...country("Japan"), ...country("India")]);
  });

  it(`Lollipop ${renderer} — a column hover keeps the hovered series' legend swatch bright`, async function () {
    const config = {
      data: coffee.map((d, i) => ({...d, region: i < 2 ? "North" : "South"})),
      groupBy: "country",
      color: "region",
      x: "country",
      y: "kg",
    };
    const r = await run("Lollipop", config, renderer, {
      keys: ["Iceland_Iceland"],
      dx: 14,
      dy: -20,
    });
    bright(r, lollipop("Iceland"));
    assert.strictEqual(
      r.marks["South_1_"].opacity,
      1,
      "the hovered row's legend swatch stays bright",
    );
    assert.ok(r.marks["North_1_"].opacity < 1, "another region's swatch dims");
  });

  it(`Lollipop ${renderer} — hoverOpacity 1 turns the column hover's dimming off`, async function () {
    const r = await run(
      "Lollipop",
      {...vertical, shapeConfig: {hoverOpacity: 1}},
      renderer,
      {keys: ["Iceland_Iceland"], dx: 14, dy: -20},
    );
    assert.strictEqual(r.hovered, false);
    assert.ok(
      Object.values(r.marks).every(m => m.opacity === 1),
      "nothing dims",
    );
  });

  it(`Dumbbell ${renderer} — a legend hover keeps every connector bright`, async function () {
    const r = await run(
      "Dumbbell",
      dumbbell,
      renderer,
      {keys: ["2000_1_"]},
      "2000_1_",
    );
    assert.ok(r.hovered, "a hover is set");
    ["Japan", "China", "India"].forEach(c => {
      assert.strictEqual(
        r.marks[`2000_${c}`].opacity,
        1,
        `2000_${c} stays bright`,
      );
      assert.ok(r.marks[`2021_${c}`].opacity < 1, `2021_${c} dims`);
      assert.strictEqual(
        r.marks[`${c}::connector`].opacity,
        1,
        `${c}'s connector stays bright`,
      );
    });
  });
}
