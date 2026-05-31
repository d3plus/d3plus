import assert from "assert";
import {default as simplify} from "../es/src/simplify.js";

it("math/simplify returns polygons of two or fewer points untouched", () => {
  const single = [[0, 0]];
  const pair = [[0, 0], [1, 1]];
  assert.strictEqual(simplify(single), single, "single point passes through by reference");
  assert.strictEqual(simplify(pair), pair, "two points pass through by reference");
});

it("math/simplify collapses collinear points down to the endpoints", () => {
  const line = [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0], [10, 0]];
  assert.deepStrictEqual(
    simplify(line, 1),
    [[0, 0], [10, 0]],
    "intermediate points on a straight line are dropped",
  );
  assert.deepStrictEqual(
    simplify(line, 1, true),
    [[0, 0], [10, 0]],
    "highestQuality path also collapses the collinear run",
  );
});

it("math/simplify keeps a vertex that deviates beyond the tolerance", () => {
  const peak = [[0, 0], [5, 5], [10, 0]];
  assert.deepStrictEqual(
    simplify(peak, 1),
    [[0, 0], [5, 5], [10, 0]],
    "the peak is 5 units off the baseline, well past tolerance 1",
  );
});

it("math/simplify drops a vertex whose deviation is within the tolerance", () => {
  const peak = [[0, 0], [5, 5], [10, 0]];
  assert.deepStrictEqual(
    simplify(peak, 10),
    [[0, 0], [10, 0]],
    "with tolerance 10 the 5-unit peak is no longer significant",
  );
});

it("math/simplify preserves endpoints and never grows the polygon", () => {
  const poly = [
    [0, 0], [1, 0.2], [2, -0.1], [3, 5], [4, 0.1],
    [5, 0], [6, -0.2], [7, 8], [8, 0.05], [9, 0], [10, 0],
  ];
  const result = simplify(poly, 1);
  assert.deepStrictEqual(result[0], poly[0], "first point is preserved");
  assert.deepStrictEqual(
    result[result.length - 1],
    poly[poly.length - 1],
    "last point is preserved",
  );
  assert.ok(
    result.length < poly.length,
    "simplification removes at least one point",
  );
  // The two prominent peaks (y=5 and y=8) survive; the small jitter does not.
  assert.ok(
    result.some(p => p[1] === 5) && result.some(p => p[1] === 8),
    "significant peaks are retained",
  );
});
