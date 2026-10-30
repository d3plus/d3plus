import {afterEach, it} from "vitest";
import assert from "assert";
import {scaleLinear, scaleLog, scaleSqrt} from "d3-scale";
import {useJsdom} from "~test/jsdom.js";
import {BubbleChart, Plot, Scatter} from "../../index.ts";
import {
  bubbleChartDef,
  bubbleEmit,
  largestFirst,
  zeroAnchoredRadius,
} from "../../internal.ts";
import {plotSizeScale} from "../../src/charts/Plot/pipeline.ts";
import {shapeEmitters} from "../../src/charts/features/shapeEmit.ts";
import {chartBackground} from "../../src/charts/viz/backgroundInk.ts";
import {applyVizTheme} from "../../src/charts/viz/vizTheme.ts";

useJsdom();

/** A stand-in viz holding just what `plotSizeScale` reads. */
const sizing = schema => ({
  schema: {
    sizeMin: 5,
    sizeMax: 20,
    sizeScale: "sqrt",
    sizeZero: false,
    ...schema,
  },
});

it("BubbleChart — a Scatter sized by area, outlined, drawn largest first", () => {
  const viz = new BubbleChart();
  assert.ok(viz instanceof Scatter);
  assert.ok(viz instanceof Plot);
  assert.strictEqual(bubbleChartDef.name, "BubbleChart");
  assert.strictEqual(viz.shape()({}, 0), "Circle");
  assert.strictEqual(viz.sizeMax(), 40);
  assert.strictEqual(viz.sizeScale(), "sqrt");
  assert.strictEqual(viz.sizeZero(), true);
  assert.strictEqual(viz._plotShapeEmitters.Circle, bubbleEmit);
  const {Circle} = viz.shapeConfig();
  assert.strictEqual(Circle.strokeWidth(), 1);
  assert.strictEqual(Circle.stroke(), chartBackground(viz));
  assert.strictEqual(Circle.trail, true, "keeps Plot's Circle config");
});

it("BubbleChart — the outline follows the theme's background", () => {
  const stroke = theme => {
    const viz = new BubbleChart().theme(theme);
    applyVizTheme(viz);
    return [viz.shapeConfig().Circle.stroke(), chartBackground(viz)];
  };
  const [light, lightBg] = stroke("light");
  const [dark, darkBg] = stroke("dark");
  assert.strictEqual(light, lightBg);
  assert.strictEqual(dark, darkBg);
  assert.notStrictEqual(light, dark);
});

it("BubbleChart — user config wins over its defaults", () => {
  const viz = new BubbleChart().config({
    sizeMax: 25,
    sizeScale: "linear",
    sizeZero: false,
    shapeConfig: {Circle: {strokeWidth: 0}},
  });
  assert.strictEqual(viz.sizeMax(), 25);
  assert.strictEqual(viz.sizeScale(), "linear");
  assert.strictEqual(viz.sizeZero(), false);
  assert.strictEqual(viz.shapeConfig().Circle.strokeWidth, 0);
  assert.strictEqual(new BubbleChart().sizeMax(), 40, "per instance");
});

it("zeroAnchoredRadius — the smallest value's radius on a scale through zero", () => {
  assert.strictEqual(zeroAnchoredRadius(scaleSqrt, [4, 16], 40), 20);
  assert.strictEqual(zeroAnchoredRadius(scaleLinear, [5, 10], 40), 20);
  assert.strictEqual(zeroAnchoredRadius(scaleSqrt, [0, 9], 30), 0);
  assert.ok(
    Number.isNaN(zeroAnchoredRadius(scaleSqrt, [-1, 9], 30)),
    "negative",
  );
  assert.ok(
    Number.isNaN(zeroAnchoredRadius(scaleSqrt, [0, 0], 30)),
    "all zero",
  );
  assert.ok(Number.isNaN(zeroAnchoredRadius(scaleLog, [1, 9], 30)), "log");
});

it("plotSizeScale — sizeZero sizes circles by area", () => {
  const scale = plotSizeScale(
    sizing({sizeZero: true, sizeMax: 40}),
    [4, 9, 16, 100],
  );
  assert.strictEqual(scale(100), 40);
  for (const [a, b] of [
    [4, 16],
    [9, 100],
    [4, 100],
  ])
    assert.ok(
      Math.abs(scale(b) / scale(a) - Math.sqrt(b / a)) < 1e-9,
      `r(${b}) / r(${a}) is √(${b} / ${a})`,
    );
  assert.deepStrictEqual(
    scale.domain(),
    [4, 100],
    "the legend keeps the data's extent",
  );
});

it("plotSizeScale — without sizeZero, or when it can't anchor, spans sizeMin to sizeMax", () => {
  assert.deepStrictEqual(plotSizeScale(sizing(), [4, 16]).range(), [5, 20]);
  assert.deepStrictEqual(
    plotSizeScale(sizing({sizeZero: true}), [-4, 16]).range(),
    [5, 20],
    "a negative size",
  );
  assert.deepStrictEqual(
    plotSizeScale(sizing({sizeZero: true, sizeScale: "log"}), [4, 16]).range(),
    [5, 20],
    "a log scale",
  );
  assert.deepStrictEqual(
    plotSizeScale(sizing({sizeZero: true}), [7, 7]).range(),
    [20, 20],
    "a single value draws at sizeMax",
  );
});

it("largestFirst — repaints circles and their hit areas largest first, other nodes in place", () => {
  const circle = (key, r) => ({type: "circle", key, r, cx: 0, cy: 0});
  const hit = key => ({type: "rect", key: `${key}::hit`});
  const nodes = [
    circle("a", 2),
    hit("a"),
    circle("b", 9),
    hit("b"),
    circle("c", 2),
    circle("d", 5),
    {type: "text", key: "label-b"},
  ];
  const keys = largestFirst(nodes).map(n => n.key);
  assert.deepStrictEqual(keys, [
    "b",
    "b::hit",
    "d",
    "a",
    "a::hit",
    "c",
    "label-b",
  ]);
  assert.deepStrictEqual(
    nodes.map(n => n.key),
    ["a", "a::hit", "b", "b::hit", "c", "d", "label-b"],
    "input untouched",
  );
  assert.deepStrictEqual(largestFirst([]), []);
});

afterEach(() => {
  shapeEmitters.Circle = circleEmit;
});
const circleEmit = shapeEmitters.Circle;

it("bubbleEmit — emits the rows in data order, then paints largest first", () => {
  const seen = [];
  const values = [{i: 0}, {i: 1}];
  shapeEmitters.Circle = (ctx, key) => {
    seen.push([ctx.values, key]);
    return [
      {type: "circle", key: "small", r: 3},
      {type: "circle", key: "large", r: 8},
    ];
  };
  const out = bubbleEmit({viz: {}, values}, "Circle");
  assert.strictEqual(seen[0][0], values, "rows reach Plot's emitter unsorted");
  assert.strictEqual(seen[0][1], "Circle");
  assert.deepStrictEqual(
    out.map(n => n.key),
    ["large", "small"],
  );
});
