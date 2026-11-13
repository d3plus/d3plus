import {it} from "vitest";
import assert from "assert";
import {fitBounds, zoomedDims} from "../../src/charts/drawSteps/zoomFit.ts";

/**
    `zoomFit.ts`: which dimensions a chart's zoom scales, and the transform
    that fits bounds to the chart's zoom area: the zoom extent less
    `zoomPadding` for a chart that zooms its picture, a Plot's plot rect
    along the axes it rescales.
*/

/** A chart that zooms its picture over a 400×300 surface. */
const picture = (zoomPadding = 20) => ({
  schema: {zoomPadding},
  _zoomBehavior: {
    translateExtent: () => [
      [0, 0],
      [400, 300],
    ],
  },
});

/**
    A Plot rescaling `axes`, its plot rect 300×200 at (60, 40) on the
    surface: ranges measured from a body at (50, 30), under a 0px x2 axis.
*/
const plot = (axes, x2Height = 0) => ({
  ...picture(),
  _plotZoomBase: {
    scales: Object.fromEntries(axes.map(a => [a, {}])),
    chartTransform: {x: 50, y: 30 + x2Height},
    pCtx: {x2Height},
    layout: {xRange: [10, 310], yRange: [10, 210]},
  },
});

/** Where bounds land under a transform. */
const land = ({k, x, y}, [[x0, y0], [x1, y1]]) => [
  [x0 * k + x, y0 * k + y],
  [x1 * k + x, y1 * k + y],
];

it("zoomedDims: a picture zoom scales both dimensions", () => {
  assert.deepStrictEqual(zoomedDims(picture()), {x: true, y: true});
});

it("zoomedDims: a Plot scales the dimensions of the axes it rescales", () => {
  assert.deepStrictEqual(zoomedDims(plot(["y"])), {x: false, y: true});
  assert.deepStrictEqual(zoomedDims(plot(["x2"])), {x: true, y: false});
  assert.deepStrictEqual(zoomedDims(plot(["x", "y2"])), {x: true, y: true});
});

it("fitBounds: a picture zoom fits the tighter dimension inside the padding and centers the box", () => {
  const t = fitBounds(picture(), [
    [100, 100],
    [180, 120],
  ]);
  // 360px of padded width for 80px, 260px of height for 20px: width decides.
  assert.strictEqual(t.k, 4.5);
  const [[x0, y0], [x1, y1]] = land(t, [
    [100, 100],
    [180, 120],
  ]);
  assert.deepStrictEqual([x0, x1], [20, 380]);
  assert.strictEqual((y0 + y1) / 2, 150);
});

it("fitBounds: a Plot zooming y alone fits the box's height to the plot rect, whatever its width", () => {
  const box = [
    [70, 100],
    [340, 150],
  ];
  const t = fitBounds(plot(["y"]), box);
  assert.strictEqual(t.k, 4);
  const [[, y0], [, y1]] = land(t, box);
  assert.deepStrictEqual([y0, y1], [40, 240]);
});

it("fitBounds: a Plot zooming x alone fits the box's width to the plot rect", () => {
  const box = [
    [110, 50],
    [170, 250],
  ];
  const t = fitBounds(plot(["x"]), box);
  assert.strictEqual(t.k, 5);
  const [[x0], [x1]] = land(t, box);
  assert.deepStrictEqual([x0, x1], [60, 360]);
});

it("fitBounds: a Plot zooming both fits the tighter one exactly and centers the other", () => {
  const box = [
    [110, 100],
    [170, 120],
  ];
  const t = fitBounds(plot(["x", "y"]), box);
  // 300/60 = 5 across, 200/20 = 10 down: across decides.
  assert.strictEqual(t.k, 5);
  const [[x0, y0], [x1, y1]] = land(t, box);
  assert.deepStrictEqual([x0, x1], [60, 360]);
  assert.strictEqual((y0 + y1) / 2, 140);
});

it("fitBounds: a Plot's y rect sits below its x2 axis", () => {
  const box = [
    [70, 100],
    [340, 150],
  ];
  const [[, y0], [, y1]] = land(fitBounds(plot(["y"], 25), box), box);
  assert.deepStrictEqual([y0, y1], [40, 240]);
});
