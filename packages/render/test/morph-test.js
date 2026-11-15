import {it} from "vitest";
import assert from "assert";

import {
  addRingPoints,
  alignRings,
  interpolateNode,
  morphPathD,
  pairRings,
  pathRings,
} from "../index.ts";

const square = "M0,0L10,0L10,10L0,10Z";

it("pathRings reads the closed rings of a straight-line path", () => {
  assert.deepStrictEqual(pathRings(square), [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ],
  ]);
  assert.deepStrictEqual(pathRings("m0,0h10v10h-10zm20,0l5,5l-5,5z"), [
    [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ],
    [
      [20, 0],
      [25, 5],
      [20, 10],
    ],
  ]);
  assert.deepStrictEqual(
    pathRings("M0,0L10,0L0,10L0,0Z"),
    [
      [
        [0, 0],
        [10, 0],
        [0, 10],
      ],
    ],
    "drops a closing point that repeats the first",
  );
});

it("pathRings is null for curves, arcs and open subpaths", () => {
  assert.strictEqual(pathRings("M0,0C1,1,2,2,3,3Z"), null);
  assert.strictEqual(pathRings("M0,0A5,5,0,0,1,10,0Z"), null);
  assert.strictEqual(pathRings("M0,0L10,0L10,10"), null);
  assert.strictEqual(pathRings("L10,0Z"), null);
});

it("addRingPoints spreads new points over the segments by length", () => {
  const ring = [
    [0, 0],
    [30, 0],
    [30, 10],
    [0, 10],
  ];
  const out = addRingPoints(ring, 4);
  assert.strictEqual(out.length, 8);
  for (const p of ring)
    assert.ok(out.some(q => q[0] === p[0] && q[1] === p[1]));
  // The long sides (30) take the new points, not the short ones (10).
  assert.deepStrictEqual(out.slice(0, 4), [
    [0, 0],
    [10, 0],
    [20, 0],
    [30, 0],
  ]);
  assert.deepStrictEqual(addRingPoints(ring, 0), ring);
});

it("alignRings gives both rings the same length, way and start", () => {
  const a = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ];
  // The same square, counterclockwise, starting at another corner, with more points.
  const b = [
    [10, 10],
    [10, 5],
    [10, 0],
    [5, 0],
    [0, 0],
    [0, 10],
  ];
  const [from, to] = alignRings(a, b);
  assert.strictEqual(from.length, to.length);
  assert.strictEqual(from.length, 6);
  const moved = from.reduce(
    (sum, p, i) => sum + Math.hypot(p[0] - to[i][0], p[1] - to[i][1]),
    0,
  );
  assert.ok(moved < 1e-9, `the squares line up (moved ${moved})`);
});

it("pairRings pairs the largest rings and shrinks the rest to their centers", () => {
  const big = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ];
  const island = [
    [200, 200],
    [210, 200],
    [210, 210],
    [200, 210],
  ];
  const circle = Array.from({length: 8}, (_, i) => [
    50 + 20 * Math.cos((i / 8) * 2 * Math.PI),
    50 + 20 * Math.sin((i / 8) * 2 * Math.PI),
  ]);
  const pairs = pairRings([island, big], [circle]);
  assert.strictEqual(pairs.length, 2);
  assert.strictEqual(pairs[0][0].length, pairs[0][1].length);
  assert.ok(pairs[0][0].some(p => p[0] === 100 && p[1] === 100));
  assert.deepStrictEqual(pairs[1][0], island);
  assert.ok(pairs[1][1].every(p => p[0] === 205 && p[1] === 205));
});

it("morphPathD ends on each path exactly and keeps every frame closed", () => {
  const outline = "M0,0L100,0L100,100L50,140L0,100ZM200,0L210,0L210,10Z";
  const circle = `M${Array.from({length: 32}, (_, i) => {
    const a = (i / 32) * 2 * Math.PI;
    return `${50 + 40 * Math.cos(a)},${50 + 40 * Math.sin(a)}`;
  }).join("L")}Z`;
  const tween = morphPathD(outline, circle);
  assert.strictEqual(tween(1), circle);
  const start = pathRings(tween(0));
  assert.strictEqual(start.length, 2);
  const mid = pathRings(tween(0.5));
  assert.strictEqual(mid.length, 2, "both rings drawn mid-tween");
  assert.strictEqual(mid[0].length, 32);
  const back = morphPathD(circle, outline);
  assert.strictEqual(back(1), outline);
});

it("morphPathD tweens paths with the same commands point by point", () => {
  const tween = morphPathD(square, "M10,10L30,10L30,30L10,30Z");
  assert.strictEqual(tween(0.5), "M5,5L20,5L20,20L5,20Z");
});

it("morphPathD falls back to the plain tween for curves and empty paths", () => {
  const curve = "M0,0C10,0,10,10,0,10Z";
  assert.strictEqual(morphPathD(square, curve)(1), curve);
  assert.strictEqual(morphPathD("", square)(1), square);
  assert.strictEqual(morphPathD(square, "")(1), "");
});

it("interpolateNode morphs a path whose new node asks for it", () => {
  const from = {type: "path", key: "a", d: "M0,0L10,0L10,10L0,10Z"};
  const to = {
    type: "path",
    key: "a",
    d: "M5,0L10,5L5,10L0,5L2,2Z",
    morph: true,
  };
  const frame = interpolateNode(from, to)(0.5);
  assert.strictEqual(pathRings(frame.d)[0].length, 5);
  assert.strictEqual(interpolateNode(from, to)(1).d, to.d);
});

it("morphPathD ends on an empty path when the target has none", () => {
  for (const to of [null, undefined, ""]) {
    assert.strictEqual(morphPathD(square, to)(1), "");
    assert.strictEqual(morphPathD(to, to)(1), "");
  }
});
