import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A colorScale drawn as swatches at the bottom of a chart whose labels
    don't fit whole in one row, in a real browser on both renderers: it
    lays its swatches out in more rows, so each label has more room, and
    cuts short only the labels that still don't fit, all within its third.
*/

const rows = Array.from({length: 30}, (_, i) => ({
  id: `n${i}`,
  v: (((i + 1) * 137) % 1000) + i,
}));

/** Draws the chart into `#${arg.target}` and reports its swatches' rows and labels. */
const draw = arg =>
  new Promise(resolve => {
    const format = new Function("d", `return \`${arg.format}\`;`);
    const viz = new window.d3plus.Treemap()
      .config({
        data: arg.rows,
        groupBy: "id",
        sum: "v",
        colorScale: "v",
        colorScalePosition: "bottom",
        colorScaleConfig: {
          scale: "jenks",
          axisConfig: {tickFormat: format},
        },
      })
      .renderer(arg.renderer)
      .duration(0)
      .select(`#${arg.target}`);
    viz.render(() => {
      const labels = [];
      const swatchRows = new Set();
      let bottom = 0;
      const walk = (n, dx, dy) => {
        const x = dx + ((n.transform && n.transform.x) || 0);
        const y = dy + ((n.transform && n.transform.y) || 0);
        if (n.type === "rect" && !String(n.key).endsWith("::hit")) {
          swatchRows.add(Math.round(y + n.y));
          bottom = Math.max(bottom, y + n.y + n.height);
        } else if (n.type === "text") {
          labels.push(n.lines.map(l => l.text).join(" "));
          for (const l of n.lines) bottom = Math.max(bottom, y + n.y + l.y);
        }
        (n.children || []).forEach(c => walk(c, x, y));
      };
      const scale = viz._paintedScene.root.children.find(
        n => n.key === "viz-colorScale",
      );
      if (scale) walk(scale, 0, 0);
      resolve({
        labels,
        rows: swatchRows.size,
        bottom,
        claim: viz._margin.bottom,
      });
    });
  });

/** Draws the chart at `size`, then at a size with room for every label whole. */
const drawBoth = (arg, [w, h]) =>
  render(
    `<div id='v0' style='width:${w}px;height:${h}px'></div><div id='v1' style='width:1200px;height:600px'></div>`,
    new Function(
      "arg",
      `const draw = ${draw};
      return draw({...arg, target: "v0"}).then(chart =>
        draw({...arg, target: "v1"}).then(roomy => [chart, roomy]),
      );`,
    ),
    {rows, ...arg},
  );

// Labels whose words, numbers that can't break, are too wide for the room
// one row of five swatches gives each: there, every label is cut short.
const formats = {
  "250×200": "$${d},000",
  "400×300": "$${d},000,000.00 yearly",
};

for (const renderer of ["svg", "canvas"])
  for (const [w, h] of [
    [250, 200],
    [400, 300],
  ])
    it(`[${renderer}] swatches at the bottom of a ${w}×${h} chart take more rows before they cut their labels short`, async () => {
      const format = formats[`${w}×${h}`];
      const [chart, roomy] = await drawBoth({renderer, format}, [w, h]);
      assert.strictEqual(roomy.labels.length, 5, `whole (${roomy.labels})`);
      assert.strictEqual(chart.labels.length, 5, `labeled (${chart.labels})`);
      const cut = chart.labels.filter((l, i) => l !== roomy.labels[i]);
      assert.ok(chart.rows > 1, `in more than one row (${chart.rows})`);
      assert.ok(
        cut.length < 5,
        `fewer labels cut short than in one row (${cut.length} of 5)`,
      );
      assert.ok(
        cut.every(l => l.endsWith("...")),
        `cut ones end in "..." (${cut.join(" | ")})`,
      );
      assert.ok(
        chart.claim <= h / 3,
        `the scale takes at most a third (${chart.claim})`,
      );
      assert.ok(chart.bottom <= h, `within the chart (${chart.bottom})`);
    });
