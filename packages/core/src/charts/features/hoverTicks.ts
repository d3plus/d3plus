/**
    Discrete axis ticks that follow the hover: each tick label is stamped
    with the value it stands for (see `hoverMatch`), so while marks are
    hovered the labels of their buckets stay at full opacity and the rest dim
    with the other marks. Continuous axes show a hover badge instead (see
    `Plot/axisHover.ts`).
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {TickHoverMatch} from "../viz/vizTypes.js";

/** An axis's scale setting, the way the Axis component stores it. */
interface AxisLike {
  schema?: {scale?: unknown};
}

/** Whether an Axis draws discrete buckets (a band, ordinal, or point scale). */
export const discreteAxis = (axis: AxisLike | undefined): boolean =>
  ["band", "ordinal", "point"].includes(`${axis?.schema?.scale}`);

/**
    Stamps every tick label in an axis scene with `hoverMatch`: the tick's
    value, matched against `field` on the hovered marks' data, or what
    `match` gives for the tick's value (none when it gives undefined).
    @param node The axis scene (or any subtree of it).
    @param field The datum key a mark keeps the axis value under.
    @param match A chart's own match for a tick (see `_tickHoverMatch`).
*/
export function tagHoverTicks(
  node: SceneNode,
  field: string,
  match?: (tick: unknown) => TickHoverMatch | undefined,
): void {
  const tick = (node.datum as {data?: DataPoint} | undefined)?.data;
  if (node.type === "text" && tick && "tick" in tick && "id" in tick) {
    const own = match ? match(tick.id) : {field, value: tick.id};
    if (own) node.hoverMatch = own;
  }
  const kids = (node as {children?: SceneNode[]}).children;
  if (kids) for (const child of kids) tagHoverTicks(child, field, match);
}

/**
    The values of the tick labels in an axis scene that `field` stamped (see
    `tagHoverTicks`), in drawing order.
    @param node The axis scene (or any subtree of it).
    @param field The field the labels were stamped with.
*/
export function hoverTickValues(node: SceneNode, field: string): unknown[] {
  const own = node.hoverMatch?.field === field ? [node.hoverMatch.value] : [];
  const kids = (node as {children?: SceneNode[]}).children ?? [];
  return [...own, ...kids.flatMap(child => hoverTickValues(child, field))];
}

/**
    The values under `field` in a datum or any datum it wraps (the first one
    that has it), as strings; an array value gives each of its items.
*/
export function datumValues(
  datum: DataPoint | undefined,
  field: string,
): string[] {
  let d = datum as (DataPoint & {data?: DataPoint}) | undefined;
  while (d && typeof d === "object") {
    if (Object.prototype.hasOwnProperty.call(d, field)) {
      const v = d[field];
      return (Array.isArray(v) ? v : [v]).map(String);
    }
    d = d.data as typeof d;
  }
  return [];
}
