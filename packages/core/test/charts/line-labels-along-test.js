import {it} from "vitest";
import assert from "assert";
import {
  bestStretch,
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
