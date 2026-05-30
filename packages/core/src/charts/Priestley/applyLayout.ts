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

import type {TransformStage} from "../stages.js";

interface PriestleyDatum extends Record<string, unknown> {
  __d3plus__: true;
  data: DataPoint;
  end: number | Date;
  i: number;
  id: string | number;
  start: number | Date;
  lane?: number;
}

export const applyPriestleyLayout: TransformStage = ({viz}) => {
  const filtered = viz._filteredData as DataPoint[] | undefined;
  if (!filtered) return {shapeData: []};

  const startFn = viz.schema.start as (d: DataPoint, i: number) => unknown;
  const endFn = viz.schema.end as (d: DataPoint, i: number) => unknown;
  const idFn = viz._id as (d: DataPoint, i: number) => string | number;
  const axisConfig = viz.schema.axisConfig as {scale?: string};
  const isTimeScale = axisConfig?.scale === "time";

  const data: PriestleyDatum[] = filtered
    .map((datum, i): PriestleyDatum => ({
      __d3plus__: true,
      data: datum,
      end: isTimeScale ? date(endFn(datum, i) as string) : (endFn(datum, i) as number),
      i,
      id: idFn(datum, i),
      start: isTimeScale ? date(startFn(datum, i) as string) : (startFn(datum, i) as number),
    }))
    .filter(d => Number(d.end) - Number(d.start) > 0)
    .sort((a, b) => Number(a.start) - Number(b.start));

  type Branch = {values: PriestleyDatum[]} & Record<string, unknown>;
  let nested: Branch[];
  if (viz.schema.groupBy.length > 1 && viz._drawDepth > 0) {
    const keyFns: ((d: PriestleyDatum) => unknown)[] = [];
    for (let i = 0; i < viz._drawDepth; i++) {
      keyFns.push(d => viz.schema.groupBy[i](d.data, d.i));
    }
    nested = nestGroups(data as unknown as DataPoint[], keyFns as ((d: DataPoint) => unknown)[]) as unknown as Branch[];
  } else {
    nested = [{values: data} as Branch];
  }

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

  const cfg = {
    domain: [
      min(data, d => Number(d.start)) ?? 0,
      max(data, d => Number(d.end)) ?? 0,
    ],
    height: viz.schema.height - viz._margin.top - viz._margin.bottom,
    width: viz.schema.width - viz._margin.left - viz._margin.right,
  };

  type AxisLike = {
    config: (c: unknown) => AxisLike;
    measure: () => AxisLike;
    renderMode: (m: string) => AxisLike;
    select: (el: HTMLElement | undefined) => AxisLike;
    render: () => AxisLike;
    outerBounds: () => {height: number};
    toScene: () => {children?: unknown[]} | undefined;
    schema: {padding: number};
    _d3Scale: (v: number | Date) => number;
  };
  const axisTest = viz.ctx.axisTest as AxisLike;
  const axis = viz.ctx.axis as AxisLike;

  axisTest.config(cfg).config(viz.schema.axisConfig).measure();

  axis
    .config(cfg)
    .config(viz.schema.axisConfig)
    .renderMode("compute")
    .select(undefined as unknown as HTMLElement)
    .render();
  const axisScene = axis.toScene();
  if (axisScene) {
    (viz._chartScene ||= []).push({
      type: "group",
      key: "priestley-axis",
      transform: {x: viz._margin.left, y: viz._margin.top},
      children: (axisScene.children ?? []) as unknown as never,
    });
  }

  const yScale = (scales as unknown as {
    scaleBand: () => {
      domain: (d: string[]) => ReturnType<(typeof scales)["scaleBand"]>;
      paddingInner: (n: number) => ReturnType<(typeof scales)["scaleBand"]>;
      paddingOuter: (n: number) => ReturnType<(typeof scales)["scaleBand"]>;
      rangeRound: (r: [number, number]) => ReturnType<(typeof scales)["scaleBand"]>;
      bandwidth: () => number;
    };
  }).scaleBand()
    .domain(range(0, maxLane, 1).map(String))
    .paddingInner(viz.schema.paddingInner as number)
    .paddingOuter(viz.schema.paddingOuter as number)
    .rangeRound([
      viz.schema.height - viz._margin.bottom - axisTest.outerBounds().height - axisTest.schema.padding,
      viz._margin.top + axisTest.schema.padding,
    ]);

  viz.ctx.xScale = axis._d3Scale;
  viz.ctx.yScale = yScale;
  viz.ctx.bandWidth = yScale.bandwidth();

  return {shapeData: data};
};

export type {PriestleyDatum};
