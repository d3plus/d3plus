/* global globalThis */
import {it} from "vitest";
import assert from "assert";
import {
  holdKeyHover,
  keyEntries,
  keyHull,
  keyOf,
} from "../../src/charts/features/keyHold.ts";
import mouseleave from "../../src/charts/events/mouseleave.ts";

/**
    A key entry's highlight survives the pointer crossing from one entry to
    the next, on a colorScale's swatches and on the legend's entries:
    leaving a swatch clears only its own highlight, and the gap between two
    entries holds the last one lit until the pointer reaches the next entry
    or leaves the key's outline.
*/

const bucket = color => ({color, id: color, _isColorScaleBucket: true});
const rect = (key, x, y, datum, extra = {}) => ({
  type: "rect",
  key,
  x,
  y,
  width: 10,
  height: 10,
  datum,
  ...extra,
});
const legend = {interactionGroup: "legend"};

/**
    Two 10×10 swatches 10px apart, inside a group translated by (100, 50),
    and two legend entries 10px apart below them at (100, 150).
*/
const scene = () => ({
  type: "group",
  key: "root",
  children: [
    {...rect("chart", 0, 0, {}), width: 80, height: 80},
    {
      type: "group",
      key: "colorScale",
      transform: {x: 100, y: 50},
      children: [
        rect("a", 0, 0, bucket("#a")),
        rect("b::hit", 20, 0, {__d3plus__: true, data: bucket("#b")}),
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
    {
      type: "group",
      key: "legend",
      transform: {x: 100, y: 150},
      interactionGroup: "legend",
      children: [
        rect("x", 0, 0, {id: "x"}, legend),
        rect("y", 0, 20, {id: "y"}, legend),
        {type: "text", key: "title", x: 0, y: 80, lines: [], ...legend},
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

/** A hull's [minX, maxX, minY, maxY]. */
const extent = hull => {
  const xs = hull.map(p => p[0]);
  const ys = hull.map(p => p[1]);
  return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
};

it("keyOf — a swatch, a legend entry, or neither", () => {
  assert.strictEqual(keyOf(rect("a", 0, 0, bucket("#a"))), "colorScale");
  assert.strictEqual(
    keyOf(rect("a", 0, 0, {__d3plus__: true, data: bucket("#a")})),
    "colorScale",
    "a wrapped bucket",
  );
  assert.strictEqual(keyOf(rect("x", 0, 0, {id: "x"}, legend)), "legend");
  assert.strictEqual(keyOf(rect("s", 0, 0, {id: "s"})), null, "a shape");
  assert.strictEqual(
    keyOf({type: "text", key: "t", datum: bucket("#a")}),
    null,
    "a label",
  );
  assert.strictEqual(keyOf(rect("bg", 0, 0, undefined, legend)), null);
  assert.strictEqual(keyOf(undefined), null);
});

it("keyEntries — each entry's corners in scene space", () => {
  const entries = keyEntries(scene(), "legend");
  assert.deepStrictEqual(
    entries.map(e => e.node.key),
    ["x", "y"],
  );
  assert.deepStrictEqual(entries[1].points, [
    [100, 170],
    [110, 170],
    [100, 180],
    [110, 180],
  ]);
  assert.deepStrictEqual(keyEntries(undefined, "legend"), []);
});

it("keyHull — outlines one key's entries, wrapped or not, in scene space", () => {
  const swatches = keyHull(scene(), "colorScale");
  assert.deepStrictEqual(
    extent(swatches),
    [100, 130, 50, 60],
    "both swatches, through the group's translate; not the label or chart",
  );
  assert.ok(inside(swatches, [115, 55]), "the gap between them");
  assert.ok(!inside(swatches, [40, 40]), "the chart");
  const entries = keyHull(scene(), "legend");
  assert.deepStrictEqual(extent(entries), [100, 110, 150, 180], "no title");
  assert.ok(inside(entries, [105, 165]), "the gap between entries");
});

it("keyHull — a rotated group's cells outline a diamond", () => {
  const root = {
    type: "group",
    key: "root",
    transform: {rotate: 45},
    children: [
      rect("a", 0, 0, bucket("#a")),
      rect("b", 10, 0, bucket("#b")),
      rect("c", 0, 10, bucket("#c")),
      rect("d", 10, 10, bucket("#d")),
    ],
  };
  const hull = keyHull(root, "colorScale");
  const [minX, maxX] = extent(hull);
  assert.ok(
    Math.abs(minX + 20 * Math.SQRT1_2) < 1e-9 &&
      Math.abs(maxX - 20 * Math.SQRT1_2) < 1e-9,
    "the turned square's side corners",
  );
  assert.ok(inside(hull, [0, 14]), "the diamond's middle");
  assert.ok(!inside(hull, [12, 2]), "outside its right edge");
});

it("keyHull — null without entries", () => {
  assert.strictEqual(keyHull(undefined, "colorScale"), null);
  const root = scene();
  root.children[1].children = [];
  assert.strictEqual(keyHull(root, "colorScale"), null);
});

/** A stand-in chart with `node` lit (its datum matches `_hover`) and `scene()` painted. */
const fakeViz = (node = rect("a", 0, 0, bucket("#a"))) => {
  const calls = [];
  const lit = node.datum;
  return {
    calls,
    _hoverBucket: Boolean(lit._isColorScaleBucket),
    _hover: d => d === lit,
    _lastScenePick: {node, d: lit, i: 0},
    _paintedScene: {root: scene()},
    hover(v) {
      calls.push(v);
      this._hover = v;
    },
  };
};

const move = (type, point, node, nativeType = "mousemove") => ({
  type,
  point,
  pick: node ? {node} : null,
  nativeEvent: {type: nativeType},
});

it("holdKeyHover — the gap holds the swatch until the next one", () => {
  const viz = fakeViz();
  holdKeyHover(viz, move("mouseleave", [115, 55]));
  assert.strictEqual(viz._keyHold.key, "colorScale", "held");
  holdKeyHover(viz, move("mousemove", [117, 56]));
  assert.ok(viz._keyHold, "still held in the gap");
  holdKeyHover(
    viz,
    move("mouseenter", [121, 55], rect("b", 20, 0, bucket("#b"))),
  );
  assert.strictEqual(viz._keyHold, undefined, "released to the next swatch");
  assert.deepStrictEqual(viz.calls, [], "the next swatch lights itself");
});

it("holdKeyHover — the gap holds a legend entry until the next one", () => {
  const viz = fakeViz(rect("x", 0, 0, {id: "x"}, legend));
  holdKeyHover(viz, move("mouseleave", [105, 165]));
  assert.strictEqual(viz._keyHold.key, "legend", "held");
  // A swatch of the colorScale is another key's entry.
  holdKeyHover(
    viz,
    move("mousemove", [105, 166], rect("a", 0, 0, bucket("#a"))),
  );
  assert.ok(viz._keyHold, "another key's entry doesn't release it");
  holdKeyHover(
    viz,
    move("mouseenter", [105, 172], rect("y", 0, 20, {id: "y"}, legend)),
  );
  assert.strictEqual(viz._keyHold, undefined);
  assert.deepStrictEqual(viz.calls, []);
});

it("holdKeyHover — leaving the key's outline clears it", () => {
  const viz = fakeViz();
  holdKeyHover(viz, move("mouseleave", [115, 55]));
  holdKeyHover(viz, move("mousemove", [115, 80]));
  assert.strictEqual(viz._keyHold, undefined);
  assert.deepStrictEqual(viz.calls, [false]);
  assert.strictEqual(viz._hoverBucket, false);
});

it("holdKeyHover — leaving the chart from the gap clears it", () => {
  const viz = fakeViz(rect("x", 0, 0, {id: "x"}, legend));
  holdKeyHover(viz, move("mouseleave", [105, 165]));
  viz._lastScenePick = null;
  holdKeyHover(viz, move("mouseleave", [105, 165], null, "mouseleave"));
  assert.strictEqual(viz._keyHold, undefined);
  assert.deepStrictEqual(viz.calls, [false]);
});

it("holdKeyHover — no hold off the outline, off the chart, for a shape, or for an unlit entry", () => {
  const outside = fakeViz();
  holdKeyHover(outside, move("mouseleave", [40, 40]));
  assert.strictEqual(outside._keyHold, undefined, "into the chart");
  const off = fakeViz();
  holdKeyHover(off, move("mouseleave", [115, 55], null, "mouseleave"));
  assert.strictEqual(off._keyHold, undefined, "off the chart");
  const shape = fakeViz(rect("s", 0, 0, {id: "row"}));
  holdKeyHover(shape, move("mouseleave", [115, 55]));
  assert.strictEqual(shape._keyHold, undefined, "a chart shape");
  const unlit = fakeViz();
  unlit._hover = () => false;
  holdKeyHover(unlit, move("mouseleave", [115, 55]));
  assert.strictEqual(unlit._keyHold, undefined, "another entry lit");
  const none = fakeViz();
  none._hover = false;
  holdKeyHover(none, move("mouseleave", [115, 55]));
  assert.strictEqual(none._keyHold, undefined, "nothing lit");
  for (const viz of [outside, off, shape, unlit, none])
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

/** A chart with `lit`'s highlight on, its shape hover on or (Geomap) off. */
const leaveViz = (lit, hoverOpacity = 1) => {
  const calls = [];
  const viz = {
    _id: d => d.id,
    _hoverDatum: null,
    _hover: d => (d._isColorScaleBucket ? d.color : d.id) === lit,
    hover: v => calls.push(v),
    schema: {shapeConfig: {hoverOpacity}, tooltip: () => true},
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

it("mouseleave — an entry clears its own highlight, unless held", () => {
  const own = leaveViz("#a");
  leave(own.viz, bucket("#a"));
  assert.deepStrictEqual(own.calls, [false]);
  const hold = {
    key: "colorScale",
    hull: [
      [0, 0],
      [1, 0],
      [0, 1],
    ],
  };
  const held = leaveViz("#a");
  held.viz._keyHold = hold;
  leave(held.viz, bucket("#a"));
  assert.deepStrictEqual(held.calls, []);
  const entry = leaveViz("x", 0.5);
  entry.viz._keyHold = {...hold, key: "legend"};
  leave(entry.viz, {id: "x"});
  assert.deepStrictEqual(entry.calls, [], "a held legend entry");
});

it("mouseleave — a shape on a chart without shape hover still clears", () => {
  const {viz, calls} = leaveViz("#b");
  leave(viz, {id: "row"});
  assert.deepStrictEqual(calls, [false]);
});
