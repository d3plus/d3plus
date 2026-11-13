/* global globalThis */
import {it} from "vitest";
import assert from "assert";
import {
  bucketSwatchHull,
  holdColorScaleBucket,
} from "../../src/charts/features/colorScaleBucketHold.ts";
import mouseleave from "../../src/charts/events/mouseleave.ts";

/**
    A colorScale bucket's highlight survives the pointer crossing from one
    swatch to the next: leaving a swatch clears only its own highlight, and
    the gap between two swatches holds the last one lit until the pointer
    reaches the next swatch or leaves the swatches' outline.
*/

const bucket = color => ({color, id: color, _isColorScaleBucket: true});

/** Two 10×10 swatches 10px apart, inside a group translated by (100, 50). */
const scene = () => ({
  type: "group",
  key: "root",
  children: [
    {type: "rect", key: "chart", x: 0, y: 0, width: 80, height: 80, datum: {}},
    {
      type: "group",
      key: "colorScale",
      transform: {x: 100, y: 50},
      children: [
        {
          type: "rect",
          key: "a",
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          datum: bucket("#a"),
        },
        {
          type: "rect",
          key: "b::hit",
          x: 20,
          y: 0,
          width: 10,
          height: 10,
          datum: {__d3plus__: true, data: bucket("#b")},
        },
        {
          type: "text",
          key: "label",
          x: 0,
          y: 40,
          lines: [],
          datum: bucket("#a"),
        },
      ],
    },
  ],
});

/** Ray-cast point-in-polygon, independent of the code under test. */
const inside = (hull, [x, y]) => {
  let hit = false;
  for (let i = 0, j = hull.length - 1; i < hull.length; j = i++) {
    const [xi, yi] = hull[i];
    const [xj, yj] = hull[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      hit = !hit;
  }
  return hit;
};

it("bucketSwatchHull — outlines the swatches, wrapped or not, in scene space", () => {
  const hull = bucketSwatchHull(scene());
  const xs = hull.map(p => p[0]);
  const ys = hull.map(p => p[1]);
  assert.deepStrictEqual(
    [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)],
    [100, 130, 50, 60],
    "both swatches, through the group's translate; not the label or chart",
  );
  assert.ok(inside(hull, [115, 55]), "the gap between them");
  assert.ok(!inside(hull, [40, 40]), "the chart");
});

it("bucketSwatchHull — a rotated group's cells outline a diamond", () => {
  const root = {
    type: "group",
    key: "root",
    transform: {rotate: 45},
    children: [
      {
        type: "rect",
        key: "a",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        datum: bucket("#a"),
      },
      {
        type: "rect",
        key: "b",
        x: 10,
        y: 0,
        width: 10,
        height: 10,
        datum: bucket("#b"),
      },
      {
        type: "rect",
        key: "c",
        x: 0,
        y: 10,
        width: 10,
        height: 10,
        datum: bucket("#c"),
      },
      {
        type: "rect",
        key: "d",
        x: 10,
        y: 10,
        width: 10,
        height: 10,
        datum: bucket("#d"),
      },
    ],
  };
  const hull = bucketSwatchHull(root);
  const xs = hull.map(p => p[0]).sort((a, b) => a - b);
  assert.ok(
    Math.abs(xs[0] + 20 * Math.SQRT1_2) < 1e-9 &&
      Math.abs(xs[xs.length - 1] - 20 * Math.SQRT1_2) < 1e-9,
    "the turned square's side corners",
  );
  assert.ok(inside(hull, [0, 14]), "the diamond's middle");
  assert.ok(!inside(hull, [12, 2]), "outside its right edge");
});

it("bucketSwatchHull — null without swatches", () => {
  assert.strictEqual(bucketSwatchHull(undefined), null);
  const root = scene();
  root.children[1].children = [];
  assert.strictEqual(bucketSwatchHull(root), null);
});

/** A stand-in chart with swatch "#a" lit and `scene()` painted. */
const fakeViz = () => {
  const calls = [];
  return {
    calls,
    _hoverBucket: true,
    _hover: d => d?._isColorScaleBucket && d.color === "#a",
    _lastScenePick: {d: bucket("#a")},
    _paintedScene: {root: scene()},
    hover(v) {
      calls.push(v);
      this._hover = v;
    },
  };
};

const move = (type, point, datum, nativeType = "mousemove") => ({
  type,
  point,
  pick: datum ? {node: {type: "rect", key: "n", datum}} : null,
  nativeEvent: {type: nativeType},
});

it("holdColorScaleBucket — the gap holds the swatch until the next one", () => {
  const viz = fakeViz();
  holdColorScaleBucket(viz, move("mouseleave", [115, 55]));
  assert.ok(viz._bucketHold, "held");
  holdColorScaleBucket(viz, move("mousemove", [117, 56]));
  assert.ok(viz._bucketHold, "still held in the gap");
  holdColorScaleBucket(viz, move("mouseenter", [121, 55], bucket("#b")));
  assert.strictEqual(viz._bucketHold, undefined, "released to the next swatch");
  assert.deepStrictEqual(viz.calls, [], "the next swatch lights itself");
});

it("holdColorScaleBucket — leaving the swatches' outline clears it", () => {
  const viz = fakeViz();
  holdColorScaleBucket(viz, move("mouseleave", [115, 55]));
  holdColorScaleBucket(viz, move("mousemove", [115, 80]));
  assert.strictEqual(viz._bucketHold, undefined);
  assert.deepStrictEqual(viz.calls, [false]);
  assert.strictEqual(viz._hoverBucket, false);
});

it("holdColorScaleBucket — leaving the chart from the gap clears it", () => {
  const viz = fakeViz();
  holdColorScaleBucket(viz, move("mouseleave", [115, 55]));
  viz._lastScenePick = null;
  holdColorScaleBucket(viz, move("mouseleave", [115, 55], null, "mouseleave"));
  assert.strictEqual(viz._bucketHold, undefined);
  assert.deepStrictEqual(viz.calls, [false]);
});

it("holdColorScaleBucket — no hold off the outline, off the chart, or for a shape", () => {
  const outside = fakeViz();
  holdColorScaleBucket(outside, move("mouseleave", [40, 40]));
  assert.strictEqual(outside._bucketHold, undefined, "into the chart");
  const off = fakeViz();
  holdColorScaleBucket(off, move("mouseleave", [115, 55], null, "mouseleave"));
  assert.strictEqual(off._bucketHold, undefined, "off the chart");
  const shape = fakeViz();
  shape._lastScenePick = {d: {id: "row"}};
  holdColorScaleBucket(shape, move("mouseleave", [115, 55]));
  assert.strictEqual(shape._bucketHold, undefined, "a chart shape");
  const unlit = fakeViz();
  unlit._hoverBucket = false;
  holdColorScaleBucket(unlit, move("mouseleave", [115, 55]));
  assert.strictEqual(unlit._bucketHold, undefined, "nothing lit");
  for (const viz of [outside, off, shape, unlit])
    assert.deepStrictEqual(viz.calls, []);
});

/** Runs `mouseleave`'s deferred body synchronously. */
const leave = (viz, d) => {
  const defer = globalThis.setTimeout;
  globalThis.setTimeout = fn => fn();
  try {
    mouseleave.call(viz, d, 0);
  } finally {
    globalThis.setTimeout = defer;
  }
};

/** A Geomap-like chart (shape hover off) with swatch `lit`'s highlight on. */
const leaveViz = lit => {
  const calls = [];
  const viz = {
    _id: d => d.id,
    _hoverDatum: null,
    _hover: d => d._isColorScaleBucket && d.color === lit,
    hover: v => calls.push(v),
    schema: {shapeConfig: {hoverOpacity: 1}, tooltip: () => true},
    _select: {style: () => viz._select},
    _tooltipClass: {data: () => [], render: () => viz._tooltipClass},
  };
  return {viz, calls};
};

it("mouseleave — a swatch keeps the next swatch's highlight", () => {
  const {viz, calls} = leaveViz("#b");
  leave(viz, bucket("#a"));
  assert.deepStrictEqual(calls, []);
});

it("mouseleave — a swatch clears its own highlight, unless held", () => {
  const own = leaveViz("#a");
  leave(own.viz, bucket("#a"));
  assert.deepStrictEqual(own.calls, [false]);
  const held = leaveViz("#a");
  held.viz._bucketHold = [
    [0, 0],
    [1, 0],
    [0, 1],
  ];
  leave(held.viz, bucket("#a"));
  assert.deepStrictEqual(held.calls, []);
});

it("mouseleave — a shape on a chart without shape hover still clears", () => {
  const {viz, calls} = leaveViz("#b");
  leave(viz, {id: "row"});
  assert.deepStrictEqual(calls, [false]);
});
