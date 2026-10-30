import {it} from "vitest";
import assert from "assert";
import {scaleLinear, scalePoint, scaleTime} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  anchorPoint,
  axisPixel,
  axisSpan,
  betweenCategories,
  categoryHalfStep,
  clipSpan,
  inPlot,
  isVertical,
  plotAnnotationFrame,
} from "../../src/charts/features/annotationFrame.ts";
import {
  arrowheadPoints,
  clampBox,
  connectorEndpoints,
  offsetBox,
  placeCalloutBox,
  pullBack,
} from "../../src/charts/features/calloutLayout.ts";

useJsdom();

// Pure layout helpers of callout annotations and reference lines/bands.

// A 400×300 plot at (40, 10): x 0..100 → 40..440, y 0..50 → 310..10.
const plot = {x0: 40, y0: 10, x1: 440, y1: 310};
const linear = {
  plot,
  axes: {
    x: {scale: scaleLinear().domain([0, 100]).range([40, 440])},
    y: {scale: scaleLinear().domain([0, 50]).range([310, 10])},
  },
};
const cats = ["A", "B", "C", "D"];
const point = scalePoint().domain(cats).range([90, 390]);
const categorical = (slots = false) => ({
  plot,
  axes: {
    x: {scale: v => point(v) ?? NaN, categories: cats, slots},
    y: linear.axes.y,
  },
});

it("isVertical: y and y2 run vertically", () => {
  assert.deepStrictEqual(["x", "y", "x2", "y2"].map(isVertical), [
    false,
    true,
    false,
    true,
  ]);
});

it("axisPixel: data values map through the axis scale", () => {
  assert.strictEqual(axisPixel(linear, "x", 25), 140);
  assert.strictEqual(axisPixel(linear, "y", 25), 160);
  assert.ok(Number.isNaN(axisPixel(linear, "x2", 25)), "no x2 axis");
  assert.ok(Number.isNaN(axisPixel(linear, "x", undefined)));
  assert.ok(Number.isNaN(axisPixel(linear, "x", "")));
});

it("axisPixel: plot fractions run left to right and bottom to top", () => {
  assert.strictEqual(axisPixel(linear, "x", 0, "plot"), 40);
  assert.strictEqual(axisPixel(linear, "x", 0.5, "plot"), 240);
  assert.strictEqual(axisPixel(linear, "y", 0, "plot"), 310);
  assert.strictEqual(axisPixel(linear, "y", 1, "plot"), 10);
  assert.ok(Number.isNaN(axisPixel(linear, "x", "left", "plot")));
});

it("axisPixel: a time axis parses date strings, years, and Dates", () => {
  const time = scaleTime()
    .domain([new Date(2020, 0, 1), new Date(2022, 0, 1)])
    .range([0, 200]);
  const frame = {plot, axes: {x: {scale: time, time: true}}};
  assert.strictEqual(
    axisPixel(frame, "x", new Date(2021, 0, 1)),
    time(new Date(2021, 0, 1)),
  );
  // A day is 200 / 731 px.
  const jan1 = time(new Date(2021, 0, 1));
  assert.ok(Math.abs(axisPixel(frame, "x", "2021-01-01") - jan1) < 0.3);
  assert.ok(Math.abs(axisPixel(frame, "x", 2021) - jan1) < 0.3);
});

it("axisPixel: a category axis matches its categories", () => {
  const frame = categorical();
  assert.strictEqual(axisPixel(frame, "x", "B"), point("B"));
  assert.ok(Number.isNaN(axisPixel(frame, "x", "Z")), "not a category");
});

it("betweenCategories: numbers between numeric categories interpolate", () => {
  const nums = scalePoint().domain([1, 2, 4]).range([0, 200]);
  const a = {scale: v => nums(v) ?? NaN, categories: [1, 2, 4]};
  assert.strictEqual(betweenCategories(a, 1.5), 50);
  assert.strictEqual(betweenCategories(a, 3), 150);
  assert.ok(Number.isNaN(betweenCategories(a, 5)), "past the last");
  assert.ok(Number.isNaN(betweenCategories(a, "x")), "not a number");
  assert.ok(
    Number.isNaN(betweenCategories({scale: point, categories: cats}, 1)),
    "string categories",
  );
  assert.strictEqual(
    axisPixel({plot, axes: {x: a}}, "x", 3),
    150,
    "axisPixel falls back to it",
  );
});

it("categoryHalfStep: half a category's slot on a bar axis, else 0", () => {
  assert.strictEqual(categoryHalfStep(categorical(true), "x"), 50);
  assert.strictEqual(categoryHalfStep(categorical(false), "x"), 0);
  assert.strictEqual(categoryHalfStep(linear, "x"), 0);
  const one = {
    plot,
    axes: {x: {scale: () => 240, categories: ["A"], slots: true}},
  };
  assert.strictEqual(categoryHalfStep(one, "x"), 200, "half the plot");
});

it("axisSpan: ordered extent, taking in whole bar slots", () => {
  assert.deepStrictEqual(axisSpan(linear, "x", [75, 25]), [140, 340]);
  assert.deepStrictEqual(
    axisSpan(categorical(true), "x", ["B", "C"]),
    [140, 340],
  );
  assert.deepStrictEqual(
    axisSpan(categorical(false), "x", ["B", "C"]),
    [190, 290],
  );
  assert.deepStrictEqual(
    axisSpan(linear, "x", [0.25, 0.5], "plot"),
    [140, 240],
  );
  assert.strictEqual(axisSpan(linear, "x", [0, null]), null);
});

it("clipSpan: clips to bounds, null when nothing is left", () => {
  assert.deepStrictEqual(clipSpan([0, 100], 40, 440), [40, 100]);
  assert.deepStrictEqual(clipSpan([400, 500], 40, 440), [400, 440]);
  assert.strictEqual(clipSpan([450, 500], 40, 440), null);
});

it("inPlot: inside the plot area, with half a pixel of slack", () => {
  assert.ok(inPlot([40, 10], plot));
  assert.ok(inPlot([440.4, 310.4], plot));
  assert.ok(!inPlot([441, 100], plot));
  assert.ok(!inPlot([100, 9], plot));
});

it("anchorPoint: x/y, or x2/y2 on the secondary axes", () => {
  const frame = {
    plot,
    axes: {...linear.axes, x2: {scale: v => v * 2}, y2: {scale: v => v * 3}},
  };
  assert.deepStrictEqual(anchorPoint(frame, {x: 25, y: 25}), [140, 160]);
  assert.deepStrictEqual(anchorPoint(frame, {x2: 10, y2: 10}), [20, 30]);
  assert.deepStrictEqual(
    anchorPoint(frame, {x: 0.5, y: 25}, "plot", "data"),
    [240, 160],
  );
});

it("plotAnnotationFrame: plot rect from the ranges, axes from the chart", () => {
  const axis = (scale, type) => ({_d3Scale: scale, schema: {scale: type}});
  const viz = {
    schema: {discrete: "x"},
    _xAxis: axis(point, "point"),
    _yAxis: axis(scaleLinear(), "linear"),
    _x2Axis: axis(scaleLinear(), "linear"),
    _y2Axis: axis(scaleLinear(), "time"),
    _xTime: false,
  };
  const frame = plotAnnotationFrame(viz, {
    x: (v, a) => (a === "x2" ? -1 : 1),
    y: (v, a) => (a === "y2" ? -2 : 2),
    xRange: [40, 440],
    yRange: [30, 330],
    x2Height: 20,
    y2Exists: true,
    slots: true,
  });
  assert.deepStrictEqual(frame.plot, plot, "y range less the x2 height");
  assert.deepStrictEqual(frame.axes.x.categories, cats);
  assert.strictEqual(frame.axes.x.slots, true, "bars fill the discrete axis");
  assert.strictEqual(frame.axes.y.categories, undefined);
  assert.strictEqual(frame.axes.x2, undefined, "no x2 data");
  assert.strictEqual(frame.axes.y2.time, true, "a time scale parses dates");
  assert.strictEqual(frame.axes.x.scale("A"), 1);
  assert.strictEqual(frame.axes.y2.scale(0), -2);
});

it("offsetBox: centered dx/dy from the anchor", () => {
  assert.deepStrictEqual(
    offsetBox([100, 100], {width: 40, height: 20}, 10, -30),
    {
      x: 90,
      y: 60,
      width: 40,
      height: 20,
    },
  );
});

it("clampBox: moved inside the plot, or to its top-left when larger", () => {
  const size = {width: 40, height: 20};
  assert.deepStrictEqual(clampBox({x: 20, y: 0, ...size}, plot), {
    x: 40,
    y: 10,
    ...size,
  });
  assert.deepStrictEqual(clampBox({x: 430, y: 300, ...size}, plot), {
    x: 400,
    y: 290,
    ...size,
  });
  assert.deepStrictEqual(clampBox({x: 100, y: 100, ...size}, plot), {
    x: 100,
    y: 100,
    ...size,
  });
  assert.deepStrictEqual(
    clampBox({x: 100, y: 100, width: 500, height: 20}, plot),
    {x: 40, y: 100, width: 500, height: 20},
  );
});

it("placeCalloutBox: clamps, flips off its own anchor, or stays put unclamped", () => {
  const size = {width: 60, height: 20};
  // Above an anchor near the top: clamping would cover it, so it flips below.
  const flipped = placeCalloutBox([200, 20], size, [0, -40], plot);
  assert.deepStrictEqual(flipped, {x: 170, y: 50, width: 60, height: 20});
  // Room above: no change.
  assert.deepStrictEqual(placeCalloutBox([200, 200], size, [0, -40], plot), {
    x: 170,
    y: 150,
    width: 60,
    height: 20,
  });
  // Off the right edge: slides back in.
  assert.strictEqual(placeCalloutBox([430, 200], size, [0, -40], plot).x, 380);
  // Unclamped: wherever the offset puts it.
  assert.deepStrictEqual(
    placeCalloutBox([200, 20], size, [0, -40], plot, false),
    {x: 170, y: -30, width: 60, height: 20},
  );
});

it("connectorEndpoints: from the box's edge to the anchor, less the standoff", () => {
  const box = {x: 0, y: 0, width: 40, height: 20};
  assert.deepStrictEqual(connectorEndpoints(box, [20, 60]), {
    from: [20, 20],
    to: [20, 60],
  });
  assert.deepStrictEqual(connectorEndpoints(box, [80, 10]), {
    from: [40, 10],
    to: [80, 10],
  });
  assert.deepStrictEqual(connectorEndpoints(box, [20, 60], 5), {
    from: [20, 20],
    to: [20, 55],
  });
  assert.strictEqual(connectorEndpoints(box, [10, 10]), null, "inside the box");
  assert.strictEqual(connectorEndpoints(box, [20, 20.5]), null, "too short");
});

it("arrowheadPoints: tip at the anchor, base `size` back along the line", () => {
  const [tip, a, b] = arrowheadPoints([0, 0], [0, 10], 6);
  assert.deepStrictEqual(tip, [0, 10]);
  assert.deepStrictEqual(a, [-3, 4]);
  assert.deepStrictEqual(b, [3, 4]);
});

it("pullBack: moves a line's end back toward its start", () => {
  assert.deepStrictEqual(pullBack([0, 0], [0, 10], 4), [0, 6]);
  assert.deepStrictEqual(
    pullBack([0, 0], [0, 10], 40),
    [0, 0],
    "no further than the start",
  );
  assert.deepStrictEqual(pullBack([5, 5], [5, 5], 4), [5, 5]);
});

it("LinePlot: referenceLines and referenceBands default to empty lists", () => {
  const viz = new LinePlot();
  assert.deepStrictEqual(viz.referenceLines(), []);
  assert.deepStrictEqual(viz.referenceBands(), []);
  const lines = [{y: 5}];
  assert.strictEqual(viz.referenceLines(lines).referenceLines(), lines);
  viz.config({referenceBands: [{x: [1, 2]}]});
  assert.deepStrictEqual(viz.referenceBands(), [{x: [1, 2]}]);
});
