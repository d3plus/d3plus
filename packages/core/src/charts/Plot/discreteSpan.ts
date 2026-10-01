/**
    Continuous discrete-axis support. When a chart sets `viz._discreteExtent`
    (an accessor returning each datum's `[start, end]` along the discrete
    axis), that axis becomes a linear scale spanning every datum's extent and
    bars fill their own span instead of an evenly divided band.
*/
import {max, min} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

/** Whether `axis` is a span-valued discrete axis. */
export function isSpanAxis(viz: VizInstance, axis: string): boolean {
  return Boolean(viz._discreteExtent) && viz.schema.discrete === axis;
}

/** `[start, end]` of a formatted Plot row (reads its source `data`). */
export function rowSpan(viz: VizInstance, row: Record<string, unknown>): [number, number] {
  return viz._discreteExtent!(row.data as DataPoint);
}

/** The `[min start, max end]` domain covering every row's span. */
export function spanDomain(viz: VizInstance, rows: Record<string, unknown>[]): number[] {
  const spans = rows.filter(d => d.data).map(d => rowSpan(viz, d));
  return [min(spans, d => d[0]) as number, max(spans, d => d[1]) as number];
}

/** Every unique span boundary, ascending — the tick values for a span axis. */
export function spanEdges(viz: VizInstance, rows: Record<string, unknown>[]): number[] {
  const edges = new Set<number>();
  rows.filter(d => d.data).forEach(d => rowSpan(viz, d).forEach(e => edges.add(e)));
  return Array.from(edges).sort((a, b) => a - b);
}
