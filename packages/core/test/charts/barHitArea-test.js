import {it} from "vitest";
import assert from "assert";
import {
  applyBarHitArea,
  barHitsFirst,
  hitBounds,
  hitColumn,
} from "../../src/charts/Plot/barHitArea.ts";

it("hitColumn: a lone bar takes its whole slot", () => {
  assert.deepStrictEqual(hitColumn(40, 1, 0, 0), [-20, 20]);
});

it("hitColumn: grouped bars split the slot at the midpoints between them", () => {
  // Three bars 10px apart (centers at -10, 0, 10) in a 40px slot.
  assert.deepStrictEqual(hitColumn(40, 3, 0, 10), [-10, 5]);
  assert.deepStrictEqual(hitColumn(40, 3, 1, 10), [-5, 5]);
  assert.deepStrictEqual(hitColumn(40, 3, 2, 10), [-5, 10]);
});

it("hitColumn: grouped columns tile the slot without overlapping", () => {
  const step = 60,
    reach = 18,
    count = 4;
  const gap = (2 * reach) / (count - 1);
  const spans = Array.from({length: count}, (_, i) => {
    const center = -reach + i * gap;
    const [lo, hi] = hitColumn(step, count, i, reach);
    return [center + lo, center + hi];
  });
  assert.strictEqual(spans[0][0], -step / 2);
  assert.strictEqual(spans[count - 1][1], step / 2);
  for (let i = 1; i < count; i++)
    assert.ok(Math.abs(spans[i][0] - spans[i - 1][1]) < 1e-9);
});

it("hitBounds: a vertical bar's column runs the full height of the plot", () => {
  assert.deepStrictEqual(
    hitBounds("x", [-15, 15], [10, 310], {x: 80, y: 250}),
    {
      x: -15,
      y: -240,
      width: 30,
      height: 300,
    },
  );
});

it("hitBounds: a horizontal bar's column runs the full width of the plot", () => {
  assert.deepStrictEqual(hitBounds("y", [-8, 12], [0, 500], {x: 40, y: 60}), {
    x: -40,
    y: -8,
    width: 500,
    height: 20,
  });
});

it("hitBounds: a missing transform coordinate reads as 0", () => {
  assert.deepStrictEqual(hitBounds("x", [-1, 1], [0, 100], {}), {
    x: -1,
    y: 0,
    width: 2,
    height: 100,
  });
});

/** A Bar shape stand-in: records its config and places each bar at `origin`. */
const fakeShape = origin => {
  const config = {};
  return {
    config(c) {
      Object.assign(config, c);
      return this;
    },
    _sceneTransform: () => origin,
    applied: config,
  };
};

it("applyBarHitArea: sets a hitArea built from each bar's column and transform", () => {
  const s = fakeShape({x: 50, y: 200});
  applyBarHitArea(s, "x", [0, 300], () => [-10, 10]);
  assert.deepStrictEqual(s.applied.hitArea({}, 0), {
    x: -10,
    y: -200,
    width: 20,
    height: 300,
  });
});

it("applyBarHitArea: does nothing without a value extent", () => {
  const s = fakeShape({x: 0, y: 0});
  applyBarHitArea(s, "x", undefined, () => [-10, 10]);
  assert.strictEqual(s.applied.hitArea, undefined);
});

it("barHitsFirst: moves Bar hit areas in front, keeping every other node's order", () => {
  const nodes = [
    {key: "area", shapeType: "Area"},
    {key: "a::hit", shapeType: "Bar"},
    {key: "a", shapeType: "Bar"},
    {key: "line::hit", shapeType: "Line"},
    {key: "b::hit", shapeType: "Bar"},
    {key: "b", shapeType: "Bar"},
  ];
  assert.deepStrictEqual(
    barHitsFirst(nodes).map(n => n.key),
    ["a::hit", "b::hit", "area", "a", "line::hit", "b"],
  );
});

it("barHitsFirst: returns the nodes as given when there are no Bar hit areas", () => {
  const nodes = [{key: "a", shapeType: "Bar"}];
  assert.strictEqual(barHitsFirst(nodes), nodes);
});
