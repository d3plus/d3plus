/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {near} from "~test/helpers.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    Marimekko draws one bar per category, as wide as the category's measure
    (by default its total), laid end to end, with each bar's groupBy segments
    stacked to 100% of its height. BarChart gains the same variable widths
    through `barWidth`.
*/

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
    if (config.maxAggs)
      config = {
        ...config,
        aggs: {[config.maxAggs]: (a, c) => Math.max(...a.map(c))},
      };
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
      const bars = [
        ...el.querySelectorAll(
          "g[data-key='plot-zoom-content'] rect.d3plus-render-rect",
        ),
      ]
        .filter(r => /^[ab]_/.test(r.getAttribute("data-key") || ""))
        .map(r => {
          const b = r.getBoundingClientRect();
          return {
            key: r.getAttribute("data-key"),
            left: b.left,
            right: b.right,
            top: b.top,
            bottom: b.bottom,
          };
        });
      // A multi-line label's lines, joined by newlines.
      const lines = t => {
        const spans = [...t.querySelectorAll("tspan")];
        return spans.length
          ? spans.map(s => s.textContent).join("\n")
          : t.textContent;
      };
      const text = selector =>
        [...el.querySelectorAll(`${selector} text`)].map(lines).filter(Boolean);
      const axes = {};
      el.querySelectorAll(
        "[data-key$='plot-x-axis'], [data-key$='plot-y-axis']",
      ).forEach(a => {
        axes[a.getAttribute("data-key")] = [...a.querySelectorAll("text")]
          .map(lines)
          .filter(Boolean);
      });
      const sceneRects = [];
      for (const node of sceneNodes(viz._chartScene || [])) {
        if (!node) continue;
        if (node.type === "rect" && node.shapeType === "Bar")
          sceneRects.push({
            key: node.key,
            width: node.width,
            height: node.height,
          });
      }
      // Each axis as painted (either renderer): its labels, tick marks, and rotation.
      const scene = {};
      const paintedAxis = (node, axis) => {
        if (!node || node.key === "textBox-group") return;
        if (node.type === "text")
          axis.labels.push(node.lines.map(l => l.text).join("\n"));
        if (node.type === "path" && !/::hit$/.test(node.key))
          axis.ticks.push(node.transform);
        (node.children || []).forEach(c => paintedAxis(c, axis));
      };
      const findAxes = node => {
        if (!node) return;
        const match = /(?:^|\/)plot-([xy])-axis$/.exec(node.key || "");
        if (match) {
          const axis = (scene[node.key] = {
            labels: [],
            ticks: [],
            rotated: viz[`_${match[1]}Axis`]._labelRotation,
          });
          (node.children || []).forEach(c => paintedAxis(c, axis));
        } else (node.children || []).forEach(findAxes);
      };
      findAxes(viz._paintedScene && viz._paintedScene.root);
      // SVG tick marks' centers along their axis, in page pixels.
      const tickCenters = {};
      el.querySelectorAll(
        "[data-key$='plot-x-axis'], [data-key$='plot-y-axis']",
      ).forEach(a => {
        const along = /x-axis$/.test(a.getAttribute("data-key")) ? "x" : "y";
        tickCenters[a.getAttribute("data-key")] = [
          ...a.querySelectorAll("[data-key='Line-group'] > path"),
        ]
          .filter(p => !/::hit$/.test(p.getAttribute("data-key")))
          .map(p => {
            const b = p.getBoundingClientRect();
            return along === "x" ? b.left + b.width / 2 : b.top + b.height / 2;
          });
      });
      const nan = [...el.querySelectorAll("*")].filter(n =>
        [...n.attributes].some(a => a.value.includes("NaN")),
      ).length;
      const out = {
        bars,
        sceneRects,
        nan,
        canvas: el.querySelectorAll("canvas").length,
        axes,
        scene,
        tickCenters,
        xLabels: text("[data-key$='plot-x-axis']"),
        yLabels: text("[data-key$='plot-y-axis']"),
        spans: viz._barSpans
          ? viz._barSpans.spans.map(s => [s.value, s.start, s.end])
          : null,
      };
      const target = hoverKey && el.querySelector(`[data-key='${hoverKey}']`);
      if (!target) return resolve(out);
      const box = target.getBoundingClientRect();
      target.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: box.left + box.width / 2,
          clientY: box.top + box.height / 2,
          bubbles: true,
        }),
      );
      requestAnimationFrame(() =>
        setTimeout(() => {
          const tip = document.querySelector(".d3plus-tooltip");
          out.tooltip = tip
            ? [...tip.querySelectorAll("tbody tr")].map(tr =>
                [...tr.querySelectorAll("td")].map(td => td.textContent),
              )
            : [];
          resolve(out);
        }, 50),
      );
    });
  });

/** Each column's [left, right, top, bottom] extent, keyed by its left edge. */
function columns(bars) {
  const out = new Map();
  for (const b of bars) {
    const key = Math.round(b.left);
    const c = out.get(key) || {
      left: b.left,
      right: b.right,
      top: Infinity,
      bottom: -Infinity,
      segments: [],
    };
    c.top = Math.min(c.top, b.top);
    c.bottom = Math.max(c.bottom, b.bottom);
    c.segments.push(b);
    out.set(key, c);
  }
  return [...out.values()].sort((a, b) => a.left - b.left);
}

it("Marimekko: bars as wide as their totals, segments stacked to 100%", async function () {
  const out = await render("", draw, ["Marimekko", {}, data, "b_A"]);
  assert.strictEqual(out.nan, 0, "no NaN attributes");
  assert.strictEqual(out.bars.length, 4, "one segment per row");
  assert.deepStrictEqual(out.spans, [
    ["A", 0, 30],
    ["B", 30, 40],
  ]);

  const [a, b] = columns(out.bars);
  const wa = a.right - a.left,
    wb = b.right - b.left;
  near(wa / wb, 3, 0.15, "width ∝ total");
  near(a.top, b.top, 1, "columns share a top");
  near(a.bottom, b.bottom, 1, "columns share a bottom");
  const heights = a.segments.map(s => s.bottom - s.top).sort((x, y) => x - y);
  near(heights[1] / heights[0], 2, 0.1, "segment height ∝ share");

  assert.deepStrictEqual(
    out.xLabels,
    ["A\n75%", "B\n25%"],
    "categories labeled with their width shares",
  );
  assert.ok(
    out.yLabels.includes("100%") && out.yLabels.includes("0%"),
    `percent ticks: ${out.yLabels}`,
  );

  const rows = Object.fromEntries(out.tooltip);
  assert.strictEqual(rows.cat, "A");
  assert.strictEqual(rows.v, "20");
  assert.strictEqual(rows["Bar Total"], "30 (75%)");
  assert.ok(/^66\.7/.test(rows.Share), `share row: ${rows.Share}`);
});

it("Marimekko: hovering a segment's label shows the segment's tooltip", async function () {
  const out = await render("", draw, ["Marimekko", {}, data, "b_A_0"]);
  const rows = Object.fromEntries(out.tooltip);
  assert.strictEqual(rows.cat, "A");
  assert.strictEqual(rows["Bar Total"], "30 (75%)");
});

it("Marimekko: the series largest overall stacks lowest in every bar", async function () {
  const out = await render("", draw, ["Marimekko", {}, data]);
  const bottom = key => out.bars.find(b => b.key === key).bottom;
  assert.ok(bottom("b_A") > bottom("a_A"), "b (25 overall) below a in A");
  assert.ok(bottom("b_B") > bottom("a_B"), "b below a in B, though tied there");
});

it("Marimekko: barWidth measures, absolute heights, and barWidth(false)", async function () {
  const measured = await render("", draw, [
    "Marimekko",
    {barWidth: "size", maxAggs: "size"},
    data,
    "a_B",
  ]);
  const [a, b] = columns(measured.bars);
  near((b.right - b.left) / (a.right - a.left), 3, 0.15, "width ∝ barWidth");
  assert.strictEqual(Object.fromEntries(measured.tooltip).size, "3 (75%)");

  const absolute = await render("", draw, [
    "Marimekko",
    {stackOffset: "none"},
    data,
  ]);
  const [aa, ab] = columns(absolute.bars);
  near((aa.bottom - aa.top) / (ab.bottom - ab.top), 3, 0.1, "height ∝ total");
  assert.ok(!absolute.yLabels.some(l => l.includes("%")), "value ticks");

  const plain = await render("", draw, ["Marimekko", {barWidth: false}, data]);
  const [pa, pb] = columns(plain.bars);
  near(
    pa.right - pa.left,
    pb.right - pb.left,
    1,
    "equal widths without barWidth",
  );
  assert.strictEqual(plain.spans, null);
});

it("Marimekko: horizontal bars span the y axis", async function () {
  const out = await render("", draw, [
    "Marimekko",
    {discrete: "y", x: "v", y: "cat"},
    data,
  ]);
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
  assert.deepStrictEqual(
    out.yLabels.slice().sort(),
    ["A (75%)", "B (25%)"],
    "shares follow the names",
  );
});

it("BarChart: barWidth makes each bar as wide as its measure", async function () {
  const rows = [
    {g: "a", cat: "A", v: 4, pop: 100},
    {g: "b", cat: "B", v: 2, pop: 300},
  ];
  const out = await render("", draw, [
    "BarChart",
    {barWidth: "pop"},
    rows,
    "b_B",
  ]);
  const [a, b] = columns(out.bars);
  near((b.right - b.left) / (a.right - a.left), 3, 0.15, "width ∝ pop");
  near(b.left - a.right, 0, 6, "bars sit end to end");
  assert.deepStrictEqual(out.xLabels, ["A", "B"]);
  assert.strictEqual(Object.fromEntries(out.tooltip).pop, "300 (75%)");
});

it("Marimekko: draws on the Canvas renderer", async function () {
  const out = await render("", draw, ["Marimekko", {renderer: "canvas"}, data]);
  assert.ok(out.canvas >= 1, "a canvas surface");
  assert.strictEqual(out.sceneRects.length, 4);
  const width = key => out.sceneRects.find(r => r.key.startsWith(key)).width;
  near(width("a_A") / width("a_B"), 3, 0.15, "width ∝ total");
  assert.ok(
    out.sceneRects.every(
      r => Number.isFinite(r.width) && Number.isFinite(r.height),
    ),
  );
});

it("Marimekko: facet draws one mosaic per panel", async function () {
  const rows = data.flatMap(d => [
    {...d, panel: "P1"},
    {...d, panel: "P2", v: d.v * 2},
  ]);
  const out = await render("", draw, ["Marimekko", {facet: "panel"}, rows]);
  assert.strictEqual(out.nan, 0);
  assert.ok(
    out.sceneRects.length >= 8,
    `segments in both panels (${out.sceneRects.length})`,
  );
  // Each panel labels its bars by category, not by cumulative width.
  const xLabels = out.xLabels.map(l => l.split("\n")[0]).sort();
  assert.deepStrictEqual(
    xLabels,
    ["A", "A", "B", "B"],
    `panel category labels: ${out.xLabels}`,
  );
});

it("Marimekko: barWidthShare(false) labels categories by name alone", async function () {
  const out = await render("", draw, [
    "Marimekko",
    {barWidthShare: false},
    data,
  ]);
  assert.deepStrictEqual(out.xLabels, ["A", "B"]);
  const horizontal = await render("", draw, [
    "Marimekko",
    {barWidthShare: false, discrete: "y", x: "v", y: "cat"},
    data,
  ]);
  assert.deepStrictEqual(horizontal.yLabels.slice().sort(), ["A", "B"]);
});

it("BarChart: barWidthShare is off by default and adds width shares when on", async function () {
  const rows = [
    {g: "a", cat: "A", v: 4, pop: 100},
    {g: "b", cat: "B", v: 2, pop: 300},
  ];
  const on = await render("", draw, [
    "BarChart",
    {barWidth: "pop", barWidthShare: true},
    rows,
  ]);
  assert.deepStrictEqual(on.xLabels, ["A\n25%", "B\n75%"]);
  // Without barWidth there is no width to share.
  const plain = await render("", draw, [
    "BarChart",
    {barWidthShare: true},
    rows,
  ]);
  assert.deepStrictEqual(plain.xLabels, ["A", "B"]);
});

for (const renderer of ["svg", "canvas"]) {
  it(`barWidth: a variable-width axis ticks only its categories, at their bars' centers (${renderer})`, async function () {
    const rows = [
      {g: "a", cat: "A", v: 4, pop: 100},
      {g: "b", cat: "B", v: 2, pop: 300},
    ];
    const cases = [
      ["Marimekko", {renderer}, data, "x"],
      ["Marimekko", {renderer, discrete: "y", x: "v", y: "cat"}, data, "y"],
      ["BarChart", {renderer, barWidth: "pop"}, rows, "x"],
    ];
    for (const [kind, config, rows, along] of cases) {
      const out = await render("", draw, [kind, config, rows]);
      const axis = out.scene[`plot-${along}-axis`];
      const message = `${kind} ${JSON.stringify(config)}`;
      assert.strictEqual(axis.labels.length, 2, `${message}: ${axis.labels}`);
      assert.strictEqual(
        axis.ticks.length,
        2,
        `${message}: one tick per category, none between`,
      );
      if (renderer === "canvas") continue;
      // Each tick sits at the middle of its bar's span.
      const [lo, hi] = along === "x" ? ["left", "right"] : ["top", "bottom"];
      const mids = [
        ...new Set(
          out.bars.map(b => `${Math.round(b[lo])},${Math.round(b[hi])}`),
        ),
      ]
        .map(k => k.split(",").map(Number))
        .map(([a, b]) => (a + b) / 2)
        .sort((a, b) => a - b);
      const ticks = out.tickCenters[`plot-${along}-axis`].sort((a, b) => a - b);
      assert.strictEqual(mids.length, 2, `${message}: bars ${mids}`);
      ticks.forEach((t, i) =>
        near(t, mids[i], 1.5, `${message}: tick ${i} at its bar's center`),
      );
    }
  });
}

// The dev page's smartphone revenue ($B) by region and brand.
const brands = ["Apple", "Samsung", "Xiaomi", "Oppo", "Other"];
const regions = {
  "North America": [62, 24, 1, 1, 9],
  Europe: [38, 30, 12, 6, 14],
  "Asia Pacific": [70, 34, 40, 38, 58],
  "Latin America": [6, 14, 7, 3, 8],
  "Middle East & Africa": [8, 12, 6, 5, 16],
};
const sales = Object.entries(regions).flatMap(([cat, values]) =>
  values.map((v, i) => ({cat, g: brands[i], v})),
);
const byYear = [2020, 2022, 2024].flatMap((year, y) =>
  sales.map((d, i) => ({
    ...d,
    year,
    v: Math.round(d.v * (0.5 + 0.25 * y + ((i * 7) % 5) * 0.04)),
  })),
);

/** Each axis's category names (the first line of each label), by axis key. */
const names = out =>
  Object.fromEntries(
    Object.entries(out.axes).map(([key, labels]) => [
      key,
      labels.map(l => l.replace(/ \(.*\)$/, "").split("\n")[0]),
    ]),
  );

const regionNames = Object.keys(regions).sort();

for (const renderer of ["svg", "canvas"]) {
  it(
    `Marimekko: at the dev page's sizes, category labels lie flat with their shares, hiding only the narrowest bar's (${renderer})`,
    {timeout: 120000},
    async function () {
      // A dev-page grid cell is 618px wide.
      const config = {width: 618, height: 400, renderer};
      const out = await render("", draw, ["Marimekko", config, sales]);
      const x = out.scene["plot-x-axis"];
      assert.strictEqual(
        x.rotated,
        false,
        "one label that can't fit doesn't rotate the rest",
      );
      const shown = x.labels.map(l => l.split("\n").slice(0, -1).join(" "));
      assert.deepStrictEqual(
        shown,
        Object.keys(regions).filter(r => r !== "Latin America"),
        `every region but the narrowest: ${x.labels}`,
      );
      assert.ok(
        x.labels.every(l => /\n[\d.]+%$/.test(l)),
        `each with its share: ${x.labels}`,
      );
      // barWidthShare(false) shows the names alone.
      const plain = await render("", draw, [
        "Marimekko",
        {...config, barWidthShare: false},
        sales,
      ]);
      assert.strictEqual(plain.scene["plot-x-axis"].rotated, false);
      assert.ok(
        plain.scene["plot-x-axis"].labels.every(l => !l.includes("%")),
        "names alone",
      );

      // Left flat, a label keeps its share line.
      const wide = await render("", draw, ["Marimekko", {renderer}, data]);
      assert.strictEqual(wide.scene["plot-x-axis"].rotated, false);
      assert.deepStrictEqual(wide.scene["plot-x-axis"].labels, [
        "A\n75%",
        "B\n25%",
      ]);

      // A vertical axis never rotates, so every region keeps its inline share.
      const horizontal = await render("", draw, [
        "Marimekko",
        {...config, discrete: "y", x: "v", y: "cat"},
        sales,
      ]);
      const y = horizontal.scene["plot-y-axis"];
      assert.strictEqual(y.rotated, false);
      assert.deepStrictEqual(
        y.labels.map(l => l.replace(/ \([\d.]+%\)$/, "")).sort(),
        regionNames,
      );
      assert.ok(
        y.labels.every(l => / \([\d.]+%\)$/.test(l)),
        `each with its share: ${y.labels}`,
      );
    },
  );
}

it("Marimekko: a hidden label's tooltip still shows its bar's width share", async function () {
  const out = await render("", draw, [
    "Marimekko",
    {width: 618, height: 400},
    sales,
    "Apple_Latin America",
  ]);
  assert.ok(
    !out.xLabels.some(l => l.startsWith("Latin")),
    `hidden: ${out.xLabels}`,
  );
  assert.strictEqual(
    Object.fromEntries(out.tooltip)["Bar Total"],
    "38 (7.28%)",
  );
});

it("Marimekko: the labels settle the same way on every render", async function () {
  const out = await render(
    "",
    ([rows]) =>
      new Promise(resolve => {
        const el = document.createElement("div");
        document.body.appendChild(el);
        const viz = new window.d3plus.Marimekko()
          .select(el)
          .data(rows)
          .groupBy("g")
          .x("cat")
          .y("v")
          .duration(0)
          .width(618)
          .height(400);
        const labels = () =>
          [...el.querySelectorAll("[data-key='plot-x-axis'] text")].map(
            t => t.textContent,
          );
        viz.render(() => {
          const first = {rotated: viz._xAxis._labelRotation, labels: labels()};
          viz.width(1800).render(() => {
            const wide = {rotated: viz._xAxis._labelRotation, labels: labels()};
            viz.width(618).render(() =>
              resolve({
                first,
                wide,
                again: {rotated: viz._xAxis._labelRotation, labels: labels()},
              }),
            );
          });
        });
      }),
    [sales],
  );
  assert.strictEqual(out.first.rotated, false);
  assert.ok(
    out.first.labels.every(l => l.includes("%")),
    `flat: ${out.first.labels}`,
  );
  assert.strictEqual(out.wide.rotated, false);
  assert.strictEqual(
    out.wide.labels.length,
    5,
    `every region: ${out.wide.labels}`,
  );
  assert.ok(
    out.wide.labels.every(l => l.includes("%")),
    `flat: ${out.wide.labels}`,
  );
  assert.deepStrictEqual(out.again, out.first);
});

it(
  "Marimekko: in the dev page's small multiples, a share costs no panel a label",
  {timeout: 120000},
  async function () {
    for (const config of [
      {width: 1260, height: 400, facet: "year"},
      {
        width: 1260,
        height: 400,
        facet: "year",
        facetConfig: {scales: "independent"},
      },
    ]) {
      const shared = names(
        await render("", draw, ["Marimekko", config, byYear]),
      );
      const plain = names(
        await render("", draw, [
          "Marimekko",
          {...config, barWidthShare: false},
          byYear,
        ]),
      );
      Object.entries(plain).forEach(([key, labels]) => {
        if (/x-axis$/.test(key))
          assert.deepStrictEqual(shared[key], labels, key);
      });
    }
  },
);

it("BarChart: width shares keep every category label at the dev page's size", async function () {
  const sectors = {
    Retail: [42, 48, 30],
    Technology: [55, 70, 12],
    Energy: [38, 33, 6],
    Healthcare: [30, 36, 18],
  };
  const rows = Object.entries(sectors).flatMap(([cat, [a, b, size]]) => [
    {cat, g: "2023", v: a, size},
    {cat, g: "2024", v: b, size},
  ]);
  const config = {
    width: 618,
    height: 400,
    barWidth: "size",
    maxAggs: "size",
    barWidthShare: true,
    barPadding: 2,
    groupPadding: 8,
  };
  const out = await render("", draw, ["BarChart", config, rows]);
  assert.deepStrictEqual(out.xLabels, [
    "Retail\n45.5%",
    "Technology\n18.2%",
    "Energy\n9.09%",
    "Healthcare\n27.3%",
  ]);
});

// Two unstacked series per category; A is three times as wide as B.
const series = [
  {cat: "A", g: "a", v: 4, size: 3},
  {cat: "A", g: "b", v: 2, size: 3},
  {cat: "B", g: "a", v: 3, size: 1},
  {cat: "B", g: "b", v: 5, size: 1},
];

it("BarChart: unstacked series split each variable-width bar side by side", async function () {
  const out = await render("", draw, [
    "BarChart",
    {barWidth: "size", maxAggs: "size", barPadding: 4},
    series,
  ]);
  assert.strictEqual(out.nan, 0);
  const bar = key => out.bars.find(b => b.key === key);
  const width = b => b.right - b.left;
  const [aA, bA, aB, bB] = ["a_A", "b_A", "a_B", "b_B"].map(bar);
  // barPadding spaces the series as it does grouped bars: (2 * 4 + 1) / (2 - 1).
  near(bA.left - aA.right, 9, 1.5, "series sit side by side, barPadding apart");
  near(bB.left - aB.right, 9, 1.5, "in every bar");
  near(width(aA), width(bA), 0.5, "series share a bar equally");
  near(
    (bA.right - aA.left) / (bB.right - aB.left),
    3,
    0.2,
    "each pair fills its bar's width",
  );
  assert.ok(bA.right < aB.left, "bars stay within their spans");

  const stacked = await render("", draw, [
    "BarChart",
    {barWidth: "size", maxAggs: "size", stacked: true},
    series,
  ]);
  const s = key => stacked.bars.find(b => b.key === key);
  near(
    s("a_A").left,
    s("b_A").left,
    0.5,
    "stacked segments still span the whole bar",
  );

  const canvas = await render("", draw, [
    "BarChart",
    {barWidth: "size", maxAggs: "size", barPadding: 4, renderer: "canvas"},
    series,
  ]);
  const rect = key => canvas.sceneRects.find(r => r.key === key);
  near(
    rect("a_A").width,
    rect("b_A").width,
    0.5,
    "canvas: series share a bar equally",
  );
  near(
    rect("a_A").width / rect("a_B").width,
    3,
    0.25,
    "canvas: widths follow each bar's measure",
  );
});

/** Per facet panel: its mosaic's drawn width (one segment per bar, summed) and its x labels. */
function facetPanels(out) {
  const panels = {};
  for (const r of out.sceneRects) {
    const [panel, key] = r.key.split("/");
    if (!key.startsWith("a_")) continue;
    panels[panel] = panels[panel] || {width: 0};
    panels[panel].width += r.width;
  }
  for (const [key, {labels}] of Object.entries(out.scene)) {
    const [panel, axis] = key.split("/");
    if (axis === "plot-x-axis" && panels[panel]) panels[panel].labels = labels;
  }
  return panels;
}

// Panel P2 doubles every value, so its total width is twice P1's.
const panelRows = data.flatMap(d => [
  {...d, panel: "P1"},
  {...d, panel: "P2", v: d.v * 2},
]);

for (const renderer of ["svg", "canvas"]) {
  it(`Marimekko: facet panels share one width scale by default (${renderer})`, async function () {
    const out = await render("", draw, [
      "Marimekko",
      {facet: "panel", renderer},
      panelRows,
    ]);
    const {"facet-P1": p1, "facet-P2": p2} = facetPanels(out);
    near(
      p1.width / p2.width,
      0.5,
      0.05,
      "the smaller panel draws a narrower mosaic",
    );
    // Each panel's shares are of its own total (40 and 80), so they add to 100% in both.
    assert.deepStrictEqual(p1.labels, ["A\n75%", "B\n25%"]);
    assert.deepStrictEqual(p2.labels, ["A\n75%", "B\n25%"]);
  });

  it(`Marimekko: facetConfig({scales: "independent"}) fills each panel's width (${renderer})`, async function () {
    const config = {
      facet: "panel",
      facetConfig: {scales: "independent"},
      renderer,
    };
    const out = await render("", draw, ["Marimekko", config, panelRows]);
    const {"facet-P1": p1, "facet-P2": p2} = facetPanels(out);
    near(p1.width / p2.width, 1, 0.05, "every panel fills its width");
    assert.deepStrictEqual(
      p1.labels,
      ["A\n75%", "B\n25%"],
      "shares of the panel's own total",
    );
    assert.deepStrictEqual(p2.labels, ["A\n75%", "B\n25%"]);
  });
}

it("Marimekko: a shared-scale facet panel's tooltip shares its width of that panel's total", async function () {
  const p1 = await render("", draw, [
    "Marimekko",
    {facet: "panel"},
    panelRows,
    "facet-P1/b_A",
  ]);
  assert.strictEqual(Object.fromEntries(p1.tooltip)["Bar Total"], "30 (75%)");
  const p2 = await render("", draw, [
    "Marimekko",
    {facet: "panel"},
    panelRows,
    "facet-P2/b_B",
  ]);
  assert.strictEqual(Object.fromEntries(p2.tooltip)["Bar Total"], "20 (25%)");
});

it("Marimekko: every facet panel labels its own categories, in every grid row", async function () {
  const rows = ["P1", "P2", "P3", "P4"].flatMap((panel, i) =>
    data.map(d => ({...d, panel, v: d.v * (i + 1)})),
  );
  const out = await render("", draw, [
    "Marimekko",
    {facet: "panel", facetConfig: {columns: 2}},
    rows,
  ]);
  const panels = facetPanels(out);
  assert.deepStrictEqual(Object.keys(panels).sort(), [
    "facet-P1",
    "facet-P2",
    "facet-P3",
    "facet-P4",
  ]);
  for (const [panel, {labels}] of Object.entries(panels))
    assert.deepStrictEqual(
      (labels || []).map(l => l.split("\n")[0]),
      ["A", "B"],
      `${panel} labels its bars`,
    );
});
