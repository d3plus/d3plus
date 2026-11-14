/**
    `matrixEmit` — cells positioned by the row/column scales stashed on
    `viz.ctx`: Rects, or Circles for cells whose `shape` is `"Circle"` (see
    `bubbles.ts`).
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {
  textureFill,
  shapeConfigFor,
  resolveAccessor,
} from "../features/emitHelpers.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";
import {matrixCellIsCircle, matrixSizeValue} from "./bubbles.js";
import type {MatrixCell} from "./bubbles.js";

/**
    A circle cell's radius: its size value through the radius scale, or the
    cell's full radius without a `size`. Null when it has no size to draw.
*/
function circleRadius(
  viz: Parameters<ChartEmit>[0]["viz"],
  d: MatrixCell,
  i: number,
): number | null {
  const maxRadius = viz.ctx.maxRadius as number;
  if (!viz._size) return maxRadius;
  const radius = viz.ctx.radiusScale as SizeLegendScale | null;
  const value = matrixSizeValue(viz, (d.data ?? d) as DataPoint, d.i ?? i);
  if (!radius || !Number.isFinite(value)) return null;
  const r = radius(value);
  return r > 0 ? Math.min(r, maxRadius) : null;
}

export const matrixEmit: ChartEmit = ({viz, shapeData}) => {
  const cells = (shapeData ?? []) as MatrixCell[];
  if (!cells.length) return [];
  const columnScale = viz.ctx.columnScale as (v: unknown) => number;
  const rowScale = viz.ctx.rowScale as (v: unknown) => number;
  const cellWidth = viz.ctx.cellWidth as number;
  const cellHeight = viz.ctx.cellHeight as number;
  const cellPadding = (viz.schema.cellPadding as number) ?? 0;
  const rectConfig = shapeConfigFor(viz, "Rect");
  const circleConfig = shapeConfigFor(viz, "Circle");
  const colorScale = viz.schema.colorScale as
    ((d: DataPoint, i: number) => unknown) | undefined;

  const cellNodes: SceneNode[] = [];
  const cellData: [DataPoint, number][] = [];
  cells.forEach((d, i) => {
    const circle = matrixCellIsCircle(viz, d, i);
    const r = circle ? circleRadius(viz, d, i) : 0;
    if (r === null) return;
    const sc = circle ? circleConfig : rectConfig;
    const fill = resolveAccessor<string>(sc.fill, d as DataPoint, i);
    const stroke = resolveAccessor<string>(sc.stroke, d as DataPoint, i);
    const strokeWidth = resolveAccessor<number>(
      sc.strokeWidth,
      d as DataPoint,
      i,
    );
    const cx = columnScale(d.column) + cellWidth / 2;
    const cy = rowScale(d.row) + cellHeight / 2;
    const validColorScale = colorScale
      ? `, ${colorScale((d.data ?? d) as DataPoint, i)}`
      : "";
    const paint = {
      fill: textureFill(sc, d as DataPoint, i, fill),
      stroke,
      strokeWidth,
    };
    const aria = {label: `${d.row}, ${d.column}${validColorScale}.`};
    const w = cellWidth - cellPadding;
    const h = cellHeight - cellPadding;
    cellData.push([d as DataPoint, i]);
    cellNodes.push(
      circle
        ? ({
            type: "circle",
            key: `matrix-circle-${i}`,
            cx,
            cy,
            r,
            datum: d as DataPoint,
            paint,
            aria,
          } as SceneNode)
        : ({
            type: "rect",
            key: `matrix-${i}`,
            x: cx - w / 2,
            y: cy - h / 2,
            width: w,
            height: h,
            datum: d as DataPoint,
            paint,
            aria,
          } as SceneNode),
    );
  });
  // Each shape's `backgroundImage` fills the cells drawn as that shape.
  const images = (type: string, sc: Record<string, unknown>) => {
    const picked = cellNodes
      .map((node, k) => [node, k] as const)
      .filter(([node]) => node.type === type);
    return backgroundImageNodes(
      sc,
      picked.map(([node]) => node),
      k => cellData[picked[k][1]],
    );
  };
  return [
    ...cellNodes,
    ...images("rect", rectConfig),
    ...images("circle", circleConfig),
  ];
};
