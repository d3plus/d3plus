/**
    `radialMatrixEmit` — Path SceneNodes for each arc cell, using the
    `arcData` generator stashed on `viz.ctx`.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {textureFill, shapeConfigFor} from "../features/emitHelpers.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";

interface RmCell extends Record<string, unknown> {
  row: unknown;
  column: unknown;
  data?: DataPoint;
}

function resolveAccessor<T>(val: unknown, d: DataPoint, i: number): T | undefined {
  if (typeof val === "function") return (val as (d: DataPoint, i: number) => T)(d, i);
  return val as T | undefined;
}

export const radialMatrixEmit: ChartEmit = ({viz, shapeData}) => {
  const cells = (shapeData ?? []) as RmCell[];
  if (!cells.length) return [];
  const arcData = viz.ctx.arcData as (d: RmCell) => string;
  const sc = shapeConfigFor(viz, "Path");
  const colorScale = viz.schema.colorScale as ((d: DataPoint, i: number) => unknown) | undefined;

  const cellNodes = cells.map((d, i): SceneNode => {
    const fill = resolveAccessor<string>(sc.fill, d as DataPoint, i);
    const stroke = resolveAccessor<string>(sc.stroke, d as DataPoint, i);
    const strokeWidth = resolveAccessor<number>(sc.strokeWidth, d as DataPoint, i);
    const validColorScale = colorScale ? `, ${colorScale((d.data ?? d) as DataPoint, i)}` : "";
    return {
      type: "path",
      key: `rm-${viz._ids(d as DataPoint, i).join("-")}`,
      d: arcData(d),
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
