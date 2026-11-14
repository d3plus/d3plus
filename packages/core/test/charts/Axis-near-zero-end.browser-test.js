import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";

/**
    A value axis whose padded domain ends just above zero (a whisker at 5, a
    point at 5) rounds that end to zero, on both renderers, instead of ending
    on an uneven value the axis labels below its first tick ("2" under "20").
*/

const summary = [
  {id: "A", min: 12, q1: 30, median: 41, q3: 50, max: 70},
  {id: "B", min: 20, q1: 38, median: 52, q3: 60, max: 85},
  {id: "C", min: 5, q1: 22, median: 28, q3: 35, max: 48},
];

/** The y axis's numeric tick labels, lowest first. */
const yLabels = viz => {
  const nodes = sceneNodes(viz.toScene().root);
  const axis = nodes.find(n => n.key === "plot-y-axis");
  return sceneNodes(axis.children || [])
    .filter(n => n.type === "text")
    .map(n => n.lines.map(l => l.text).join(" "))
    .filter(t => /^-?\d/.test(t))
    .map(Number)
    .sort((a, b) => a - b);
};

const charts = {
  "precomputed BoxWhisker": `(lib, data) => new lib.BoxWhisker().data(data).groupBy("id").x("id")
    .boxMin("min").boxQ1("q1").boxMedian("median").boxQ3("q3").boxMax("max")`,
  Scatter: `(lib, data) => new lib.Scatter().data([...data, {id: "D", q1: 10, max: 5}]).groupBy("id").x("q1").y("max")`,
};

for (const renderer of ["svg", "canvas"])
  for (const [name, src] of Object.entries(charts))
    it(`${name} ${renderer} — the axis starts at zero, not just above it`, async () => {
      const labels = await probeChart(src, yLabels, {data: summary, renderer});
      assert.strictEqual(labels[0], 0, `y labels: ${labels}`);
      assert.ok(labels.length >= 3, `y labels: ${labels}`);
      const step = labels[2] - labels[1];
      assert.ok(
        labels[1] - labels[0] >= step,
        `no label crowds zero: ${labels}`,
      );
    });
