/**
    `parallelEmit` — one path per row through its value on every axis, each
    paired with a wider transparent hit path so a thin line is easy to hover,
    then the axes and their titles on top, so tick labels stay legible.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {resolveAccessor, shapeConfigFor} from "../features/emitHelpers.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {autoLineOpacity} from "./dimensions.js";
import {formatDimensionValue} from "./format.js";
import type {ParallelDimension} from "./dimensions.js";

/** Marks the scene keys of the chart's lines (see `lineStates.ts`). */
export const LINE_KEY = "pc-line-";
/** Suffix of each line's hit path key. */
export const HIT_SUFFIX = "::hit";
/** Width (px) of the transparent hover target around each line. */
export const HIT_WIDTH = 8;

/** One row's line, laid out. */
export interface ParallelLine {
  data: DataPoint;
  i: number;
  id: string;
  d: string;
}

/** The stroke opacity `lineOpacity` resolves to for `count` lines. */
export function resolveLineOpacity(value: unknown, count: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.min(1, Math.max(0, value));
  return autoLineOpacity(count);
}

/** The screen-reader label for a row's line: its name, then each dimension's value. */
export function lineAriaLabel(
  viz: VizInstance,
  row: DataPoint,
  i: number,
  dims: ParallelDimension[],
): string {
  const values = dims
    .map(dim => `${dim.title} ${formatDimensionValue(viz, dim.key, row[dim.key])}`)
    .join(", ");
  return `${viz._drawLabel(row, i)}${values ? `: ${values}` : ""}.`;
}

export const parallelEmit: ChartEmit = ({viz, shapeData}) => {
  const lines = (shapeData ?? []) as unknown as ParallelLine[];
  const axisNodes = (viz.ctx.axisNodes ?? []) as SceneNode[];
  if (!lines.length) return axisNodes;
  const dims = (viz.ctx.dimensions ?? []) as ParallelDimension[];
  const sc = shapeConfigFor(viz, "Line");
  const opacity = resolveLineOpacity(viz.schema.lineOpacity, lines.length);
  const out: SceneNode[] = [];
  lines.forEach(line => {
    if (!line.d) return;
    const {data, i} = line;
    const key = `${LINE_KEY}${line.id}`;
    const strokeOpacity = resolveAccessor<number>(sc.strokeOpacity, data, i);
    out.push({
      type: "path",
      shapeType: "Line",
      key,
      d: line.d,
      datum: data,
      index: i,
      paint: {
        fill: "none",
        stroke: resolveAccessor<string>(sc.stroke, data, i),
        strokeWidth: resolveAccessor<number>(sc.strokeWidth, data, i),
        strokeOpacity: typeof strokeOpacity === "number" ? strokeOpacity : opacity,
        strokeDasharray: resolveAccessor<number[]>(sc.strokeDasharray, data, i),
        opacity: resolveAccessor<number>(sc.opacity, data, i),
      },
      aria: {label: lineAriaLabel(viz, data, i, dims)},
    } as SceneNode);
    out.push({
      type: "path",
      shapeType: "Line",
      key: `${key}${HIT_SUFFIX}`,
      d: line.d,
      datum: data,
      index: i,
      paint: {fill: "none", stroke: "transparent", strokeWidth: HIT_WIDTH},
      aria: {hidden: true},
    } as SceneNode);
  });
  return [...out, ...axisNodes];
};
