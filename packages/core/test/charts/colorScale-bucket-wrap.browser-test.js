import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    A color scale at the left or right of a chart whose labels are too long
    for one line, in a real browser on both renderers: drawn as a
    `bucketAxis` bar, its labels wrap onto as many lines as the gradient's
    do for the same labels (the labels left shown take the room the hidden
    ones leave them), with no two of them overlapping. The scale's room is
    an explicit `axisConfig.maxSize`.
*/

const rows = Array.from({length: 30}, (_, i) => ({
  id: `n${i}`,
  v: (((i + 1) * 137) % 1000) + i,
}));

const prefix =
  "A very long color scale label for the values that are no more than ";

/** Draws the chart and reports its color scale's painted labels' lines. */
const draw = arg =>
  new Promise(resolve => {
    const viz = new window.d3plus.Treemap()
      .data(arg.rows)
      .groupBy("id")
      .sum("v")
      .colorScale("v")
      .colorScalePosition(arg.position)
      .colorScaleConfig({
        ...arg.scale,
        axisConfig: {
          maxSize: arg.maxSize,
          tickFormat: d => `${arg.prefix}${d}`,
        },
      })
      .renderer(arg.renderer)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      const labels = [];
      const walk = (n, dy, inAxis) => {
        const y = dy + ((n.transform && n.transform.y) || 0);
        const axis = inAxis || /^Axis-/.test(String(n.key || ""));
        if (axis && n.type === "text" && n.lines.length)
          labels.push(n.lines.map(l => ({text: l.text, y: y + n.y + l.y})));
        (n.children || []).forEach(c => walk(c, y, axis));
      };
      walk(viz._paintedScene.root, 0, false);
      resolve(labels.sort((a, b) => a[0].y - b[0].y));
    });
  });

const scales = {
  gradient: {scale: "linear"},
  bucketAxis: {scale: "jenks", bucketAxis: true},
};

for (const renderer of ["svg", "canvas"])
  for (const position of ["left", "right"])
    it(`[${renderer}] a bucketAxis color scale wraps its labels as a gradient does at the ${position}`, async () => {
      const drawn = {};
      for (const [name, scale] of Object.entries(scales))
        drawn[name] = await render(
          "<div id='viz' style='width:250px;height:200px'></div>",
          draw,
          {rows, renderer, position, prefix, scale, maxSize: 105},
        );
      const lines = labels => labels.map(l => l.length);
      const fewest = labels => Math.min(...lines(labels));
      assert.ok(
        drawn.bucketAxis.length > 0 && drawn.gradient.length > 0,
        "both draw labels",
      );
      assert.ok(
        fewest(drawn.bucketAxis) >= fewest(drawn.gradient),
        `the bucketAxis wraps onto as many lines (${lines(drawn.bucketAxis)} vs ${lines(drawn.gradient)})`,
      );
      drawn.bucketAxis.forEach((label, i) => {
        const next = drawn.bucketAxis[i + 1];
        if (next)
          assert.ok(
            label[label.length - 1].y < next[0].y,
            `labels ${i} and ${i + 1} don't overlap`,
          );
      });
    });
