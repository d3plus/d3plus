/**
    `waffleEmit` — one rect (or circle) per laid-out Waffle cell, plus each
    cell's icon or `shapeConfig.backgroundImage`.
*/

import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {
  resolveAccessor,
  shapeConfigFor,
  textureFill,
} from "../features/emitHelpers.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {WaffleCell} from "./applyLayout.js";

/** How each cell is drawn. */
export type WaffleCellShape = "square" | "rounded" | "circle";

/** A rounded cell's corner radius, as a fraction of its side. */
const ROUNDED_RADIUS = 0.25;

/**
    The scene geometry for one cell: a rect for `"square"` and `"rounded"`
    (with corner radius), a circle for `"circle"`.
*/
export function waffleCellGeometryNode(
  cell: Pick<WaffleCell, "x" | "y" | "size">,
  shape: WaffleCellShape,
):
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      rx?: number;
      ry?: number;
    }
  | {type: "circle"; cx: number; cy: number; r: number} {
  const {x, y, size} = cell;
  if (shape === "circle")
    return {type: "circle", cx: x + size / 2, cy: y + size / 2, r: size / 2};
  const rect = {type: "rect" as const, x, y, width: size, height: size};
  if (shape !== "rounded") return rect;
  const r = size * ROUNDED_RADIUS;
  return {...rect, rx: r, ry: r};
}

/** Coerces a `cellShape` setting, falling back to `"square"`. */
export function waffleCellShape(value: unknown): WaffleCellShape {
  return value === "rounded" || value === "circle" ? value : "square";
}

export const waffleEmit: ChartEmit = ({viz, shapeData}) => {
  const cells = (shapeData ?? []) as unknown as WaffleCell[];
  if (!cells.length) return [];

  const shape = waffleCellShape(viz.schema.cellShape);
  const sc = shapeConfigFor(viz, shape === "circle" ? "Circle" : "Rect");
  const icon = viz.schema.icon as unknown;
  const sum = viz.schema.sum as (d: DataPoint, i: number) => number;
  const locale = viz.schema.locale as string;

  const nodes: SceneNode[] = cells.map(cell => {
    const {data: d, i} = cell;
    const iconUrl = icon ? resolveAccessor<unknown>(icon, d, i) : undefined;
    const fill = resolveAccessor<unknown>(sc.fill, d, i);
    const paint = iconUrl
      ? {fill: "transparent"}
      : {
          fill: textureFill(sc, d, i, fill),
          stroke: resolveAccessor<string>(sc.stroke, d, i),
          strokeWidth: resolveAccessor<number>(sc.strokeWidth, d, i),
        };
    const label =
      cell.n === 0
        ? `${viz._drawLabel(d, i)}, ${sum(d, i)}, ${formatAbbreviate(cell.share * 100, locale)}%`
        : undefined;
    return {
      ...waffleCellGeometryNode(cell, shape),
      key: `waffle-${cell.id}`,
      index: i,
      datum: d,
      paint: {...paint, opacity: resolveAccessor<number>(sc.opacity, d, i)},
      aria: label ? {label} : {hidden: true},
    } as SceneNode;
  });

  const imageConfig = icon
    ? {...sc, backgroundImage: icon, backgroundImageFit: "contain"}
    : sc;
  const images = backgroundImageNodes(imageConfig, nodes, k => [
    cells[k].data,
    cells[k].i,
  ]);

  return [...nodes, ...images];
};
