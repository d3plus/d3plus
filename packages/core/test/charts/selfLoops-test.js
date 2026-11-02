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
  selfLoopExtent,
  selfLoopGeometry,
  selfLoopOpening,
  selfLoopReach,
  selfLoopSpread,
  unionBox,
  widestGapAngle,
} from "../../internal.ts";

const close = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not close to ${b}`);
const numbers = d => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

const cubic = (p, t) => {
  const m = 1 - t;
  return [0, 1].map(
    i =>
      m * m * m * p[0][i] +
      3 * m * m * t * p[1][i] +
      3 * m * t * t * p[2][i] +
      t * t * t * p[3][i],
  );
};

/**
    A loop's opening, inside its `sw` stroke: `open`, the largest circle
    on its axis clear of the stroke and the node; `neck`, how far the
    stroke stays from the axis 2px off the node's edge (where the opening
    pinches); `outer`, how far its outer edge reaches past the node's edge.
*/
function opening(node, loop, sw) {
  const pts = Array.from({length: 241}, (_, k) => cubic(loop.points, k / 240));
  const ux = Math.cos(loop.angle);
  const uy = Math.sin(loop.angle);
  const clear = d => {
    const x = node.x + ux * d;
    const y = node.y + uy * d;
    return Math.min(...pts.map(q => Math.hypot(q[0] - x, q[1] - y))) - sw / 2;
  };
  const apex = Math.hypot(loop.apex.x - node.x, loop.apex.y - node.y);
  let open = 0;
  for (let d = node.r; d < apex; d += 0.25)
    open = Math.max(open, Math.min(clear(d), d - node.r));
  const outer =
    Math.max(...pts.map(q => Math.hypot(q[0] - node.x, q[1] - node.y))) +
    sw / 2 -
    node.r;
  return {open, neck: clear(node.r + 2), outer};
}

it("isSelfLoop is true when a link's two ends are the same node", () => {
  const a = {id: "a"};
  assert.strictEqual(isSelfLoop({source: a, target: a}), true);
  assert.strictEqual(isSelfLoop({source: a, target: {id: "a"}}), true);
  assert.strictEqual(isSelfLoop({source: a, target: {id: "b"}}), false);
  assert.strictEqual(isSelfLoop({source: a, target: undefined}), false);
  assert.strictEqual(isSelfLoop({}), false);
});

it("selfLoopReach grows with the node, at least 10px", () => {
  assert.strictEqual(selfLoopReach(0), 10);
  assert.strictEqual(selfLoopReach(4), 10);
  assert.strictEqual(selfLoopReach(20), 25);
  assert.strictEqual(selfLoopReach(NaN), 10, "a bad radius falls back");
});

it("selfLoopOpening and selfLoopExtent grow with the stroke", () => {
  assert.strictEqual(selfLoopOpening(25), 25);
  assert.strictEqual(selfLoopOpening(25, 4), 29);
  assert.strictEqual(selfLoopOpening(-5, 4), 4);
  assert.strictEqual(selfLoopOpening(25, NaN), 25, "a bad stroke is none");
  assert.strictEqual(selfLoopExtent(25), 25);
  assert.strictEqual(selfLoopExtent(25, 4), 33);
  assert.strictEqual(selfLoopExtent(25, -2), 25);
});

it("a thin loop sits where a hairline loop grown by its stroke does", () => {
  const node = {x: 0, y: 0, r: 20};
  const reach = selfLoopReach(20);
  const loop = selfLoopGeometry(node, 0, reach, 1);
  // The line's far point: the reach plus one and a half strokes.
  close(loop.apex.x, 20 + reach + 1.5);
  close(loop.apex.y, 0);
  // Its ends barely move from a hairline loop of that reach.
  const hair = selfLoopGeometry(node, 0, reach + 1.5);
  for (const end of ["source", "target"])
    assert.ok(
      Math.hypot(loop[end].x - hair[end].x, loop[end].y - hair[end].y) < 1,
      end,
    );
  close(opening(node, loop, 1).outer, selfLoopExtent(reach, 1), 0.05);
});

it("a loop keeps its opening clear whatever its stroke", () => {
  for (const r of [8, 20, 40]) {
    const node = {x: 0, y: 0, r};
    const reach = selfLoopReach(r);
    let last = 0;
    for (const sw of [0, 1, r / 4, r / 2, r]) {
      const loop = selfLoopGeometry(node, 0, reach, sw);
      const o = opening(node, loop, sw);
      const at = `r ${r}, stroke ${sw}`;
      // At least a hairline loop's opening (0.6r), growing with the stroke.
      assert.ok(o.open >= 0.59 * r, `${at}: opening ${o.open}`);
      assert.ok(o.open >= last - 0.25, `${at}: ${o.open} < ${last}`);
      last = o.open;
      // It doesn't pinch shut by the node, where the arrowhead sits.
      assert.ok(o.neck >= 0.38 * r, `${at}: neck ${o.neck}`);
      // Its outer edge reaches `selfLoopExtent`.
      close(o.outer, selfLoopExtent(reach, sw), 0.05);
    }
  }
});

it("selfLoopGeometry's box covers the loop's stroke", () => {
  const node = {x: 0, y: 0, r: 10};
  const loop = selfLoopGeometry(node, 0, 15, 6);
  close(loop.box[1][0], 10 + selfLoopExtent(15, 6), 0.05);
  const [[x0, y0], [x1, y1]] = selfLoopGeometry(node, 0, 15).box;
  const [[a0, b0], [a1, b1]] = selfLoopGeometry(node, 0, 15, 0).box;
  assert.deepStrictEqual([x0, y0, x1, y1], [a0, b0, a1, b1]);
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
  // It covers the loop's drawn stroke.
  const loop = selfLoopGeometry(node, 0, 15, 10);
  const pts = Array.from({length: 49}, (_, k) => cubic(loop.points, k / 48));
  const half = Math.max(...pts.map(([x, y]) => Math.abs(Math.atan2(y, x))));
  assert.ok(heavy / 2 > half, `${heavy / 2} vs ${half}`);
});

it("selfLoopAngles centers a fan on its angle, wrapping at a full turn", () => {
  assert.deepStrictEqual(selfLoopAngles(1, []), []);
  assert.deepStrictEqual(selfLoopAngles(1, [0.5]), [1]);
  assert.deepStrictEqual(selfLoopAngles(0, [0.5, 0.5, 0.5]), [-0.5, 0, 0.5]);
  const crowded = selfLoopAngles(0, [3, 3, 3, 3]);
  close(crowded[1] - crowded[0], Math.PI / 2);
  // One loop needs no room from neighbors, however wide.
  assert.deepStrictEqual(selfLoopAngles(1, [9]), [1]);
});

it("selfLoopAngles spaces neighbors by their own spreads", () => {
  // A wide loop between two narrow ones: each gap is half of each spread.
  const [a, b, c] = selfLoopAngles(0, [0.4, 1.2, 0.4]);
  close(b - a, 0.8);
  close(c - b, 0.8);
  close(a + c, 0, 1e-9);
  // Mixed spreads are centered on the fan's angle.
  const mixed = selfLoopAngles(1, [0.2, 1, 0.6]);
  close(mixed[1] - mixed[0], 0.6);
  close(mixed[2] - mixed[1], 0.8);
  close(mixed[0] + mixed[2], 2, 1e-9);
  // Too many to fit: every gap shrinks alike so the fan closes into a full turn.
  const ring = selfLoopAngles(0, [2, 4, 2, 4]);
  const gaps = ring.slice(1).map((x, k) => x - ring[k]);
  for (const g of gaps) close(g, Math.PI / 2);
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

it("layoutSelfLoops fans a node's loops with the heaviest in the middle, each sized by its stroke", () => {
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
    reach: l => selfLoopReach(l.node.r),
    strokeWidth: l => l.w,
  });
  assert.strictEqual(out.size, 4, "a node without a position draws no loop");
  const [first, heavy, third] = loops.slice(0, 3).map(l => out.get(l));
  // The heaviest in the middle, the 2px loop next, then the 1px loop.
  const spread = w => selfLoopSpread(a, selfLoopReach(10), w);
  close(third.angle - heavy.angle, (spread(6) + spread(2)) / 2);
  close(heavy.angle - first.angle, (spread(6) + spread(1)) / 2);
  // The fan is centered on the node's direction.
  close((first.angle + third.angle) / 2, -Math.PI / 2);
  // Each loop's line sits a stroke and a half past the shared hairline reach.
  const reach = l => Math.hypot(l.apex.x, l.apex.y) - 10;
  close(reach(first), selfLoopReach(10) + 1.5);
  close(reach(heavy), selfLoopReach(10) + 9);
  close(reach(third), selfLoopReach(10) + 3);
  close(out.get(loops[3]).angle, 0);
});

it("layoutSelfLoops packs thin loops by their own strokes, not the heaviest's", () => {
  const node = {id: "a", x: 0, y: 0, r: 20};
  const reach = 12;
  const fan = weights => {
    const loops = weights.map(w => ({w}));
    const out = layoutSelfLoops(loops, {
      node: () => node,
      angle: () => 0,
      reach: () => reach,
      strokeWidth: l => l.w,
    });
    return loops.map(l => out.get(l).angle).sort((x, y) => x - y);
  };
  const thin = selfLoopSpread(node, reach, 1);
  const heavy = selfLoopSpread(node, reach, 6);
  assert.ok(2 * thin + heavy < Math.PI * 2, "the fan fits in a turn");
  const width = a => a[a.length - 1] - a[0];
  // Thin loops sit side by side as a uniform fan.
  const thins = fan([1, 1, 1]);
  close(thins[1] - thins[0], thin);
  close(thins[2] - thins[1], thin);
  // A heavy loop in the middle widens the fan only by its own share: its
  // thin neighbors sit half its spread and half theirs off it.
  const mixed = fan([6, 1, 1]);
  close(width(mixed), heavy + thin);
  assert.ok(width(thins) < width(mixed) && width(mixed) < 2 * heavy);
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
  // The tip sits a pixel back along the loop from where it meets the node.
  const tip = numbers(target[0].d).slice(0, 2);
  close(tip[0], loop.target.x, 0.1);
  close(tip[1], loop.target.y, 0.1);
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
