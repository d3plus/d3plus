import {it} from "vitest";
import assert from "assert";

import {
  arrowAlongChord,
  arrowedRibbonD,
  bandRibbonD,
  circularLinkD,
  circularLinkEdge,
  circularRibbonD,
  edgeD,
  offsetCircularShape,
  reverseEdge,
  ribbonD,
  sankeyBandThickness,
  sankeyRibbonD,
  shiftEdge,
} from "../../internal.ts";

const numbers = d => (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number);
const pairs = d => {
  const n = numbers(d);
  return Array.from({length: n.length / 2}, (_, k) => [n[2 * k], n[2 * k + 1]]);
};
const close = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not close to ${b}`);

const edge = {
  start: [0, 0],
  steps: [{to: [10, 0]}, {c1: [20, 0], c2: [20, 10], to: [30, 10]}],
};
const shape = {
  side: "top",
  xs: 210,
  sy: 32,
  xt: 0,
  ty: 42,
  laneY: 10,
  xr: 230,
  rs: 8,
  xl: -20,
  rt: 8,
};

it("edgeD writes an edge's straight runs and curves", () => {
  assert.strictEqual(edgeD(edge), "M0,0L10,0C20,0 20,10 30,10");
});

it("reverseEdge runs an edge backwards, its curves' handles swapped", () => {
  assert.deepStrictEqual(reverseEdge(edge), {
    start: [30, 10],
    steps: [{to: [10, 0], c1: [20, 10], c2: [20, 0]}, {to: [0, 0]}],
  });
  assert.deepStrictEqual(reverseEdge(reverseEdge(edge)), edge);
});

it("shiftEdge moves every point of an edge down", () => {
  assert.strictEqual(edgeD(shiftEdge(edge, 5)), "M0,5L10,5C20,5 20,15 30,15");
});

it("ribbonD closes the area between two edges", () => {
  const d = ribbonD(edge, shiftEdge(edge, 4));
  assert.strictEqual(
    d,
    "M0,0L10,0C20,0 20,10 30,10L30,14C20,14 20,4 10,4L0,4Z",
  );
});

it("bandRibbonD is the link curve moved up and down by half the band", () => {
  const d = bandRibbonD(0, 10, 200, 50, 9);
  assert.strictEqual(d, "M0,1C100,1 100,41 200,41L200,59C100,59 100,19 0,19Z");
  // Each end is as tall as the band, at any slope.
  const steep = pairs(bandRibbonD(0, 0, 20, 300, 40));
  assert.deepStrictEqual(steep[0], [0, -40]);
  assert.deepStrictEqual(steep[4], [20, 340]);
});

it("arrowedRibbonD ends square inside each head, on its axis", () => {
  const body = [
    [0, 10],
    [90, 10],
    [90, 50],
    [180, 50],
  ];
  // A head angled 30° down at the target end.
  const target = arrowAlongChord([200, 61.55], [180, 50], 6);
  const d = arrowedRibbonD(body, 5, undefined, target);
  const p = pairs(d);
  const [top, bottom] = [p[4], p[5]];
  const mid = [(top[0] + bottom[0]) / 2, (top[1] + bottom[1]) / 2];
  close(mid[0], target.cut[0], 1e-2);
  close(mid[1], target.cut[1], 1e-2);
  close(Math.hypot(top[0] - bottom[0], top[1] - bottom[1]), 10, 1e-2);
  // Square to the head's axis.
  const across = [bottom[0] - top[0], bottom[1] - top[1]];
  close(
    across[0] * Math.cos(target.angle) + across[1] * Math.sin(target.angle),
    0,
    1e-2,
  );
  assert.ok(top[1] < bottom[1], "the top edge stays on top");
  assert.ok(d.endsWith("Z"));
  // A head at the source end leads the ribbon.
  const source = arrowAlongChord([0, 10], [20, 10], 6);
  const both = pairs(arrowedRibbonD(body, 5, source, target));
  assert.deepStrictEqual(both[0], [6, 5]);
  assert.deepStrictEqual(both[both.length - 1], [6, 15]);
});

it("circularLinkEdge is the center line circularLinkD draws", () => {
  assert.strictEqual(edgeD(circularLinkEdge(shape)), circularLinkD(shape));
  assert.strictEqual(
    edgeD(circularLinkEdge(shape, 4, 2)),
    circularLinkD(shape, 4, 2),
  );
});

it("offsetCircularShape moves a band outward around the same turn centers", () => {
  const out = offsetCircularShape(shape, 3);
  assert.deepStrictEqual(
    [out.sy, out.ty, out.laneY, out.xr, out.xl, out.rs, out.rt],
    [35, 45, 7, 233, -23, 11, 11],
  );
  // The turn above the source keeps its center.
  assert.deepStrictEqual(
    [out.xr - out.rs, out.sy - out.rs],
    [shape.xr - shape.rs, shape.sy - shape.rs],
  );
  const bottom = offsetCircularShape({...shape, side: "bottom", laneY: 90}, 3);
  assert.deepStrictEqual([bottom.sy, bottom.laneY], [29, 93]);
  assert.strictEqual(offsetCircularShape(shape, -20).rs, 0);
});

it("circularRibbonD fills between the band's outer and inner edges", () => {
  const d = circularRibbonD(shape, 3);
  assert.strictEqual(
    d,
    ribbonD(
      circularLinkEdge(offsetCircularShape(shape, 3)),
      circularLinkEdge(offsetCircularShape(shape, -3)),
    ),
  );
  const ys = numbers(d).filter((_, k) => k % 2);
  assert.strictEqual(Math.min(...ys), 7, "the outer edge of the lane");
  assert.ok(numbers(d).every(Number.isFinite));
  assert.ok(circularRibbonD(shape, 3, 6, 6).startsWith("M216,35"));
});

it("sankeyBandThickness leaves a pixel each side, at least 1", () => {
  assert.strictEqual(sankeyBandThickness({width: 20}), 18);
  assert.strictEqual(sankeyBandThickness({width: 2}), 1);
  assert.strictEqual(sankeyBandThickness({}), 1);
});

it("sankeyRibbonD draws a band, or a circular link's loop", () => {
  const band = {source: {x1: 0}, target: {x0: 200}, y0: 10, y1: 50};
  assert.strictEqual(sankeyRibbonD(band, 9), bandRibbonD(0, 10, 200, 50, 9));
  assert.strictEqual(
    sankeyRibbonD({...band, circular: shape}, 3),
    circularRibbonD(shape, 3),
  );
});
