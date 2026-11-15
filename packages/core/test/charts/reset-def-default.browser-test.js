import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    RESET in Chromium, on SVG and Canvas: a Donut whose `padPixel` is set and
    then reset, directly or through `config()`, draws its arcs exactly as a
    Donut that was never configured, with Donut's own gap between them.
*/

const data = [
  {id: "alpha", value: 30},
  {id: "beta", value: 20},
  {id: "gamma", value: 50},
];

const box = "<div id='viz' style='width:400px;height:400px'></div>";

/** Runs in the page: draws a Donut, with `padPixel` reset as `mode` says, and reads back each arc's path. */
const draw = ([renderer, rows, mode]) =>
  new Promise(resolve => {
    const {Donut, RESET} = window.d3plus;
    const viz = new Donut()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .data(rows)
      .groupBy("id")
      .value("value");
    if (mode !== "fresh") viz.padPixel(30);
    if (mode === "direct") viz.padPixel(RESET);
    if (mode === "config") viz.config({padPixel: RESET});
    viz.render(() => {
      const arcs = {};
      const walk = n => {
        const key = String(n.key);
        if (
          n.type === "path" &&
          key.startsWith("pie-") &&
          !key.endsWith("::hit")
        )
          arcs[n.datum.id] = n.d;
        (n.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      const drawn = document.querySelectorAll("#viz path, #viz canvas").length;
      resolve({arcs, drawn, padPixel: viz.padPixel()});
    });
  });

for (const renderer of ["svg", "canvas"]) {
  for (const mode of ["direct", "config"]) {
    it(`Donut ${renderer}: padPixel reset (${mode}) draws Donut's default arcs`, async () => {
      const fresh = await render(box, draw, [renderer, data, "fresh"]);
      const padded = await render(box, draw, [renderer, data, "padded"]);
      const reset = await render(box, draw, [renderer, data, mode]);
      assert.ok(reset.drawn > 0, "drawn");
      assert.strictEqual(reset.padPixel, 2);
      assert.strictEqual(Object.keys(reset.arcs).length, data.length);
      for (const {id} of data) {
        assert.ok(!/NaN/.test(reset.arcs[id]), `${id}: ${reset.arcs[id]}`);
        assert.strictEqual(reset.arcs[id], fresh.arcs[id], id);
        assert.notStrictEqual(padded.arcs[id], fresh.arcs[id], `${id} padded`);
      }
    });
  }
}
