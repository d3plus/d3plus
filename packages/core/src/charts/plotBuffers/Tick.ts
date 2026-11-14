import type Plot from "../Plot/index.js";
import circleBuffer from "./Circle.js";

/**
    @module tickBuffer
    Pads a discrete axis like Circle does, so the outer bands hold their
    whole ticks, and a numeric axis by a few pixels past the outermost ticks.
    @private
*/
export default function (
  this: Plot,
  args: Parameters<typeof circleBuffer>[0],
): [unknown, unknown] {
  return circleBuffer.call(this, {...args, buffer: 4});
}
