/**
    `applyRadarLayout` — Radar's chart-specific layout stage. Computes per-
    axis angular positions and the web radius (sized to the metric labels,
    see `axisLabels.ts`), the radial value domain + level rings (see
    `levels.ts`), per-group polygon vertices, and the per-polygon
    `pathConfig` (with event-handler wrappers that translate cursor →
    nearest vertex). Emits the chrome (rings, metric labels, spokes, level
    value labels — see `axisDecorations.ts`) into `_chartScene`, beneath the
    polygons. Stashes `groupData` + `pathConfig` on `viz.ctx`.
*/

import {groups, min, sum} from "d3-array";
import {pointer} from "d3-selection";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {shapeConfigFor} from "../features/emitHelpers.js";
import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";

import {
  radarAxisNodes,
  radarLevelLabelNodes,
  radarPolarAxis,
  radarRingNodes,
} from "./axisDecorations.js";
import {radarLevels, radarRadius} from "./levels.js";

const TAU = Math.PI * 2;

interface GroupDatum {
  __d3plus__: true;
  data: DataPoint;
  arr: DataPoint[];
  id: string | number;
  points: {x: number; y: number}[];
  d: string;
}

/** Builds the polygon `pathConfig`, wrapping handlers to resolve cursor → nearest vertex. */
const buildPathConfig = (
  viz: Parameters<TransformStage>[0]["viz"],
  width: number,
  height: number,
): Record<string, unknown> => {
  const pathConfig = shapeConfigFor(viz, "Path");
  // Event-handler wrappers: cursor → nearest polygon vertex resolution.
  const eventNames = Object.keys((pathConfig.on as Record<string, unknown>) ?? {});
  pathConfig.on = {};
  for (const eventName of eventNames) {
    (pathConfig.on as Record<string, unknown>)[eventName] = (
      d: GroupDatum, i: number, s: unknown, evt: Event,
    ) => {
      const xs = d.points.map(p => p.x + width / 2);
      const ys = d.points.map(p => p.y + height / 2);
      const cursor = pointer(evt, viz._select.node() as Element);
      const xDist = xs.map(p => Math.abs(p - cursor[0]));
      const yDist = ys.map(p => Math.abs(p - cursor[1]));
      const dists = xDist.map((dd, ii) => dd + yDist[ii]);
      const handler = viz.schema.on[eventName] as (...args: unknown[]) => unknown;
      handler.call(viz, d.arr[dists.indexOf(min(dists)!)], i, s, evt);
    };
  }
  return pathConfig;
};

export const applyRadarLayout: TransformStage = ({viz}) => {
  const {width, height} = chartBounds(viz);

  const metricFn = viz.schema.metric as (d: DataPoint, i: number) => unknown;
  const valueFn = viz.schema.value as (d: DataPoint, i: number) => number;

  const filtered = viz._filteredData as DataPoint[];
  const nestedAxisData = groups(filtered, metricFn);
  const nestedGroupData = groups(filtered, viz._id, metricFn);

  const values = nestedGroupData.flatMap(([, innerEntries]) =>
    innerEntries.map(([, vals]) => sum(vals, (x, i) => valueFn(x, i))),
  );
  const levels = radarLevels(values, viz.schema.levels as number | number[]);
  const {domain} = levels;

  if (!values.length || domain[0] === domain[1]) {
    viz.ctx.groupData = [];
    viz.ctx.pathConfig = {};
    return {shapeData: []};
  }

  const {radius, polarAxis} = radarPolarAxis(viz, nestedAxisData, width, height);

  // Chrome: flat SceneNodes on `_chartScene` (the chart-transformed group),
  // painted beneath the polygons `radarEmit` returns.
  const chartScene: SceneNode[] = Array.isArray(viz._chartScene)
    ? (viz._chartScene as SceneNode[])
    : (viz._chartScene = [] as SceneNode[]);
  chartScene.push(
    ...radarRingNodes(viz, levels, radius),
    ...radarAxisNodes(viz, polarAxis),
    ...radarLevelLabelNodes(viz, levels, radius),
  );
  const totalAxis = nestedAxisData.length;

  const groupData: GroupDatum[] = nestedGroupData.map(([hKey, innerEntries]) => {
    const q = innerEntries.map(([, vals], i) => {
      const value = sum(vals, (x, ii) => valueFn(x, ii));
      const r = radarRadius(value, domain, radius);
      const radians = (TAU / totalAxis) * i;
      return {x: r * Math.cos(radians), y: r * Math.sin(radians)};
    });

    const pathD = `M ${q[0].x} ${q[0].y} ${q
      .map(l => `L ${l.x} ${l.y}`)
      .join(" ")} L ${q[0].x} ${q[0].y}`;

    const aggs = viz.schema.aggs as Parameters<typeof merge>[1];
    return {
      __d3plus__: true,
      arr: innerEntries.map(([, vals]) => merge(vals as DataPoint[], aggs)) as DataPoint[],
      id: hKey as string | number,
      points: q,
      d: pathD,
      data: merge(
        innerEntries.map(([, vals]) => merge(vals as DataPoint[], aggs)) as DataPoint[],
        aggs,
      ) as DataPoint,
    };
  });

  const pathConfig = buildPathConfig(viz, width, height);

  viz.ctx.groupData = groupData;
  viz.ctx.pathConfig = pathConfig;
  return {shapeData: groupData};
};
