import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A Priestley's time axis lights the labels of the ticks its selected or
    hovered bands span (a legend hover lights its bands the same way), and
    dims the rest with the other marks.
*/

const box = "<div id='viz' style='width:600px;height:400px'></div>";

const bands = [
  {id: "early", start: 2000, end: 2003},
  {id: "late", start: 2006, end: 2010},
];

for (const renderer of ["svg", "canvas"])
  it(`[${renderer}] a Priestley lights the tick labels its selected or hovered bands span`, async () => {
    const r = await render(
      box,
      async ([data, renderer]) => {
        const chart = new window.d3plus.Priestley()
          .select("#viz")
          .renderer(renderer)
          .duration(0)
          .data(data)
          .groupBy("id")
          .axisConfig({scale: "linear", tickFormat: d => `${d}`})
          .legend(false);
        await new Promise(r => chart.render(r));
        const ticks = () => {
          const out = {};
          const walk = node => {
            if (node.type === "text" && node.hoverMatch)
              out[node.lines.map(l => l.text).join("")] =
                node.paint?.opacity ?? 1;
            (node.children || []).forEach(walk);
          };
          const scene = chart.toScene();
          (scene.root ? [scene.root] : scene.children).forEach(walk);
          return out;
        };
        const before = ticks();
        chart.selection([data[0]]);
        const selected = ticks();
        chart.selection(false);
        chart.hover(d => d.id === "late");
        const hovered = ticks();
        chart.hover(false);
        return {before, selected, hovered, after: ticks()};
      },
      [bands, renderer],
    );
    const lit = state =>
      Object.keys(state)
        .filter(k => state[k] === 1)
        .map(Number)
        .sort((a, b) => a - b);
    const all = lit(r.before);
    assert.ok(all.length > 4, `the axis labels its ticks (${all})`);
    assert.deepStrictEqual(
      lit(r.selected),
      all.filter(t => t >= 2000 && t <= 2003),
      "a selected band lights the ticks it spans",
    );
    assert.deepStrictEqual(
      lit(r.hovered),
      all.filter(t => t >= 2006 && t <= 2010),
      "a hovered band (as from its legend entry) lights its ticks",
    );
    assert.deepStrictEqual(lit(r.after), all, "no interaction, no dimming");
  });
