import assert from "assert";
import it from "../jsdom.js";
import {BarChart, Plot, Treemap} from "../../es/index.js";
import {autoPosition, sanitizePosition} from "../../es/src/charts/features/features.js";

// `legendPosition`/`colorScalePosition` default to "auto": the chart chooses
// (inside the chart when it fits, else right on wide charts, bottom on others).

// Stand-ins for a Viz: the helpers only read schema.width/height.
const wide = {schema: {width: 800, height: 500}};
const tall = {schema: {width: 500, height: 700}};

it("legendPosition and colorScalePosition default to \"auto\" on every chart", () => {
  for (const Chart of [Plot, BarChart, Treemap]) {
    const viz = new Chart();
    assert.strictEqual(viz.legendPosition()(), "auto", `${Chart.name} legendPosition`);
    assert.strictEqual(viz.colorScalePosition()(), "auto", `${Chart.name} colorScalePosition`);
  }
});

it("legendPosition(\"auto\") can be set explicitly, and an explicit side replaces it", () => {
  const viz = new Plot().legendPosition("left");
  assert.strictEqual(viz.legendPosition()(), "left");
  viz.legendPosition("auto");
  assert.strictEqual(viz.legendPosition()(), "auto");
});

it("autoPosition picks the right side of wide charts and the bottom of others", () => {
  assert.strictEqual(autoPosition(wide), "right");
  assert.strictEqual(autoPosition(tall), "bottom");
  assert.strictEqual(autoPosition({schema: {width: 750, height: 500}}), "bottom", "exactly 1.5x is not wide");
  assert.strictEqual(autoPosition({schema: {width: 751, height: 500}}), "right");
});

it("sanitizePosition resolves \"auto\" to a side and keeps explicit positions", () => {
  assert.strictEqual(sanitizePosition("auto", wide), "right");
  assert.strictEqual(sanitizePosition("auto", tall), "bottom");
  for (const side of ["top", "right", "bottom", "left"]) {
    assert.strictEqual(sanitizePosition(side, wide), side);
    assert.strictEqual(sanitizePosition(side, tall), side);
  }
  assert.strictEqual(sanitizePosition(false, wide), false);
  assert.strictEqual(sanitizePosition("middle", wide), "bottom", "unknown values still fall back to bottom");
});
