import {it} from "vitest";
import assert from "assert";
import {
  bestStretch,
  bestStretchAt,
  curvature,
  labelBand,
  PointGrid,
  resample,
  scoreStretch,
} from "../../src/charts/Plot/lineLabelsAlong.ts";
import {
  lineLabelSides,
  rowLabelsAlong,
} from "../../src/charts/Plot/lineLabelSides.ts";

const close = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

it("lineLabelSides and rowLabelsAlong — along labels claim no end", () => {
  assert.deepStrictEqual(lineLabelSides("along"), []);
  assert.strictEqual(rowLabelsAlong("along", {}, 0), true);
  assert.strictEqual(rowLabelsAlong(true, {}, 0), false);
  assert.strictEqual(
    rowLabelsAlong(d => (d.id === "a" ? "along" : "end"), {id: "a"}, 0),
    true,
  );
  assert.strictEqual(
    rowLabelsAlong(() => "end", {id: "b"}, 0),
    false,
  );
});

it("PointGrid — the nearest obstacle within a cell", () => {
  const grid = new PointGrid(10);
  grid.add([
    [0, 0],
    [25, 0],
  ]);
  assert.strictEqual(grid.nearest([3, 4]), 5);
  assert.strictEqual(grid.nearest([18, 0]), 7);
  assert.strictEqual(grid.nearest([60, 60]), Infinity, "out of reach");
});

it("PointGrid — a lookup can ignore a tag's points", () => {
  const grid = new PointGrid(10);
  grid.add([[0, 0]], 1);
  grid.add([[8, 0]], 2);
  grid.add([[0, 9]]);
  assert.strictEqual(grid.nearest([1, 0]), 1);
  assert.strictEqual(grid.nearest([1, 0], 1), 7, "skips tag 1");
  assert.strictEqual(grid.nearest([0, 8], -1), 1, "untagged points stay");
});

it("resample — points every step along a polyline", () => {
  assert.deepStrictEqual(
    resample(
      [
        [0, 0],
        [10, 0],
      ],
      5,
    ),
    [
      [0, 0],
      [5, 0],
      [10, 0],
    ],
  );
});

it("curvature — the sum of a polyline's turns", () => {
  assert.strictEqual(
    curvature([
      [0, 0],
      [10, 0],
      [20, 0],
    ]),
    0,
  );
  close(
    curvature([
      [0, 0],
      [10, 0],
      [10, 10],
      [20, 10],
    ]),
    Math.PI,
  );
});

const rect = {x0: 0, y0: 0, x1: 400, y1: 300};
const ctx = (obstacles = []) => {
  const grid = new PointGrid(10);
  grid.add(obstacles);
  return {grid, rect, fontSize: 10, lift: 3};
};
const flat = (x0, x1, y) => [
  [x0, y],
  [x1, y],
];

it("labelBand — rows from the baseline up to the letters' height", () => {
  const band = labelBand(flat(0, 20, 100), ctx());
  const ys = [...new Set(band.map(p => p[1]))].sort((a, b) => a - b);
  assert.deepStrictEqual(ys, [90, 93.5, 97]);
});

it("scoreStretch — blocked by obstacles and the plot's edges, flatter is better", () => {
  assert.notStrictEqual(scoreStretch(flat(10, 60, 100), ctx()), null);
  assert.strictEqual(
    scoreStretch(flat(10, 60, 100), ctx([[30, 94]])),
    null,
    "another line through the label",
  );
  assert.strictEqual(
    scoreStretch(flat(10, 60, 5), ctx()),
    null,
    "past the plot's top",
  );
  const level = scoreStretch(flat(10, 60, 100), ctx());
  const sloped = scoreStretch(
    [
      [10, 120],
      [60, 80],
    ],
    ctx(),
  );
  const bent = scoreStretch(
    [
      [10, 100],
      [35, 90],
      [60, 100],
    ],
    ctx(),
  );
  assert.ok(level < sloped && level < bent);
});

it("bestStretch — the flat, clear part of a line, upright", () => {
  // A line that climbs steeply, then runs level, drawn right to left.
  const line = [
    [300, 100],
    [150, 100],
    [100, 250],
  ];
  const stretch = bestStretch([line], 60, ctx());
  assert.ok(stretch, "finds a stretch");
  assert.ok(
    stretch[0][0] < stretch[stretch.length - 1][0],
    "reads left to right",
  );
  assert.ok(
    stretch.every(p => p[1] === 100),
    "on the level part",
  );
  // A line crossed everywhere by another has nowhere clear.
  const blocked = ctx(resample(flat(0, 400, 95), 2));
  assert.strictEqual(bestStretch([flat(50, 350, 100)], 60, blocked), null);
  assert.strictEqual(
    bestStretch([flat(50, 80, 100)], 60, ctx()),
    null,
    "too short",
  );
});

it("scoreStretch — ignores the points of the line it sits on", () => {
  const c = ctx();
  c.grid.add(resample(flat(0, 400, 97), 2), 3);
  assert.strictEqual(scoreStretch(flat(10, 60, 100), c), null);
  assert.notStrictEqual(
    scoreStretch(flat(10, 60, 100), {...c, ignore: 3}),
    null,
  );
});

it("scoreStretch — keeps the clearance it asks for", () => {
  const c = ctx([[30, 104]]);
  assert.notStrictEqual(scoreStretch(flat(10, 60, 100), c), null);
  assert.strictEqual(
    scoreStretch(flat(10, 60, 100), {...c, clearance: 8}),
    null,
  );
});

it("bestStretchAt — where the stretch lies, within what allow permits and maxTurn", () => {
  const line = flat(0, 300, 100);
  const spot = bestStretchAt([line], 60, ctx());
  assert.strictEqual(spot.piece, 0);
  assert.deepStrictEqual(spot.points, bestStretch([line], 60, ctx()));
  const late = bestStretchAt([line], 60, ctx(), from => from >= 200);
  assert.ok(late.from >= 200, "only allowed starts");
  assert.strictEqual(late.points[0][0], late.from);
  assert.strictEqual(
    bestStretchAt([line], 60, ctx(), () => false),
    null,
    "nothing allowed",
  );
  // A right-angle corner: under the default turn limit, but not a tighter one.
  const corner = [
    [100, 100],
    [130, 100],
    [130, 130],
  ];
  assert.ok(bestStretchAt([corner], 50, ctx()));
  assert.strictEqual(
    bestStretchAt([corner], 50, {...ctx(), maxTurn: Math.PI / 3}),
    null,
  );
});
