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

it("pathHit tests an unfilled path on its stroke only, as SVG does", () => {
  const ctx = fakeCtx();
  let filled = 0;
  ctx.isPointInPath = () => (filled++, true);
  ctx.isPointInStroke = () => false;
  const arc = {d: "M0,0A50,50 0 0,1 100,0", paint: {fill: "none"}};
  assert.strictEqual(pathHit(ctx, arc, 50, -10), false, "inside the curve");
  assert.strictEqual(filled, 0, "the fill region is never tested");
  assert.strictEqual(
    pathHit(ctx, {...arc, paint: {fill: "transparent"}}, 50, -10),
    true,
    "a transparent fill still hits",
  );
});
