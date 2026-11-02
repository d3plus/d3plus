import {it} from "vitest";
import assert from "assert";

import {
  arcPathD,
  arcPointAlong,
  arcTrimmedPathD,
  arcVisibleD,
  arcEndTip,
  arrowTrim,
  cubicPathD,
  cubicPoint,
  defaultArrowSize,
  edgeArrowTrims,
  makeLinkDatum,
  ringsVisibleD,
  sankeyVisibleD,
  selfLoopD,
  selfLoopGeometry,
  straightEdgeD,
  trimCubic,
  trimSegment,
} from "../../internal.ts";

const close = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not close to ${b}`);
const numbers = d => (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);
const fakeViz = schema => ({schema: {arrowSize: undefined, ...schema}});

/** A cubic's length, measured in many chords. */
const cubicLength = (c, steps = 2000) => {
  let length = 0;
  let prev = c[0];
  for (let k = 1; k <= steps; k++) {
    const p = cubicPoint(...c, k / steps);
    length += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }
  return length;
};

it("defaultArrowSize is 3× thin strokes, capped at 12px, never under 1.5× the stroke", () => {
  assert.strictEqual(defaultArrowSize(0), 6);
  assert.strictEqual(defaultArrowSize(1), 6);
  assert.strictEqual(defaultArrowSize(3), 9);
  assert.strictEqual(defaultArrowSize(4), 12);
  assert.strictEqual(defaultArrowSize(6), 12);
  assert.strictEqual(defaultArrowSize(8), 12);
  assert.strictEqual(defaultArrowSize(10), 15);
  assert.strictEqual(defaultArrowSize(NaN), 6);
});

it("arrowTrim ends the stroke where the head is as wide as it", () => {
  // The head is 1.2 × d wide at d from its tip.
  assert.strictEqual(arrowTrim(12, 1), 6, "at least halfway along the head");
  assert.strictEqual(arrowTrim(12, 9), 7.5, "where the head is 9px wide");
  close(1.2 * arrowTrim(12, 9), 9);
  assert.strictEqual(arrowTrim(12, 30), 12, "at most the head's base");
  assert.strictEqual(arrowTrim(0, 3), 0);
  assert.strictEqual(arrowTrim(NaN, NaN), 0);
});

it("edgeArrowTrims resolves an edge's arrow ends, size, and stroke trims", () => {
  const base = {arrowSize: undefined, strokeWidth: 2, datum: {}, i: 0};
  assert.deepStrictEqual(edgeArrowTrims({...base, arrows: false}), {
    ends: {source: false, target: false},
    size: 0,
    source: 0,
    target: 0,
  });
  assert.deepStrictEqual(edgeArrowTrims({...base, arrows: true}), {
    ends: {source: false, target: true},
    size: 6,
    source: 0,
    target: 3,
  });
  const both = edgeArrowTrims({
    ...base,
    arrows: "both",
    arrowSize: d => d.size,
    datum: {size: 20},
  });
  assert.strictEqual(both.size, 20);
  assert.strictEqual(both.source, 10);
  assert.strictEqual(both.target, 10);
});

it("trimSegment shortens a segment at each end, collapsing when the cuts meet", () => {
  assert.deepStrictEqual(trimSegment([0, 0], [10, 0], 2, 3), [
    [2, 0],
    [7, 0],
  ]);
  assert.deepStrictEqual(trimSegment([0, 0], [0, 10], 0, 0), [
    [0, 0],
    [0, 10],
  ]);
  assert.deepStrictEqual(trimSegment([0, 0], [10, 0], 6, 6), [
    [5, 0],
    [5, 0],
  ]);
  assert.deepStrictEqual(trimSegment([1, 1], [1, 1], 2, 2), [
    [1, 1],
    [1, 1],
  ]);
});

it("trimCubic cuts a curve short along its own length, keeping its shape", () => {
  const curve = [
    [0, 0],
    [50, 0],
    [50, 100],
    [100, 100],
  ];
  assert.strictEqual(trimCubic(curve, 0, 0), curve);
  const cut = trimCubic(curve, 10, 20);
  close(cubicLength(curve) - cubicLength(cut), 30, 0.2);
  // The cut is the same curve: its ends and middle lie on the original.
  const onCurve = p => {
    let best = Infinity;
    for (let k = 0; k <= 4000; k++) {
      const q = cubicPoint(...curve, k / 4000);
      best = Math.min(best, Math.hypot(p[0] - q[0], p[1] - q[1]));
    }
    return best;
  };
  for (const p of [cut[0], cut[3], cubicPoint(...cut, 0.5)])
    assert.ok(onCurve(p) < 0.1, `${p} is on the curve`);
  const end = trimCubic(curve, 0, 15);
  assert.deepStrictEqual(end[0], [0, 0], "an untrimmed start stays put");
  const gone = trimCubic(curve, 500, 500);
  assert.deepStrictEqual(gone[0], gone[3], "collapses when the cuts meet");
});

it("cubicPathD writes a rounded cubic path", () => {
  assert.strictEqual(
    cubicPathD([
      [0, 0],
      [1.234, 2],
      [3, 4.5678],
      [5, 6],
    ]),
    "M0,0C1.23,2 3,4.57 5,6",
  );
});

it("straightEdgeD stops a center-to-center link inside each arrowhead", () => {
  const source = {x: 0, y: 0, r: 5};
  const target = {x: 100, y: 0, r: 10};
  assert.strictEqual(
    straightEdgeD(source, target, {source: 0, target: 4}),
    "M0,0 85,0",
    "the tip sits at r + 1 from the target's center; the stroke 4px before it",
  );
  assert.strictEqual(
    straightEdgeD(source, target, {source: 3, target: 0}),
    "M9,0 100,0",
  );
});

it("selfLoopD cuts a loop short along the loop at its arrow ends", () => {
  const loop = selfLoopGeometry({x: 0, y: 0, r: 10}, 0, 20);
  assert.strictEqual(selfLoopD(loop, {source: 0, target: 0}), loop.d);
  const cut = selfLoopD(loop, {source: 0, target: 5});
  const [x0, y0, , , , , x3, y3] = numbers(cut);
  const [ox0, oy0] = numbers(loop.d);
  assert.deepStrictEqual([x0, y0], [ox0, oy0], "the source end stays");
  // The target end moved 6px (a pixel off the edge, plus the trim) back along it.
  const end = loop.points[3];
  const moved = Math.hypot(x3 - end[0], y3 - end[1]);
  assert.ok(moved > 5 && moved <= 6.05, `${moved}`);
});

it("arcPointAlong walks an arc's ellipse from an end toward its top", () => {
  const arc = {
    from: 0,
    to: 100,
    base: 200,
    scale: 1,
    side: "above",
    orient: "horizontal",
  };
  // A semicircle of radius 50: the tip 6px up, then 10px along the circle.
  const tip = arcEndTip(arc, "target", 6);
  const p = arcPointAlong(arc, "target", 6, 10);
  close(Math.hypot(p[0] - 50, p[1] - 200), 50, 1e-6);
  const chord = Math.hypot(p[0] - tip.x, p[1] - tip.y);
  close(2 * 50 * Math.asin(chord / 100), 10, 0.01);
  // It stops at the top.
  const top = arcPointAlong(arc, "target", 6, 1000);
  close(top[0], 50);
  close(top[1], 150);
  // A flattened arc runs along the line.
  const flat = arcPointAlong({...arc, scale: 0}, "source", 6, 10);
  close(flat[0], 10, 0.05);
  close(flat[1], 200);
});

it("arcTrimmedPathD keeps the arc's ellipse and cuts its ends short", () => {
  const arc = {
    from: 0,
    to: 100,
    base: 200,
    scale: 1,
    side: "above",
    orient: "horizontal",
  };
  const none = {source: 0, target: 0};
  assert.strictEqual(arcTrimmedPathD(arc, none, none), arcPathD(arc));
  const d = arcTrimmedPathD(
    arc,
    {source: 0, target: 8},
    {source: 6, target: 6},
  );
  const [x1, y1, rx, ry, , , sweep, x2, y2] = numbers(d);
  assert.deepStrictEqual([x1, y1, rx, ry, sweep], [0, 200, 50, 50, 1]);
  close(Math.hypot(x2 - 50, y2 - 200), 50, 0.01);
  assert.ok(x2 < 100 && y2 < 200 - 6, "back along the arc past the tip");
});

it("arcVisibleD, ringsVisibleD, and sankeyVisibleD stop strokes inside arrowheads", () => {
  const a = {data: {id: "a"}, i: 0, id: "a"};
  const b = {data: {id: "b"}, i: 1, id: "b"};
  const datum = makeLinkDatum({source: "a", target: "b"}, a, b, 0);
  const off = fakeViz({arrows: false});
  const on = fakeViz({arrows: true});

  const arc = {
    from: 0,
    to: 100,
    base: 200,
    scale: 1,
    side: "above",
    orient: "horizontal",
  };
  const arcLink = {
    datum,
    index: 0,
    size: 1,
    source: {r: 4},
    target: {r: 4},
    arc,
    d: arcPathD(arc),
  };
  assert.strictEqual(arcVisibleD(off, arcLink), arcLink.d);
  assert.notStrictEqual(arcVisibleD(on, arcLink), arcLink.d);

  const straight = {
    datum,
    source: {id: "a", x: 0, y: 0, r: 5},
    target: {id: "b", x: 100, y: 0, r: 5},
  };
  assert.strictEqual(
    ringsVisibleD(off, straight, 0, 1, "M0,0 100,0"),
    "M0,0 100,0",
  );
  // A 6px head on a 1px link: the stroke ends 3px inside it.
  assert.strictEqual(
    ringsVisibleD(on, straight, 0, 1, "M0,0 100,0"),
    "M0,0 91,0",
  );
  const spline = {
    ...straight,
    spline: true,
    sourceX: 0,
    sourceY: 0,
    sourceBisectX: 30,
    sourceBisectY: 50,
    targetBisectX: 70,
    targetBisectY: 50,
    targetX: 100,
    targetY: 0,
  };
  const curved = numbers(ringsVisibleD(on, spline, 0, 1, ""));
  assert.strictEqual(curved.length, 8);
  close(Math.hypot(curved[6] - 100, curved[7]), 3, 0.05);

  const band = {
    datum,
    source: {x1: 0},
    target: {x0: 200},
    y0: 10,
    y1: 50,
    width: 20,
  };
  assert.strictEqual(sankeyVisibleD(off, band, 0, 18, "full"), "full");
  // A 20px head on an 18px band: the band ends where the head is 18px wide.
  const cut = numbers(sankeyVisibleD(on, band, 0, 18, "full"));
  close(cut[6], 200 - 15, 0.1);
  close(cut[7], 50, 0.5);
  assert.deepStrictEqual(cut.slice(0, 2), [0, 10]);
});
