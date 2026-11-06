import {it} from "vitest";
import assert from "assert";
import {
  offsetPolyline,
  plotEdges,
  polylineD,
  polylineLength,
  trimPolyline,
  uprightPoints,
  visibleRun,
} from "../../src/charts/features/pathLabelGeometry.ts";

const close = (a, b, tol = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

it("polylineLength — sums the segments", () => {
  assert.strictEqual(
    polylineLength([
      [0, 0],
      [3, 4],
      [3, 10],
    ]),
    11,
  );
  assert.strictEqual(polylineLength([[1, 1]]), 0);
});

it("uprightPoints — reverses a line running right to left or straight down", () => {
  const ltr = [
    [0, 10],
    [100, 0],
  ];
  assert.strictEqual(uprightPoints(ltr), ltr, "left to right stays");
  assert.deepStrictEqual(
    uprightPoints([
      [100, 0],
      [0, 10],
    ]),
    [
      [0, 10],
      [100, 0],
    ],
    "right to left reverses",
  );
  assert.deepStrictEqual(
    uprightPoints([
      [5, 0],
      [5, 100],
    ]),
    [
      [5, 100],
      [5, 0],
    ],
    "straight down reads bottom to top",
  );
  const up = [
    [5, 100],
    [5, 0],
  ];
  assert.strictEqual(uprightPoints(up), up, "straight up stays");
});

it("uprightPoints — a wider steep reads bottom to top further from upright", () => {
  const down = [
    [0, 0],
    [20, 100],
  ];
  assert.strictEqual(uprightPoints(down), down, "left to right by default");
  assert.deepStrictEqual(
    uprightPoints(down, 0.5),
    [
      [20, 100],
      [0, 0],
    ],
    "bottom to top within the steep",
  );
  const shallow = [
    [0, 0],
    [80, 100],
  ];
  assert.strictEqual(uprightPoints(shallow, 0.5), shallow);
});

it("offsetPolyline — moves a line to its left (above a rightward line)", () => {
  assert.deepStrictEqual(
    offsetPolyline(
      [
        [0, 10],
        [100, 10],
      ],
      4,
    ),
    [
      [0, 6],
      [100, 6],
    ],
  );
  const corner = offsetPolyline(
    [
      [0, 0],
      [10, 0],
      [10, 10],
    ],
    1,
  );
  // The corner moves along the average of its two normals.
  close(corner[1][0], 10 + Math.SQRT1_2);
  close(corner[1][1], -Math.SQRT1_2);
});

it("trimPolyline — the stretch between two distances", () => {
  const line = [
    [0, 0],
    [10, 0],
    [10, 10],
  ];
  assert.deepStrictEqual(trimPolyline(line, 5, 15), [
    [5, 0],
    [10, 0],
    [10, 5],
  ]);
  assert.deepStrictEqual(trimPolyline(line, 0, 20), line);
});

it("visibleRun — the longest run of points inside the plot", () => {
  const rect = {x0: 0, y0: 0, x1: 100, y1: 100};
  assert.deepStrictEqual(
    visibleRun(
      [
        [-10, 50],
        [10, 50],
        [20, 50],
        [30, 150],
        [40, 50],
        [45, 50],
      ],
      rect,
    ),
    [
      [10, 50],
      [20, 50],
    ],
  );
  assert.deepStrictEqual(visibleRun([[NaN, 1]], rect), []);
});

it("polylineD and plotEdges", () => {
  assert.strictEqual(
    polylineD([
      [0, 0],
      [1.234, 5.6789],
    ]),
    "M0,0L1.23,5.68",
  );
  assert.deepStrictEqual(plotEdges([10, 200], [300, 20], 5), {
    x0: 10,
    y0: 15,
    x1: 200,
    y1: 295,
  });
});
