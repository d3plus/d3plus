import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    ColorScale bucket labels in a real browser, on both renderers: a
    diverging, bucketed colorScale over computed values (means, which carry
    float noise) in roughly [-20, 100] labels its buckets at a readable
    precision, with no femto/pico/nano/micro bounds from float noise around
    zero.
*/

// Seeded observations whose per-bin means are computed values.
let seed = 3;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const rows = Array.from({length: 1500}, () => {
  const a = random() * 2 - 1;
  return {
    x: 50 + 30 * a + 10 * random(),
    y: 30 + 20 * random(),
    score: Math.round(-20 + 120 * random() * (a + 1) * 0.5),
  };
});

/** Every text label the drawn colorScale shows. */
const labels = viz => {
  const out = [];
  const walk = n => {
    if (n.type === "text") out.push(n.lines.map(l => l.text).join(" "));
    (n.children || []).forEach(walk);
  };
  const scale = viz._paintedScene.root.children.find(
    n => n.key === "viz-colorScale",
  );
  if (scale) walk(scale);
  return out;
};

const charts = {
  hexbinMean: `new d3plus.Hexbin().data(arg.rows).x("x").y("y")
    .binValue({value: "score", agg: "mean"})`,
  scatterComputed: `new d3plus.Scatter()
    .data(Array.from({length: 38}, (_, i) => ({id: i, x: i, y: i % 5, v: -20 + (120 * i) / 37})))
    .groupBy("id").x("x").y("y").colorScale("v")`,
};

for (const renderer of ["svg", "canvas"])
  for (const [name, src] of Object.entries(charts))
    it(`[${renderer}] ${name}: bucket labels carry no float-noise suffix`, async () => {
      const out = await render(
        "<div id='viz' style='width:640px;height:420px'></div>",
        new Function(
          "arg",
          `return new Promise(resolve => {
            const viz = (${src}).renderer(arg.renderer).duration(0).select("#viz");
            viz.render(() => resolve((${labels})(viz)));
          });`,
        ),
        {rows, renderer},
      );
      assert.ok(out.length > 2, `labels drawn (${out})`);
      assert.ok(
        out.every(l => !/\d\s*[fpnµ]/.test(l)),
        `no femto/pico/nano/micro bounds (${out.join(" | ")})`,
      );
      assert.ok(
        out.some(l => /(^|\s)-\d/.test(l)),
        `a diverging scale (${out.join(" | ")})`,
      );
    });
