/**
    `radialMatrixEmit` — Path SceneNodes for each arc cell, using the
    `arcData` generator stashed on `viz.ctx`.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {ChartDefinition} from "../ChartDefinition.js";

interface RmCell extends Record<string, unknown> {
  row: unknown;
  column: unknown;
}

function resolveAccessor<T>(val: unknown, d: DataPoint, i: number): T | undefined {
  if (typeof val === "function") return (val as (d: DataPoint, i: number) => T)(d, i);
  return val as T | undefined;
}

export const radialMatrixEmit: ChartDefinition["emit"] = ({viz, shapeData}) => {
  const cells = (shapeData ?? []) as RmCell[];
  if (!cells.length) return [];
  const arcData = viz.ctx.arcData as (d: RmCell) => string;
  const sc = (viz.schema.shapeConfig ?? {}) as Record<string, unknown>;

  return cells.map((d, i): SceneNode => {
    const fill = resolveAccessor<string>(sc.fill, d as DataPoint, i);
    const stroke = resolveAccessor<string>(sc.stroke, d as DataPoint, i);
    const strokeWidth = resolveAccessor<number>(sc.strokeWidth, d as DataPoint, i);
    return {
      type: "path",
      key: `rm-${viz._ids(d as DataPoint, i).join("-")}`,
      d: arcData(d),
      datum: d as DataPoint,
      paint: {
        fill: typeof fill === "string" ? fill : undefined,
        stroke,
        strokeWidth,
      },
    } as SceneNode;
  });
};
