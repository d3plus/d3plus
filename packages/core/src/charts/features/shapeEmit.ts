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

import {extent, groups, max, merge} from "d3-array";
import * as scales from "d3-scale";

import type {DataPoint} from "@d3plus/data";

import type {SceneNode} from "@d3plus/render";

import type {Shape} from "../../shapes/index.js";

import {emitBarConfidence} from "../Plot/barConfidence.js";
import {labelsOverCircles, plotCircleLabels} from "../Plot/circleLabels.js";
import {emitLineBands} from "../Plot/lineBands.js";
import {lineLabelConfig} from "../Plot/lineLabelEmit.js";
import {breakLines, clipBands, lineGaps} from "../Plot/connectGapsScene.js";
import {clampBarConfig, valueAxis} from "../Plot/baselineBreak.js";
import {barSeries, seriesSlot} from "../Plot/barWidth.js";
import {applyBarHitArea, hitColumn} from "../Plot/barHitArea.js";
import {rowSpan} from "../Plot/discreteSpan.js";
import {emitFillBetween} from "../Plot/fillBetween.js";
import {applyStackShareLabels} from "../Plot/stackShareLabels.js";
import {stackEnterWindows} from "../Plot/stackEnter.js";
import {swarmPlacements, type SwarmPlacement} from "../Plot/swarm.js";
import {forecastDashOr, forecastLineDash} from "../Plot/forecastScene.js";
import {collectComputed, makeShape, shapeConfigFor} from "./emitHelpers.js";
import type {LabelWidth, PlotAxisFn, PlotDatum} from "./plotPaint.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";
import {markSharedConfig} from "../../utils/configWarnings.js";

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

  /** Pixel span of the value axis; bars are clamped inside it. */
  valueExtent?: [number, number];
  /** Pixels reserved under the value axis's range, above the x axis (see `_plotInsetBottom`). */
  insetBottom?: number;
  /** The x2 axis's height: `yRange` minus this is content space. */
  x2Height?: number;

  /** The category axis names the bars, which drop their labels (see `Plot/barLabelFit.ts`). */
  barLabelsOnAxis?: boolean;

  /** Where the unzoomed x/y plot ranges land in a zoom repaint (see `Plot/plotZoom.ts`). */
  zoomRanges?: Partial<Record<"x" | "y", number[]>>;

  /** Line rows with no plottable value, where `connectGaps` breaks lines. */
  missingRows?: PlotDatum[];
}

/** An emitter: produces the scene nodes for one shape group. */
export type ShapeEmitter = (ctx: ShapeEmitContext, key: string) => SceneNode[];

/**
    Clone the base shape config and, for stacked Area/Bar, inject the
    stacking-aware opp/opp0/opp1 accessors that read the precomputed
    `stackData` cube.
*/
function buildInner(
  ctx: ShapeEmitContext,
  key: string,
): Record<string, unknown> {
  const {viz, opp, x, y, stackData, domains, stackKeyIndex, discreteKeyIndex} =
    ctx;
  const inner: Record<string, unknown> = markSharedConfig(
    Object.assign({}, ctx.shapeConfig),
  );
  // Bubble plots: when a `size` accessor is set, default to layering circles
  // largest-behind so smaller marks stay visible under bigger ones. This is a
  // default — `finishShape` applies the user's `shapeConfig` afterwards, so an
  // explicit `sort` (or `sort: null` to disable) still wins.
  if (key === "Circle" && viz._size) {
    const size = viz._size;
    inner.sort = (a: DataPoint, b: DataPoint) =>
      (Number(size(b)) || 0) - (Number(size(a)) || 0);
  }
  // A Box groups its rows by pixel position, which a reorder hands to another
  // category, so it takes its identity from the category instead.
  if (key === "Box") inner.id = (d: PlotDatum) => d.discrete;
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
function finishShape(
  ctx: ShapeEmitContext,
  key: string,
  s: Shape,
  override?: (userConfig: Record<string, unknown>) => Record<string, unknown>,
): SceneNode[] {
  const {viz, events} = ctx;
  viz._wirePlotShapeEvents!(s, key, events);
  const userConfig = shapeConfigFor(viz, key);
  if (viz.schema.shapeConfig.duration === undefined) delete userConfig.duration;
  s.config(userConfig);
  if (override) s.config(override(userConfig));
  if (key === "Bar" && ctx.barLabelsOnAxis) s.label(false);
  if (viz.schema.stacked && key === "Bar") applyStackShareLabels(viz, s);
  const besideLabels =
    key === "Circle" ? plotCircleLabels(ctx, s, userConfig) : null;
  s.render();
  const nodes = collectComputed(s);
  if (key === "Circle")
    return labelsOverCircles([...nodes, ...(besideLabels?.() ?? [])]);
  if (key !== "Bar") return nodes;
  // Error bars paint over their bars but under the bar labels. Stacked bars
  // grow in one stack level after another.
  const errorBars = emitBarConfidence(ctx, nodes);
  if (!errorBars.length) return stackEnterWindows(ctx, nodes);
  let last = -1;
  nodes.forEach((n, i) => {
    if (n.shapeType === "Bar") last = i;
  });
  return stackEnterWindows(ctx, [
    ...nodes.slice(0, last + 1),
    ...errorBars,
    ...nodes.slice(last + 1),
  ]);
}

/** Generic path — every shape key without a dedicated emitter (incl. stacked Area). */
export const genericEmit: ShapeEmitter = (ctx, key) => {
  const s = makeShape(key)
    .renderMode("compute")
    .config(buildInner(ctx, key))
    .data(ctx.values);
  return finishShape(ctx, key, s);
};

/**
    Circle — in swarm mode, each circle is packed off its lane's centerline
    (see `Plot/swarm.ts`); otherwise the generic path.
*/
const circleEmit: ShapeEmitter = (ctx, key) => {
  if (!ctx.viz._swarm) return genericEmit(ctx, key);
  const {viz, values, x, y, xRange, yRange} = ctx;
  const s = makeShape("Circle")
    .renderMode("compute")
    .config(buildInner(ctx, "Circle"))
    .data(values);
  return finishShape(ctx, "Circle", s, userConfig => {
    const r = userConfig.r as ((d: DataPoint, i: number) => number) | number;
    const placed = swarmPlacements(viz, {
      values,
      x,
      y,
      xRange,
      yRange,
      lanes: viz._swarm!.cross === "x" ? ctx.xDomain : ctx.yDomain,
      r: typeof r === "function" ? r : () => r,
    });
    const at = (d: DataPoint) => placed.get(d) as SwarmPlacement;
    return {
      x: (d: DataPoint) => at(d).x,
      y: (d: DataPoint) => at(d).y,
      r: (d: DataPoint) => at(d).r,
    };
  });
};

/**
    The bars a time axis's domain reaches. A user domain can stop short of the
    data, and a bar centered outside it is not drawn (nor counted when
    spacing the bars that are).
*/
function barsInDomain(ctx: ShapeEmitContext): DataPoint[] {
  const {viz, values} = ctx;
  const axis = viz.schema.discrete as string;
  if ((axis === "x" ? ctx.xScale : ctx.yScale) !== "Time") return values;
  // Zoomed, the domain is the visible window; bars keep to the unzoomed
  // domain, which spans where the unzoomed plot range landed.
  const zoomRange = ctx.zoomRanges?.[axis as "x" | "y"];
  if (zoomRange) {
    const scale = axis === "x" ? ctx.x : ctx.y;
    const [lo, hi] = extent(zoomRange) as [number, number];
    return values.filter(d => {
      const at = scale(d[axis]);
      return at >= lo - 0.5 && at <= hi + 0.5;
    });
  }
  const [lo, hi] = extent(
    (axis === "x" ? ctx.xDomain : ctx.yDomain).map(Number),
  ) as [number, number];
  return values.filter(d => {
    const at = +(d[axis] as number);
    return at >= lo && at <= hi;
  });
}

/** Bar — discrete-axis spacing + multi-series grouping offsets. */
const barEmit: ShapeEmitter = emitCtx => {
  const ctx = {...emitCtx, values: barsInDomain(emitCtx)};
  const {
    viz,
    x,
    y,
    xScale,
    yScale,
    xDomain,
    yDomain,
    xRange,
    yRange,
    values,
    zoomRanges,
  } = ctx;
  const s = makeShape("Bar")
    .renderMode("compute")
    .config(
      clampBarConfig(buildInner(ctx, "Bar"), valueAxis(viz), ctx.valueExtent),
    )
    .data(values);

  const scale = viz.schema.discrete === "x" ? x : y;
  if (viz._discreteExtent) return spanBarEmit(ctx, s, scale);

  let space;
  const scaleType = viz.schema.discrete === "x" ? xScale : yScale;
  const vals = viz.schema.discrete === "x" ? xDomain : yDomain;
  const range = viz.schema.discrete === "x" ? xRange : yRange;
  // Zoomed, a time axis's bars keep their unzoomed spacing, scaled: the
  // first and last bars mirror about where the unzoomed plot edges landed,
  // not about the visible edges they may sit on or past.
  const zoomRange = zoomRanges?.[viz.schema.discrete as "x" | "y"];
  if (scaleType !== "Point" && vals.length === 2) {
    const allPositions = Array.from(
      new Set(
        values.map((d: DataPoint) => scale(d[viz.schema.discrete as string])),
      ),
    );
    // A reversed axis places the data from its far end.
    if (allPositions[0] > allPositions[allPositions.length - 1])
      allPositions.reverse();
    const first = allPositions[0] as number;
    const last = allPositions[allPositions.length - 1] as number;
    allPositions.unshift(
      zoomRange
        ? 2 * zoomRange[0] - first
        : (range[0] as number) - first - (range[0] as number),
    );
    allPositions.push(
      zoomRange
        ? 2 * zoomRange[1] - last
        : (range[1] as number) + (range[1] as number) - last,
    );
    space = allPositions.reduce((n: number, d, i, arr) => {
      if (i) {
        const dist = Math.abs((d as number) - (arr[i - 1] as number));
        if (dist < n) n = dist;
      }
      return n;
    }, Infinity);
  } else if (vals.length > 1) space = Math.abs(scale(vals[1]) - scale(vals[0]));
  else space = range[range.length - 1] - range[0];
  const step = space;
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
  const discreteFn = ctx.shapeConfig[discreteKey] as (
    d: PlotDatum,
    i: number,
  ) => number;
  let column: (d: PlotDatum) => [number, number] = () =>
    hitColumn(step, 1, 0, 0);
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
    column = (d: PlotDatum) =>
      hitColumn(step, uniqueIds.length, uniqueIds.indexOf(d.group), offset);
  }

  s.width(barSize);
  s.height(barSize);
  barHits(ctx, s, column);

  return finishShape(ctx, "Bar", s);
};

/**
    Bar on a span axis (`viz._discreteExtent`): each bar fills its own
    `[start, end]`, less `groupPadding`. Unstacked series sharing a
    variable-width bar (`barWidth`) split it side by side, spaced by
    `barPadding`; Histogram's series sharing a bin overlap.
*/
function spanBarEmit(
  ctx: ShapeEmitContext,
  s: Shape,
  scale: PlotAxisFn,
): SceneNode[] {
  const {viz, values} = ctx;
  const space = (d: PlotDatum) => {
    const [start, end] = rowSpan(viz, d);
    return Math.max(
      1,
      Math.abs(scale(end) - scale(start)) - viz._groupPadding!,
    );
  };
  const step = (d: PlotDatum) => {
    const [start, end] = rowSpan(viz, d);
    return Math.abs(scale(end) - scale(start));
  };
  const axis = viz.schema.discrete as "x" | "y";
  const series = viz._barSpans ? barSeries(values as PlotDatum[], axis) : [];
  if (series.length < 2) {
    s.width(space);
    s.height(space);
    barHits(ctx, s, (d: PlotDatum) => hitColumn(step(d), 1, 0, 0));
    return finishShape(ctx, "Bar", s);
  }
  const slot = (d: PlotDatum) =>
    seriesSlot(
      space(d),
      series.length,
      series.indexOf(d.group),
      viz.schema.barPadding,
    );
  const position = ctx.shapeConfig[axis] as (d: PlotDatum, i: number) => number;
  s[axis]((d: PlotDatum, i: number) => position(d, i) + slot(d).offset);
  s.width((d: PlotDatum) => slot(d).size);
  s.height((d: PlotDatum) => slot(d).size);
  barHits(ctx, s, (d: PlotDatum) =>
    hitColumn(
      step(d),
      series.length,
      series.indexOf(d.group),
      Math.max(0, space(d) - slot(d).size) / 2,
    ),
  );
  return finishShape(ctx, "Bar", s);
}

/** Side-by-side bars' hit areas (see `Plot/barHitArea.ts`); stacked bars take none. */
function barHits(
  ctx: ShapeEmitContext,
  s: Shape,
  column: (d: PlotDatum, i: number) => [number, number],
): void {
  const {viz} = ctx;
  if (viz.schema.stacked) return;
  applyBarHitArea(
    s,
    viz.schema.discrete === "y" ? "y" : "x",
    ctx.valueExtent,
    column as (d: DataPoint, i: number) => [number, number],
  );
}

/** Line — duration, optional confidence band, end-labels, and point markers. */
const lineEmit: ShapeEmitter = ctx => {
  const {
    viz,
    values,
    width,
    showLineLabels,
    labelWidths,
    largestLabel,
    labelPositions,
  } = ctx;
  const out: SceneNode[] = [];

  const s = makeShape("Line")
    .renderMode("compute")
    .config(buildInner(ctx, "Line"))
    .data(values);

  // Fills between series sit behind the lines and their confidence bands.
  if (viz.schema.fillBetween) out.push(...emitFillBetween(ctx));

  s.duration(width * 1.5);

  // `connectGaps` breaks each line, and clips its bands, where it skips a value.
  const gaps = lineGaps(ctx);
  if (viz._confidence) {
    const bands = emitLineBands(ctx);
    out.push(...(gaps ? clipBands(bands, gaps) : bands));
  }

  const labelInputs = {viz, labelWidths, largestLabel, labelPositions};
  const labels = showLineLabels ? lineLabelConfig(labelInputs) : undefined;
  s.config({
    discrete: ctx.shapeConfig.discrete || "x",
    label: labels ? labels.label : false,
    labelBounds: labels ? labels.labelBounds : false,
  });

  // A forecast draws each line dashed from where its forecast starts.
  const forecastDash = forecastLineDash(
    viz,
    values as PlotDatum[],
    ctx.shapeConfig,
    ctx,
  );
  // Labels at a line's left end, or with values, keep their own text,
  // bounds, and anchor over the user's, taking only the series name from them.
  const labelOverride =
    labels && labelWidths.some(l => l.side === "start" || l.valueText)
      ? (user: Record<string, unknown>) => {
          const own = lineLabelConfig({...labelInputs, name: user.label});
          return {
            label: own.label,
            labelBounds: own.labelBounds,
            labelConfig: {
              textAnchor: own.textAnchor(s.labelConfig().textAnchor),
            },
          };
        }
      : undefined;
  const lines = finishShape(
    ctx,
    "Line",
    s,
    forecastDash || labelOverride
      ? user => ({
          ...(forecastDash && {
            strokeDasharray: forecastDashOr(forecastDash, user.strokeDasharray),
          }),
          ...labelOverride?.(user),
        })
      : undefined,
  );
  out.push(...(gaps ? breakLines(lines, gaps) : lines));

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
  Circle: circleEmit,
  Line: lineEmit,
};

/**
    Dispatch a shape group to its emitter: the chart's own override for the key
    (`viz._plotShapeEmitters`), else the registry, else the generic path.
*/
export function emitShape(ctx: ShapeEmitContext, key: string): SceneNode[] {
  return (
    ctx.viz._plotShapeEmitters?.[key] ??
    shapeEmitters[key] ??
    genericEmit
  )(ctx, key);
}
