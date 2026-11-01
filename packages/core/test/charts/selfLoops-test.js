import {it} from "vitest";
import assert from "assert";

import {
  awayFromAngle,
  fanOrder,
  isSelfLoop,
  isSelfLoopMark,
  layoutSelfLoops,
  makeLinkDatum,
  selfLoopAngles,
  selfLoopArrows,
  selfLoopGeometry,
  selfLoopReach,
  selfLoopSpread,
  unionBox,
  widestGapAngle,
} from "../../internal.ts";

const close = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not close to ${b}`);
const numbers = d => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

it("isSelfLoop is true when a link's two ends are the same node", () => {
  const a = {id: "a"};
  assert.strictEqual(isSelfLoop({source: a, target: a}), true);
  assert.strictEqual(isSelfLoop({source: a, target: {id: "a"}}), true);
  assert.strictEqual(isSelfLoop({source: a, target: {id: "b"}}), false);
  assert.strictEqual(isSelfLoop({source: a, target: undefined}), false);
  assert.strictEqual(isSelfLoop({}), false);
});

it("selfLoopReach grows with the node and the stroke, at least 10px", () => {
  assert.strictEqual(selfLoopReach(0, 0), 10);
  assert.strictEqual(selfLoopReach(4, 0), 10);
  assert.strictEqual(selfLoopReach(20, 0), 25);
  assert.strictEqual(selfLoopReach(20, 4), 31);
  assert.strictEqual(selfLoopReach(NaN, NaN), 11.5, "bad inputs fall back");
});

it("selfLoopGeometry leaves and re-enters the node's edge, reaching out along its angle", () => {
  const node = {x: 100, y: 50, r: 10};
  const loop = selfLoopGeometry(node, -Math.PI / 2, 20);
  // Its far point is `reach` past the edge, straight up.
  close(loop.apex.x, 100);
  close(loop.apex.y, 50 - 10 - 20);
  close(Math.cos(loop.apex.angle), 1, 1e-9);
  // Its ends sit a pixel outside the node's edge.
  for (const end of [loop.source, loop.target]) {
    const dist = Math.hypot(end.x - 100, end.y - 50);
    assert.ok(dist > 10 && dist < 11.5, `end ${dist}px from the center`);
  }
  // Clockwise on screen: out on the left, back on the right.
  assert.ok(loop.source.x < 100 && loop.target.x > 100);
  // Both arrows point back down, into the node.
  assert.ok(Math.sin(loop.source.angle) > 0 && Math.sin(loop.target.angle) > 0);
  // The path is a single cubic with finite coordinates.
  assert.match(
    loop.d,
    /^M[-\d.]+,[-\d.]+C[-\d.]+,[-\d.]+ [-\d.]+,[-\d.]+ [-\d.]+,[-\d.]+$/,
  );
  assert.ok(numbers(loop.d).every(Number.isFinite));
  // The box holds the loop's far point and both ends.
  const [[x0, y0], [x1, y1]] = loop.box;
  for (const p of [loop.apex, loop.source, loop.target]) {
    assert.ok(p.x >= x0 - 1 && p.x <= x1 + 1 && p.y >= y0 - 1 && p.y <= y1 + 1);
  }
  assert.strictEqual(loop.angle, -Math.PI / 2);
});

it("selfLoopGeometry draws on a node with no radius without NaN", () => {
  const loop = selfLoopGeometry({x: 0, y: 0, r: 0}, 0, 12);
  assert.ok(numbers(loop.d).every(Number.isFinite));
  close(loop.apex.x, 12);
  close(loop.apex.y, 0);
});

it("selfLoopSpread is the angle a loop covers, wider with a heavier stroke", () => {
  const node = {x: 0, y: 0, r: 10};
  const thin = selfLoopSpread(node, 15);
  const heavy = selfLoopSpread(node, 15, 10);
  assert.ok(thin > 0.5 && thin < Math.PI, `${thin}`);
  assert.ok(heavy > thin);
});

it("selfLoopAngles centers a fan on its angle, wrapping at a full turn", () => {
  assert.deepStrictEqual(selfLoopAngles(1, 0, 0.5), []);
  assert.deepStrictEqual(selfLoopAngles(1, 1, 0.5), [1]);
  assert.deepStrictEqual(selfLoopAngles(0, 3, 0.5), [-0.5, 0, 0.5]);
  const crowded = selfLoopAngles(0, 4, 3);
  close(crowded[1] - crowded[0], Math.PI / 2);
});

it("fanOrder runs from the middle of a fan outward", () => {
  assert.deepStrictEqual(fanOrder(0), []);
  assert.deepStrictEqual(fanOrder(1), [0]);
  assert.deepStrictEqual(fanOrder(3), [1, 2, 0]);
  assert.deepStrictEqual(fanOrder(4), [1, 2, 0, 3]);
  assert.deepStrictEqual(fanOrder(5), [2, 3, 1, 4, 0]);
});

it("widestGapAngle points into the widest gap between neighbors", () => {
  // One neighbor to the right: point left.
  close(Math.abs(widestGapAngle([0, 0], [[10, 0]], 0)), Math.PI);
  // Neighbors right, down, and left: point up.
  close(
    widestGapAngle(
      [0, 0],
      [
        [10, 0],
        [0, 10],
        [-10, 0],
      ],
      0,
    ),
    -Math.PI / 2,
  );
  // No neighbors (or only ones on the node): the fallback.
  assert.strictEqual(widestGapAngle([0, 0], [], 2), 2);
  assert.strictEqual(widestGapAngle([1, 1], [[1, 1]], 2), 2);
});

it("awayFromAngle points out from a center, or falls back on it", () => {
  close(awayFromAngle([10, 0], [0, 0]), 0);
  close(awayFromAngle([0, -5], [0, 0]), -Math.PI / 2);
  close(awayFromAngle([3, 3], [3, 3]), -Math.PI / 2);
  assert.strictEqual(awayFromAngle([3, 3], [3, 3], 1), 1);
});

it("layoutSelfLoops sizes a node's loops alike, fanned with the heaviest in the middle", () => {
  const a = {id: "a", x: 0, y: 0, r: 10};
  const b = {id: "b", x: 100, y: 0, r: 5};
  const lost = {id: "lost", x: NaN, y: 0, r: 5};
  const loops = [
    {node: a, w: 1},
    {node: a, w: 6},
    {node: a, w: 2},
    {node: b, w: 1},
    {node: lost, w: 1},
  ];
  const out = layoutSelfLoops(loops, {
    node: l => l.node,
    angle: n => (n.id === "a" ? -Math.PI / 2 : 0),
    reach: l => selfLoopReach(l.node.r, l.w),
    strokeWidth: l => l.w,
  });
  assert.strictEqual(out.size, 4, "a node without a position draws no loop");
  const [first, heavy, third] = loops.slice(0, 3).map(l => out.get(l));
  close(heavy.angle, -Math.PI / 2);
  assert.ok(first.angle !== third.angle);
  close(first.angle + third.angle, -Math.PI, 1e-9);
  // The node's loops share the largest reach.
  const reach = l => Math.hypot(l.apex.x, l.apex.y);
  close(reach(first), reach(heavy), 1e-6);
  close(out.get(loops[3]).angle, 0);
});

it("unionBox covers both boxes", () => {
  assert.deepStrictEqual(
    unionBox(
      [
        [0, 5],
        [10, 6],
      ],
      [
        [-2, 0],
        [4, 20],
      ],
    ),
    [
      [-2, 0],
      [10, 20],
    ],
  );
});

it("selfLoopArrows draws an arrowhead at each end `arrows` selects", () => {
  const loop = selfLoopGeometry({x: 0, y: 0, r: 10}, 0, 15);
  const opts = {
    arrowSize: undefined,
    strokeWidth: 2,
    datum: {},
    i: 0,
    keyPrefix: "k",
    fill: "red",
    loop,
  };
  assert.deepStrictEqual(selfLoopArrows({...opts, arrows: false}), []);
  const target = selfLoopArrows({...opts, arrows: true});
  assert.strictEqual(target.length, 1);
  assert.strictEqual(target[0].key, "k-t");
  assert.strictEqual(target[0].paint.fill, "red");
  assert.strictEqual(target[0].interactive, false);
  const tip = numbers(target[0].d).slice(0, 2);
  close(tip[0], Math.round(loop.target.x * 100) / 100, 0.01);
  close(tip[1], Math.round(loop.target.y * 100) / 100, 0.01);
  const both = selfLoopArrows({...opts, arrows: "both"});
  assert.deepStrictEqual(
    both.map(n => n.key),
    ["k-t", "k-s"],
  );
  // A set `arrowSize` is used as given.
  const sized = selfLoopArrows({...opts, arrows: true, arrowSize: 30});
  const [x, y, bx, by] = numbers(sized[0].d);
  assert.ok(Math.hypot(x - bx, y - by) > 30);
});

it("isSelfLoopMark is true for a path drawing a link from a node to itself", () => {
  const a = {data: {id: "a"}, i: 0, id: "a"};
  const b = {data: {id: "b"}, i: 1, id: "b"};
  const loop = makeLinkDatum({source: "a", target: "a"}, a, a, 0);
  const link = makeLinkDatum({source: "a", target: "b"}, a, b, 1);
  assert.strictEqual(isSelfLoopMark({type: "path", datum: loop}), true);
  assert.strictEqual(isSelfLoopMark({type: "path", datum: link}), false);
  assert.strictEqual(isSelfLoopMark({type: "circle", datum: loop}), false);
  assert.strictEqual(isSelfLoopMark({type: "path", datum: {id: "a"}}), false);
  assert.strictEqual(isSelfLoopMark({type: "path"}), false);
});
