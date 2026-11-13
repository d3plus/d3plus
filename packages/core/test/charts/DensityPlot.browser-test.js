import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";

/**
    DensityPlot in a real browser, on SVG and Canvas: one translucent density
    curve per group overlaid on a linear value axis (or stacked, the top edge
    tracing the density of every observation), a shared tooltip listing every
    group's density at the hovered value, and small multiples.
*/

const RENDERERS = ["svg", "canvas"];

/** Seeded rows: three groups of different sizes and centers. */
const ROWS = (() => {
  let s = 3;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const normal = () =>
    Math.sqrt(-2 * Math.log(rand())) * Math.cos(2 * Math.PI * rand());
  return [
    ["low", 60, 20, 3],
    ["mid", 30, 30, 4],
    ["high", 45, 45, 3],
  ].flatMap(([g, n, mean, sd]) =>
    Array.from({length: n}, (_, i) => ({
      g,
      f: i % 2 ? "odd" : "even",
      year: 2000 + (i % 2),
      v: Math.round((mean + sd * normal()) * 10) / 10,
    })),
  );
})();

/**
    Renders a DensityPlot of ROWS configured by `extra` (a config object
    source) and returns what the scene drew: each Area's datum id, fill
    opacity, and pixel extent, the axis titles, and the y of the top edge.
*/
const draw = (page, renderer, extra = "{}") =>
  page.evaluate(
    ([rows, renderer, extra]) =>
      new Promise(resolve => {
        const viz = new window.d3plus.DensityPlot()
          .config({data: rows, groupBy: "g", value: "v", legend: false})
          .config(new Function(`return (${extra});`)())
          .renderer(renderer)
          .duration(0)
          .select("#viz");
        window.__viz = viz;
        viz.render(() => {
          try {
            const areas = [];
            // Each Area's pixel extent in the chart body's frame.
            const walk = (node, dx, dy) => {
              const x = dx + (node.transform?.x ?? 0),
                y = dy + (node.transform?.y ?? 0);
              if (node.shapeType === "Area" && node.type === "path") {
                const nums = node.d
                  .match(/-?[\d.]+(?:e[-+]?\d+)?/gi)
                  .map(Number);
                const xs = nums.filter((_, i) => i % 2 === 0);
                const ys = nums.filter((_, i) => i % 2 === 1);
                areas.push({
                  id: String(node.key),
                  fillOpacity: node.paint.fillOpacity,
                  left: x + Math.min(...xs),
                  right: x + Math.max(...xs),
                  top: y + Math.min(...ys),
                });
              }
              (node.children || []).forEach(c => walk(c, x, y));
            };
            (viz._chartScene || []).forEach(n => walk(n, 0, 0));
            const totals = new Map();
            viz._data.forEach(d =>
              totals.set(d.x, (totals.get(d.x) || 0) + (d.y || 0)),
            );
            const max = Math.max(...viz._data.map(d => d.y || 0));
            const y = v => (viz._yFunc ? viz._yFunc(v, "y") : NaN);
            resolve({
              areas,
              xTitle: viz._xConfig.title,
              yTitle: viz._yConfig.title,
              xDomain: viz._xAxis._d3Scale.domain(),
              totalTop: y(Math.max(...totals.values())),
              maxTop: y(max),
              panels: (viz._facetPanels || []).length,
              nan: Array.from(document.querySelectorAll("#viz *")).filter(n =>
                Array.from(n.attributes).some(a => a.value.includes("NaN")),
              ).length,
            });
          } catch (error) {
            resolve({error: String(error)});
          }
        });
      }),
    [ROWS, renderer, extra],
  );

const BODY = `<div id="viz" style="width:800px;height:500px;font-family:sans-serif"></div>`;

it("DensityPlot overlays one translucent curve per group on a linear value axis", async function () {
  for (const renderer of RENDERERS)
    await withPage(BODY, async page => {
      const out = await draw(page, renderer);
      assert.strictEqual(out.nan, 0, `${renderer}: no NaN`);
      assert.deepStrictEqual(
        out.areas.map(a => a.id).sort(),
        ["high", "low", "mid"],
        `${renderer}: one area per group`,
      );
      out.areas.forEach(a => {
        assert.strictEqual(a.fillOpacity, 0.4, `${renderer}: translucent`);
        assert.ok(
          Math.abs(a.left - out.areas[0].left) < 0.5 &&
            Math.abs(a.right - out.areas[0].right) < 0.5,
          `${renderer}: every curve spans the shared grid`,
        );
      });
      assert.ok(
        Math.abs(Math.min(...out.areas.map(a => a.top)) - out.maxTop) < 1,
        `${renderer}: the tallest curve reaches its peak density`,
      );
      assert.strictEqual(out.xTitle, "v");
      assert.strictEqual(out.yTitle, "Density");
      assert.ok(
        out.xDomain[0] <= 10 && out.xDomain[1] >= 55,
        `${renderer}: the value axis spans every curve (${out.xDomain})`,
      );
    });
});

it("DensityPlot stacks curves so the top edge is the density of every observation", async function () {
  for (const renderer of RENDERERS)
    await withPage(BODY, async page => {
      const out = await draw(page, renderer, "{stacked: true}");
      assert.strictEqual(out.nan, 0);
      assert.strictEqual(out.areas.length, 3);
      out.areas.forEach(a => assert.strictEqual(a.fillOpacity, 1));
      assert.ok(
        Math.abs(Math.min(...out.areas.map(a => a.top)) - out.totalTop) < 1,
        `${renderer}: the stack tops out at the summed density`,
      );
    });
});

it("DensityPlot hover lists every group's density at the hovered value", async function () {
  for (const renderer of RENDERERS)
    await withPage(BODY, async page => {
      await draw(page, renderer);
      const point = await page.evaluate(() => {
        const viz = window.__viz;
        const surface = document.querySelector(
          "#viz svg.d3plus-render-svg, #viz canvas",
        );
        const box = surface.getBoundingClientRect();
        const t = viz._chartTransform || {x: 0, y: 0};
        return [
          box.left + t.x + viz._xFunc(30, "x"),
          box.top + t.y + viz._yFunc(0.01, "y"),
        ];
      });
      await page.mouse.move(point[0] - 3, point[1] - 3);
      await page.mouse.move(point[0], point[1], {steps: 3});
      await page.waitForTimeout(150);
      const tip = await page.evaluate(() => {
        const el = document.querySelector(".d3plus-tooltip");
        return el && getComputedStyle(el).display !== "none"
          ? el.innerText.replace(/\s+/g, " ")
          : "";
      });
      ["low", "mid", "high"].forEach(g =>
        assert.ok(tip.includes(g), `${renderer}: lists ${g}: ${tip}`),
      );
      assert.ok(
        /\bv \d+(\.\d)? /.test(tip),
        `${renderer}: the hovered value reads cleanly: ${tip}`,
      );
    });
});

it("DensityPlot draws one panel per facet with a curve per group", async function () {
  for (const renderer of RENDERERS)
    await withPage(
      `<div id="viz" style="width:900px;height:400px;font-family:sans-serif"></div>`,
      async page => {
        const out = await draw(page, renderer, `{facet: "f"}`);
        assert.strictEqual(out.panels, 2);
        assert.strictEqual(out.nan, 0);
        assert.strictEqual(out.error, undefined);
        assert.strictEqual(
          out.areas.length,
          6,
          `${renderer}: three curves per panel`,
        );
      },
    );
});

/**
    Renders a DensityPlot of ROWS with a rug and `extra` config, optionally
    hiding series, and returns its rug ticks (count and colors per series)
    and its areas' colors.
*/
const drawRug = (page, renderer, extra = "{}", hidden = []) =>
  page.evaluate(
    ([rows, renderer, extra, hidden]) =>
      new Promise(resolve => {
        const viz = new window.d3plus.DensityPlot()
          .config({data: rows, groupBy: "g", value: "v", rug: true})
          .config(new Function(`return (${extra});`)())
          .renderer(renderer)
          .duration(0)
          .select("#viz");
        viz._hidden = hidden;
        viz.render(() => {
          const ticks = {},
            areas = {};
          let inert = true;
          const walk = node => {
            const key = `${node.key}`;
            const rug = key.match(/rug-(\w+)-\d+$/);
            if (rug && node.type === "line") {
              const id = rug[1];
              (ticks[id] ||= {n: 0, colors: new Set()}).n++;
              ticks[id].colors.add(node.paint.stroke);
              if (node.interactive !== false) inert = false;
            }
            if (node.shapeType === "Area" && node.datum?.id)
              areas[node.datum.id] ||= node.paint.stroke;
            (node.children || []).forEach(walk);
          };
          (viz._chartScene || []).forEach(walk);
          resolve({
            ticks: Object.fromEntries(
              Object.entries(ticks).map(([id, t]) => [
                id,
                {n: t.n, colors: [...t.colors]},
              ]),
            ),
            areas,
            inert,
          });
        });
      }),
    [ROWS, renderer, extra, hidden],
  );

it("DensityPlot rug ticks every drawn observation in its group's color", async function () {
  const counts = {low: 60, mid: 30, high: 45};
  for (const renderer of RENDERERS)
    await withPage(BODY, async page => {
      const out = await drawRug(page, renderer);
      assert.deepStrictEqual(
        Object.fromEntries(
          Object.entries(out.ticks).map(([id, t]) => [id, t.n]),
        ),
        counts,
        `${renderer}: one tick per observation`,
      );
      Object.entries(out.ticks).forEach(([id, t]) =>
        assert.deepStrictEqual(t.colors, [out.areas[id]], `${renderer}: ${id}`),
      );
      assert.ok(out.inert, `${renderer}: ticks leave hover to the curves`);

      const hidden = await drawRug(page, renderer, "{}", ["mid"]);
      assert.deepStrictEqual(Object.keys(hidden.ticks).sort(), ["high", "low"]);

      const stacked = await drawRug(page, renderer, "{stacked: true}");
      assert.strictEqual(stacked.ticks.low.n, 60, `${renderer}: stacked`);

      const faceted = await drawRug(page, renderer, `{facet: "f"}`);
      assert.strictEqual(
        faceted.ticks.low.n,
        60,
        `${renderer}: each panel ticks its own half`,
      );

      const off = await drawRug(page, renderer, "{rug: false}");
      assert.deepStrictEqual(off.ticks, {});
    });
});

it("DensityPlot rug ticks only the selected time period", async function () {
  await withPage(BODY, async page => {
    const out = await drawRug(page, "svg", `{time: "year"}`);
    // The latest year, 2001, holds every second observation.
    assert.deepStrictEqual(
      Object.fromEntries(Object.entries(out.ticks).map(([id, t]) => [id, t.n])),
      {low: 30, mid: 15, high: 22},
    );
  });
});
