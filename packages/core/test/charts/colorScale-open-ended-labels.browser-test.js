import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {chart} from "./colorScale-page.js";

/*
    A chart's colorScale axis rounds "inside" the data, marking its lowest
    label "< " and its highest "+". Custom `ticks` in
    `colorScaleConfig.axisConfig` leave those affixes on the end labels, and
    custom `labels` carry them only where the data reaches.
*/

const trees = ["Ash", "Birch", "Cedar", "Elm", "Fir", "Maple", "Oak"];
const values = [120, 300, 450, 640, 800, 950, 1040];
const forest = trees.map((id, i) => ({id, value: values[i]}));

const treemap = colorScaleConfig => `lib => new lib.Treemap()
  .data(${JSON.stringify(forest)})
  .groupBy("id")
  .sum("value")
  .colorScale("value")
  .colorScaleConfig(${JSON.stringify(colorScaleConfig)})`;

/** The painted colorScale axis labels, in value order. */
const axisLabels = page =>
  page.evaluate(() => {
    const found = [];
    const walk = node => {
      const data = node.datum?.data;
      if (node.type === "text" && data && "labelBounds" in data)
        found.push([data.id, node.lines.map(line => line.text).join(" ")]);
      (node.children || []).forEach(walk);
    };
    walk(window.__viz._paintedScene.root);
    return found.sort((a, b) => a[0] - b[0]).map(d => d[1]);
  });

const open = ["< 200", "400", "600", "800", "1k+"];

for (const renderer of ["svg", "canvas"]) {
  /** Renders the treemap and returns its colorScale's labels. */
  const labelsOf = async colorScaleConfig => {
    const {page, close} = await chart(treemap(colorScaleConfig), renderer);
    try {
      return await axisLabels(page);
    } finally {
      await close();
    }
  };

  it(`colorScale ticks alone keep the open-ended labels at the ends (${renderer})`, async () => {
    assert.deepStrictEqual(await labelsOf({scale: "linear"}), open);
    assert.deepStrictEqual(
      await labelsOf({
        scale: "linear",
        axisConfig: {ticks: [200, 400, 600, 800]},
      }),
      open,
      "ticks ending below the last label",
    );
    assert.deepStrictEqual(
      await labelsOf({
        scale: "linear",
        axisConfig: {ticks: [400, 600, 800, 1000]},
      }),
      open,
      "ticks starting above the first label",
    );
  });

  it(`colorScale ticks and labels together open the labels the data reaches (${renderer})`, async () => {
    const below = [200, 400, 600, 800, 900];
    assert.deepStrictEqual(
      await labelsOf({
        scale: "linear",
        axisConfig: {ticks: below, labels: below},
      }),
      ["< 200", "400", "600", "800", "900+"],
    );
    const above = [0, 400, 800, 1200];
    assert.deepStrictEqual(
      await labelsOf({
        scale: "linear",
        axisConfig: {ticks: above, labels: above},
      }),
      ["0", "400", "800", "1.2k"],
    );
  });

  it(`colorScale bucketAxis ticks alone keep the end buckets open (${renderer})`, async () => {
    assert.deepStrictEqual(
      await labelsOf({
        bucketAxis: true,
        axisConfig: {ticks: [200, 400, 600, 800, 900]},
      }),
      ["< 120", "300", "640", "800", "950+"],
    );
  });
}
