import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";

/**
    ConnectedScatter and Plot's `order` in a real browser, on SVG and Canvas:
    each series' points joined in order (so the line can double back), an
    arrowhead along each segment, the first and last points labeled with
    their years, and hovering a point showing that point's row.
*/

const RENDERERS = ["svg", "canvas"];

/** Two series whose x doubles back, given out of year order. */
const ROWS = [
  {id: "a", year: 2002, x: 30, y: 30},
  {id: "a", year: 2000, x: 10, y: 10},
  {id: "a", year: 2003, x: 15, y: 40},
  {id: "a", year: 2001, x: 40, y: 20},
  {id: "b", year: 2001, x: 60, y: 15},
  {id: "b", year: 2000, x: 80, y: 5},
  {id: "b", year: 2002, x: 70, y: 35},
];

const BODY = `<div id="viz" style="width:800px;height:500px;font-family:sans-serif"></div>`;

/**
    Draws `Chart` over ROWS with `extra` config (an object source) and
    returns the scene: each series' line vertices and point centers (in the
    chart body's frame, points by year), arrow and label nodes, and NaNs.
*/
const draw = (page, renderer, extra = "{}", Chart = "ConnectedScatter") =>
  page.evaluate(
    ([rows, renderer, extra, Chart]) =>
      new Promise(resolve => {
        const viz = new window.d3plus[Chart]()
          .config({data: rows, groupBy: "id", x: "x", y: "y", order: "year"})
          .config(new Function(`return (${extra});`)())
          .renderer(renderer)
          .duration(0)
          .select("#viz");
        window.__viz = viz;
        viz.render(() => {
          try {
            const lines = {},
              points = {},
              arrows = [],
              labels = [],
              keys = [];
            const walk = (node, dx, dy) => {
              const x = dx + (node.transform?.x ?? 0),
                y = dy + (node.transform?.y ?? 0);
              const key = `${node.key}`;
              if (key.includes("order-arrow-")) arrows.push(key);
              if (key.includes("order-label-") && node.type === "text")
                labels.push(node.lines.map(l => l.text).join(" "));
              if (
                node.shapeType === "Line" &&
                node.type === "path" &&
                node.datum?.__d3plus__ &&
                !key.endsWith("::hit")
              ) {
                const nums = node.d.match(/-?[\d.]+(?:e[-+]?\d+)?/gi);
                const pts = [];
                for (let i = 0; i < nums.length; i += 2)
                  pts.push([x + +nums[i], y + +nums[i + 1]]);
                lines[node.datum.id] = pts;
              }
              if (node.shapeType === "Circle" && node.type === "circle") {
                keys.push(key);
                const row = node.datum.data;
                (points[row.id] ||= []).push({
                  year: row.year,
                  at: [x + node.cx, y + node.cy],
                });
              }
              (node.children || []).forEach(c => walk(c, x, y));
            };
            (viz._chartScene || []).forEach(n => walk(n, 0, 0));
            Object.values(points).forEach(p =>
              p.sort((a, b) => a.year - b.year),
            );
            resolve({
              lines,
              points,
              arrows,
              labels: [...new Set(labels)].sort(),
              keys,
              nan: Array.from(document.querySelectorAll("#viz *")).filter(n =>
                Array.from(n.attributes).some(a => a.value.includes("NaN")),
              ).length,
            });
          } catch (error) {
            resolve({error: String(error)});
          }
        });
      }),
    [ROWS, renderer, extra, Chart],
  );

/** Whether a line's vertices visit `points` in order. */
const visits = (line, points) =>
  line.length === points.length &&
  line.every(
    ([x, y], k) =>
      Math.abs(x - points[k].at[0]) < 1 && Math.abs(y - points[k].at[1]) < 1,
  );

it("ConnectedScatter joins each series' points in year order", async function () {
  for (const renderer of RENDERERS)
    await withPage(BODY, async page => {
      const out = await draw(page, renderer);
      assert.strictEqual(out.error, undefined);
      assert.strictEqual(out.nan, 0, `${renderer}: no NaN`);
      assert.deepStrictEqual(Object.keys(out.lines).sort(), ["a", "b"]);
      ["a", "b"].forEach(id =>
        assert.ok(
          visits(out.lines[id], out.points[id]),
          `${renderer}: ${id}'s line visits its points by year`,
        ),
      );
      assert.strictEqual(
        new Set(out.keys).size,
        ROWS.length,
        `${renderer}: one uniquely keyed point per row`,
      );
      assert.ok(
        out.arrows.length >= 4,
        `${renderer}: arrowheads along the paths (${out.arrows.length})`,
      );
      assert.deepStrictEqual(
        out.labels,
        ["2000", "2002", "2003"],
        `${renderer}: the first and last years`,
      );
    });
});

it("pathArrows and pathLabels turn the direction marks off", async function () {
  await withPage(BODY, async page => {
    const out = await draw(
      page,
      "svg",
      "{pathArrows: false, pathLabels: false}",
    );
    assert.strictEqual(out.arrows.length, 0);
    assert.deepStrictEqual(out.labels, []);
    const custom = await draw(page, "svg", "{pathLabels: d => 'Y' + d.year}");
    assert.ok(
      custom.labels.includes("Y2000") && custom.labels.includes("Y2003"),
    );
  });
});

it("order sends a Plot's Line back on itself and joins a Scatter's points", async function () {
  await withPage(BODY, async page => {
    const line = await draw(page, "svg", `{shape: "Line"}`, "Plot");
    const xs = line.lines.a.map(p => p[0]);
    assert.ok(
      xs.some((x, i) => i && x < xs[i - 1]),
      `the line doubles back: ${xs}`,
    );
    const scatter = await draw(page, "svg", "{}", "Scatter");
    assert.ok(visits(scatter.lines.a, scatter.points.a));
    const plain = await draw(page, "svg", "{order: undefined}", "Scatter");
    assert.deepStrictEqual(plain.lines, {}, "no order, no line");
    assert.deepStrictEqual(plain.arrows, []);
  });
});

it("ConnectedScatter hover on a point shows that point's row", async function () {
  for (const renderer of RENDERERS)
    await withPage(BODY, async page => {
      await draw(page, renderer);
      // a's 2002 point, at (30, 30).
      const point = await page.evaluate(() => {
        const viz = window.__viz;
        const surface = document.querySelector(
          "#viz svg.d3plus-render-svg, #viz canvas.d3plus-render-canvas",
        );
        const box = surface.getBoundingClientRect();
        // The SVG starts below the chart's top margin; the canvas spans it.
        const t =
          surface.tagName === "CANVAS"
            ? viz._chartTransform || {x: 0, y: 0}
            : {x: 0, y: 0};
        return [
          box.left + t.x + viz._xFunc(30, "x"),
          box.top + t.y + viz._yFunc(30, "y"),
        ];
      });
      await page.mouse.move(point[0] - 4, point[1] - 4);
      await page.mouse.move(point[0], point[1], {steps: 3});
      await page.waitForTimeout(300);
      const tip = await page.evaluate(() => {
        const el = document.querySelector(".d3plus-tooltip");
        return el && getComputedStyle(el).display !== "none"
          ? el.innerText.replace(/\s+/g, " ")
          : "";
      });
      assert.ok(tip.includes("a"), `${renderer}: names the series: ${tip}`);
      assert.ok(
        tip.includes("year 2002"),
        `${renderer}: shows the point's year: ${tip}`,
      );
    });
});

it("ConnectedScatter draws a path per facet panel", async function () {
  await withPage(BODY, async page => {
    const out = await draw(page, "canvas", `{facet: "id"}`);
    assert.strictEqual(out.error, undefined);
    assert.strictEqual(out.nan, 0);
    assert.ok(out.arrows.length >= 2, `arrows: ${out.arrows.length}`);
    assert.strictEqual(
      Object.keys(out.points).length,
      2,
      "both series' points drawn",
    );
  });
});
