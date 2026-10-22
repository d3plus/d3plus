import {describe, it} from "vitest";
import assert from "assert";

import {coneAt} from "../src/animate/trail.ts";

const corners = d =>
  d
    .slice(1, -1)
    .split("L")
    .map(p => p.split(",").map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

describe("coneAt", () => {
  it("traces a rect's swept silhouette through the outer corners at both ends", () => {
    const {d, box} = coneAt("rect", [0, 0], [1, 1], [10, 0], [1, 1], 0, 1);
    assert.deepStrictEqual(corners(d), [
      [-1, -1],
      [-1, 1],
      [11, -1],
      [11, 1],
    ]);
    assert.deepStrictEqual(box, {x: -1, y: -1, w: 12, h: 2});
  });

  it("keeps the corners that stick out of a diagonal sweep", () => {
    const {d} = coneAt("rect", [0, 0], [1, 1], [10, 10], [1, 1], 0, 1);
    assert.deepStrictEqual(corners(d), [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [9, 11],
      [11, 9],
      [11, 11],
    ]);
  });

  it("draws a zero-size rect that hasn't moved without throwing", () => {
    const {box} = coneAt("rect", [5, 5], [0, 0], [5, 5], [0, 0], 0, 1);
    assert.deepStrictEqual(box, {x: 5, y: 5, w: 1, h: 1});
  });
});
