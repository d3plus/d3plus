/**
    `applyRadialBarLayout` — RadialBar's chart-specific layout stage. Orders
    the rows by `sort`, then lays them out as concentric tracks whose arc
    length encodes value (`discrete("radius")`, see `trackLayout.ts`) or as
    bars radiating from an inner circle whose length encodes value
    (`discrete("angle")`, the circular bar chart, see `polarWedgeLayout`).
*/

import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import type {Paint} from "@d3plus/render";

import {paintFromShapeConfig} from "../features/emitHelpers.js";
import type {PolarDomainValues} from "../polar/polarFacet.js";
import {polarSlotTops, polarWedgeLayout} from "../polar/wedgeLayout.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {radialBarTrackLayout} from "./trackLayout.js";

/** The rows in drawing order: sorted by `sort` when it's a comparator, else as given. */
export function radialBarRows(viz: VizInstance): DataPoint[] {
  const rows = ((viz._filteredData ?? []) as DataPoint[]).slice();
  const sort = viz.schema.sort as
    ((a: DataPoint, b: DataPoint) => number) | null | undefined;
  return typeof sort === "function" ? rows.sort(sort) : rows;
}

/** The circular bar chart's slot for a row: its own id. */
const radialBarSlotOf =
  (viz: VizInstance) =>
  (d: DataPoint, i: number): string =>
    viz._ids(d, i).join("-");

/**
    The values RadialBar fits its domain to: every row's value, or, for the
    circular bar chart, each bar's stacked total.
*/
export const radialBarDomainValues: PolarDomainValues = (viz, rows) => {
  if (viz.schema.discrete === "angle")
    return polarSlotTops(viz, rows, radialBarSlotOf(viz));
  const valueFn = viz.schema.value as (d: DataPoint, i: number) => unknown;
  return rows.map((d, i) => Number(valueFn(d, i)));
};

export const applyRadialBarLayout: TransformStage = ({viz}) => {
  const rows = radialBarRows(viz);
  if (viz.schema.discrete === "angle") {
    const maxAngle = Number(viz.schema.maxAngle ?? 360) || 360;
    const trackConfig = (viz.schema.trackConfig ?? {}) as Record<
      string,
      unknown
    >;
    const {wedges} = polarWedgeLayout(viz, {
      key: "radialbar",
      rows,
      slotOf: radialBarSlotOf(viz),
      slotLabel: (_key, members) =>
        members.length ? viz._drawLabel(members[0], 0) : "",
      scale: "linear",
      slotPadding: Number(viz.schema.trackPadding) || 0,
      sweep: (Math.max(1, Math.min(360, maxAngle)) * Math.PI) / 180,
      trackPaint:
        viz.schema.track === false || !rows.length
          ? undefined
          : (paintFromShapeConfig(trackConfig, rows[0], 0) as Paint),
    });
    return {shapeData: wedges as unknown as DataPoint[]};
  }
  const {wedges} = radialBarTrackLayout(viz, rows);
  return {shapeData: wedges as unknown as DataPoint[]};
};
