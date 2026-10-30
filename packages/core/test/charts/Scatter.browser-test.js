import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";

/**
    Scatter in a real browser, on both renderers: a point per row at its
    x and y values, on two continuous axes.
*/

const data = [
  {id: "a", x: 1.5, y: 40},
  {id: "b", x: 4, y: 12},
  {id: "c", x: 7.25, y: 33},
  {id: "d", x: 9, y: 25},
];

/** The chart's points, and each axis's tick labels. */
const points = viz => {
  const nodes = sceneNodes(viz.toScene().root);
  const body = nodes.find(n => n.key === "viz-chart-body");
  const labels = key =>
    sceneNodes(nodes.find(n => n.key === key).children || [])
      .filter(n => n.type === "text")
      .map(n => n.lines.map(l => l.text).join(" "));
  return {
    circles: sceneNodes(body.children)
      .filter(n => n.type === "circle" && n.shapeType === "Circle" && n.datum)
      .map(n => ({id: n.datum.id, r: n.r})),
    xLabels: labels("plot-x-axis"),
    yLabels: labels("plot-y-axis"),
  };
};

const src = `(lib, data) => new lib.Scatter().data(data).groupBy("id").x("x").y("y")`;

for (const renderer of ["svg", "canvas"]) {
  it(`Scatter ${renderer} — a point per row on two continuous axes`, async () => {
    const out = await probeChart(src, points, {data, renderer});
    assert.deepStrictEqual(
      out.circles.map(c => c.id),
      ["a", "b", "c", "d"],
    );
    assert.ok(
      out.circles.every(c => c.r === 5),
      "points at sizeMin",
    );
    const numeric = labels =>
      labels.filter(t => /^-?\d/.test(t)).length >= 3 &&
      !labels.some(t => ["a", "b", "c", "d"].includes(t));
    assert.ok(numeric(out.xLabels), `x ticks: ${out.xLabels}`);
    assert.ok(numeric(out.yLabels), `y ticks: ${out.yLabels}`);
  });
}

it("Scatter — a size accessor scales the points and adds a size legend", async () => {
  const out = await probeChart(
    `${src}.size("y")`,
    viz => ({
      ...points(viz),
      legend: Boolean(
        sceneNodes(viz.toScene().root).find(n => n.key === "viz-bottomRight"),
      ),
    }),
    {data},
  );
  const radii = out.circles.map(c => c.r);
  assert.strictEqual(Math.min(...radii), 5);
  assert.strictEqual(Math.max(...radii), 20);
  assert.ok(out.legend);
});
