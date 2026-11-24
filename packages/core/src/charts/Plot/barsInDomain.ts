/**
    Which bars a Plot draws along a time axis.

    @module
*/
import {extent} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import type {ShapeEmitContext} from "../features/shapeEmit.js";
import {vizDiscrete} from "../viz/discrete.js";

/**
    The bars a time axis's domain reaches. A user domain can stop short of the
    data, and a bar centered outside it is not drawn (nor counted when
    spacing the bars that are).
*/
export function barsInDomain(ctx: ShapeEmitContext): DataPoint[] {
  const {viz, values} = ctx;
  const axis = vizDiscrete(viz) as string;
  if ((axis === "x" ? ctx.xScale : ctx.yScale) !== "Time") return values;
  // Zoomed, the domain is the visible window; bars keep to the unzoomed
  // domain, which spans where the unzoomed plot range landed.
  const zoomRange = ctx.zoomRanges?.[axis as "x" | "y"];
  if (zoomRange) {
    const scale = axis === "x" ? ctx.x : ctx.y;
    const [lo, hi] = extent(zoomRange) as [number, number];
    return values.filter(d => {
      const at = scale(d[axis]);
      return at >= lo - 0.5 && at <= hi + 0.5;
    });
  }
  const [lo, hi] = extent(
    (axis === "x" ? ctx.xDomain : ctx.yDomain).map(Number),
  ) as [number, number];
  return values.filter(d => {
    const at = +(d[axis] as number);
    return at >= lo && at <= hi;
  });
}
