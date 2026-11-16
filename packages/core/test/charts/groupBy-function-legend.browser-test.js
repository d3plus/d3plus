import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart} from "./colorScale-page.js";

/**
    A function in `groupBy` reads fields that merging sums (a row's `lon`
    here). Rows merged for the legend, a Treemap's group headers and the
    like keep the value the function gave their rows, so each legend
    swatch takes its group's color and each header its group's name.
*/

const data = [
  {slug: "a", lon: -120, value: 10},
  {slug: "b", lon: -110, value: 20},
  {slug: "c", lon: -85, value: 15},
  {slug: "d", lon: -82, value: 25},
  {slug: "e", lon: -75, value: 30},
  {slug: "f", lon: -70, value: 12},
];

const treemap = `lib => {
  const zone = d => (d.lon < -90 ? "West" : d.lon < -80 ? "Central" : "East");
  return new lib.Treemap()
    .data(${JSON.stringify(data)})
    .groupBy([zone, "slug"])
    .sum("value")
    .legend(true);
}`;

/** Each legend entry's label and fill, each mark's slug and fill, and the chart's text. */
async function read(renderer) {
  const {page, close} = await chart(treemap, renderer);
  try {
    return await page.evaluate(() => {
      const viz = window.__viz;
      const legend = [];
      const marks = {};
      const walk = (node, inLegend) => {
        const here = inLegend || node.key === "viz-legend";
        if (
          node.type === "rect" &&
          node.datum &&
          !String(node.key).endsWith("::hit")
        ) {
          if (here)
            legend.push({
              label: viz._legendClass.schema.label(node.datum, 0),
              fill: node.paint.fill,
            });
          else if (node.datum.slug && !Array.isArray(node.datum.slug))
            marks[node.datum.slug] = node.paint.fill;
        }
        (node.children || []).forEach(c => walk(c, here));
      };
      walk(viz._paintedScene.root, false);
      // The chart's text outside the legend: tile and header labels.
      const texts = [];
      const read = (node, inLegend) => {
        const here = inLegend || node.key === "viz-legend";
        if (node.type === "text" && !here)
          texts.push(node.lines.map(l => l.text).join(" "));
        (node.children || []).forEach(c => read(c, here));
      };
      read(viz._chartScene ? {children: viz._chartScene} : {}, false);
      return {legend, marks, texts};
    });
  } finally {
    await close();
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: each legend swatch takes its group's color`, async () => {
    const {legend, marks} = await read(renderer);
    const byLabel = Object.fromEntries(legend.map(e => [e.label, e.fill]));
    assert.deepStrictEqual(Object.keys(byLabel).sort(), [
      "Central",
      "East",
      "West",
    ]);
    assert.strictEqual(new Set(Object.values(byLabel)).size, 3);
    assert.strictEqual(byLabel.West, marks.a);
    assert.strictEqual(byLabel.Central, marks.c);
    assert.strictEqual(byLabel.East, marks.e);
  });
}

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: each Treemap group header names its own group`, async () => {
    const {texts} = await read(renderer);
    for (const zone of ["West", "Central", "East"])
      assert.strictEqual(
        texts.filter(t => t === zone).length,
        1,
        `${zone}: ${JSON.stringify(texts)}`,
      );
  });
}
