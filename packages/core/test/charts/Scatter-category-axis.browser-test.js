import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";

/**
    A Plot axis with text values and no `discrete` places them as categories
    on a point scale (see `Plot/categoryAxis.ts`), on both renderers.
*/

const data = [
  {id: "a", fruit: "Apples", value: 40},
  {id: "b", fruit: "Bananas", value: 12},
  {id: "c", fruit: "Cherries", value: 33},
  {id: "d", fruit: "Bananas", value: 25},
];

/** Each point's position, and each axis's scale and tick labels. */
const read = viz => {
  const nodes = sceneNodes(viz.toScene().root);
  const body = nodes.find(n => n.key === "viz-chart-body");
  const labels = key =>
    sceneNodes(nodes.find(n => n.key === key).children || [])
      .filter(n => n.type === "text")
      .map(n => n.lines.map(l => l.text).join(" "));
  return {
    points: sceneNodes(body.children)
      .filter(n => n.type === "circle" && n.datum)
      .map(n => ({id: n.datum.id, x: n.transform.x, y: n.transform.y})),
    xScale: viz._xAxis.scale(),
    yScale: viz._yAxis.scale(),
    xLabels: labels("plot-x-axis"),
    yLabels: labels("plot-y-axis"),
  };
};

const byId = points => Object.fromEntries(points.map(p => [p.id, p]));
const finite = points =>
  points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y));

const scatter = `(lib, data) => new lib.Scatter().data(data).groupBy("id")`;

for (const renderer of ["svg", "canvas"]) {
  it(`Scatter ${renderer} — text x values place points along a category axis`, async () => {
    const out = await probeChart(`${scatter}.x("fruit").y("value")`, read, {
      data,
      renderer,
    });
    assert.strictEqual(out.points.length, 4);
    assert.ok(finite(out.points), JSON.stringify(out.points));
    assert.strictEqual(out.xScale, "point");
    assert.strictEqual(out.yScale, "linear");
    for (const fruit of ["Apples", "Bananas", "Cherries"])
      assert.ok(out.xLabels.includes(fruit), `x ticks: ${out.xLabels}`);
    const p = byId(out.points);
    assert.ok(p.a.x < p.b.x && p.b.x < p.c.x, "categories in data order");
    assert.strictEqual(p.b.x, p.d.x, "one position per category");
    assert.ok(p.a.y < p.c.y && p.c.y < p.d.y && p.d.y < p.b.y, "values on y");
  });

  it(`Scatter ${renderer} — text y values place points along a category axis`, async () => {
    const out = await probeChart(`${scatter}.x("value").y("fruit")`, read, {
      data,
      renderer,
    });
    assert.ok(finite(out.points), JSON.stringify(out.points));
    assert.strictEqual(out.xScale, "linear");
    assert.strictEqual(out.yScale, "point");
    for (const fruit of ["Apples", "Bananas", "Cherries"])
      assert.ok(out.yLabels.includes(fruit), `y ticks: ${out.yLabels}`);
    const p = byId(out.points);
    assert.strictEqual(p.b.y, p.d.y, "one position per category");
    assert.ok(p.b.x < p.d.x && p.d.x < p.c.x && p.c.x < p.a.x, "values on x");
  });
}

it("Scatter — a category axis places points as `discrete` on that axis does", async () => {
  const inferred = await probeChart(`${scatter}.x("fruit").y("value")`, read, {
    data,
  });
  const discrete = await probeChart(
    `${scatter}.x("fruit").y("value").discrete("x")`,
    read,
    {data},
  );
  // Its title stays (a discrete axis drops it), so only x is compared.
  const xs = out => out.points.map(p => [p.id, p.x]).sort();
  assert.deepStrictEqual(xs(inferred), xs(discrete));
  assert.ok(inferred.xLabels.includes("fruit"), "titled like any axis");
});

it('Scatter — `scale: "auto"` keeps a category axis\'s point scale', async () => {
  const out = await probeChart(
    `${scatter}.x("fruit").y("value").xConfig({scale: "auto"})`,
    read,
    {data},
  );
  assert.strictEqual(out.xScale, "point");
  assert.ok(finite(out.points));
});

it("Scatter — numeric strings stay on a continuous axis", async () => {
  const out = await probeChart(`${scatter}.x("year").y("value")`, read, {
    data: data.map((d, i) => ({...d, year: `${2020 + i}`})),
  });
  assert.strictEqual(out.xScale, "linear");
  assert.ok(finite(out.points));
});

it("BubbleChart — text x values place bubbles along a category axis", async () => {
  const out = await probeChart(
    `(lib, data) => new lib.BubbleChart().data(data).groupBy("id").x("fruit").y("value").size("value")`,
    read,
    {data},
  );
  assert.strictEqual(out.xScale, "point");
  assert.ok(finite(out.points), JSON.stringify(out.points));
});

it("Scatter — small multiples share a category axis's categories", async () => {
  const rows = data.flatMap(d => [
    {...d, region: "North"},
    {...d, id: `${d.id}2`, region: "South", value: d.value / 2},
  ]);
  const out = await probeChart(
    `${scatter}.x("fruit").y("value").facet("region")`,
    viz =>
      sceneNodes(viz.toScene().root)
        .filter(n => n.type === "circle" && n.datum)
        .map(n => ({x: n.transform.x, y: n.transform.y})),
    {data: rows.filter(d => d.region === "North" || d.fruit !== "Cherries")},
  );
  assert.strictEqual(out.length, 7);
  assert.ok(finite(out), JSON.stringify(out));
});

it("Scatter — `jitter` spreads points across a category axis's bands", async () => {
  const rows = ["a", "b", "c", "d", "e", "f"].map(id => ({
    id,
    fruit: "Apples",
    value: 10,
  }));
  const out = await probeChart(
    `${scatter}.x("fruit").y("value").jitter(true)`,
    read,
    {data: rows},
  );
  assert.ok(finite(out.points));
  assert.ok(new Set(out.points.map(p => p.x)).size > 1, "spread along x");
  assert.strictEqual(new Set(out.points.map(p => p.y)).size, 1);
});
