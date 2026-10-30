import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {probeChart, sceneNodes} from "~test/browser/helpers.js";

/**
    BubbleChart in a real browser, on both renderers: bubbles sized by area
    (radius ratios are the square roots of the value ratios, the largest at
    `sizeMax`), painted largest first, outlined in the theme's background,
    and keyed by the size legend.
*/

const data = [
  {id: "Small", region: "A", gdp: 10, life: 60, pop: 4},
  {id: "Mid", region: "B", gdp: 30, life: 70, pop: 25},
  {id: "Large", region: "A", gdp: 32, life: 71, pop: 100},
  {id: "Tiny", region: "B", gdp: 50, life: 65, pop: 1},
  {id: "Big", region: "A", gdp: 70, life: 75, pop: 64},
];

/** The chart's bubbles in paint order, and whether the size legend drew. */
const bubbles = viz => {
  const nodes = sceneNodes(viz.toScene().root);
  const body = nodes.find(n => n.key === "viz-chart-body");
  const legend = nodes.find(n => n.key === "viz-bottomRight");
  return {
    circles: sceneNodes(body.children)
      .filter(n => n.type === "circle" && n.shapeType === "Circle" && n.datum)
      .map(n => ({
        id: n.datum.id,
        pop: n.datum.data.pop,
        r: n.r,
        region: n.datum.data.region,
        fill: n.paint.fill,
        stroke: n.paint.stroke,
        strokeWidth: n.paint.strokeWidth,
      })),
    background: viz._theme.background,
    sizeLegend: legend
      ? sceneNodes(legend).filter(n => n.type === "circle").length
      : 0,
  };
};

const src = config => `(lib, data) => new lib.BubbleChart()
  .data(data)
  .groupBy("id")
  .color("region")
  .x("gdp")
  .y("life")
  .config(${JSON.stringify(config)})`;

for (const renderer of ["svg", "canvas"]) {
  it(`BubbleChart ${renderer} — sizes bubbles by area, largest first`, async () => {
    const out = await probeChart(src({size: "pop"}), bubbles, {
      data,
      renderer,
    });
    assert.strictEqual(out.circles.length, 5);
    const byId = Object.fromEntries(out.circles.map(c => [c.id, c]));
    assert.ok(Math.abs(byId.Large.r - 40) < 1e-6, "the largest at sizeMax");
    for (const a of out.circles)
      for (const b of out.circles)
        assert.ok(
          Math.abs(a.r / b.r - Math.sqrt(a.pop / b.pop)) < 1e-6,
          `r(${a.id}) / r(${b.id}) = √(${a.pop} / ${b.pop})`,
        );
    assert.deepStrictEqual(
      out.circles.map(c => c.id),
      ["Large", "Big", "Mid", "Small", "Tiny"],
      "painted largest first",
    );
    assert.ok(out.sizeLegend >= 2, "the size legend keys the sizes");
  });

  it(`BubbleChart ${renderer} — outlines each bubble in the theme's background`, async () => {
    for (const theme of ["light", "dark"]) {
      const out = await probeChart(src({size: "pop", theme}), bubbles, {
        data,
        renderer,
      });
      for (const c of out.circles) {
        assert.strictEqual(c.stroke, out.background, `${theme} outline`);
        assert.strictEqual(c.strokeWidth, 1);
      }
    }
  });
  it(`BubbleChart ${renderer} — each series keeps the color it has in a Scatter`, async () => {
    // The largest bubble is in region "B", while "A" comes first along x, so
    // assigning colors in size order would swap the two.
    const rows = data.map(d => ({
      ...d,
      region: d.id === "Large" ? "B" : d.region,
    }));
    const fills = out =>
      Object.fromEntries(out.circles.map(c => [c.region, c.fill]));
    const scatter = await probeChart(
      src({size: "pop"}).replace("BubbleChart", "Scatter"),
      bubbles,
      {data: rows, renderer},
    );
    const bubble = await probeChart(src({size: "pop"}), bubbles, {
      data: rows,
      renderer,
    });
    assert.deepStrictEqual(fills(bubble), fills(scatter));
    assert.notStrictEqual(fills(bubble).A, fills(bubble).B);
    const radii = bubble.circles.map(c => c.r);
    assert.deepStrictEqual(
      radii,
      [...radii].sort((a, b) => b - a),
      "still painted largest first",
    );
  });
}

it("BubbleChart — user config wins: sizeZero off spans sizeMin to sizeMax", async () => {
  const out = await probeChart(
    src({size: "pop", sizeZero: false, sizeMin: 10, sizeMax: 30}),
    bubbles,
    {data},
  );
  const radii = out.circles.map(c => c.r);
  assert.strictEqual(Math.max(...radii), 30);
  assert.strictEqual(Math.min(...radii), 10);
});

it("BubbleChart — without size, every bubble draws at sizeMin", async () => {
  const out = await probeChart(src({}), bubbles, {data});
  assert.deepStrictEqual(
    out.circles.map(c => c.r),
    [5, 5, 5, 5, 5],
  );
  assert.strictEqual(out.sizeLegend, 0);
});
