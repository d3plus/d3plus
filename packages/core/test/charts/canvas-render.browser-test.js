import {it} from "vitest";
import {CanvasRenderer} from "@d3plus/render";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Canvas backend smoke test.

    `.renderer("canvas")` once painted nothing: the scene renderer was mounted
    into the off-stage compute `<svg>`, and a `<canvas>` cannot paint inside an
    `<svg>`, so every chart came out blank with no error. The Viz pipeline now
    mounts the canvas into the compute svg's parent (the user's element). This
    renders a BarChart through Chromium with the Canvas backend and asserts a
    `<canvas>` lands in the user's container and carries real, multi-color paint —
    guarding against a silent regression back to blank output.
*/

const builderSrc = `lib => new lib.BarChart()
  .groupBy("group")
  .data([
    {group: "Alpha", x: "Q1", y: 35},
    {group: "Alpha", x: "Q2", y: 50},
    {group: "Beta",  x: "Q1", y: 20},
    {group: "Beta",  x: "Q2", y: 30},
  ])
  .x("x").y("y")
  .renderer("canvas")`;

const probeFn = src =>
  new Promise((resolve, reject) => {
    try {
      const build = new Function("lib", `return (${src})(lib);`);
      const viz = build(window.d3plus).duration(0).select("#viz");
      viz.render(() => {
        try {
          const host = document.querySelector("#viz");
          const canvas =
            host && host.querySelector("canvas.d3plus-render-canvas");
          if (!canvas) return reject(new Error("no <canvas> mounted in #viz"));

          const ctx = canvas.getContext("2d");
          const {width, height} = canvas;
          const data = ctx.getImageData(0, 0, width, height).data;

          // Count opaque, non-white pixels (the painted chart) and tally the
          // distinct quantized colors among them — a blank canvas has none, a
          // single-fill mistake has one, a real chart has several (bars, axes,
          // labels, legend).
          let painted = 0;
          const colors = new Set();
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i],
              g = data[i + 1],
              b = data[i + 2],
              a = data[i + 3];
            if (a < 250) continue;
            if (r > 245 && g > 245 && b > 245) continue; // background white
            painted++;
            colors.add(`${r >> 4}_${g >> 4}_${b >> 4}`);
          }
          resolve({
            hasCanvas: true,
            width,
            height,
            painted,
            total: width * height,
            distinctColors: colors.size,
          });
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });

it("Canvas backend paints a non-blank, multi-color chart into the user's container", async function () {
  const body =
    '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>';
  const fp = await render(body, probeFn, builderSrc);

  assert.ok(fp.hasCanvas, "a <canvas> is mounted inside #viz");
  assert.ok(
    fp.width > 0 && fp.height > 0,
    "the canvas has a non-zero backing size",
  );

  const paintedFraction = fp.painted / fp.total;
  assert.ok(
    paintedFraction > 0.02,
    `the canvas is not blank (painted ${(paintedFraction * 100).toFixed(2)}% of pixels)`,
  );
  assert.ok(
    fp.distinctColors >= 3,
    `the canvas carries multi-color chart paint (got ${fp.distinctColors} distinct colors)`,
  );
});

it("CanvasRenderer picks a Path2D path", async () => {
  const res = await render('<div id="B"></div>', () => {
    const r = new CanvasRenderer();
    r.mount({
      container: document.getElementById("B"),
      width: 100,
      height: 100,
      pixelRatio: 1,
    });
    r.drawScene({
      width: 100,
      height: 100,
      root: {
        type: "group",
        key: "root",
        children: [
          {
            type: "path",
            key: "p",
            d: "M10,10 L90,10 L90,90 L10,90 Z",
            paint: {fill: "#09c"},
          },
        ],
      },
    });
    const inside = r.pick([50, 50]);
    const outside = r.pick([5, 5]);
    return {inside: inside && inside.node.key, outside};
  });
  assert.strictEqual(
    res.inside,
    "p",
    "point inside the square path hits (Path2D isPointInPath)",
  );
  assert.strictEqual(res.outside, null, "point outside the path misses");
});
