/**
    `applyRadarLayout` — Radar's chart-specific layout stage. Computes per-
    axis angular positions, per-group polygon vertices, the max value for
    radius normalization, and the per-polygon `pathConfig` (with event-
    handler wrappers that translate cursor → nearest vertex). Emits flat
    SceneNodes for background circles, axis labels, and radial spokes into
    `_chartScene`. Stashes `groupData` + `pathConfig` on `viz.ctx`.
*/

import {groups, max, min, sum} from "d3-array";
import {pointer} from "d3-selection";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import {paintFromShapeConfig, shapeConfigFor} from "../emitHelpers.js";
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

/** Emits background concentric circles, one per level, onto `chartScene`. */
const emitRadialCircles = (
  viz: Parameters<TransformStage>[0]["viz"],
  chartScene: SceneNode[],
  axisShapeConfig: Record<string, unknown>,
  levels: number,
  radius: number,
): void => {
  const circleConfig = shapeConfigFor(viz, "Circle", axisShapeConfig);
  delete circleConfig.label;

  // Background concentric circles, one per level.
  const radialCircleChildren: SceneNode[] = [];
  for (let d = 0; d < levels; d++) {
    const r = radius * ((d + 1) / levels);
    const datum = {id: d, r} as unknown as DataPoint;
    const paint = paintFromShapeConfig(circleConfig, datum, d);
    radialCircleChildren.push({
      type: "circle",
      key: `radar-radial-${d}`,
      cx: 0,
      cy: 0,
      r,
      datum,
      paint,
    } as SceneNode);
  }
  if (radialCircleChildren.length) {
    chartScene.push({
      type: "group",
      key: "radar-radial-circles",
      children: radialCircleChildren,
    } as SceneNode);
  }
};

/** Emits axis labels and radial spokes for each axis vertex onto `chartScene`. */
const emitAxisDecorations = (
  viz: Parameters<TransformStage>[0]["viz"],
  chartScene: SceneNode[],
  axisConfig: {shapeConfig?: {labelConfig?: unknown}},
  axisShapeConfig: Record<string, unknown>,
  polarAxis: PolarAxisDatum[],
): void => {
  // Axis labels: one TextNode per axis, positioned at the axis vertex,
  // rotated to read along the spoke. The original code used a Rect with
  // zero width/height + label; here we emit only labels.
  const axisLabelChildren = emitLabels({
    data: polarAxis as unknown as DataPoint[],
    label: d => (d as unknown as PolarAxisDatum).id,
    x: d => (d as unknown as PolarAxisDatum).x,
    y: d => (d as unknown as PolarAxisDatum).y,
    aes: () => ({}),
    rotate: d => (d as unknown as PolarAxisDatum).angle || 0,
    id: d => (d as unknown as PolarAxisDatum).id,
    labelBounds: d => (d as unknown as PolarAxisDatum).labelBounds,
    labelConfig: (axisConfig.shapeConfig?.labelConfig ?? {}) as Record<string, unknown>,
  });
  if (axisLabelChildren.length) {
    chartScene.push({
      type: "group",
      key: "radar-axis-labels",
      children: axisLabelChildren,
    } as SceneNode);
  }

  // Radial spokes: one Path from center to each axis vertex.
  const pathDecorConfig = shapeConfigFor(viz, "Path", axisShapeConfig);
  const spokeChildren: SceneNode[] = polarAxis.map((p, i) => {
    const paint = paintFromShapeConfig(pathDecorConfig, p as unknown as DataPoint, i);
    return {
      type: "path",
      key: `radar-spoke-${p.id}`,
      d: `M0,0 ${-p.x},${-p.y}`,
      datum: p as unknown as DataPoint,
      paint,
    } as SceneNode;
  });
  if (spokeChildren.length) {
    chartScene.push({
      type: "group",
      key: "radar-axis-spokes",
      children: spokeChildren,
    } as SceneNode);
  }
};

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

  // Decorations: emitted as flat SceneNodes onto `_chartScene` (the
  // chart-transformed group). Replaces the old `absorbShapeIntoChartScene`
  // calls that span up transient `Circle`/`Rect`/`Path` instances in
  // compute mode.
  const chartScene: SceneNode[] = Array.isArray(viz._chartScene)
    ? (viz._chartScene as SceneNode[])
    : (viz._chartScene = [] as SceneNode[]);

  const axisShapeConfig = (axisConfig.shapeConfig ?? {}) as Record<string, unknown>;
  emitRadialCircles(viz, chartScene, axisShapeConfig, levels, radius);

  const labelConfig = (viz.schema.shapeConfig as Record<string, unknown>)?.labelConfig as {
    fontSize?: (d: unknown, i: number) => number;
  } | undefined;

  const totalAxis = nestedAxisData.length;
  const polarAxis: PolarAxisDatum[] = nestedAxisData
    .map(([key, values], i): PolarAxisDatum => {
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
        data: merge(values as DataPoint[], viz.schema.aggs as Parameters<typeof merge>[1]) as DataPoint,
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

  emitAxisDecorations(viz, chartScene, axisConfig, axisShapeConfig, polarAxis);

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
