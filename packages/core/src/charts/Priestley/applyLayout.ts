/**
    `applyPriestleyLayout` — Priestley's chart-specific layout stage.

    Coerces start/end values (via `date()` if axis is time-scaled), groups by
    the nested `_groupBy` slice, packs bands onto lanes with a greedy
    first-fit packer, runs the production + measure axes, computes the band
    scale, and stashes `xScale`/`yScale`/`bandWidth` on `viz.ctx`.
*/

import {min, max, range} from "d3-array";
import * as scales from "d3-scale";

import {date} from "@d3plus/dom";
import {nestGroups} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import {hoverTickValues} from "../features/hoverTicks.js";
import type {TransformStage} from "../pipeline/stages.js";
import {
  isTimeAxis,
  isUtcAxis,
  measureTimeAxis,
  renderTimeAxis,
} from "./timeAxis.js";

interface PriestleyDatum extends Record<string, unknown> {
  __d3plus__: true;
  data: DataPoint;
  end: number | Date;
  i: number;
  id: string | number;
  start: number | Date;
  lane?: number;
}

type Branch = {values: PriestleyDatum[]} & Record<string, unknown>;

/** Greedy first-fit lane packer; mutates `d.lane` and returns total lane count. */
const packLanes = (nested: Branch[]): number => {
  let maxLane = 0;
  nested.forEach(g => {
    let track: (number | Date | false)[] = [];
    g.values.forEach(d => {
      track = track.map(t => (t !== false && t <= d.start ? false : t));
      const idx = track.indexOf(false);
      if (idx < 0) {
        d.lane = maxLane + track.length;
        track.push(d.end);
      } else {
        track[idx] = d.end;
        d.lane = maxLane + idx;
      }
    });
    maxLane += track.length;
  });
  return maxLane;
};

/**
    The field the time axis's tick labels follow the hover on: each band
    lists the ticks it spans under it (see `bandTicks`).
*/
export const TICK_FIELD = "priestleyTick";

/**
    The ticks among `ticks` that fall within a band, its start and end
    included, so the band lights their labels while it's hovered or
    selected.
*/
export const bandTicks = (ticks: unknown[], d: PriestleyDatum): unknown[] =>
  ticks.filter(t => Number(t) >= Number(d.start) && Number(t) <= Number(d.end));

/**
    Runs both axes, pushes the axis scene (its tick labels stamped with
    `TICK_FIELD`), and stashes scales/bandWidth/ticks on `viz.ctx`. Everything is placed in the chart area's own coordinates: the
    default `_chartTransform` moves the area to the margin origin.
*/
const runAxesAndScales = (
  viz: Parameters<TransformStage>[0]["viz"],
  data: PriestleyDatum[],
  maxLane: number,
): void => {
  const frame = {
    domain: [
      min(data, d => Number(d.start)) ?? 0,
      max(data, d => Number(d.end)) ?? 0,
    ],
    ...chartBounds(viz),
  };
  const axis = measureTimeAxis(viz, frame);
  const xScale = renderTimeAxis(viz, {
    ...frame,
    transform: {x: 0, y: 0},
    key: "priestley-axis",
    hoverField: TICK_FIELD,
  });
  const axisScene = viz._chartScene?.[viz._chartScene.length - 1];
  viz.ctx.ticks = axisScene ? hoverTickValues(axisScene, TICK_FIELD) : [];

  const yScale = (
    scales as unknown as {
      scaleBand: () => {
        domain: (d: string[]) => ReturnType<(typeof scales)["scaleBand"]>;
        paddingInner: (n: number) => ReturnType<(typeof scales)["scaleBand"]>;
        paddingOuter: (n: number) => ReturnType<(typeof scales)["scaleBand"]>;
        rangeRound: (
          r: [number, number],
        ) => ReturnType<(typeof scales)["scaleBand"]>;
        bandwidth: () => number;
      };
    }
  )
    .scaleBand()
    .domain(range(0, maxLane, 1).map(String))
    .paddingInner(viz.schema.paddingInner as number)
    .paddingOuter(viz.schema.paddingOuter as number)
    .rangeRound([frame.height - axis.height - axis.padding, axis.padding]);

  viz.ctx.xScale = xScale;
  viz.ctx.yScale = yScale;
  viz.ctx.bandWidth = yScale.bandwidth();
};

export const applyPriestleyLayout: TransformStage = ({viz}) => {
  const filtered = viz._filteredData as DataPoint[] | undefined;
  if (!filtered) return {shapeData: []};

  const startFn = viz.schema.start as (d: DataPoint, i: number) => unknown;
  const endFn = viz.schema.end as (d: DataPoint, i: number) => unknown;
  const idFn = viz._id as (d: DataPoint, i: number) => string | number;
  const isTimeScale = isTimeAxis(viz);
  const utc = isUtcAxis(viz);

  const data: PriestleyDatum[] = filtered
    .map((datum, i): PriestleyDatum => ({
      __d3plus__: true,
      data: datum,
      end: isTimeScale
        ? (date(endFn(datum, i) as string, {utc}) as Date)
        : (endFn(datum, i) as number),
      i,
      id: idFn(datum, i),
      start: isTimeScale
        ? (date(startFn(datum, i) as string, {utc}) as Date)
        : (startFn(datum, i) as number),
    }))
    .filter(d => Number(d.end) - Number(d.start) > 0)
    .sort((a, b) => Number(a.start) - Number(b.start));

  let nested: Branch[];
  if (viz.schema.groupBy.length > 1 && viz._drawDepth > 0) {
    const keyFns: ((d: PriestleyDatum) => unknown)[] = [];
    for (let i = 0; i < viz._drawDepth; i++) {
      keyFns.push(d => viz.schema.groupBy[i](d.data, d.i));
    }
    nested = nestGroups(
      data as unknown as DataPoint[],
      keyFns as ((d: DataPoint) => string | number | boolean)[],
    ) as unknown as Branch[];
  } else {
    nested = [{values: data} as Branch];
  }

  const maxLane = packLanes(nested);

  runAxesAndScales(viz, data, maxLane);

  return {shapeData: data};
};

export type {PriestleyDatum};
