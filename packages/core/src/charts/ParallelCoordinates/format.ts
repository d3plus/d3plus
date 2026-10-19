/**
    ParallelCoordinates value formatting, shared by tooltips and line labels.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import type {VizInstance} from "../viz/vizTypes.js";

import {isMissing, isNumeric} from "./dimensions.js";
import type {DimensionOptions, ParallelDimension} from "./dimensions.js";

/**
    A row's value on one dimension as text: through that dimension's
    `tickFormat` when it has one, else the locale's abbreviated number format
    for numbers. Missing values read as an empty string.
*/
export function formatDimensionValue(viz: VizInstance, key: string, value: unknown): string {
  if (isMissing(value)) return "";
  const config = (viz.schema.dimensionConfig ?? {}) as Record<string, DimensionOptions | undefined>;
  const format = config[key]?.tickFormat;
  if (typeof format === "function") return `${(format as (v: unknown) => unknown)(value)}`;
  if (isNumeric(value)) return formatAbbreviate(value, viz.schema.locale as string);
  return String(value);
}

/** The tooltip rows for a line: each dimension's title and the row's value on it. */
export function dimensionTooltipRows(viz: VizInstance, d: DataPoint): [string, string][] {
  const dims = (viz.ctx.dimensions ?? []) as ParallelDimension[];
  return dims.map(dim => [dim.title, formatDimensionValue(viz, dim.key, d[dim.key])]);
}
