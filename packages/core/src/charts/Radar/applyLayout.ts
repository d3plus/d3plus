/**
    `applyRadarLayout` — Radar's chart-specific layout stage. Computes per-
    axis angular positions, per-group polygon vertices, the max value for
    radius normalization, and the per-polygon `pathConfig` (with event-
    handler wrappers that translate cursor → nearest vertex). Absorbs
    background circles, axis-label boxes, and radial spokes into
    `_chartScene`. Stashes `groupData` + `pathConfig` on `viz.ctx`.
*/

import {groups, max, min, sum} from "d3-array";
import {pointer} from "d3-selection";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {Circle, Path, Rect} from "../../shapes/index.js";
import {absorbShapeIntoChartScene, shapeConfigFor} from "../emitHelpers.js";
import type {TransformStage} from "../stages.js";
import {chartBounds} from "../chartGeometry.js";

const TAU = Math.PI * 2;

interface PolarAxisDatum {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  id: string | number;
  key: string | number;
  angle: number;
  textAnchor: string;
  labelBounds: {x: number; y: number; width: number; height: number};
  rotateAnchor: [number, number];
  x: number;
  y: number;
}

interface GroupDatum {
  __d3plus__: true;
  data: DataPoint;
  arr: DataPoint[];
  id: string | number;
  points: {x: number; y: number}[];
  d: string;
}

export const applyRadarLayout: TransformStage = ({viz}) => {
  const {width, height} = chartBounds(viz);

  const outerPadding = viz.schema.outerPadding as number;
  const levels = viz.schema.levels as number;
  const metricFn = viz.schema.metric as (d: DataPoint, i: number) => unknown;
  const valueFn = viz.schema.value as (d: DataPoint, i: number) => number;
  const axisConfig = viz.schema.axisConfig as {
    shapeConfig?: {labelConfig?: unknown};
  };

  const rawRadius = (min([height, width]) ?? 0) / 2 - outerPadding;
  const radius = Math.max(0, rawRadius);

  const filtered = viz._filteredData as DataPoint[];
  const nestedAxisData = groups(filtered, metricFn);
  const nestedGroupData = groups(filtered, viz._id, metricFn);

  const maxValue = max(
    nestedGroupData
      .map(([, innerEntries]) =>
        innerEntries.map(([, vals]) => sum(vals, (x, i) => valueFn(x, i))),
      )
      .flat(),
  );

  if (!maxValue) {
    viz.ctx.groupData = [];
    viz.ctx.pathConfig = {};
    return {shapeData: []};
  }

  const circularAxis = Array.from({length: levels}).map((_, d) => ({
    id: d,
    r: radius * ((d + 1) / levels),
  }));

  const circleConfig = shapeConfigFor(viz, "Circle", axisConfig.shapeConfig as Record<string, unknown>);
  delete circleConfig.label;
  const radarCircles = new Circle()
    .renderMode("compute")
    .data(circularAxis as unknown as DataPoint[])
    .config(circleConfig);
  absorbShapeIntoChartScene(viz, radarCircles, {key: "radar-radial-circles"});

  const labelConfig = (viz._shapeConfig as Record<string, unknown>)?.labelConfig as {
    fontSize?: (d: unknown, i: number) => number;
  } | undefined;

  const totalAxis = nestedAxisData.length;
  const polarAxis: PolarAxisDatum[] = nestedAxisData
    .map(([key, values], i) => {
      const fontSize = labelConfig?.fontSize?.(values, i) ?? 11;
      const lineHeight = fontSize * 1.4;
      const hh = lineHeight * 2;
      const ww = outerPadding;
      const padding = 10;
      const quadrant = (parseInt(String(360 - ((360 / totalAxis) * i) / 90), 10) % 4) + 1;
      const radians = (TAU / totalAxis) * i;

      let angle = (360 / totalAxis) * i;
      let textAnchor = "start";
      let x = padding;
      if (quadrant === 2 || quadrant === 3) {
        x = -ww - padding;
        textAnchor = "end";
        angle += 180;
      }
      const labelBounds = {x, y: -hh / 2, width: ww, height: hh};

      return {
        __d3plus__: true,
        data: merge(values as DataPoint[], viz._aggs as Parameters<typeof merge>[1]) as DataPoint,
        i,
        id: key as string | number,
        key: key as string | number,
        angle,
        textAnchor,
        labelBounds,
        rotateAnchor: [-x, hh / 2] as [number, number],
        x: radius * Math.cos(radians),
        y: radius * Math.sin(radians),
      };
    })
    .sort((a, b) => Number(a.key) - Number(b.key));

  const radarLabels = new Rect()
    .renderMode("compute")
    .data(polarAxis as unknown as DataPoint[])
    .rotate((d: unknown) => (d as PolarAxisDatum).angle || 0)
    .width(0)
    .height(0)
    .x((d: unknown) => (d as PolarAxisDatum).x)
    .y((d: unknown) => (d as PolarAxisDatum).y)
    .label((d: unknown) => (d as PolarAxisDatum).id)
    .labelBounds((d: unknown) => (d as PolarAxisDatum).labelBounds as unknown as Record<string, unknown>)
    .labelConfig((axisConfig.shapeConfig?.labelConfig ?? {}) as Record<string, unknown>);
  absorbShapeIntoChartScene(viz, radarLabels, {key: "radar-axis-labels"});

  const radarSpokes = new Path()
    .renderMode("compute")
    .data(polarAxis as unknown as DataPoint[])
    .d((d: unknown) => {
      const p = d as PolarAxisDatum;
      return `M0,0 ${-p.x},${-p.y}`;
    })
    .config(shapeConfigFor(viz, "Path", axisConfig.shapeConfig as Record<string, unknown>));
  absorbShapeIntoChartScene(viz, radarSpokes, {key: "radar-axis-spokes"});

  const groupData: GroupDatum[] = nestedGroupData.map(([hKey, innerEntries]) => {
    const q = innerEntries.map(([, vals], i) => {
      const value = sum(vals, (x, ii) => valueFn(x, ii));
      const r = (value / maxValue) * radius;
      const radians = (TAU / totalAxis) * i;
      return {x: r * Math.cos(radians), y: r * Math.sin(radians)};
    });

    const pathD = `M ${q[0].x} ${q[0].y} ${q
      .map(l => `L ${l.x} ${l.y}`)
      .join(" ")} L ${q[0].x} ${q[0].y}`;

    const aggs = viz._aggs as Parameters<typeof merge>[1];
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
      const handler = viz._on[eventName] as (...args: unknown[]) => unknown;
      handler.call(viz, d.arr[dists.indexOf(min(dists)!)], i, s, evt);
    };
  }

  viz.ctx.groupData = groupData;
  viz.ctx.pathConfig = pathConfig;
  return {shapeData: groupData};
};
