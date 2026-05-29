/**
    `matrixEmit` — Rect cells positioned by the row/column scales stashed
    on `viz.ctx`.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {ChartDefinition} from "../ChartDefinition.js";

interface MatrixCell extends Record<string, unknown> {
  row: unknown;
  column: unknown;
}

function resolveAccessor<T>(val: unknown, d: DataPoint, i: number): T | undefined {
  if (typeof val === "function") return (val as (d: DataPoint, i: number) => T)(d, i);
  return val as T | undefined;
}

export const matrixEmit: ChartDefinition["emit"] = ({viz, shapeData}) => {
  const cells = (shapeData ?? []) as MatrixCell[];
  if (!cells.length) return [];
  const columnScale = viz.ctx.columnScale as (v: unknown) => number;
  const rowScale = viz.ctx.rowScale as (v: unknown) => number;
  const cellWidth = viz.ctx.cellWidth as number;
  const cellHeight = viz.ctx.cellHeight as number;
  const cellPadding = (viz.schema.cellPadding as number) ?? 0;
  const sc = (viz.schema.shapeConfig ?? {}) as Record<string, unknown>;

  return cells.map((d, i): SceneNode => {
    const fill = resolveAccessor<string>(sc.fill, d as DataPoint, i);
    const stroke = resolveAccessor<string>(sc.stroke, d as DataPoint, i);
    const strokeWidth = resolveAccessor<number>(sc.strokeWidth, d as DataPoint, i);
    const w = cellWidth - cellPadding;
    const h = cellHeight - cellPadding;
    const x = columnScale(d.column) + cellWidth / 2 - w / 2;
    const y = rowScale(d.row) + cellHeight / 2 - h / 2;
    return {
      type: "rect",
      key: `matrix-${i}`,
      x, y, width: w, height: h,
      datum: d as DataPoint,
      paint: {
        fill: typeof fill === "string" ? fill : undefined,
        stroke,
        strokeWidth,
      },
    } as SceneNode;
  });
};
