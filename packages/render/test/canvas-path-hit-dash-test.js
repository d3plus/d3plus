import {afterAll, beforeAll, it} from "vitest";
import assert from "assert";

import {pathHit} from "../src/canvas/canvasNodePaint.ts";

/**
    A dashed path hits only on its dashes on Canvas, as it does in SVG:
    `pathHit` tests the stroke with the node's dash pattern, then clears it so
    the next test or draw starts solid.
*/

let saved;
beforeAll(() => {
  saved = globalThis.Path2D;
  globalThis.Path2D = class {
    constructor(d) {
      this.d = d;
    }
  };
});
afterAll(() => {
  globalThis.Path2D = saved;
});

function fakeCtx() {
  return {
    lineWidth: 0,
    dash: [],
    strokeDash: null,
    setLineDash(d) {
      this.dash = d;
    },
    isPointInPath() {
      return false;
    },
    isPointInStroke() {
      this.strokeDash = this.dash;
      return true;
    },
  };
}

it("pathHit tests a dashed stroke with its dash pattern, then clears it", () => {
  const ctx = fakeCtx();
  const node = {
    d: "M0,0L100,0",
    paint: {strokeWidth: 2, strokeDasharray: [5, 3]},
  };
  assert.strictEqual(pathHit(ctx, node, 50, 0), true);
  assert.deepStrictEqual(ctx.strokeDash, [5, 3]);
  assert.strictEqual(ctx.lineWidth, 2);
  assert.deepStrictEqual(ctx.dash, []);
});

it("pathHit tests a solid or degenerate dash as a solid stroke", () => {
  const ctx = fakeCtx();
  pathHit(ctx, {d: "M0,0L100,0", paint: {strokeWidth: 2}}, 50, 0);
  assert.deepStrictEqual(ctx.strokeDash, []);
  pathHit(
    ctx,
    {d: "M0,0L100,0", paint: {strokeWidth: 2, strokeDasharray: [0]}},
    50,
    0,
  );
  assert.deepStrictEqual(ctx.strokeDash, []);
});

it("pathHit skips the stroke test for an unstroked path", () => {
  const ctx = fakeCtx();
  assert.strictEqual(pathHit(ctx, {d: "M0,0L100,0", paint: {}}, 50, 0), false);
  assert.strictEqual(ctx.strokeDash, null);
});
