import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Renderer-switching cleanup test.

    Switching `.renderer()` between "svg" and "canvas" on an already-rendered
    viz once leaked DOM: `_drawSceneToTarget` mounted a fresh renderer whenever
    the kind (or container) changed but never destroyed the outgoing one. Each
    switch orphaned the previous renderer's `<svg>`/`<canvas>` (plus its overlay
    host, pointer listeners, and timers) in the user's element, stacking the old
    mode's output behind the new one and accumulating on every toggle.

    This renders a BarChart through Chromium, toggles the renderer back and
    forth, and asserts exactly one scene surface of the active kind exists after
    each pass — never a leftover from the other mode.
*/

const builderSrc = `lib => new lib.BarChart()
  .groupBy("group")
  .data([
    {group: "Alpha", x: "Q1", y: 35},
    {group: "Alpha", x: "Q2", y: 50},
    {group: "Beta",  x: "Q1", y: 20},
    {group: "Beta",  x: "Q2", y: 30},
  ])
  .x("x").y("y")`;

const probeFn = src =>
  new Promise((resolve, reject) => {
    try {
      const build = new Function("lib", `return (${src})(lib);`);
      const viz = build(window.d3plus).duration(0).select("#viz");
      const host = () => document.querySelector("#viz");
      const counts = () => ({
        svg: host().querySelectorAll("svg.d3plus-render-svg").length,
        canvas: host().querySelectorAll("canvas.d3plus-render-canvas").length,
      });
      const step = r => new Promise(res => viz.renderer(r).render(() => res()));
      (async () => {
        try {
          await step("svg");
          const afterSvg = counts();
          await step("canvas");
          const afterCanvas = counts();
          await step("svg");
          const afterBack = counts();
          resolve({afterSvg, afterCanvas, afterBack});
        } catch (err) {
          reject(err);
        }
      })();
    } catch (err) {
      reject(err);
    }
  });

after(closeBrowser);

it("switching renderer modes leaves no stale renderer DOM", async function () {
  this.timeout(60000);
  const body =
    '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>';
  const fp = await render(body, probeFn, builderSrc);

  assert.deepStrictEqual(
    fp.afterSvg,
    {svg: 1, canvas: 0},
    "one <svg> scene surface, no <canvas>, after the initial SVG render",
  );
  assert.deepStrictEqual(
    fp.afterCanvas,
    {svg: 0, canvas: 1},
    "the SVG surface is torn down when switching to the canvas renderer",
  );
  assert.deepStrictEqual(
    fp.afterBack,
    {svg: 1, canvas: 0},
    "the canvas surface is torn down when switching back to the SVG renderer",
  );
});
