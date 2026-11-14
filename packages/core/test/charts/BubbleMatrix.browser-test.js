import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    BubbleMatrix (and Matrix with `shape: "Circle"`) renders in Chromium on
    both backends: one circle per cell with a value, sized by its absolute
    value with the largest filling its cell, no circle for a cell without
    one, the size legend, the signed value in a real pointer's tooltip, the
    row/column crosshair, keyboard focus walking the circles, redraws that
    keep each cell's circle, small multiples sharing one size scale, and
    Canvas painting + picking.
*/

const box = "<div id='viz' style='width:700px;height:500px'></div>";

/** A 3×3 correlation matrix missing one cell. */
const corr = [];
["a", "b", "c"].forEach((x, i) =>
  ["a", "b", "c"].forEach((y, j) => {
    if (x === "c" && y === "a") return;
    // Five distinct values: a linear colorScale over three crossing zero
    // leaves every cell unfilled (a ColorScale bug queued on its own).
    const r = {"b/c": -0.75, "c/b": 0.5}[`${x}/${y}`];
    corr.push({x, y, r: r ?? (i === j ? 1 : (i + j) % 2 ? -0.5 : 0.25)});
  }),
);

const base = {
  data: corr,
  groupBy: ["x", "y"],
  column: "x",
  row: "y",
  size: "r",
  colorScale: "r",
};

/** Draws a chart of `type` from `config` on `renderer`; resolves with the viz. */
const draw = `
  window.draw = (type, config, renderer) => new Promise(resolve => {
    const viz = new window.d3plus[type]()
      .select("#viz")
      .duration(0)
      .renderer(renderer)
      .config(config);
    window.__viz = viz;
    viz.render(() => resolve(viz));
  });
`;

for (const renderer of ["svg", "canvas"]) {
  it(`BubbleMatrix [${renderer}]: sizes circles by absolute value, the largest filling its cell`, async () => {
    const out = await render(
      box,
      async ({src, config, renderer}) => {
        eval(src);
        const viz = await window.draw("BubbleMatrix", config, renderer);
        const circles = viz._chartScene.filter(n => n.type === "circle");
        const at = (x, y) =>
          circles.find(n => n.datum.data.x === x && n.datum.data.y === y);
        const paintedCircles = document.querySelectorAll(
          "#viz svg circle[data-key^='matrix-circle']",
        ).length;
        return {
          count: circles.length,
          rects: viz._chartScene.filter(
            n => n.type === "rect" && `${n.key}`.startsWith("matrix-"),
          ).length,
          maxRadius: viz.ctx.maxRadius,
          cell: [viz.ctx.cellWidth, viz.ctx.cellHeight],
          diagonal: at("a", "a").r,
          negative: at("b", "a").r,
          positive: at("c", "b") ? at("c", "b").r : null,
          quarter: at("a", "c").r,
          centered: [
            at("b", "b").cx -
              (viz.ctx.columnScale("b") + viz.ctx.cellWidth / 2),
            at("b", "b").cy - (viz.ctx.rowScale("b") + viz.ctx.cellHeight / 2),
          ],
          missing: circles.some(
            n => n.datum.data.x === "c" && n.datum.data.y === "a",
          ),
          fills: new Set(circles.map(n => n.paint.fill)).size,
          legend: viz._sizeLegendFinal ? viz._sizeLegendFinal.domain() : null,
          paintedCircles,
          canvas: !!document.querySelector("#viz canvas.d3plus-render-canvas"),
        };
      },
      {src: draw, config: base, renderer},
    );
    assert.strictEqual(out.count, 8, "a circle per cell with a value");
    assert.strictEqual(out.rects, 0, "no rect cells");
    assert.strictEqual(out.missing, false, "no circle for the missing cell");
    const expected = (Math.min(...out.cell) - 2) / 2;
    assert.ok(Math.abs(out.maxRadius - expected) < 1e-9);
    assert.ok(
      Math.abs(out.diagonal - out.maxRadius) < 1e-9,
      "1 fills the cell",
    );
    assert.ok(
      Math.abs(out.negative - out.maxRadius * Math.sqrt(0.5)) < 1e-9,
      "-0.5 sizes by its absolute value, by area",
    );
    assert.ok(Math.abs(out.quarter - out.maxRadius / 2) < 1e-9);
    assert.ok(
      out.centered.every(v => Math.abs(v) < 1e-9),
      "centered in the cell",
    );
    assert.ok(out.fills >= 3, "colored by the colorScale");
    assert.deepStrictEqual(out.legend, [0.25, 1], "the size legend keys |r|");
    if (renderer === "svg") assert.strictEqual(out.paintedCircles, 8);
    else assert.ok(out.canvas, "a <canvas> is mounted");
  });

  it(`BubbleMatrix [${renderer}]: the colorScale diverges over a domain symmetric around zero, unless the user sets one`, async () => {
    const out = await render(
      box,
      async ({src, renderer}) => {
        eval(src);
        const data = [
          {x: "a", y: "a", r: 0.6},
          {x: "a", y: "b", r: -0.6},
          {x: "b", y: "a", r: 0.2},
          {x: "b", y: "b", r: -0.1},
        ];
        const config = {
          data,
          groupBy: ["x", "y"],
          column: "x",
          row: "y",
          size: "r",
          colorScale: "r",
        };
        const read = viz => {
          const cs = viz._colorScaleClass;
          const fill = (x, y) =>
            viz._chartScene.find(
              n =>
                n.type === "circle" &&
                n.datum.data.x === x &&
                n.datum.data.y === y,
            ).paint.fill;
          return {
            domain: cs.schema.domain,
            scale: cs._scaleType,
            ends: (cs.schema.domain || [-1, 1]).map(v => cs._colorScale(v)),
            positive: fill("a", "a"),
            negative: fill("a", "b"),
          };
        };
        const symmetric = read(
          await window.draw("BubbleMatrix", config, renderer),
        );
        const domain = read(
          await window.draw(
            "BubbleMatrix",
            {...config, colorScaleConfig: {domain: [-1, 1]}},
            renderer,
          ),
        );
        const jenks = read(
          await window.draw(
            "BubbleMatrix",
            {...config, colorScaleConfig: {scale: "jenks"}},
            renderer,
          ),
        );
        const matrix = await window.draw("Matrix", config, renderer);
        return {
          symmetric,
          domain,
          jenks,
          matrix: [
            matrix._colorScaleClass.schema.domain,
            matrix._colorScaleClass._scaleType,
          ],
        };
      },
      {src: draw, renderer},
    );
    assert.deepStrictEqual(out.symmetric.domain, [-0.6, 0.6]);
    assert.strictEqual(out.symmetric.scale, "linear");
    assert.strictEqual(
      out.symmetric.negative,
      out.symmetric.ends[0],
      "-0.6 takes the low pole",
    );
    assert.strictEqual(
      out.symmetric.positive,
      out.symmetric.ends[1],
      "0.6 the high pole",
    );
    assert.deepStrictEqual(
      out.domain.domain,
      [-1, 1],
      "the user's domain stands",
    );
    assert.notStrictEqual(
      out.domain.positive,
      out.domain.ends[1],
      "0.6 short of the pole",
    );
    assert.strictEqual(out.jenks.scale, "jenks", "the user's scale stands");
    assert.ok(!out.jenks.domain, "with no domain of ours");
    assert.deepStrictEqual(
      out.matrix,
      [undefined, "jenks"],
      "Matrix keeps its own colorScale",
    );
  });

  it(`BubbleMatrix [${renderer}]: keyboard focus walks the circles`, async () => {
    const out = await render(
      box,
      async ({src, config, renderer}) => {
        eval(src);
        await window.draw("BubbleMatrix", config, renderer);
        const host = document.querySelector("#viz .d3plus-keyboard-nav");
        const wait = () =>
          new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
        const live = () => host.querySelector("[aria-live]").textContent;
        host.focus();
        await wait();
        const seen = [live()];
        for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft"]) {
          host.dispatchEvent(
            new KeyboardEvent("keydown", {key, bubbles: true}),
          );
          await wait();
          seen.push(live());
        }
        return seen;
      },
      {src: draw, config: base, renderer},
    );
    assert.strictEqual(out[0], "a, a, 1.");
    assert.strictEqual(out[1], "a, b, -0.5.");
    assert.ok(new Set(out).size >= 3, `focus moves (${out.join(" | ")})`);
    assert.ok(
      out.every(s => !s.startsWith("a, c")),
      "the missing cell is skipped",
    );
  });

  it(`BubbleMatrix [${renderer}]: a pointer's tooltip shows the signed value, and the crosshair lights its row and column`, async () => {
    const {page, errors, close} = await openPage(box);
    try {
      const config = {
        ...base,
        colorScale: "growth",
        data: corr.map((d, i) => ({...d, growth: i - 4})),
      };
      const point = await page.evaluate(
        async ([src, config, renderer]) => {
          eval(src);
          // The page's own arrays, not copies from the test's frame.
          const viz = await window.draw(
            "BubbleMatrix",
            JSON.parse(config),
            renderer,
          );
          const host =
            document.querySelector("#viz svg") ||
            document.querySelector("#viz canvas");
          const rect = host.getBoundingClientRect();
          const t = viz._chartTransform;
          const c = viz._chartScene.find(
            n =>
              n.type === "circle" &&
              n.datum.data.x === "b" &&
              n.datum.data.y === "a",
          );
          return [rect.left + t.x + c.cx, rect.top + t.y + c.cy];
        },
        [draw, JSON.stringify(config), renderer],
      );
      await page.mouse.move(point[0] - 4, point[1] - 4);
      await page.mouse.move(point[0], point[1], {steps: 3});
      await page.waitForTimeout(150);
      const out = await page.evaluate(() => {
        const viz = window.__viz;
        return {
          tip: [...document.querySelectorAll(".d3plus-tooltip")]
            .filter(el => getComputedStyle(el).opacity !== "0")
            .map(el => el.textContent)
            .join(" "),
          lit: viz._filteredData
            .filter((d, i) => viz._hover && viz._hover(d, i))
            .map(d => `${d.y}/${d.x}`)
            .sort(),
        };
      });
      assert.ok(/a \/ b/.test(out.tip), `names the cell (${out.tip})`);
      assert.ok(/r\s*-0\.5/.test(out.tip), `the signed size (${out.tip})`);
      assert.ok(/growth/.test(out.tip), `the colorScale value (${out.tip})`);
      assert.deepStrictEqual(out.lit, ["a/a", "a/b", "b/b", "c/b"]);
      assert.deepStrictEqual(errors, []);
    } finally {
      await close();
    }
  });

  it(`Matrix [${renderer}]: shape Circle fills each cell without a size, and redraws keep each cell's circle`, async () => {
    const out = await render(
      box,
      async ({src, config, renderer}) => {
        eval(src);
        const {size, ...unsized} = config;
        const viz = await window.draw("Matrix", unsized, renderer);
        const rects = viz._chartScene.filter(
          n => n.type === "rect" && `${n.key}`.startsWith("matrix-"),
        ).length;
        await new Promise(r => viz.shape("Circle").render(r));
        const full = viz._chartScene.filter(n => n.type === "circle");
        const domRects = document.querySelectorAll(
          "#viz svg rect[data-key^='matrix-']",
        ).length;
        await new Promise(r => viz.size(size).render(r));
        const before = viz._chartScene
          .filter(n => n.type === "circle")
          .map(n => [n.key, n.r]);
        await new Promise(r =>
          viz
            .data(config.data.map(d => ({...d, r: d.r === 1 ? 1 : d.r / 2})))
            .render(r),
        );
        const after = viz._chartScene
          .filter(n => n.type === "circle")
          .map(n => [n.key, n.r]);
        return {
          rects,
          full: full.length,
          radii: new Set(full.map(n => n.r)).size,
          maxRadius: viz.ctx.maxRadius,
          fullRadius: full[0].r,
          domRects,
          legendless: viz._sizeLegendFinal === null,
          before,
          after,
        };
      },
      {src: draw, config: base, renderer},
    );
    assert.strictEqual(out.rects, 9, "rects by default, the missing cell too");
    assert.strictEqual(out.full, 9, "every cell a circle without a size");
    assert.strictEqual(out.radii, 1, "all one size");
    assert.ok(Math.abs(out.fullRadius - out.maxRadius) < 1e-9);
    if (renderer === "svg") assert.strictEqual(out.domRects, 0, "rects exit");
    assert.deepStrictEqual(
      out.after.map(d => d[0]),
      out.before.map(d => d[0]),
      "each cell keeps its key",
    );
    assert.ok(out.after[0][1] === out.before[0][1], "1 still fills its cell");
    assert.ok(out.after[1][1] < out.before[1][1], "halved values shrink");
  });

  it(`BubbleMatrix [${renderer}]: small multiples share one size scale`, async () => {
    const out = await render(
      "<div id='viz' style='width:900px;height:450px'></div>",
      async ({src, renderer}) => {
        eval(src);
        const rows = [];
        ["p", "q"].forEach(panel =>
          ["a", "b"].forEach(x =>
            ["a", "b"].forEach(y =>
              rows.push({
                panel,
                x,
                y,
                r: panel === "p" ? (x === y ? 1 : 0.5) : x === y ? 0.5 : -0.25,
              }),
            ),
          ),
        );
        const viz = await window.draw(
          "BubbleMatrix",
          {
            data: rows,
            groupBy: ["x", "y"],
            column: "x",
            row: "y",
            size: "r",
            facet: "panel",
          },
          renderer,
        );
        const circles = [];
        const walk = n => {
          if (n.type === "circle" && n.datum) circles.push(n);
          (n.children || []).forEach(walk);
        };
        viz._chartScene.forEach(walk);
        const radius = (panel, x, y) =>
          circles.find(
            n =>
              n.datum.data.panel === panel &&
              n.datum.data.x === x &&
              n.datum.data.y === y,
          ).r;
        return {
          count: circles.length,
          pHalf: radius("p", "a", "b"),
          qHalf: radius("q", "a", "a"),
          pOne: radius("p", "a", "a"),
          legend: viz._sizeLegendFinal.domain(),
        };
      },
      {src: draw, renderer},
    );
    assert.strictEqual(out.count, 8);
    assert.ok(
      Math.abs(out.pHalf - out.qHalf) < 1e-9,
      "0.5 draws the same size in both panels",
    );
    assert.ok(out.qHalf < out.pOne, "q's largest doesn't fill its cell");
    assert.deepStrictEqual(out.legend, [0.25, 1]);
  });
}

it("BubbleMatrix: the size legend keys |size| when it fits beside the chart", async () => {
  const out = await render(
    "<div id='viz' style='width:900px;height:600px'></div>",
    async ({src}) => {
      eval(src);
      const vars = ["a", "b", "c", "d", "e", "f", "g"];
      const data = [];
      vars.forEach((x, i) =>
        vars.forEach((y, j) =>
          data.push({x, y, r: i === j ? 1 : ((i * 3 + j * 5) % 9) / 10 - 0.4}),
        ),
      );
      const viz = await window.draw(
        "BubbleMatrix",
        {data, groupBy: ["x", "y"], column: "x", row: "y", size: "r"},
        "svg",
      );
      const keys = [];
      const walk = n => {
        keys.push(`${n.key}`);
        (n.children || []).forEach(walk);
      };
      walk(viz.toScene().root);
      const legend = document.querySelector(
        "#viz svg [data-key^='SizeLegend']",
      );
      return {
        bottomRight: keys.includes("viz-bottomRight"),
        legend: keys.some(k => k.startsWith("SizeLegend")),
        title: legend ? legend.textContent : "",
        domain: viz._sizeLegendFinal.domain(),
        largest: viz._sizeLegendFinal(1),
        maxRadius: viz.ctx.maxRadius,
      };
    },
    {src: draw},
  );
  assert.ok(out.bottomRight && out.legend, "the size legend is drawn");
  assert.ok(/r$/.test(out.title), `titled by the size key (${out.title})`);
  assert.ok(!/^0|[^.]0r$/.test(out.title), `no zero circle (${out.title})`);
  assert.ok(Math.abs(out.domain[0] - 0.1) < 1e-9, "zeros draw no circle");
  assert.strictEqual(out.domain[1], 1);
  assert.ok(Math.abs(out.largest - out.maxRadius) < 1e-9);
});

it("BubbleMatrix [canvas]: paints the circles and picks one on click", async () => {
  const out = await render(
    box,
    async ({src, config}) => {
      eval(src);
      const viz = await window.draw("BubbleMatrix", config, "canvas");
      viz.on("click.shape", d => (window.__clicked = d));
      const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      const t = viz._chartTransform;
      const c = viz._chartScene.find(
        n =>
          n.type === "circle" &&
          n.datum.data.x === "b" &&
          n.datum.data.y === "a",
      );
      const ratio = canvas.width / rect.width;
      const px = ctx.getImageData(
        Math.round((t.x + c.cx) * ratio),
        Math.round((t.y + c.cy) * ratio),
        1,
        1,
      ).data;
      const corner = ctx.getImageData(
        Math.round((t.x + c.cx + c.r * 0.9) * ratio),
        Math.round((t.y + c.cy + c.r * 0.9) * ratio),
        1,
        1,
      ).data;
      canvas.dispatchEvent(
        new MouseEvent("click", {
          clientX: rect.left + t.x + c.cx,
          clientY: rect.top + t.y + c.cy,
          bubbles: true,
        }),
      );
      return {
        center: [...px.slice(0, 3)].join(","),
        corner: [...corner.slice(0, 3)].join(","),
        fill: c.paint.fill,
        clicked:
          window.__clicked && `${window.__clicked.y}/${window.__clicked.x}`,
      };
    },
    {src: draw, config: base},
  );
  assert.notStrictEqual(
    out.center,
    out.corner,
    "the circle is round, not its cell",
  );
  assert.strictEqual(out.clicked, "a/b", "clicking a circle picks its row");
});
