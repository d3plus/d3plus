/**
    `applyRadarLayout` — Radar's chart-specific layout stage. Computes per-
    axis angular positions and the web radius (sized to the metric labels,
    see `axisLabels.ts`), the radial value domain + level rings (see
    `levels.ts`), per-group polygon vertices, and the polygons'
    `pathConfig`. Emits the chrome (rings, metric labels, spokes, level
    value labels — see `axisDecorations.ts`) into `_chartScene`, beneath the
    polygons. Stashes `groupData` + `pathConfig` on `viz.ctx`.
*/

import {groups, sum} from "d3-array";

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
import {registerRadarPoint} from "./points.js";

const TAU = Math.PI * 2;

interface GroupDatum {
  __d3plus__: true;
  data: DataPoint;
  arr: DataPoint[];
  id: string | number;
  /** The metrics the polygon has a value for. */
  metrics: unknown[];
  /** Each vertex's value. */
  values: number[];
  points: {x: number; y: number}[];
  d: string;
}

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

  const {radius, polarAxis} = radarPolarAxis(
    viz,
    nestedAxisData,
    width,
    height,
  );

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
  const spokeOf = new Map(nestedAxisData.map(([key], i) => [key, i]));

  const groupData: GroupDatum[] = nestedGroupData.map(([hKey, entries]) => {
    // Each vertex sits on its own metric's spoke, in spoke order; a
    // metric the group has no value for has no vertex.
    const innerEntries = entries
      .slice()
      .sort((a, b) => spokeOf.get(a[0])! - spokeOf.get(b[0])!);
    const values = innerEntries.map(([, vals]) =>
      sum(vals, (x, ii) => valueFn(x, ii)),
    );
    const q = innerEntries.map(([metric], k) => {
      const r = radarRadius(values[k], domain, radius);
      const radians = (TAU / totalAxis) * spokeOf.get(metric)!;
      return {x: r * Math.cos(radians), y: r * Math.sin(radians)};
    });

    const pathD = `M ${q[0].x} ${q[0].y} ${q
      .map(l => `L ${l.x} ${l.y}`)
      .join(" ")} L ${q[0].x} ${q[0].y}`;

    const aggs = viz.schema.aggs as Parameters<typeof merge>[1];
    const metrics = innerEntries.map(([metric]) => metric);
    // Each vertex's row: the datum of its dot (see `points.ts`).
    const arr = innerEntries.map(([, vals], k) => {
      const row = merge(vals as DataPoint[], aggs) as DataPoint;
      registerRadarPoint(row, {metric: metrics[k], value: values[k]});
      return row;
    });
    return {
      __d3plus__: true,
      arr,
      id: hKey as string | number,
      metrics,
      values,
      points: q,
      d: pathD,
      data: merge(arr, aggs) as DataPoint,
    };
  });

  viz.ctx.groupData = groupData;
  viz.ctx.pathConfig = shapeConfigFor(viz, "Path");
  return {shapeData: groupData};
};
