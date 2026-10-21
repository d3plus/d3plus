import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Canvas backend interaction smoke test.

    The Canvas backend has no per-shape DOM, so `shape.on(evt, fn)` can't wire
    DOM listeners the way the SVG path does. Instead CanvasRenderer attaches one
    set of pointer listeners to the `<canvas>`, hit-tests the scene to find the
    picked node, and the Viz pipeline bridges that pick to the chart's
    `schema.on` handlers. This renders a BarChart with the Canvas backend, finds
    a painted bar pixel, dispatches a real click there, and asserts the chart's
    click handler fires with the bar's source datum — guarding the pick→handler
    bridge against silent regressions.
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
  .renderer("canvas")
  .on("click", function (d) { window.__clicked = d && d.data ? d.data : d; })`;

const probeFn = src =>
  new Promise((resolve, reject) => {
    try {
      const build = new Function("lib", `return (${src})(lib);`);
      const viz = build(window.d3plus).duration(0).select("#viz");
      viz.render(() => {
        try {
          const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
          if (!canvas) return reject(new Error("no <canvas> mounted in #viz"));
          const ctx = canvas.getContext("2d");
          const {width, height} = canvas;
          const data = ctx.getImageData(0, 0, width, height).data;

          // Find a strongly-blue pixel (an Alpha bar) in backing-store space.
          let bx = -1, by = -1;
          for (let y = 0; y < height && by < 0; y++)
            for (let x = 0; x < width; x++) {
              const i = (y * width + x) * 4;
              const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
              if (a > 250 && b > 140 && r < 120 && g < 120) {
                bx = x;
                by = y;
                break;
              }
            }
          if (bx < 0) return reject(new Error("no blue bar pixel found on canvas"));

          // Backing store may be devicePixelRatio-scaled; the listeners read CSS
          // coords (clientX - rect.left), so convert and offset by the rect.
          const rect = canvas.getBoundingClientRect();
          const ratioX = width / rect.width;
          const ratioY = height / rect.height;
          const clientX = rect.left + bx / ratioX;
          const clientY = rect.top + by / ratioY;

          window.__clicked = undefined;
          canvas.dispatchEvent(
            new MouseEvent("click", {clientX, clientY, bubbles: true}),
          );

          // The bridge fires synchronously off the dispatched event.
          resolve({clicked: window.__clicked ?? null, bx, by});
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });

after(closeBrowser);

it("Canvas backend routes a click on a shape to the chart's on('click') handler", async function () {
  this.timeout(60000);
  const body =
    '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>';
  const fp = await render(body, probeFn, builderSrc);

  assert.ok(fp.clicked, `click handler fired with a datum (got ${JSON.stringify(fp.clicked)})`);
  assert.strictEqual(fp.clicked.group, "Alpha", "the clicked bar's datum is an Alpha bar");
  assert.ok(
    fp.clicked.x === "Q1" || fp.clicked.x === "Q2",
    `the datum carries the source x (got ${JSON.stringify(fp.clicked.x)})`,
  );
});
