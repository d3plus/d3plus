/**
    `applyParallelLayout` — ParallelCoordinates' layout stage. Resolves the
    dimensions, lays out one axis per dimension, traces each row's line
    across them, and queues each axis's brush strip for the next paint (see
    `brushDom.ts`). Stashes the resolved `dimensions` and the axis + title
    nodes (`axisNodes`, drawn over the lines) on `viz.ctx`.
*/

import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {layoutAxes} from "./axes.js";
import type {PlacedAxis} from "./axes.js";
import type {BrushTarget} from "./brushDom.js";
import {detectDimensions, resolveDimensions} from "./dimensions.js";
import type {DimensionOptions} from "./dimensions.js";
import type {ParallelLine} from "./emit.js";
import {linePoints, parallelPath} from "./paths.js";
import type {ParallelCurve, ParallelOrient} from "./paths.js";

/** Default width (px) of each axis's brush strip. */
export const BRUSH_WIDTH = 20;

/**
    The dimensions to draw: `dimensions` when set, otherwise every numeric
    key in the data except the `groupBy` keys and `id`.
*/
export function parallelDimensionKeys(viz: VizInstance): string[] {
  const set = viz.schema.dimensions;
  if (Array.isArray(set)) return set.map(String);
  const raw = (viz as VizInstance & {_groupByRaw?: unknown})._groupByRaw;
  const groupBy = (Array.isArray(raw) ? raw : [raw]).filter(
    (k): k is string => typeof k === "string",
  );
  return detectDimensions((viz._data ?? []) as DataPoint[], ["id", ...groupBy]);
}

/** The orientation `orient` names (anything but `"vertical"` is horizontal). */
export function parallelOrient(value: unknown): ParallelOrient {
  return value === "vertical" ? "vertical" : "horizontal";
}

/** The brush strip over a placed axis, in surface pixels. */
export function brushTarget(
  axis: PlacedAxis,
  orient: ParallelOrient,
  margin: {left: number; top: number},
  width: number,
): BrushTarget {
  const along = axis.end - axis.start;
  const {dim} = axis;
  const base = {
    id: `${margin.left},${margin.top}|${orient}|${dim.key}`,
    key: dim.key,
    title: dim.title,
    orient,
    type: dim.type,
    domain: dim.domain,
    position: axis.position,
    invert: axis.invert,
    alongStart: axis.start,
  };
  return orient === "horizontal"
    ? {
        ...base,
        x: margin.left + axis.offset - width / 2,
        y: margin.top + axis.start,
        width,
        height: along,
      }
    : {
        ...base,
        x: margin.left + axis.start,
        y: margin.top + axis.offset - width / 2,
        width: along,
        height: width,
      };
}

export const applyParallelLayout: TransformStage = ({viz}) => {
  const queue = ((viz.ctx.brushQueue as BrushTarget[] | undefined) ??= []);
  const rows = (viz._filteredData ?? []) as DataPoint[];
  const keys = parallelDimensionKeys(viz);
  viz.ctx.dimensions = [];
  viz.ctx.axisNodes = [];
  if (!rows.length || !keys.length) return {shapeData: []};

  const config = (viz.schema.dimensionConfig ?? {}) as Record<
    string,
    DimensionOptions | undefined
  >;
  const shared = viz.ctx.sharedDomains as
    Record<string, (number | string)[]> | undefined;
  const dims = resolveDimensions(keys, rows, config, shared);
  viz.ctx.dimensions = dims;

  const orient = parallelOrient(viz.schema.orient);
  const curve = (
    viz.schema.curve === "bump" ? "bump" : "linear"
  ) as ParallelCurve;
  const {width, height} = chartBounds(viz);
  const layout = layoutAxes(viz, dims, width, height, orient);
  viz.ctx.axisNodes = layout.nodes;

  const brushConfig = (viz.schema.brushConfig ?? {}) as {width?: number};
  const stripWidth =
    typeof brushConfig.width === "number" ? brushConfig.width : BRUSH_WIDTH;
  for (const axis of layout.axes)
    queue.push(brushTarget(axis, orient, viz._margin, stripWidth));

  const lineAxes = layout.axes.map(a => ({
    key: a.dim.key,
    offset: a.offset,
    position: a.position,
  }));
  const seen = new Map<string, number>();
  const lines: ParallelLine[] = rows.map((row, i) => {
    const base = `${viz._id(row, i)}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return {
      data: row,
      i,
      id: n ? `${base}-${n}` : base,
      d: parallelPath(linePoints(row, lineAxes, orient), curve, orient),
    };
  });
  return {shapeData: lines as unknown as DataPoint[]};
};
