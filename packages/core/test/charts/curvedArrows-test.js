import {it} from "vitest";
import assert from "assert";

import {
  arrowAlongChord,
  chordAngle,
  chordArrowNodes,
  chordEndsPathD,
  cubicArrowEdge,
  cubicPoint,
  cubicPolyline,
  edgeArrowTrims,
  pathPointBack,
  polylineArrowEdge,
} from "../../internal.ts";

const close = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} is not close to ${b}`);
const numbers = d => (d.match(/-?\d+(\.\d+)?(e-?\d+)?/g) ?? []).map(Number);

/** How far `p` lies from the line through `tip` running along `angle`. */
const offAxis = (p, tip, angle) =>
  Math.abs(
    (p[0] - tip[0]) * Math.sin(angle) - (p[1] - tip[1]) * Math.cos(angle),
  );

it("pathPointBack walks back along a polyline from its last point", () => {
  const line = [
    [0, 0],
    [10, 0],
    [10, 10],
  ];
  assert.deepStrictEqual(pathPointBack(line, 0), [10, 10]);
  assert.deepStrictEqual(pathPointBack(line, 4), [10, 6]);
  assert.deepStrictEqual(pathPointBack(line, 10), [10, 0]);
  assert.deepStrictEqual(pathPointBack(line, 13), [7, 0]);
  assert.deepStrictEqual(pathPointBack(line, 99), [0, 0], "stops at the start");
  assert.deepStrictEqual(pathPointBack(line, -5), [10, 10]);
  // Reversed, it walks from the first point.
  assert.deepStrictEqual(pathPointBack([...line].reverse(), 3), [3, 0]);
  // Repeated points (as projected map paths have) are skipped over.
  assert.deepStrictEqual(
    pathPointBack(
      [
        [0, 0],
        [5, 0],
        [5, 0],
        [8, 0],
      ],
      4,
    ),
    [4, 0],
  );
  assert.deepStrictEqual(pathPointBack([[2, 3]], 5), [2, 3]);
  assert.ok(pathPointBack([], 1).every(Number.isNaN));
});

it("cubicPolyline samples a curve from end to end", () => {
  const curve = [
    [0, 0],
    [0, 50],
    [100, 50],
    [100, 0],
  ];
  const line = cubicPolyline(curve, 8);
  assert.strictEqual(line.length, 9);
  assert.deepStrictEqual(line[0], [0, 0]);
  assert.deepStrictEqual(line[8], [100, 0]);
  assert.deepStrictEqual(line[4], cubicPoint(...curve, 0.5));
});

it("chordAngle and arrowAlongChord aim a head from its base to its tip", () => {
  close(chordAngle([0, 0], [10, 10]), Math.PI / 4);
  close(chordAngle([10, 0], [0, 0]), Math.PI);
  const end = arrowAlongChord([10, 10], [4, 2], 5);
  assert.deepStrictEqual(end.tip, [10, 10]);
  assert.deepStrictEqual(end.base, [4, 2]);
  close(end.angle, Math.atan2(8, 6));
  // The cut is on the axis, `trim` back from the tip.
  close(end.cut[0], 7);
  close(end.cut[1], 6);
});

it("chordEndsPathD extends a path straight along each arrowed end's axis", () => {
  const body = "M10,0C20,0 30,0 40,0";
  const source = {tip: [0, 0], angle: Math.PI, base: [10, 0], cut: [4, 0]};
  const target = {tip: [50, 0], angle: 0, base: [40, 0], cut: [46.666, 0]};
  assert.strictEqual(chordEndsPathD(body), body);
  assert.strictEqual(
    chordEndsPathD(body, undefined, target),
    "M10,0C20,0 30,0 40,0L46.67,0",
  );
  assert.strictEqual(
    chordEndsPathD(body, source, target),
    "M4,0L10,0C20,0 30,0 40,0L46.67,0",
  );
  assert.strictEqual(
    chordEndsPathD("M10,0A5,5 0 0,1 40,0", source),
    "M4,0L10,0A5,5 0 0,1 40,0",
  );
});

it("cubicArrowEdge ends the stroke on each head's axis, from the head's base on the curve", () => {
  const curve = [
    [0, 0],
    [0, 80],
    [100, 80],
    [100, 0],
  ];
  const trims = arrows =>
    edgeArrowTrims({arrows, arrowSize: 12, strokeWidth: 4, datum: {}, i: 0});
  assert.deepStrictEqual(cubicArrowEdge(curve, trims(false)), {
    d: "M0,0C0,80 100,80 100,0",
  });
  const edge = cubicArrowEdge(curve, trims("both"), {source: 0, target: 2});
  const line = cubicPolyline(curve, 2000);
  const onCurve = p =>
    Math.min(...line.map(q => Math.hypot(p[0] - q[0], p[1] - q[1])));
  for (const end of [edge.source, edge.target]) {
    assert.ok(onCurve(end.tip) < 0.05, "the tip is on the curve");
    assert.ok(onCurve(end.base) < 0.05, "the base is on the curve");
    close(
      Math.hypot(end.tip[0] - end.base[0], end.tip[1] - end.base[1]),
      12,
      0.1,
    );
    close(offAxis(end.cut, end.tip, end.angle), 0, 1e-9);
    close(Math.hypot(end.tip[0] - end.cut[0], end.tip[1] - end.cut[1]), 6);
  }
  // The target tip sits 2px back along the curve from its end.
  close(Math.hypot(edge.target.tip[0] - 100, edge.target.tip[1]), 2, 0.01);
  // The tangent at the end points straight down; the chord leans inward.
  assert.ok(Math.abs(edge.target.angle - Math.PI / 2) > 0.05);
  const nums = numbers(edge.d);
  assert.match(edge.d, /^M[^L]+L[^C]+C[^L]+L/);
  close(nums[0], edge.source.cut[0], 0.01);
  close(nums.at(-2), edge.target.cut[0], 0.01);
  close(nums.at(-1), edge.target.cut[1], 0.01);
});

it("chordArrowNodes draws a head at each arrowed end", () => {
  const target = {tip: [50, 0], angle: 0, base: [40, 0], cut: [45, 0]};
  const source = {tip: [0, 0], angle: Math.PI, base: [10, 0], cut: [5, 0]};
  const base = {size: 10, datum: {}, keyPrefix: "k", fill: "red"};
  const both = chordArrowNodes({...base, ends: {source, target}});
  assert.deepStrictEqual(
    both.map(n => n.key),
    ["k-t", "k-s"],
  );
  assert.strictEqual(both[0].paint.fill, "red");
  assert.deepStrictEqual(numbers(both[0].d).slice(0, 2), [50, 0]);
  const keyed = chordArrowNodes({
    ...base,
    ends: {target},
    keys: {source: "s!", target: "t!"},
    opacity: 1,
  });
  assert.strictEqual(keyed.length, 1);
  assert.strictEqual(keyed[0].key, "t!");
  assert.strictEqual(keyed[0].paint.opacity, 1);
  assert.deepStrictEqual(chordArrowNodes({...base, ends: {}}), []);
});

it("polylineArrowEdge ends the stroke on each head's axis, from the head's base on the polyline", () => {
  // A right-angle bend near the target, so the chord and the last segment differ.
  const line = [
    [0, 0],
    [100, 0],
    [100, 10],
  ];
  const trims = arrows =>
    edgeArrowTrims({arrows, arrowSize: 12, strokeWidth: 4, datum: {}, i: 0});
  assert.deepStrictEqual(polylineArrowEdge(line, trims(false)), {
    d: "M0,0L100,0L100,10",
    source: undefined,
    target: undefined,
  });
  const edge = polylineArrowEdge(line, trims("both"), {source: 3, target: 2});
  // The target tip sits 2px back along the polyline, its base 12px further.
  assert.deepStrictEqual(edge.target.tip, [100, 8]);
  assert.deepStrictEqual(edge.target.base, [96, 0]);
  close(edge.target.angle, Math.atan2(8, 4));
  assert.deepStrictEqual(edge.source.tip, [3, 0]);
  assert.deepStrictEqual(edge.source.base, [15, 0]);
  close(edge.source.angle, Math.PI);
  for (const end of [edge.source, edge.target]) {
    close(offAxis(end.cut, end.tip, end.angle), 0, 1e-9);
    close(Math.hypot(end.tip[0] - end.cut[0], end.tip[1] - end.cut[1]), 6);
  }
  // The stroke: source cut, the body between the bases, the target cut.
  const nums = numbers(edge.d);
  close(nums[0], edge.source.cut[0], 0.01);
  assert.deepStrictEqual(nums.slice(2, 4), [15, 0]);
  assert.deepStrictEqual(nums.slice(-4, -2), [96, 0]);
  close(nums.at(-2), edge.target.cut[0], 0.01);
  close(nums.at(-1), edge.target.cut[1], 0.01);
});

it("polylineArrowEdge puts the heads on the first run's start and the last run's end", () => {
  const runs = [
    [
      [0, 0],
      [50, 0],
    ],
    [
      [60, 0],
      [100, 0],
    ],
  ];
  const trims = edgeArrowTrims({
    arrows: "both",
    arrowSize: 10,
    strokeWidth: 2,
    datum: {},
    i: 0,
  });
  const edge = polylineArrowEdge(runs, trims);
  assert.deepStrictEqual(edge.source.tip, [0, 0]);
  assert.deepStrictEqual(edge.target.tip, [100, 0]);
  assert.strictEqual((edge.d.match(/M/g) ?? []).length, 2, "two runs");
  // Only the ends `trims.ends` names get a head.
  const one = polylineArrowEdge(runs, {
    ...trims,
    ends: {source: false, target: true},
  });
  assert.strictEqual(one.source, undefined);
  assert.match(one.d, /^M0,0L50,0M60,0L90,0L/);
});
