import assert from "assert";

import {paint} from "../es/src/canvas/canvasNodePaint.js";

/**
    Canvas parity for `vector-effect: non-scaling-stroke`. Under a zoom/scale the
    canvas ctx transform scales stroke widths along with geometry; a non-scaling
    stroke must divide its width by the on-screen scale so it stays a constant
    screen width (matching the SVG backend). Data shapes (Geomap paths/points,
    Network/Rings nodes) opt in; edges deliberately do not, so they still scale.
*/
function fakeCtx() {
  return {
    globalAlpha: 1,
    strokeStyle: "",
    lineWidth: 0,
    _dash: null,
    setLineDash(d) {
      this._dash = d;
    },
    stroke() {},
    fill() {},
  };
}

it("non-scaling stroke halves its width at 2× zoom (constant on screen)", () => {
  const ctx = fakeCtx();
  const node = {type: "circle", paint: {stroke: "#000", strokeWidth: 4, vectorEffect: "non-scaling-stroke"}};
  paint(ctx, node, 1, undefined, undefined, 2);
  assert.strictEqual(ctx.lineWidth, 2);
});

it("non-scaling stroke is unchanged at scale 1 (no zoom)", () => {
  const ctx = fakeCtx();
  const node = {type: "circle", paint: {stroke: "#000", strokeWidth: 4, vectorEffect: "non-scaling-stroke"}};
  paint(ctx, node, 1, undefined, undefined, 1);
  assert.strictEqual(ctx.lineWidth, 4);
});

it("a stroke without non-scaling-stroke scales with the zoom (edges enlarge)", () => {
  const ctx = fakeCtx();
  const node = {type: "path", paint: {stroke: "#000", strokeWidth: 4}};
  paint(ctx, node, 1, undefined, undefined, 2);
  assert.strictEqual(ctx.lineWidth, 4);
});
