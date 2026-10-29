import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    `barWidthShare("opposite")` (Marimekko's default) moves each bar's width
    share off its name's axis onto the secondary axis across the bars: above
    them (`x2`) when the bars run along `x`, right of them (`y2`) when they
    run along `y`. `barWidthShareFormat` writes the label.
*/

// Category A totals 30 (a 10, b 20); B totals 10 (a 5, b 5).
const data = [
  {cat: "A", g: "a", v: 10},
  {cat: "A", g: "b", v: 20},
  {cat: "B", g: "a", v: 5},
  {cat: "B", g: "b", v: 5},
];

/** Renders a chart and reads back its bars' extents and each axis's labels. */
const draw = ([kind, config, rows]) =>
  new Promise(resolve => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    new window.d3plus[kind]()
      .select(el)
      .data(rows)
      .groupBy("g")
      .x("cat")
      .y("v")
      .duration(0)
      .width(800)
      .height(500)
      .config(config)
      .render(() => {
        const box = n => {
          const b = n.getBoundingClientRect();
          return {left: b.left, right: b.right, top: b.top, bottom: b.bottom};
        };
        const bars = [
          ...el.querySelectorAll(
            "g[data-key='plot-zoom-content'] rect.d3plus-render-rect:not([data-key$='::hit'])",
          ),
        ]
          .filter(r => /^[ab]_/.test(r.getAttribute("data-key") || ""))
          .map(box);
        const labels = axis =>
          [...el.querySelectorAll(`[data-key$='plot-${axis}-axis'] text`)]
            .filter(t => t.textContent)
            .map(t => ({
              text: [...t.querySelectorAll("tspan")]
                .map(s => s.textContent)
                .join("\n"),
              ...box(t),
            }));
        resolve({
          bars,
          x: labels("x"),
          x2: labels("x2"),
          y: labels("y"),
          y2: labels("y2"),
        });
      });
  });

const texts = labels => labels.map(l => l.text);
const center = b => [(b.left + b.right) / 2, (b.top + b.bottom) / 2];

it("Marimekko: by default, each width share sits above its bar, names alone beneath", async function () {
  const out = await render("", draw, ["Marimekko", {}, data]);
  assert.deepStrictEqual(texts(out.x), ["A", "B"]);
  assert.deepStrictEqual(texts(out.x2), ["75%", "25%"]);
  const barsTop = Math.min(...out.bars.map(b => b.top));
  const barsLeft = Math.min(...out.bars.map(b => b.left));
  const barsRight = Math.max(...out.bars.map(b => b.right));
  // A spans the first three quarters of the width, B the last.
  const width = barsRight - barsLeft;
  const mids = [barsLeft + width * 0.375, barsLeft + width * 0.875];
  out.x2.forEach((label, i) => {
    assert.ok(
      label.bottom <= barsTop + 1,
      `${label.text} sits above the bars (${label.bottom} ≤ ${barsTop})`,
    );
    assert.ok(
      Math.abs(center(label)[0] - mids[i]) < 2,
      `${label.text} centers over its bar (${center(label)[0]} ≈ ${mids[i]})`,
    );
  });
});

it('Marimekko: barWidthShare("opposite") along y puts the shares right of the bars', async function () {
  const out = await render("", draw, [
    "Marimekko",
    {barWidthShare: "opposite", discrete: "y", x: "v", y: "cat"},
    data,
  ]);
  assert.deepStrictEqual(texts(out.y).slice().sort(), ["A", "B"]);
  assert.deepStrictEqual(texts(out.y2).slice().sort(), ["25%", "75%"]);
  const barsRight = Math.max(...out.bars.map(b => b.right));
  for (const label of out.y2)
    assert.ok(
      label.left >= barsRight - 1,
      `${label.text} sits right of the bars (${label.left} ≥ ${barsRight})`,
    );
});

it("Marimekko: no secondary axis with barWidthShare(true) or (false)", async function () {
  for (const barWidthShare of [true, false]) {
    const out = await render("", draw, ["Marimekko", {barWidthShare}, data]);
    assert.deepStrictEqual(out.x2, [], `barWidthShare(${barWidthShare})`);
  }
});

it('BarChart: barWidthShare("opposite") lines the shares up with unstacked bars', async function () {
  const rows = [
    {g: "a", cat: "A", v: 4, pop: 100},
    {g: "b", cat: "B", v: 2, pop: 300},
  ];
  const out = await render("", draw, [
    "BarChart",
    {barWidth: "pop", barWidthShare: "opposite"},
    rows,
  ]);
  assert.deepStrictEqual(texts(out.x), ["A", "B"]);
  assert.deepStrictEqual(texts(out.x2), ["25%", "75%"]);
  const sorted = out.bars.slice().sort((a, b) => a.left - b.left);
  out.x2.forEach((label, i) => {
    const bar = sorted[i];
    assert.ok(
      Math.abs(center(label)[0] - center(bar)[0]) < 2,
      `${label.text} centers over its bar`,
    );
  });
});

it("Marimekko: barWidthShareFormat labels each share from its bar's data", async function () {
  const out = await render(
    "",
    rows =>
      new Promise(resolve => {
        const el = document.createElement("div");
        document.body.appendChild(el);
        new window.d3plus.Marimekko()
          .select(el)
          .data(rows)
          .groupBy("g")
          .x("cat")
          .y("v")
          .duration(0)
          .width(800)
          .height(500)
          .barWidthShareFormat((d, {text}) => `${d.cat}: ${d.v} (${text})`)
          .render(() => {
            const read = axis =>
              [
                ...el.querySelectorAll(`[data-key$='plot-${axis}-axis'] text`),
              ].map(t =>
                [...t.querySelectorAll("tspan")]
                  .map(s => s.textContent)
                  .join(" "),
              );
            resolve({x: read("x"), x2: read("x2")});
          });
      }),
    data,
  );
  assert.deepStrictEqual(out.x, ["A", "B"]);
  assert.deepStrictEqual(out.x2, ["A: 30 (75%)", "B: 10 (25%)"]);
});
