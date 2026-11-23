import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Reference lines at statistics of the drawn rows (one, or one per
    series), quadrants, two-dimensional bands, partial lines, highlighting,
    and callouts that select their own rows with droplines, drawn on both
    renderers.
*/

const box = "<div id='viz' style='width:640px;height:400px'></div>";

// Every scene node with its surface offset, and whether it is an annotation's.
const PRELUDE = `
  const done = chart => new Promise(resolve => chart.select("#viz").duration(0).render(resolve));
  const nodes = (chart, scene = chart._sceneRenderer._scene) => {
    const out = [];
    const walk = (list, ox, oy, annotation) => list.forEach(n => {
      const t = n.transform || {};
      const x = ox + (t.x || 0), y = oy + (t.y || 0);
      const inAnnotation = annotation || String(n.key).includes("annotation-");
      out.push({node: n, x, y, annotation: inAnnotation});
      if (n.children) walk(n.children, x, y, inAnnotation);
    });
    walk(scene.root.children, 0, 0, false);
    return out;
  };
  const lines = chart => nodes(chart)
    .filter(d => d.annotation && d.node.type === "line")
    .map(d => ({key: d.node.key, stroke: d.node.paint.stroke,
      points: d.node.points.map(([px, py]) => [px + d.x, py + d.y])}));
  const texts = chart => nodes(chart)
    .filter(d => d.annotation && d.node.type === "text")
    .flatMap(d => d.node.lines.map(l => l.text));
  const data = [
    {id: "a", x: 1, y: 10}, {id: "a", x: 2, y: 20}, {id: "a", x: 3, y: 30},
    {id: "b", x: 1, y: 40}, {id: "b", x: 2, y: 50}, {id: "b", x: 3, y: 60},
  ];
`;

function page(body, arg) {
  return render(
    box,
    new Function("arg", `return (async () => { ${PRELUDE} ${body} })()`),
    arg,
  );
}

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a mean line sits where a line at the mean value does, labeled "Mean"`, async () => {
    const r = await page(
      `const chart = new d3plus.LinePlot().data(data).groupBy("id")
          .renderer(arg.renderer)
          .referenceLines([{y: "mean"}, {y: 35, label: "Same"}]);
        await done(chart);
        return {lines: lines(chart), texts: texts(chart)};`,
      {renderer},
    );
    assert.strictEqual(r.lines.length, 2);
    assert.ok(
      Math.abs(r.lines[0].points[0][1] - r.lines[1].points[0][1]) < 0.01,
      "the mean (35) and the constant line coincide",
    );
    assert.ok(r.texts.includes("Mean"));
  });

  it(`[${renderer}] perSeries: one line per series, in its color`, async () => {
    const r = await page(
      `const chart = new d3plus.LinePlot().data(data).groupBy("id")
          .renderer(arg.renderer)
          .color(d => d.id === "a" ? "#ff0000" : "#0000ff")
          .referenceLines([{y: "max", perSeries: true}]);
        await done(chart);
        return {lines: lines(chart), texts: texts(chart)};`,
      {renderer},
    );
    assert.deepStrictEqual(
      r.lines.map(l => l.stroke),
      ["#ff0000", "#0000ff"],
    );
    assert.ok(r.lines[0].points[0][1] > r.lines[1].points[0][1], "a below b");
    assert.ok(r.texts.includes("a") && r.texts.includes("b"));
  });

  it(`[${renderer}] quadrants: four fills, two dividers, and corner labels`, async () => {
    const r = await page(
      `const chart = new d3plus.Plot().data(data).groupBy("x").legend(false)
          .renderer(arg.renderer)
          .quadrants({fill: "#00ff00", topLeft: {label: "TL"}, bottomRight: {label: "BR"}});
        await done(chart);
        const rects = nodes(chart).filter(d => d.annotation && d.node.type === "rect");
        return {rects: rects.length, lines: lines(chart).length, texts: texts(chart)};`,
      {renderer},
    );
    assert.strictEqual(r.rects, 4);
    assert.strictEqual(r.lines, 2);
    assert.deepStrictEqual(r.texts.sort(), ["BR", "TL"]);
  });

  it(`[${renderer}] a partial line spans only from/to`, async () => {
    const r = await page(
      `const chart = new d3plus.LinePlot().data(data).groupBy("id")
          .renderer(arg.renderer)
          .referenceLines([{y: 25}, {y: 45, from: 2, to: 3}]);
        await done(chart);
        return lines(chart);`,
      {renderer},
    );
    const width = l => Math.abs(l.points[1][0] - l.points[0][0]);
    const ratio = width(r[1]) / width(r[0]);
    assert.ok(ratio > 0.45 && ratio < 0.55, `half the plot: ${ratio}`);
  });

  it(`[${renderer}] a 2D band shades a rectangle`, async () => {
    const r = await page(
      `const chart = new d3plus.Plot().data(data).groupBy("x").legend(false)
          .renderer(arg.renderer)
          .referenceBands([{x: [1, 2], y: [20, 40]}, {x: [1, 2]}]);
        await done(chart);
        return nodes(chart).filter(d => d.annotation && d.node.type === "rect")
          .map(d => ({width: d.node.width, height: d.node.height}));`,
      {renderer},
    );
    assert.strictEqual(r.length, 2);
    assert.ok(Math.abs(r[0].width - r[1].width) < 0.01, "same x span");
    assert.ok(r[0].height < r[1].height * 0.5, "a y span of its own");
  });

  it(`[${renderer}] highlight: the rows below the line gray out`, async () => {
    const r = await page(
      `const chart = new d3plus.Plot().data(data).groupBy("y").legend(false)
          .renderer(arg.renderer).color(() => "#ff0000")
          .referenceLines([{y: "mean", highlight: "above"}]);
        await done(chart);
        return nodes(chart, chart.toScene()).filter(d => d.node.type === "circle" && d.node.datum)
          .map(d => [d.node.datum.data ? d.node.datum.data.y : d.node.datum.y, d.node.paint.fill]);`,
      {renderer},
    );
    assert.strictEqual(r.length, 6);
    r.forEach(([y, fill]) =>
      assert.strictEqual(fill === "#ff0000", y > 35, `y ${y}: ${fill}`),
    );
  });

  it(`[${renderer}] callouts select their rows and drop lines to the axis`, async () => {
    const r = await page(
      `const chart = new d3plus.LinePlot().data(data).groupBy("id")
          .renderer(arg.renderer)
          .annotations([
            {shape: "Callout", select: "last", perSeries: true},
            {shape: "Callout", select: "max", label: "Top", dropline: true},
          ]);
        await done(chart);
        return {lines: lines(chart).map(l => l.key), texts: texts(chart)};`,
      {renderer},
    );
    assert.ok(r.texts.includes("Top"));
    assert.ok(r.texts.includes("a") && r.texts.includes("b"));
    assert.ok(r.lines.some(k => k.endsWith("-dropline-x")));
  });
}

it("small multiples: each panel draws the mean of its own rows", async () => {
  const r = await page(
    `const chart = new d3plus.Plot().data(data).groupBy("y").facet("id")
        .legend(false).referenceLines([{y: "mean"}]);
      await done(chart);
      return lines(chart).map(l => l.points[0][1]);`,
  );
  assert.strictEqual(r.length, 2);
  assert.ok(Math.abs(r[0] - r[1]) > 10, `two heights: ${r}`);
});
