import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";
import {chart, tooltip} from "./axis-tooltip-page.js";

/**
    A Plot with no `discrete` whose x (else y) values include text draws that
    axis as its discrete axis (see `Plot/inferDiscrete.ts`), exactly as
    `discrete` would, on both renderers: points, axis, hover badges, and the
    shared tooltip.
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

it("Scatter — an inferred discrete axis draws as `discrete` on that axis does", async () => {
  const inferred = await probeChart(`${scatter}.x("fruit").y("value")`, read, {
    data,
  });
  const discrete = await probeChart(
    `${scatter}.x("fruit").y("value").discrete("x")`,
    read,
    {data},
  );
  assert.deepStrictEqual(byId(inferred.points), byId(discrete.points));
  assert.deepStrictEqual(inferred.xLabels, discrete.xLabels);
  assert.ok(!inferred.xLabels.includes("fruit"), "untitled, as discrete");
});

it("Scatter — an explicit `discrete` wins over the inferred axis", async () => {
  const rows = data.map(d => ({...d, grade: `Grade ${d.value % 3}`}));
  const probe = viz => ({
    discrete: viz._discrete,
    setting: viz.discrete(),
    x: viz._xAxis.scale(),
    y: viz._yAxis.scale(),
  });
  const inferred = await probeChart(`${scatter}.x("fruit").y("grade")`, probe, {
    data: rows,
  });
  assert.strictEqual(inferred.discrete, "x");
  assert.strictEqual(inferred.setting, undefined);
  assert.strictEqual(inferred.x, "point");
  const explicit = await probeChart(
    `${scatter}.x("fruit").y("grade").discrete("y")`,
    probe,
    {data: rows},
  );
  assert.strictEqual(explicit.discrete, undefined, "nothing inferred");
  assert.strictEqual(explicit.setting, "y");
  assert.strictEqual(explicit.y, "point");
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

/** The client point of the circle drawn for `id`. */
const circlePoint = (page, id) =>
  page.evaluate(id => {
    const viz = window.__viz;
    let found;
    const walk = nodes =>
      nodes.forEach(n => {
        if (!found && n.type === "circle" && n.datum && n.datum.id === id)
          found = n;
        if (n.children) walk(n.children);
      });
    walk(viz._chartScene);
    const t = found.transform || {};
    const surface = document
      .querySelector("#viz svg, #viz canvas")
      .getBoundingClientRect();
    const c = viz._chartTransform || {x: 0, y: 0};
    return [
      surface.left + c.x + (t.x || 0) + found.cx,
      surface.top + c.y + (t.y || 0) + found.cy,
    ];
  }, id);

/** Hovers the circle drawn for `id`; returns the axis badges and the tooltip. */
async function hoverPoint(src, renderer, id) {
  const {page, close} = await chart(src, renderer);
  try {
    const [x, y] = await circlePoint(page, id);
    await page.mouse.move(5, 5);
    await page.mouse.move(x, y, {steps: 3});
    await page.waitForTimeout(120);
    const badges = await page.evaluate(() => {
      const out = [];
      const walk = nodes =>
        nodes.forEach(n => {
          const badge = `${n.key}`.match(/plot-axis-hover-badge-(\w+)$/);
          if (badge) out.push([badge[1], n.children[1].lines[0].text]);
          if (n.children) walk(n.children);
        });
      walk([window.__viz._paintedScene.root]);
      return out;
    });
    const tip = await tooltip(page);
    return {badges, title: tip && tip.title, rows: tip && tip.rows};
  } finally {
    await close();
  }
}

/** Two series per category, so the shared tooltip lists a column. */
const columns = ["Apples", "Bananas", "Cherries"].flatMap((fruit, k) => [
  {id: "North", fruit, value: 10 + k * 7},
  {id: "South", fruit, value: 30 - k * 4},
]);
const columnChart = extra =>
  `lib => new lib.Scatter().data(${JSON.stringify(columns)}).groupBy("id").x("fruit").y("value")${extra}`;

for (const renderer of ["svg", "canvas"])
  it(`Scatter ${renderer} — hover badges and the shared tooltip on an inferred discrete axis`, async () => {
    const inferred = await hoverPoint(columnChart(""), renderer, "South");
    const discrete = await hoverPoint(
      columnChart(`.discrete("x")`),
      renderer,
      "South",
    );
    assert.ok(
      inferred.badges.some(([axis]) => axis === "x"),
      `badges: ${JSON.stringify(inferred.badges)}`,
    );
    assert.ok(inferred.title, "a tooltip shows");
    assert.ok(inferred.rows.length >= 2, "the shared tooltip lists a column");
    assert.deepStrictEqual(inferred, discrete);
  });
