import assert from "assert";
import {
  curvePolyline,
  splitDash,
  splitLength,
} from "../../es/src/charts/Plot/curveLength.js";

// Path-length helpers behind the forecast's part-dashed lines.

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} vs ${b}`);

it("curvePolyline — a linear curve passes its points through", () => {
  const points = [[0, 0], [10, 0], [10, 10]];
  assert.deepStrictEqual(curvePolyline(points, "linear"), points);
  assert.deepStrictEqual(curvePolyline([], "linear"), []);
});

it("curvePolyline — Bézier curves are sampled, ending on each point", () => {
  const points = [[0, 0], [10, 10], [20, 0], [30, 10]];
  const line = curvePolyline(points, "monotoneX", 8);
  assert.strictEqual(line.length, 1 + 3 * 8, "8 samples per segment");
  assert.deepStrictEqual(line[0], [0, 0]);
  for (const [k, p] of points.entries())
    if (k) {
      near(line[k * 8][0], p[0], `segment ${k} ends at x`);
      near(line[k * 8][1], p[1], `segment ${k} ends at y`);
    }
  const quad = curvePolyline([[0, 0], [10, 10], [20, 0]], "natural", 4);
  assert.ok(quad.length > 3, "other curve types sample too");
});

it("splitLength — how far along a polyline it reaches a position", () => {
  const line = [[0, 0], [10, 0], [20, 0]];
  assert.deepStrictEqual(splitLength(line, 0, 15), [15, 20]);
  assert.deepStrictEqual(splitLength(line, 0, -5), [0, 20], "starts past it");
  assert.deepStrictEqual(splitLength(line, 0, 25), [20, 20], "never reaches it");
  const diagonal = [[0, 0], [3, 4], [6, 8]];
  assert.deepStrictEqual(splitLength(diagonal, 0, 3), [5, 10], "measured along the path");
  const vertical = [[0, 100], [0, 50], [0, 0]];
  assert.deepStrictEqual(splitLength(vertical, 1, 25), [75, 100], "along y, running backwards");
  assert.deepStrictEqual(splitLength([], 0, 5), [0, 0]);
});

it("splitDash — solid up to the split, the pattern after", () => {
  assert.deepStrictEqual(splitDash(10, 30, [6, 4]), [10, 0, 6, 4, 6, 4]);
  assert.deepStrictEqual(splitDash(0, 5, [3]), [0, 0, 3, 3], "an odd pattern is doubled");
  assert.strictEqual(splitDash(30, 30, [6, 4]), undefined, "nothing left to dash");
  assert.strictEqual(splitDash(0, 30, [0, 0]), undefined, "an empty pattern");
  assert.deepStrictEqual(splitDash(1.23456, 2, [5, 5]), [1.23, 0, 5, 5], "rounded");
});
