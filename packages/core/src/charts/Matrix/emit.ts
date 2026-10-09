/**
    `matrixEmit` — Rect cells positioned by the row/column scales stashed
    on `viz.ctx`.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {textureFill, shapeConfigFor} from "../features/emitHelpers.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";

interface MatrixCell extends Record<string, unknown> {
  row: unknown;
  column: unknown;
  data?: DataPoint;
}

function resolveAccessor<T>(val: unknown, d: DataPoint, i: number): T | undefined {
  if (typeof val === "function") return (val as (d: DataPoint, i: number) => T)(d, i);
  return val as T | undefined;
}

export const matrixEmit: ChartEmit = ({viz, shapeData}) => {
  const cells = (shapeData ?? []) as MatrixCell[];
  if (!cells.length) return [];
  const columnScale = viz.ctx.columnScale as (v: unknown) => number;
  const rowScale = viz.ctx.rowScale as (v: unknown) => number;
  const cellWidth = viz.ctx.cellWidth as number;
  const cellHeight = viz.ctx.cellHeight as number;
  const cellPadding = (viz.schema.cellPadding as number) ?? 0;
  const sc = shapeConfigFor(viz, "Rect");
  const colorScale = viz.schema.colorScale as ((d: DataPoint, i: number) => unknown) | undefined;

  const cellNodes = cells.map((d, i): SceneNode => {
    const fill = resolveAccessor<string>(sc.fill, d as DataPoint, i);
    const stroke = resolveAccessor<string>(sc.stroke, d as DataPoint, i);
    const strokeWidth = resolveAccessor<number>(sc.strokeWidth, d as DataPoint, i);
    const w = cellWidth - cellPadding;
    const h = cellHeight - cellPadding;
    const x = columnScale(d.column) + cellWidth / 2 - w / 2;
    const y = rowScale(d.row) + cellHeight / 2 - h / 2;
    const validColorScale = colorScale ? `, ${colorScale((d.data ?? d) as DataPoint, i)}` : "";
    return {
      type: "rect",
      key: `matrix-${i}`,
      x, y, width: w, height: h,
      datum: d as DataPoint,
      paint: {
        fill: textureFill(sc, d as DataPoint, i, fill),
        stroke,
        strokeWidth,
      },
      aria: {label: `${d.row}, ${d.column}${validColorScale}.`},
    } as SceneNode;
  });
  return [...cellNodes, ...backgroundImageNodes(sc, cellNodes, k => [cells[k] as DataPoint, k])];
};
