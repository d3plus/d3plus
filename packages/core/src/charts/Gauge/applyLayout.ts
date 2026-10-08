/**
    `applyGaugeLayout` — Gauge's chart-specific layout stage. Resolves the
    value domain, ticks, and bands, fits one dial to the chart area, and maps
    each row of `viz._filteredData` onto the dial's sweep (clamped to the
    domain). Stores the dial's settings on `viz.ctx.gauge` and returns one
    `GaugeDatum` per row.
*/

import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {dialBox} from "./dialLayout.js";
import type {DialOptions, GaugeIndicator} from "./dialLayout.js";
import {
  arcExtent,
  defaultTickCount,
  gaugeAngle,
  fitDial,
  gaugeDomain,
  gaugeTicks,
  resolveBands,
  toRadians,
} from "./gaugeGeometry.js";
import type {
  GaugeBand,
  GaugeDomainInput,
  ResolvedBand,
} from "./gaugeGeometry.js";

/** One row's reading on the dial. */
export interface GaugeDatum {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  value: number;
  /** The indicator's angle in radians, clamped to the sweep. */
  angle: number;
}

/** The dial every row is read against, stored on `viz.ctx.gauge`. */
export interface GaugeShared {
  /** The dial's center and outer radius, in chart-area coordinates. */
  cx: number;
  cy: number;
  radius: number;
  domain: [number, number];
  /** The sweep's start and end angles, in radians. */
  start: number;
  end: number;
  ticks: {major: number[]; minor: number[]};
  bands: ResolvedBand[];
  dial: DialOptions;
}

/**
    Room left around the dial for the hovered stroke emphasis (up to 3× a
    1px stroke, centered on the outline), so it never clips at the chart edge.
*/
const STROKE_BUFFER = 2;

/** Whether a row has a name to show: any `groupBy` level or a `label` resolves for it. */
export function hasName(viz: VizInstance, d: DataPoint, i: number): boolean {
  if (viz.schema.label) return true;
  const groupBy = (viz.schema.groupBy ?? []) as ((
    d: DataPoint,
    i: number,
  ) => unknown)[];
  return groupBy.some(g => g(d, i) !== undefined);
}

/** The label `fontSize` the user set on the axis labels, when it's a plain number. */
function userTickFontSize(viz: VizInstance): number | undefined {
  const axisConfig = (viz.schema.axisConfig ?? {}) as {
    shapeConfig?: {labelConfig?: {fontSize?: unknown}};
  };
  const size = axisConfig.shapeConfig?.labelConfig?.fontSize;
  return typeof size === "number" ? size : undefined;
}

export const applyGaugeLayout: TransformStage = ({viz}) => {
  const {width, height} = chartBounds(viz);
  const data = (viz._filteredData ?? []) as DataPoint[];
  const valueFn = viz.schema.value as (d: DataPoint, i: number) => unknown;
  const values = data.map((d, i) => Number(valueFn(d, i)));

  const bandInput = (
    Array.isArray(viz.schema.bands) ? viz.schema.bands : []
  ) as GaugeBand[];
  const start = toRadians(Number(viz.schema.startAngle) || 0);
  const end = toRadians(Number(viz.schema.endAngle) || 0);
  const tickInput = viz.schema.ticks as number | number[] | false | undefined;
  const tickCount =
    typeof tickInput === "number" ? tickInput : defaultTickCount(start, end);
  const domain = gaugeDomain(
    values,
    bandInput,
    viz.schema.domain as GaugeDomainInput,
    tickCount,
  );
  const bands = resolveBands(
    bandInput,
    domain,
    viz.schema.colorDefaults?.missing ?? "#ced4da",
  );
  const ticks = gaugeTicks(
    domain,
    tickInput,
    viz.schema.minorTicks !== false,
    tickCount,
  );

  const single = data.length === 1;
  const dial: DialOptions = {
    indicator: (viz.schema.indicator === "progress"
      ? "progress"
      : "needle") as GaugeIndicator,
    thickness: Number(viz.schema.thickness) || 0.2,
    hasBands: bands.length > 0,
    rows: data.length,
    hasValue: single,
    hasName: single && hasName(viz, data[0], 0),
    extent: arcExtent(start, end),
    tickFontSize: userTickFontSize(viz),
  };
  const fit = fitDial(
    Math.max(0, width - STROKE_BUFFER * 2),
    Math.max(0, height - STROKE_BUFFER * 2),
    dialBox(dial),
  );

  const gauges: GaugeDatum[] = data.map((d, i) => ({
    __d3plus__: true,
    data: d,
    i,
    value: values[i],
    angle: gaugeAngle(values[i], domain, start, end),
  }));

  viz.ctx.gauge = {
    cx: fit.cx + STROKE_BUFFER,
    cy: fit.cy + STROKE_BUFFER,
    radius: fit.radius,
    domain,
    start,
    end,
    ticks,
    bands,
    dial,
  } satisfies GaugeShared;
  return {shapeData: gauges as unknown as DataPoint[]};
};
