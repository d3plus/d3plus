/**
    Per-shape emit registry for the Plot paint phase.

    The Plot paint loop walks the grouped `shapeData` and, for each shape
    key, produces the scene nodes for that shape's data. Most shapes follow
    the same path (instantiate compute-mode → wire events → apply user
    config → render → collect). Bar and Line carry extra geometry — bar
    spacing/grouping, line confidence bands + end-labels + markers — so they
    get dedicated emitters. Everything else (and stacked Area) flows through
    the generic emitter.

    A chart "uses only some shapes" purely by which keys appear in its
    `shapeData` (driven by the chart's `shape` accessor default). The
    registry stays complete; the dispatch only ever calls the emitters whose
    keys are present.

    @module
*/

import {groups, max, merge} from "d3-array";
import * as scales from "d3-scale";

import type {DataPoint} from "@d3plus/data";
import {assign} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";

import type {SceneNode} from "@d3plus/render";

import type {Shape} from "../../shapes/index.js";

import {collectComputed, makeShape, shapeConfigFor} from "./emitHelpers.js";
import type {LabelWidth, PlotAxisFn, PlotDatum} from "./plotPaint.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/**
    The cross-phase locals a shape emitter reads. Assembled once per draw by
    the Plot paint loop and passed to each emitter alongside the shape key.
    The stack math (`stackData`/`stackKeyIndex`/`discreteKeyIndex`) is
    computed upstream once per draw — emitters consume it, never recompute.
*/
export interface ShapeEmitContext {
  viz: Viz;
  /** The data rows for this shape group. */
  values: DataPoint[];
  /** The base shape config shared across every shape in the loop. */
  shapeConfig: Record<string, unknown>;
  /** Event names registered on the viz (`Object.keys(viz.schema.on)`). */
  events: string[];

  // Scales + accessors (x/y reassigned to the production-axis closures).
  x: PlotAxisFn;
  y: PlotAxisFn;
  xScale: string;
  yScale: string;
  xDomain: number[];
  yDomain: number[];
  xRange: number[];
  yRange: number[];

  // Stacking inputs (computed once upstream).
  opp: "x" | "y" | undefined;
  domains: Record<string, number[]>;
  stackData: number[][][];
  stackKeyIndex: Map<unknown, number>;
  discreteKeyIndex: Map<unknown, number>;

  // Line-label inputs.
  showLineLabels: boolean;
  labelWidths: LabelWidth[];
  largestLabel: number;
  labelPositions: Record<string, number>;

  width: number;
}

/** An emitter: produces the scene nodes for one shape group. */
export type ShapeEmitter = (ctx: ShapeEmitContext, key: string) => SceneNode[];

/**
    Clone the base shape config and, for stacked Area/Bar, inject the
    stacking-aware opp/opp0/opp1 accessors that read the precomputed
    `stackData` cube.
*/
function buildInner(ctx: ShapeEmitContext, key: string): Record<string, unknown> {
  const {viz, opp, x, y, stackData, domains, stackKeyIndex, discreteKeyIndex} = ctx;
  const inner: Record<string, unknown> = Object.assign({}, ctx.shapeConfig);
  // Bubble plots: when a `size` accessor is set, default to layering circles
  // largest-behind so smaller marks stay visible under bigger ones. This is a
  // default — `finishShape` applies the user's `shapeConfig` afterwards, so an
  // explicit `sort` (or `sort: null` to disable) still wins.
  if (key === "Circle" && viz._size) {
    const size = viz._size;
    inner.sort = (a: DataPoint, b: DataPoint) =>
      (Number(size(b)) || 0) - (Number(size(a)) || 0);
  }
  if (viz.schema.stacked && ["Area", "Bar"].includes(key)) {
    const scale = opp === "x" ? x : y;
    inner[`${opp}`] = inner[`${opp}0`] = (d: PlotDatum) => {
      const dataIndex = stackKeyIndex.get(d.id) ?? -1;
      const discreteIndex = discreteKeyIndex.get(d.discrete) ?? -1;
      const scaleIndex = (d[opp!] as number) < 0 ? 1 : 0;
      return dataIndex >= 0
        ? scale(stackData[dataIndex][discreteIndex][scaleIndex])
        : scale(domains[opp!][opp === "x" ? 0 : 1]);
    };
    inner[`${opp}1`] = (d: PlotDatum) => {
      const dataIndex = stackKeyIndex.get(d.id) ?? -1;
      const discreteIndex = discreteKeyIndex.get(d.discrete) ?? -1;
      const scaleIndex = (d[opp!] as number) < 0 ? 0 : 1;
      return dataIndex >= 0
        ? scale(stackData[dataIndex][discreteIndex][scaleIndex])
        : scale(domains[opp!][opp === "x" ? 0 : 1]);
    };
  }
  return inner;
}

/**
    Shared tail: wire shape events, apply the user's shapeConfig, render in
    compute mode, and collect the resulting scene nodes.
*/
function finishShape(ctx: ShapeEmitContext, key: string, s: Shape): SceneNode[] {
  const {viz, events} = ctx;
  viz._wirePlotShapeEvents!(s, key, events);
  const userConfig = shapeConfigFor(viz, key);
  if (viz.schema.shapeConfig.duration === undefined) delete userConfig.duration;
  s.config(userConfig).render();
  return collectComputed(s);
}

/** Generic path — every shape key without a dedicated emitter (incl. stacked Area). */
const genericEmit: ShapeEmitter = (ctx, key) => {
  const s = makeShape(key)
    .renderMode("compute")
    .config(buildInner(ctx, key))
    .data(ctx.values);
  return finishShape(ctx, key, s);
};

/** Bar — discrete-axis spacing + multi-series grouping offsets. */
const barEmit: ShapeEmitter = ctx => {
  const {viz, x, y, xScale, yScale, xDomain, yDomain, xRange, yRange, values} = ctx;
  const s = makeShape("Bar")
    .renderMode("compute")
    .config(buildInner(ctx, "Bar"))
    .data(values);

  let space;
  const scale = viz.schema.discrete === "x" ? x : y;
  const scaleType = viz.schema.discrete === "x" ? xScale : yScale;
  const vals = viz.schema.discrete === "x" ? xDomain : yDomain;
  const range = viz.schema.discrete === "x" ? xRange : yRange;
  if (scaleType !== "Point" && vals.length === 2) {
    const allPositions = Array.from(
      new Set(values.map((d: DataPoint) => scale(d[viz.schema.discrete as string]))),
    );
    allPositions.unshift(
      (range[0] as number) -
        (allPositions[0] as number) -
        (range[0] as number),
    );
    allPositions.push(
      (range[1] as number) +
        (range[1] as number) -
        (allPositions[allPositions.length - 1] as number),
    );
    space = allPositions.reduce((n: number, d, i, arr) => {
      if (i) {
        const dist = Math.abs((d as number) - (arr[i - 1] as number));
        if (dist < n) n = dist;
      }
      return n;
    }, Infinity);
  } else if (vals.length > 1) space = scale(vals[1]) - scale(vals[0]);
  else space = range[range.length - 1] - range[0];
  if (viz._groupPadding! < space) space -= viz._groupPadding!;

  let barSize = space || 1;

  const barGroups = groups(
    values,
    (d: DataPoint) => d[viz.schema.discrete as string],
    (d: DataPoint) => d.group,
  );

  const ids = merge(
    barGroups.map(([, innerEntries]) => innerEntries.map(([k]) => k)),
  );
  const uniqueIds = Array.from(new Set(ids));

  const discreteKey = viz.schema.discrete as string;
  const discreteFn = ctx.shapeConfig[discreteKey] as (d: PlotDatum, i: number) => number;
  if (max(barGroups.map(([, innerEntries]) => innerEntries.length)) === 1) {
    s[discreteKey]((d: PlotDatum, i: number) => discreteFn(d, i));
  } else {
    barSize =
      (barSize - viz.schema.barPadding * uniqueIds.length - 1) /
      uniqueIds.length;

    const offset = space / 2 - barSize / 2;

    const xMod = scales
      .scaleLinear()
      .domain([0, uniqueIds.length - 1])
      .range([-offset, offset]);

    s[discreteKey](
      (d: PlotDatum, i: number) =>
        discreteFn(d, i) + xMod(uniqueIds.indexOf(d.group)),
    );
  }

  s.width(barSize);
  s.height(barSize);

  return finishShape(ctx, "Bar", s);
};

/** Line — duration, optional confidence band, end-labels, and point markers. */
const lineEmit: ShapeEmitter = ctx => {
  const {
    viz, x, y, values, width, showLineLabels,
    labelWidths, largestLabel, labelPositions,
  } = ctx;
  const out: SceneNode[] = [];

  const s = makeShape("Line")
    .renderMode("compute")
    .config(buildInner(ctx, "Line"))
    .data(values);

  s.duration(width * 1.5);

  if (viz._confidence) {
    const confidence = viz._confidence;
    const areaConfig: Record<string, unknown> = Object.assign({}, ctx.shapeConfig);
    const discrete = viz.schema.discrete || "x";
    const key = discrete === "x" ? "y" : "x";
    const scaleFunction = discrete === "x" ? y : x;
    areaConfig[`${key}0`] = (d: PlotDatum) =>
      scaleFunction(confidence[0] ? d.lci : d[key]);
    areaConfig[`${key}1`] = (d: PlotDatum) =>
      scaleFunction(confidence[1] ? d.hci : d[key]);

    const area = makeShape("Area")
      .renderMode("compute")
      .config(areaConfig)
      .data(values);
    // Fresh object — must NOT mutate the shared `shapeConfig`, or the confidence
    // fill/fillOpacity leak onto every other shape and every later render.
    const confidenceConfig = Object.assign(
      {},
      viz.schema.shapeConfig,
      viz._confidenceConfig,
    );

    area
      .config(
        assign(
          shapeConfigFor(viz, "Line", confidenceConfig),
          shapeConfigFor(viz, "Area", confidenceConfig),
        ),
      )
      .render();

    out.push(...collectComputed(area));
  }

  s.config({
    discrete: ctx.shapeConfig.discrete || "x",
    label: showLineLabels
      ? (d: PlotDatum, i: number) => {
          const visible =
            typeof viz.schema.lineLabels === "function"
              ? viz.schema.lineLabels(d.data, d.i)
              : true;
          if (!visible) return false;
          const labelData = labelWidths.find(l => l.id === d.id);
          if (labelData) {
            const yPos = labelData.newY || labelData.defaultY;
            const allLabels = labelWidths.filter(l => l.newY === yPos);
            if (allLabels.length > 1)
              return allLabels[0].id !== d.id
                ? false
                : `+${formatAbbreviate(
                    allLabels.length,
                    viz.schema.locale,
                  )} ${viz.schema.translate("more")}`;
            return viz._drawLabel(d as unknown as DataPoint, i);
          }
          return false;
        }
      : false,
    labelBounds: showLineLabels
      ? (d: PlotDatum, i: number, s: {points: number[][]}) => {
          const [firstX, firstY] = s.points[0];
          const [lastX, lastY] = s.points[s.points.length - 1];
          const height = viz.schema.height / 4;
          const mod = labelPositions[d.id]
            ? lastY - labelPositions[d.id]
            : 0;
          return {
            x: lastX - firstX,
            y: lastY - firstY - height / 2 - mod,
            width: largestLabel,
            height,
          };
        }
      : false,
  });

  out.push(...finishShape(ctx, "Line", s));

  const markers = makeShape("Circle")
    .renderMode("compute")
    .data(viz._lineMarkers ? values : [])
    .config(ctx.shapeConfig)
    .config(viz._lineMarkerConfig)
    .id((d: PlotDatum) => `${d.id}_${d.discrete}`);

  viz._wirePlotShapeEvents!(markers, "Circle", ctx.events);
  markers.render();
  out.push(...collectComputed(markers));

  return out;
};

/** Shape key → dedicated emitter. Keys absent here use `genericEmit`. */
export const shapeEmitters: Record<string, ShapeEmitter> = {
  Bar: barEmit,
  Line: lineEmit,
};

/** Dispatch a shape group to its emitter (falling back to the generic path). */
export function emitShape(ctx: ShapeEmitContext, key: string): SceneNode[] {
  return (shapeEmitters[key] ?? genericEmit)(ctx, key);
}
