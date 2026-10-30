/* global requestAnimationFrame, setTimeout */
import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    Histogram's `cumulative` mode on both renderers: bar heights follow the
    running counts (from the lowest bin, or from the highest with
    `"reverse"`), the y axis is titled for the mode, and hovering a bar shows
    its range, its own count, and its running count. Without `cumulative`,
    bars keep their per-bin counts.
*/

// Counts per bin of width 10: [0,10)→1, [10,20)→2, [20,30)→4, [30,40]→3.
const values = [5, 12, 18, 21, 22, 25, 29, 31, 35, 40];

/**
    Draws a Histogram of `values`, hovers the bar of the bin starting at
    `hoverX0` through the renderer's pointer path, and reports each bar's
    height (left to right), the y title, and the tooltip's text.
*/
const draw = ([renderer, config, rows, hoverX0]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Histogram()
      .config(config)
      .data(rows)
      .value("v")
      .binWidth(10)
      .renderer(renderer)
      .width(600)
      .height(400)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const bars = [];
      const walk = (n, x, y) => {
        const t = n.transform || {};
        const nx = x + (t.x || 0),
          ny = y + (t.y || 0);
        if (
          n.type === "rect" &&
          n.shapeType === "Bar" &&
          n.datum &&
          !`${n.key}`.endsWith("::hit")
        ) {
          let d = n.datum;
          while (d.data && d.__d3plus__) d = d.data;
          bars.push({
            x0: d.x0,
            g: d.g,
            x: nx + n.x,
            y: ny + n.y,
            w: n.width,
            h: n.height,
          });
        }
        (n.children || []).forEach(c => walk(c, nx, ny));
      };
      walk(viz._paintedScene.root, 0, 0);
      bars.sort((a, b) => a.x - b.x || a.y - b.y);
      const nan = sceneNodes(viz._paintedScene.root).filter(n =>
        JSON.stringify({x: n.x, y: n.y, h: n.height}).includes("null"),
      ).length;

      const host = document.querySelector(
        "#viz svg.d3plus-render-svg, #viz canvas.d3plus-render-canvas",
      );
      const box = host.getBoundingClientRect();
      const target = bars.find(b => b.x0 === hoverX0);
      const clientX = box.left + target.x + target.w / 2;
      const clientY = box.top + target.y + target.h / 2;
      const el = document.elementFromPoint(clientX, clientY);
      el.dispatchEvent(
        new MouseEvent("mousemove", {clientX, clientY, bubbles: true}),
      );
      requestAnimationFrame(() =>
        setTimeout(() => {
          const tip = [...document.querySelectorAll(".d3plus-tooltip")].find(
            t => getComputedStyle(t).opacity !== "0",
          );
          resolve({
            heights: bars.map(b => b.h),
            groups: bars.map(b => `${b.g}:${b.x0}`),
            yTitle: viz._yConfig.title,
            tip: tip ? tip.textContent : null,
            nan,
          });
        }, 50),
      );
    });
  });

const html = "<div id='viz' style='width:600px;height:400px'></div>";
const rows = values.map(v => ({v}));

/** Asserts `heights` are proportional to `expected`. */
const proportional = (heights, expected, label) => {
  const unit = heights[0] / expected[0];
  expected.forEach((e, i) =>
    assert.ok(
      Math.abs(heights[i] - e * unit) < 1.5,
      `${label}: bar ${i} height ∝ ${e} (${heights[i]} vs ${e * unit})`,
    ),
  );
};

for (const renderer of ["svg", "canvas"]) {
  it(`Histogram ${renderer} — default bars keep per-bin counts`, async function () {
    const out = await render(html, draw, [renderer, {}, rows, 20]);
    assert.strictEqual(out.nan, 0);
    assert.strictEqual(out.heights.length, 4);
    proportional(out.heights, [1, 2, 4, 3], "default");
    assert.strictEqual(out.yTitle, "Count");
    assert.ok(out.tip, "a tooltip shows");
    assert.ok(out.tip.includes("20 – 30"), `bin range (${out.tip})`);
    assert.ok(out.tip.includes("Count4"), `bin count (${out.tip})`);
    assert.ok(!out.tip.includes("Cumulative"), "no cumulative row");
  });

  it(`Histogram ${renderer} — cumulative bars follow the running count`, async function () {
    const out = await render(html, draw, [
      renderer,
      {cumulative: true},
      rows,
      20,
    ]);
    assert.strictEqual(out.nan, 0);
    assert.strictEqual(out.heights.length, 4);
    proportional(out.heights, [1, 3, 7, 10], "cumulative");
    assert.strictEqual(out.yTitle, "Cumulative Count");
    assert.ok(out.tip.includes("20 – 30"), `bin range (${out.tip})`);
    assert.ok(out.tip.includes("Count4"), `own count (${out.tip})`);
    assert.ok(
      out.tip.includes("Cumulative Count7"),
      `running count (${out.tip})`,
    );
  });

  it(`Histogram ${renderer} — reverse cumulative counts from the top bin down`, async function () {
    const out = await render(html, draw, [
      renderer,
      {cumulative: "reverse"},
      rows,
      20,
    ]);
    proportional(out.heights, [10, 9, 7, 3], "reverse");
    assert.ok(
      out.tip.includes("Cumulative Count7"),
      `running count (${out.tip})`,
    );
  });

  it(`Histogram ${renderer} — cumulative relative ends at 1`, async function () {
    const out = await render(html, draw, [
      renderer,
      {cumulative: true, binNormalize: "relative"},
      rows,
      30,
    ]);
    proportional(out.heights, [1, 3, 7, 10], "relative");
    assert.strictEqual(out.yTitle, "Cumulative Relative Frequency");
    assert.ok(out.tip.includes("Count3"), `own count (${out.tip})`);
    assert.ok(
      out.tip.includes("Cumulative Count10"),
      `running count (${out.tip})`,
    );
    assert.ok(
      out.tip.includes("Cumulative Relative Frequency1"),
      `running share (${out.tip})`,
    );
  });

  it(`Histogram ${renderer} — stacked groups accumulate separately`, async function () {
    const grouped = [
      ...[5, 12, 18].map(v => ({g: "a", v})),
      ...[21, 22, 25, 29, 31, 35, 40].map(v => ({g: "b", v})),
    ];
    const out = await render(html, draw, [
      renderer,
      {cumulative: true, groupBy: "g"},
      grouped,
      20,
    ]);
    // a: [1, 2, 0, 0] → [1, 3, 3, 3]; b: [0, 0, 4, 3] → [0, 0, 4, 7].
    const byKey = Object.fromEntries(
      out.groups.map((k, i) => [k, out.heights[i]]),
    );
    const unit = byKey["a:0"];
    [
      ["a:10", 3],
      ["a:20", 3],
      ["a:30", 3],
      ["b:20", 4],
      ["b:30", 7],
    ].forEach(([k, e]) =>
      assert.ok(
        Math.abs(byKey[k] - e * unit) < 1.5,
        `${k} height ∝ ${e} (${byKey[k]})`,
      ),
    );
    // The shared tooltip lists each series' running count at the bin.
    assert.ok(out.tip.startsWith("Cumulative Count"), `title (${out.tip})`);
    assert.ok(
      out.tip.includes("b4") && out.tip.includes("a3"),
      `series rows (${out.tip})`,
    );

    const single = await render(html, draw, [
      renderer,
      {cumulative: true, groupBy: "g", tooltipShared: false},
      grouped,
      20,
    ]);
    assert.ok(single.tip.includes("Range20 – 30"), `range (${single.tip})`);
    assert.ok(single.tip.includes("Count4"), `own count (${single.tip})`);
    assert.ok(
      single.tip.includes("Cumulative Count4"),
      `running count (${single.tip})`,
    );
  });
}

it("Histogram translates its cumulative axis title and tooltip labels", async function () {
  const out = await render(
    "",
    () =>
      new Promise(resolve => {
        const el = document.createElement("div");
        document.body.appendChild(el);
        const viz = new window.d3plus.Histogram()
          .select(el)
          .duration(0)
          .width(800)
          .height(500)
          .locale("es-ES")
          .data([1, 2, 3, 11, 12].map(v => ({g: "a", v})))
          .groupBy("g")
          .value("v")
          .binWidth(10)
          .binNormalize("density")
          .cumulative(true);
        viz.render(() => {
          const bin = viz._filteredData[1];
          resolve({
            yTitle: viz._yConfig.title,
            tbody: viz.schema.tooltipConfig.tbody(bin, 1),
          });
        });
      }),
  );

  assert.strictEqual(out.yTitle, "Frecuencia Relativa Acumulada");
  assert.deepStrictEqual(
    out.tbody.map(([label]) => label),
    [
      "Rango",
      "Recuento",
      "Recuento Acumulado",
      "Frecuencia Relativa Acumulada",
    ],
  );
  // es-ES writes decimals with a comma.
  assert.deepStrictEqual(
    out.tbody.slice(1).map(([, v]) => Number(v.replace(",", "."))),
    [2, 5, 1],
  );
});
