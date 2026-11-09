/**
    How areas grow in: every band starts flat on the value axis's baseline
    and rises into place. An unstacked area starts on its own baseline; a
    stack starts on the zero line (or the `baseline`, kept inside the
    domain), so its bands rise together, each riding on the one beneath it.
*/
import type {SceneNode} from "@d3plus/render";

import {growFromLine} from "../helpers/densityEnter.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";

/**
    The pixel line, along the value axis, that areas grow out of.
    @param ctx The Plot shape-emit context the areas were drawn with.
*/
export function areaBaseline(ctx: ShapeEmitContext): number | null {
  const {viz} = ctx;
  const axis = viz.schema.discrete === "y" ? "x" : "y";
  const own = ctx.shapeConfig[`${axis}0`];
  if (!viz.schema.stacked && typeof own === "number" && Number.isFinite(own))
    return own;
  const domain = (axis === "x" ? ctx.xDomain : ctx.yDomain).map(Number);
  const baseline = viz.schema.baseline;
  const value = typeof baseline === "number" ? baseline : 0;
  const lo = Math.min(...domain);
  const hi = Math.max(...domain);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;
  const at = (axis === "x" ? ctx.x : ctx.y)(Math.max(lo, Math.min(hi, value)));
  return Number.isFinite(at) ? at : null;
}

/** Every Area path's key under `nodes`. */
function areaKeys(nodes: SceneNode[], out: string[] = []): string[] {
  for (const node of nodes) {
    if (node.type === "group") areaKeys(node.children, out);
    else if (node.type === "path" && node.shapeType === "Area")
      out.push(`${node.key}`);
  }
  return out;
}

/**
    Sets each Area path's `enterD`: its outline flattened onto the baseline
    (see `areaBaseline`), so it grows out of the axis and, on exit, sinks
    back into it.
    @param ctx The Plot shape-emit context the areas were drawn with.
    @param nodes The areas' scene nodes.
*/
export function growAreasFromBaseline(
  ctx: ShapeEmitContext,
  nodes: SceneNode[],
): void {
  const line = areaBaseline(ctx);
  if (line === null) return;
  const axis = ctx.viz.schema.discrete === "y" ? "x" : "y";
  const keys = areaKeys(nodes);
  if (keys.length)
    growFromLine(nodes, axis, new Map(keys.map(key => [key, line])));
}
