/**
    Discrete axis ticks that follow the hover: each tick label is stamped
    with the value it stands for (see `hoverMatch`), so while marks are
    hovered the labels of their buckets stay at full opacity and the rest dim
    with the other marks. Continuous axes show a hover badge instead (see
    `Plot/axisHover.ts`).
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

/** An axis's scale setting, the way the Axis component stores it. */
interface AxisLike {
  schema?: {scale?: unknown};
}

/** Whether an Axis draws discrete buckets (a band, ordinal, or point scale). */
export const discreteAxis = (axis: AxisLike | undefined): boolean =>
  ["band", "ordinal", "point"].includes(`${axis?.schema?.scale}`);

/**
    Stamps every tick label in an axis scene with `hoverMatch`: the tick's
    value, matched against `field` on the hovered marks' data.
    @param node The axis scene (or any subtree of it).
    @param field The datum key a mark keeps the axis value under.
*/
export function tagHoverTicks(node: SceneNode, field: string): void {
  const tick = (node.datum as {data?: DataPoint} | undefined)?.data;
  if (node.type === "text" && tick && "tick" in tick && "id" in tick)
    node.hoverMatch = {field, value: tick.id};
  const kids = (node as {children?: SceneNode[]}).children;
  if (kids) for (const child of kids) tagHoverTicks(child, field);
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
