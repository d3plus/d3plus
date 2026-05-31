import assert from "assert";
import {
  centerChartTransform,
  chartBounds,
  marginOriginTransform,
} from "../../es/src/charts/chartGeometry.js";

// A plain stand-in for a Viz: the helpers only read schema.width/height and
// the four margins, so no real instance is needed.
const viz = {
  schema: {width: 500, height: 300},
  _margin: {top: 10, right: 20, bottom: 30, left: 40},
};

it("charts/chartGeometry chartBounds subtracts margins from the svg size", () => {
  assert.deepStrictEqual(chartBounds(viz), {width: 440, height: 260});
});

it("charts/chartGeometry marginOriginTransform sits at the top-left margin", () => {
  assert.deepStrictEqual(marginOriginTransform(viz), {x: 40, y: 10});
});

it("charts/chartGeometry centerChartTransform centers within the chart area", () => {
  const {width, height} = chartBounds(viz);
  assert.deepStrictEqual(centerChartTransform(viz, width, height), {
    x: 40 + 220,
    y: 10 + 130,
  });
});
