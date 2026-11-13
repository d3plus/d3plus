import {it} from "vitest";
import assert from "assert";

import {
  arcArrowEdge,
  arcPathD,
  arcPointAlong,
  arcVisibleD,
  arcEndTip,
  arrowTrim,
  cubicPathD,
  cubicPoint,
  defaultArrowSize,
  edgeArrowTrims,
  makeLinkDatum,
  ringsVisibleD,
  selfLoopArrows,
  selfLoopD,
  selfLoopGeometry,
  straightEdgeCuts,
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
    strokeWidth: 2,
  });
  assert.deepStrictEqual(edgeArrowTrims({...base, arrows: true}), {
    ends: {source: false, target: true},
    size: 6,
    source: 0,
    target: 3,
    strokeWidth: 2,
  });
  assert.strictEqual(
    edgeArrowTrims({...base, strokeWidth: undefined, arrows: false})
      .strokeWidth,
    1,
    "an unset stroke counts as 1px wide",
  );
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

it("straightEdgeD stops a center-to-center link inside each arrowhead, else at each node's outline", () => {
  const source = {x: 0, y: 0, r: 5};
  const target = {x: 100, y: 0, r: 10};
  assert.strictEqual(
    straightEdgeD(source, target, {source: 0, target: 4}),
    "M5,0 85,0",
    "the tip sits at r + 1 from the target's center; the stroke 4px before it",
  );
  assert.strictEqual(
    straightEdgeD(source, target, {source: 3, target: 0}),
    "M9,0 90,0",
  );
  assert.strictEqual(
    straightEdgeD(source, target, {source: 0, target: 0}),
    "M5,0 90,0",
    "a hairline stops on each circle",
  );
  // An 8px stroke's square end has both corners on the circle.
  const [x0, , x1] = numbers(
    straightEdgeD(source, target, {source: 0, target: 0, strokeWidth: 8}),
  );
  close(x0, 3);
  close(x1, 100 - Math.sqrt(84));
  // A Rect node's box: the target's side is 10px out from its center.
  const box = {x: 100, y: 0, r: 4, shape: "Rect", width: 20, height: 8};
  assert.strictEqual(
    straightEdgeD(source, box, {source: 0, target: 0}),
    "M5,0 90,0",
  );
});

it("straightEdgeCuts measures each end's cut along the edge", () => {
  const cuts = straightEdgeCuts(
    {x: 0, y: 0, r: 5},
    {x: 0, y: 50, r: 6, shape: "Rect"},
    {source: 2, target: 0, strokeWidth: 2},
  );
  close(cuts.source, 8, 1e-9);
  close(cuts.target, 6);
});

it("selfLoopD follows a loop to each head's base, then runs along its axis", () => {
  const loop = selfLoopGeometry({x: 0, y: 0, r: 10}, 0, 20);
  const trims = (source, target) =>
    edgeArrowTrims({
      arrows:
        source && target ? "both" : target ? true : source ? "source" : false,
      arrowSize: 6,
      strokeWidth: 1,
      datum: {},
      i: 0,
    });
  assert.strictEqual(selfLoopD(loop, trims(false, false)), loop.d);
  const d = selfLoopD(loop, trims(false, true));
  assert.match(d, /^M[^C]+C[^L]+L[-\d.]+,[-\d.]+$/, d);
  const nums = numbers(d);
  const [ox0, oy0] = numbers(loop.d);
  assert.deepStrictEqual(nums.slice(0, 2), [ox0, oy0], "the source end stays");
  // It ends 3px (the trim) back from the tip, a pixel back along the loop.
  const [ex, ey] = nums.slice(-2);
  const tipDistance = Math.hypot(ex - loop.target.x, ey - loop.target.y);
  close(tipDistance, 3, 0.1);
  assert.match(selfLoopD(loop, trims(true, true)), /^M[^L]+L[^C]+C[^L]+L/);
});

it("a heavy loop's stroke ends on its default-sized head's axis, at both ends", () => {
  for (const sw of [1, 6, 20]) {
    const loop = selfLoopGeometry({x: 0, y: 0, r: 20}, -1, 25, sw);
    const opts = {arrows: "both", arrowSize: undefined, strokeWidth: sw};
    const trims = edgeArrowTrims({...opts, datum: {}, i: 0});
    const d = selfLoopD(loop, trims);
    const nums = numbers(d);
    const ends = {source: nums.slice(0, 2), target: nums.slice(-2)};
    const heads = selfLoopArrows({
      ...opts,
      datum: {},
      i: 0,
      keyPrefix: "k",
      loop,
    });
    for (const head of heads) {
      const end = head.key === "k-t" ? "target" : "source";
      const [tx, ty, ax, ay, bx, by] = numbers(head.d);
      // The tip sits at the loop's end, a pixel off the node.
      close(tx, loop[end].x, 0.1);
      close(ty, loop[end].y, 0.1);
      // The stroke's end lies on the head's axis, inside the head.
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const [px, py] = ends[end];
      const len = Math.hypot(tx - mx, ty - my);
      const off = ((tx - mx) * (py - my) - (ty - my) * (px - mx)) / len;
      close(off, 0, 0.1);
      const along = Math.hypot(px - tx, py - ty);
      assert.ok(along > 0 && along <= len + 0.1, `${sw} ${end}: ${along}`);
    }
  }
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

it("arcArrowEdge aims each head along its chord and ends the stroke on its axis", () => {
  const arc = {
    from: 0,
    to: 100,
    base: 200,
    scale: 1,
    side: "above",
    orient: "horizontal",
  };
  const trims = arrows =>
    edgeArrowTrims({arrows, arrowSize: 10, strokeWidth: 2, datum: {}, i: 0});
  const insets = {source: 6, target: 6};
  assert.deepStrictEqual(arcArrowEdge(arc, trims(false), insets), {
    d: arcPathD(arc),
  });
  const {d, target, source} = arcArrowEdge(arc, trims(true), insets);
  assert.strictEqual(source, undefined);
  const tip = arcEndTip(arc, "target", 6);
  assert.deepStrictEqual(target.tip, [tip.x, tip.y]);
  // The base is 10px along the circle from the tip, and the head points from it.
  close(Math.hypot(target.base[0] - 50, target.base[1] - 200), 50, 1e-6);
  close(
    target.angle,
    Math.atan2(tip.y - target.base[1], tip.x - target.base[0]),
  );
  // The stroke: the same circle from the start to the base, then along the axis.
  const nums = numbers(d);
  const [x1, y1, rx, ry, , , sweep, bx, by, cx, cy] = nums;
  assert.deepStrictEqual([x1, y1, rx, ry, sweep], [0, 200, 50, 50, 1]);
  close(bx, target.base[0], 0.01);
  close(by, target.base[1], 0.01);
  close(cx, target.cut[0], 0.01);
  close(cy, target.cut[1], 0.01);
  close(Math.hypot(tip.x - cx, tip.y - cy), 5, 0.01, "trim back from the tip");
  const both = arcArrowEdge(arc, trims("both"), insets);
  assert.match(both.d, /^M[^L]+L[^A]+A[^L]+L/);
});

it("arcVisibleD and ringsVisibleD stop strokes inside arrowheads", () => {
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
  // With no heads, the arc runs between its nodes' outlines.
  const bare = numbers(arcVisibleD(off, arcLink));
  close(Math.hypot(bare[0], bare[1] - 200), Math.sqrt(15.75), 0.05);
  close(
    Math.hypot(bare.at(-2) - 100, bare.at(-1) - 200),
    Math.sqrt(15.75),
    0.05,
  );
  assert.notStrictEqual(arcVisibleD(on, arcLink), arcLink.d);

  const straight = {
    datum,
    source: {id: "a", x: 0, y: 0, r: 5},
    target: {id: "b", x: 100, y: 0, r: 5},
  };
  const [s0, , s1] = numbers(ringsVisibleD(off, straight, 0, 1, "M0,0 100,0"));
  close(s0, Math.sqrt(24.75));
  close(s1, 100 - Math.sqrt(24.75));
  // A 6px head on a 1px link: the stroke ends 3px inside it.
  assert.match(ringsVisibleD(on, straight, 0, 1, "M0,0 100,0"), / 91,0$/);
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
  // The curve to the head's base (6px back), then 3px along its axis.
  const curved = numbers(ringsVisibleD(on, spline, 0, 1, ""));
  assert.strictEqual(curved.length, 10);
  close(Math.hypot(curved[8] - 100, curved[9]), 3, 0.05);
  close(Math.hypot(curved[6] - 100, curved[7]), 6, 0.1);
});
