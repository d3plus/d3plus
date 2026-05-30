/**
    `plotPaint(viz, pCtx)` — the Plot paint phase as a free function.

    RFC §3.1 architectural seam for Plot, sibling to `runVizPipeline(viz)`.
    The paint phase (production axis rendering, shape buffer setup, and
    shape emission with event handlers) runs here; `Plot._paint` is a
    thin shim that concats the returned nodes onto `viz._chartScene`.

    @param viz The Plot instance (or any subclass: BarChart, LinePlot, …).
    @param pCtx Cross-phase locals produced by `Plot._draw` — see the
                destructure block below for the full schema.
*/

import {groups, max, merge, range} from "d3-array";
import * as scales from "d3-scale";

import type {DataPoint} from "@d3plus/data";
import {assign} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";

import type {SceneNode} from "@d3plus/render";

import type Axis from "../components/Axis.js";
import * as shapes from "../shapes/index.js";
import {collectComputed, shapeConfigFor} from "./emitHelpers.js";
import type {VizInstance as Viz} from "./vizTypes.js";

/** An axis position function: maps a domain value to a pixel coordinate. */
type PlotAxisFn = (d: unknown, axis?: string) => number;

/**
    A line-label measurement record produced upstream by
    `measurePlotLineLabels` and consumed here to bump overlapping labels
    apart and draw their connector lines.
*/
interface LabelWidth {
  id: string | number;
  xValue: unknown;
  value: unknown;
  fontSize: number;
  padding: number;
  fontColor?: string;
  /** Bumped y position (set when this label collided with a neighbor). */
  newY?: number;
  /** Unbumped y position (the raw axis position of `value`). */
  defaultY?: number;
}

/**
    The wrapped datum a compute-mode shape passes to its config accessors:
    the original `data` row plus the layout-assigned coordinate/group slots.
    The index signature covers the dynamic `d[discrete]` / `d[opp]` reads.
*/
interface PlotDatum {
  data: DataPoint;
  i: number;
  id: string | number;
  discrete?: string | number;
  group?: string | number;
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  lci?: number;
  hci?: number;
  [key: string]: unknown;
}

/** A user annotation: a shape key plus its config, optionally z-layered. */
interface Annotation {
  shape: string;
  layer?: string;
  [key: string]: unknown;
}

/** Construct a shape instance by its registry key (e.g. "Bar", "Line"). */
const shapeCtors = shapes as unknown as Record<string, new () => shapes.Shape>;
const makeShape = (key: string): shapes.Shape => new shapeCtors[key]();

/**
    Cross-phase locals threaded from `Plot._draw` (and its extracted pipeline
    stages) into `plotPaint` — the contract any consumer of `plotPaint` must
    supply.

    Grouped by what populates them:
      - **Data + domain** (formatPlotData / computePlotInitialDomains):
        `data`, `shapeData`, `axisData`, `domains`, `discreteKeys`,
        `stackData`, `stackKeys`, `xData/yData/x2Data/y2Data`,
        `xDomain/yDomain/x2Domain/y2Domain`.
      - **Accessors + scales** (computePlotScales):
        `x`, `y`, `x2`, `y2`, `xScale`/`yScale`/`x2Scale`/`y2Scale`,
        `xConfigScale`/`yConfigScale`/`x2ConfigScale`/`y2ConfigScale`.
        `x` and `y` are reassigned during paint (`viz._xFunc = x = ...`).
      - **Axis configs + visibility** (preparePlotAxisLayout):
        `defaultConfig`, `defaultX2Config`, `defaultY2Config`,
        `showX`, `showY`, `x2Exists`, `y2Exists`, `xC`, `yC`.
      - **Axis measurements** (preparePlotAxisLayout + measurePlotLineLabels):
        `xTicks`/`yTicks`/`x2Ticks`/`y2Ticks`, `labelWidths`, `largestLabel`,
        `xRangeMax`, `xTest`/`yTest`/`x2Test`/`y2Test` (transient axis
        instances), `xTestRange`/`x2TestRange`.
      - **Layout offsets + viewport** (preparePlotAxisLayout):
        `yBounds`/`yWidth`/`xOffsetLeft`/`y2Bounds`/`y2Width`/`xOffsetRight`
        (REASSIGNED by paint from production axes), `xHeight`, `x2Height`,
        `topOffset`, `height`, `width`, `horizontalMargin`, `verticalMargin`.
      - **Paint plumbing** (Plot._draw): `opp`, `barLabels`,
        `showLineLabels`, `stackGroup`.
*/
export interface PlotPaintContext {
  // Data + domain
  data: DataPoint[];
  shapeData: [string, DataPoint[]][];
  axisData: DataPoint[];
  domains: Record<string, number[]>;
  discreteKeys: unknown[];
  stackData: number[][][];
  stackKeys: unknown[];
  xData: unknown[];
  yData: unknown[];
  x2Data: unknown[];
  y2Data: unknown[];
  xDomain: number[];
  yDomain: number[];
  x2Domain: number[];
  y2Domain: number[];
  // Accessors + scales
  x: PlotAxisFn;
  y: PlotAxisFn;
  x2: PlotAxisFn;
  y2: PlotAxisFn;
  xScale: string;
  yScale: string;
  xConfigScale: string;
  yConfigScale: string;
  x2ConfigScale: string;
  y2ConfigScale: string;
  // Axis configs + visibility
  defaultConfig: Record<string, unknown>;
  defaultX2Config: Record<string, unknown>;
  defaultY2Config: Record<string, unknown>;
  showX: boolean;
  showY: boolean;
  x2Exists: boolean;
  y2Exists: boolean;
  xC: Record<string, unknown>;
  yC: Record<string, unknown>;
  // Axis measurements
  xTicks: unknown[];
  yTicks: unknown[];
  x2Ticks: unknown[];
  y2Ticks: unknown[];
  labelWidths: LabelWidth[];
  largestLabel: number;
  xRangeMax: number;
  xTest: Axis;
  yTest: Axis;
  x2Test: Axis;
  y2Test: Axis;
  xTestRange: number[];
  x2TestRange: number[];
  // Layout offsets + viewport
  yBounds: {width: number; height: number; x: number; y: number};
  y2Bounds: {width: number; height: number; x: number; y: number};
  yWidth: number | undefined;
  y2Width: number | undefined;
  xOffsetLeft: number;
  xOffsetRight: number;
  xHeight: number;
  x2Height: number;
  topOffset: number;
  height: number;
  width: number;
  horizontalMargin: number;
  verticalMargin: number;
  // Paint plumbing
  opp: "x" | "y" | undefined;
  barLabels: string[];
  showLineLabels: boolean;
  stackGroup: unknown;
}

/**
    Result of the MEASURE phase of plotPaint. Captures everything the EMIT
    phase needs to know that was computed/reassigned during measure:
      - `x`/`y`: the production-axis accessor closures (reassigned by
        measure onto `viz._xFunc`/`viz._yFunc`).
      - `xRange`/`yRange`: recomputed from the production axes' outer
        bounds.
      - `xOffsetLeft`/`xOffsetRight`/`yWidth`/`y2Width`/`yBounds`/`y2Bounds`:
        production-axis bounds (the pCtx values were throwaway test-axis
        measurements; these are the real ones).
      - `axisSceneQueue`: deferred axis scenes, populated during measure
        and drained at the END of emit (so axes layer above shapes).
      - `yOffset`: half the x-axis bar stroke width — used to nudge
        annotation and shape y0/y1 baselines so shapes don't visually
        overlap the axis stroke.
      - `labelPositions`: map of line-label id → bumped y position
        (computed from `labelWidths`); read by the line-label
        `labelBounds` config in emit.
*/
export interface PlotMeasureResult {
  x: PlotAxisFn;
  y: PlotAxisFn;
  xRange: number[];
  yRange: number[];
  xOffsetLeft: number;
  xOffsetRight: number;
  yWidth: number | undefined;
  y2Width: number | undefined;
  yBounds: {width: number; height: number; x: number; y: number};
  y2Bounds: {width: number; height: number; x: number; y: number};
  axisSceneQueue: {key: string; transform: {x: number; y: number}; axis: Axis}[];
  yOffset: number;
  labelPositions: Record<string, number>;
}

/**
    MEASURE phase of plotPaint. Reads `pCtx`, runs the production-mode
    axes through `renderMode("compute").select(null).render()`,
    computes the final `xRange`/`yRange` + offsets, sets `viz._xFunc` /
    `viz._yFunc` accessors, and queues axis scenes for the emit phase.
    Returns everything `plotEmit` needs to consume.
*/
export function plotMeasure(viz: Viz, pCtx: PlotPaintContext): PlotMeasureResult {
    const {xDomain, yDomain, x2Domain, y2Domain} = pCtx;
    let {x, y} = pCtx;
    const {xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale} = pCtx;
    const {defaultX2Config, defaultY2Config, showX, showY, x2Exists, y2Exists, xC, yC} = pCtx;
    const {xTicks, yTicks, x2Ticks, labelWidths, yTest, x2TestRange, xTestRange} = pCtx;
    let {yBounds, y2Bounds, yWidth, y2Width, xOffsetLeft, xOffsetRight} = pCtx;
    const {xHeight, x2Height, topOffset, height, width, horizontalMargin, verticalMargin} = pCtx;
    const {y2Test} = pCtx;

    let yRange = [x2Height, height - (xHeight + topOffset + verticalMargin)];

    if (showY) {
      yTest
        .domain(yDomain)
        .height(height)
        .maxSize(width / 2)
        .range(yRange)
        .ticks(yTicks)
        .width(width)
        .config(yC)
        .config(viz._yConfig)
        .scale(yConfigScale)
        .measure();
    }

    yBounds = yTest.outerBounds() as {width: number; height: number; x: number; y: number};
    yWidth = yBounds.width ? yBounds.width + yTest.padding() : undefined;
    xOffsetLeft = max([yWidth, xTestRange[0], x2TestRange[0]] as number[])!;

    if (y2Exists) {
      y2Test
        .config(yC)
        .domain(y2Domain)
        .gridSize(0)
        .height(height)
        .range(yRange)
        .width(width - max([0, xOffsetRight - (y2Width as number)])!)
        .title(false)
        .config(viz._y2Config)
        .config(defaultY2Config)
        .scale(y2ConfigScale)
        .measure();
    }

    y2Bounds = y2Test.outerBounds() as {width: number; height: number; x: number; y: number};
    y2Width = y2Bounds.width
      ? y2Bounds.width + y2Test.padding()
      : undefined;
    xOffsetRight = max([
      0,
      y2Width,
      width - xTestRange[1],
      width - x2TestRange[1],
    ] as number[])!;
    const xRange = [xOffsetLeft, width - (xOffsetRight + horizontalMargin)];

    // The shape-group offset. `_chartScene` is wrapped with this transform,
    // so nodes absorbed into it (the background Rect, axes) pass their coords
    // RELATIVE to this origin.
    const chartTransform = {
      x: viz._margin.left,
      y: viz._margin.top + x2Height + topOffset,
    };
    viz._chartTransform = chartTransform;

    // Each axis's absolute transform. Stored so we can derive the axis's
    // transform RELATIVE to `_chartTransform` when absorbing axis scenes into
    // `_chartScene` (the chart-cells group already applies `_chartTransform`).
    // Axes are scene-only: `renderMode("compute")` renders into a detached svg
    // and `axis.toScene()` produces the visible output.
    const yW = yWidth as number;
    const xTrans = xOffsetLeft > yW ? xOffsetLeft - yW : 0;
    const axisAbsoluteTransforms = {
      x: {x: viz._margin.left, y: viz._margin.top + x2Height + topOffset},
      x2: {x: viz._margin.left, y: viz._margin.top + topOffset},
      y: {x: viz._margin.left + xTrans, y: viz._margin.top + topOffset},
      y2: {x: -viz._margin.right, y: viz._margin.top + topOffset},
    };
    const axisRelativeTransform = (which: "x" | "x2" | "y" | "y2") => ({
      x: axisAbsoluteTransforms[which].x - chartTransform.x,
      y: axisAbsoluteTransforms[which].y - chartTransform.y,
    });
    // Queued axis scenes — pushed onto `_chartScene` AFTER the shape loop so
    // axes render above shapes.
    const axisSceneQueue: {key: string; transform: {x: number; y: number}; axis: Axis}[] = [];

    viz._xAxis
      .renderMode("compute")
      .select(null)
      .domain(xDomain)
      .height(height - (x2Height + topOffset + verticalMargin))
      .maxSize(height / 2)
      .range(xRange)
      .ticks(xTicks)
      .width(width)
      .config(xC)
      .config(viz._xConfig)
      .scale(xConfigScale)
      .render();
    if (showX) {
      axisSceneQueue.push({
        key: "plot-x-axis",
        transform: axisRelativeTransform("x"),
        axis: viz._xAxis,
      });
    }

    if (x2Exists) {
      viz._x2Axis
        .renderMode("compute")
        .select(null)
        .domain(x2Domain)
        .height(height - (xHeight + topOffset + verticalMargin))
        .range(xRange)
        .ticks(x2Ticks)
        .width(width)
        .config(xC)
        .config(defaultX2Config)
        .config(viz._x2Config)
        .scale(x2ConfigScale)
        .render();
      axisSceneQueue.push({
        key: "plot-x2-axis",
        transform: axisRelativeTransform("x2"),
        axis: viz._x2Axis,
      });
    }

    viz._xFunc = x = (d: unknown, x?: string): number => {
      if (x === "x2") {
        if (x2ConfigScale === "log" && d === 0)
          d =
            x2Domain[0] < 0
              ? viz._x2Axis._d3Scale.domain()[1]
              : viz._x2Axis._d3Scale.domain()[0];
        return viz._x2Axis._getPosition.bind(viz._x2Axis)(d);
      } else {
        if (xConfigScale === "log" && d === 0)
          d =
            xDomain[0] < 0
              ? viz._xAxis._d3Scale.domain()[1]
              : viz._xAxis._d3Scale.domain()[0];
        return viz._xAxis._getPosition.bind(viz._xAxis)(d);
      }
    };

    yRange = [
      viz._xAxis.outerBounds().y + x2Height,
      height - (xHeight + topOffset + verticalMargin),
    ];

    viz._yAxis
      .renderMode("compute")
      .select(null)
      .domain(yDomain)
      .height(height)
      .maxSize(width / 2)
      .range(yRange)
      .ticks(yTicks)
      .width(xRange[xRange.length - 1])
      .config(yC)
      .config(viz._yConfig)
      .scale(yConfigScale)
      .render();
    if (showY) {
      axisSceneQueue.push({
        key: "plot-y-axis",
        transform: axisRelativeTransform("y"),
        axis: viz._yAxis,
      });
    }

    if (y2Exists) {
      viz._y2Axis
        .renderMode("compute")
        .select(null)
        .config(yC)
        .domain(y2Exists ? y2Domain : yDomain)
        .gridSize(0)
        .height(height)
        .range(yRange)
        .width(width - max([0, xOffsetRight - (y2Width as number)])!)
        .title(false)
        .config(viz._y2Config)
        .config(defaultY2Config)
        .scale(y2ConfigScale)
        .render();
      axisSceneQueue.push({
        key: "plot-y2-axis",
        transform: axisRelativeTransform("y2"),
        axis: viz._y2Axis,
      });
    }

    let labelPositions: Record<string, number> = {};
    if (labelWidths) {
      groups(labelWidths, d => d.xValue).forEach(([, values]) => {
        const minFontSize = max(values.map(d => d.fontSize))!;
        const yBuckets = range(yRange[0], yRange[1], minFontSize).reverse();
        const bumpLimit = (yRange[1] - yRange[0]) / 8;

        /***/
        function bumpPrevious(d: LabelWidth, i: number, arr: LabelWidth[]) {
          if (!d.defaultY) d.defaultY = viz._yAxis._getPosition(d.value);
          if (i) {
            const prev = arr[i - 1];
            const {fontSize, padding} = d;
            const y = (d.newY || d.defaultY)!;
            const prevY = (prev.newY || prev.defaultY)!;
            if (y - fontSize / 2 - padding < prevY) {
              const newY = yBuckets.find(n => n < prevY);
              const change = d.defaultY! - newY!;
              if (change < bumpLimit) {
                prev.newY = newY;
                if (i) bumpPrevious(prev, i - 1, arr);
              }
            }
          }
        }

        values.forEach(bumpPrevious);
      });

      labelPositions = labelWidths.reduce<Record<string, number>>((obj, d) => {
        if (d.newY) obj[d.id] = d.newY;
        return obj;
      }, {});
    }

    viz._yFunc = y = (d: unknown, y?: string): number => {
      if (y === "y2") {
        if (y2ConfigScale === "log" && d === 0)
          d =
            y2Domain[1] < 0
              ? viz._y2Axis._d3ScaleNegative.domain()[0]
              : viz._y2Axis._d3Scale.domain()[1];
        return viz._y2Axis._getPosition.bind(viz._y2Axis)(d) - x2Height;
      } else {
        if (yConfigScale === "log" && d === 0)
          d =
            yDomain[1] < 0
              ? viz._yAxis._d3ScaleNegative.domain()[0]
              : viz._yAxis._d3Scale.domain()[1];
        return viz._yAxis._getPosition.bind(viz._yAxis)(d) - x2Height;
      }
    };

    let yOffset = viz._xAxis.barConfig()["stroke-width"];
    if (yOffset) yOffset /= 2;

    return {
      x,
      y,
      xRange,
      yRange,
      xOffsetLeft: xOffsetLeft as number,
      xOffsetRight: xOffsetRight as number,
      yWidth,
      y2Width,
      yBounds,
      y2Bounds,
      axisSceneQueue,
      yOffset: yOffset || 0,
      labelPositions: labelPositions as Record<string, number>,
    };
}

/**
    EMIT phase of plotPaint. Takes the `PlotMeasureResult` from
    `plotMeasure` and produces ALL the scene nodes: background rect,
    connector lines, back/front annotations, the main shape loop, line
    markers, and the deferred axis scenes (drained from the queue).
    Returns the flat `SceneNode[]` array that the caller (`Plot._paint`)
    merges into `_chartScene`.
*/
export function plotEmit(viz: Viz, pCtx: PlotPaintContext, mCtx: PlotMeasureResult): SceneNode[] {
    const out: SceneNode[] = [];

    // Re-destructure pCtx for emit-only reads. Names listed are exactly
    // what the emit body below references; measure-only names (xTest /
    // yTest / x2Test / y2Test / xTestRange / x2TestRange / showX /
    // showY / xTicks / x2Ticks / y2Ticks / defaultConfig / defaultX2Config /
    // defaultY2Config) are intentionally omitted.
    const {shapeData, domains, discreteKeys, stackData, stackKeys, xDomain, yDomain} = pCtx;
    const {xScale, yScale} = pCtx;
    const {labelWidths, largestLabel} = pCtx;
    const {width} = pCtx;
    const {opp, showLineLabels} = pCtx;

    const {x, y, xRange, yRange, yOffset, axisSceneQueue, labelPositions} = mCtx;

    // Background Rect: skip rendering when transparent (the default) — under
    // the scene path it would emit a 5th `rect.d3plus-render-rect` that
    // confuses bar-counting tests. When a user customizes
    // `backgroundConfig.fill` to a real color, render it normally.
    const bgConfig = viz._backgroundConfig;
    if (bgConfig && bgConfig.fill && bgConfig.fill !== "transparent") {
      // Coords are relative to `_chartTransform` (margin.left, margin.top +
      // x2Height + topOffset), so we subtract the chart-transform offset.
      // yRange[0] = x2Height, so the y simplification is
      // (yRange[1] - yRange[0]) / 2.
      const bgRect = makeShape("Rect")
        .renderMode("compute")
        .data([{}])
        .x(xRange[0] - viz._margin.left + (xRange[1] - xRange[0]) / 2)
        .width(xRange[1] - xRange[0])
        .y((yRange[1] - yRange[0]) / 2)
        .height(yRange[1] - yRange[0])
        .config(bgConfig);
      bgRect.render();
      // Background must sit BEHIND chart shapes. Unshift onto `out` so
      // the z-order survives even if a future emit step pushes nodes
      // before this point (i.e. the invariant is enforced at the call
      // site rather than relying on the upstream contract that `out` is
      // empty here). `unshift(...nodes)` is O(out.length + nodes.length)
      // which is fine — `out` carries axis-queue items, not the full
      // shape scene, so the prepend is a few entries at most.
      const bgNodes = collectComputed(bgRect);
      out.unshift(...bgNodes);
    }

    const labelConnectors = labelWidths.filter(d => d.newY !== undefined);
    if (labelConnectors.length) {
      const data = labelConnectors
        .map(d =>
          assign(
            {
              x: viz._xAxis._getPosition.bind(viz._xAxis)(d.xValue),
              y: d.defaultY,
            },
            d as unknown as Record<string, unknown>,
          ),
        )
        .concat(
          labelConnectors.map(d =>
            assign(
              {
                x:
                  viz._xAxis._getPosition.bind(viz._xAxis)(d.xValue) +
                  d.padding -
                  1,
                y: d.newY || d.defaultY,
              },
              d as unknown as Record<string, unknown>,
            ),
          ),
        );

      // Connector lines: compute-mode emit → absorbed into _chartScene; the
      // chart-wide `_chartTransform` provides the positioning.
      const connectorLine = makeShape("Line")
        .config({
          data: data as DataPoint[],
          stroke: (d: DataPoint) => d.fontColor,
          x: (d: DataPoint) => d.x,
          y: (d: DataPoint) => d.y,
        } as Record<string, unknown>)
        .config(viz._labelConnectorConfig!)
        .renderMode("compute");
      connectorLine.render();
      out.push(...collectComputed(connectorLine));
    }

    // Annotations run in `renderMode("compute")` and their scenes are
    // absorbed into `_chartScene`. Layering: "back" annotations absorb here
    // (before the main shape loop below); "front" annotations queue and
    // absorb AFTER the shape loop, giving back → shapes → front.
    const frontAnnotationShapes: shapes.Shape[] = [];
    const renderAnnotation = (annotation: Annotation) => {
      const inst = makeShape(annotation.shape)
        .renderMode("compute")
        .duration(viz.schema.duration)
        .config(annotation)
        .config({
          x: (d: PlotDatum) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
          x0:
            viz.schema.discrete === "x"
              ? (d: PlotDatum) => (d.x2 ? x(d.x2, "x2") : x(d.x))
              : x(domains.x[0]),
          x1:
            viz.schema.discrete === "x"
              ? null
              : (d: PlotDatum) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
          y: (d: PlotDatum) => (d.y2 ? y(d.y2, "y2") : y(d.y)),
          y0:
            viz.schema.discrete === "y"
              ? (d: PlotDatum) => (d.y2 ? y(d.y2, "y2") : y(d.y))
              : y(domains.y[1]) - yOffset,
          y1:
            viz.schema.discrete === "y"
              ? null
              : (d: PlotDatum) => (d.y2 ? y(d.y2, "y2") : y(d.y) - yOffset),
        });
      inst.render();
      return inst;
    };

    Object.keys(viz._previousAnnotations!).forEach(layer => {
      const annotationData: Annotation[] = viz._annotations!.filter(
        (d: Annotation) => (layer === "back" && !d.layer) || d.layer === layer,
      );
      const annotationShapes = annotationData.map(d => d.shape);
      annotationData.forEach(annotation => {
        const inst = renderAnnotation(annotation);
        if (layer === "front") frontAnnotationShapes.push(inst);
        else out.push(...collectComputed(inst));
      });
      // Exits: render with empty data in compute mode so their scenes go
      // empty; no DOM to clean up.
      const exitAnnotations = viz._previousAnnotations![layer].filter(
        (d: string) => !annotationShapes.includes(d),
      );
      exitAnnotations.forEach(shape => {
        makeShape(shape).renderMode("compute").data([]).render();
      });

      viz._previousAnnotations![layer] = annotationShapes;
    });

    const discrete = viz.schema.discrete || "x";

    const shapeConfig: Record<string, unknown> = {
      discrete: viz.schema.discrete,
      duration: viz.schema.duration,
      label: (d: PlotDatum) => viz._drawLabel(d.data, d.i),
      x: (d: PlotDatum) => (d.x2 !== undefined ? x(d.x2, "x2") : x(d.x)),
      x0:
        discrete === "x"
          ? (d: PlotDatum) => (d.x2 ? x(d.x2, "x2") : x(d.x))
          : x(
              typeof viz.schema.baseline === "number"
                ? viz.schema.baseline
                : domains.x[0],
            ),
      x1: discrete === "x" ? null : (d: PlotDatum) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
      y: (d: PlotDatum) => (d.y2 !== undefined ? y(d.y2, "y2") : y(d.y)),
      y0:
        discrete === "y"
          ? (d: PlotDatum) => (d.y2 ? y(d.y2, "y2") : y(d.y))
          : y(
              typeof viz.schema.baseline === "number"
                ? viz.schema.baseline
                : domains.y[1],
            ) - yOffset,
      y1:
        discrete === "y"
          ? null
          : (d: PlotDatum) => (d.y2 ? y(d.y2, "y2") : y(d.y) - yOffset),
    };

    const events = Object.keys(viz.schema.on);
    // Precompute id→index and discrete→index Maps once per draw. Without
    // them the per-datum closures below run two linear `Array.indexOf`
    // scans for every shape coord access — O(stackKeys + discreteKeys)
    // per datum, per coord, per draw. For dense stacked plots (~5k
    // shapes × 4 coord reads × ~50 indexOf scans) that's millions of
    // comparisons per draw before scale evaluation.
    const stackKeyIndex = new Map<unknown, number>();
    for (let i = 0; i < stackKeys.length; i++) stackKeyIndex.set(stackKeys[i], i);
    const discreteKeyIndex = new Map<unknown, number>();
    for (let i = 0; i < discreteKeys.length; i++)
      discreteKeyIndex.set(discreteKeys[i], i);
    shapeData.forEach(([key, values]) => {
      const d = {key, values};
      const shapeConfigInner: Record<string, unknown> = Object.assign({}, shapeConfig);
      if (viz.schema.stacked && ["Area", "Bar"].includes(d.key)) {
        const scale = opp === "x" ? x : y;
        shapeConfigInner[`${opp}`] = shapeConfigInner[`${opp}0`] = (d: PlotDatum) => {
          const dataIndex = stackKeyIndex.get(d.id) ?? -1;
          const discreteIndex = discreteKeyIndex.get(d.discrete) ?? -1;
          const scaleIndex = (d[opp!] as number) < 0 ? 1 : 0;
          return dataIndex >= 0
            ? scale(stackData[dataIndex][discreteIndex][scaleIndex])
            : scale(domains[opp!][opp === "x" ? 0 : 1]);
        };
        shapeConfigInner[`${opp}1`] = (d: PlotDatum) => {
          const dataIndex = stackKeyIndex.get(d.id) ?? -1;
          const discreteIndex = discreteKeyIndex.get(d.discrete) ?? -1;
          const scaleIndex = (d[opp!] as number) < 0 ? 0 : 1;
          return dataIndex >= 0
            ? scale(stackData[dataIndex][discreteIndex][scaleIndex])
            : scale(domains[opp!][opp === "x" ? 0 : 1]);
        };
      }

      const s = makeShape(d.key)
        .renderMode("compute")
        .config(shapeConfigInner)
        .data(d.values);

      if (d.key === "Bar") {
        let space;
        const scale = viz.schema.discrete === "x" ? x : y;
        const scaleType = viz.schema.discrete === "x" ? xScale : yScale;
        const vals = viz.schema.discrete === "x" ? xDomain : yDomain;
        const range = viz.schema.discrete === "x" ? xRange : yRange;
        if (scaleType !== "Point" && vals.length === 2) {
          const allPositions = Array.from(
            new Set(d.values.map((d: DataPoint) => scale(d[viz.schema.discrete as string]))),
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
          d.values,
          (d: DataPoint) => d[viz.schema.discrete as string],
          (d: DataPoint) => d.group,
        );

        const ids = merge(
          barGroups.map(([, innerEntries]) => innerEntries.map(([k]) => k)),
        );
        const uniqueIds = Array.from(new Set(ids));

        const discreteKey = viz.schema.discrete as string;
        const discreteFn = shapeConfig[discreteKey] as (d: PlotDatum, i: number) => number;
        if (
          max(barGroups.map(([, innerEntries]) => innerEntries.length)) === 1
        ) {
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
      } else if (d.key === "Line") {
        s.duration(width * 1.5);

        if (viz._confidence) {
          const confidence = viz._confidence;
          const areaConfig: Record<string, unknown> = Object.assign({}, shapeConfig);
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
            .data(d.values);
          const confidenceConfig = Object.assign(
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
          discrete: shapeConfig.discrete || "x",
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
      }

      viz._wirePlotShapeEvents!(s, d.key, events);

      const userConfig = shapeConfigFor(viz, d.key);
      if (viz.schema.shapeConfig.duration === undefined) delete userConfig.duration;
      s.config(userConfig).render();

      out.push(...collectComputed(s));

      if (d.key === "Line") {
        const markers = makeShape("Circle")
          .renderMode("compute")
          .data(viz._lineMarkers ? d.values : [])
          .config(shapeConfig)
          .config(viz._lineMarkerConfig)
          .id((d: PlotDatum) => `${d.id}_${d.discrete}`);

        viz._wirePlotShapeEvents!(markers, "Circle", events);
        markers.render();
        out.push(...collectComputed(markers));
      }
    });

    const dataShapes = shapeData.map(([key]) => key);
    if (dataShapes.includes("Line")) {
      if (viz._confidence) dataShapes.push("Area");
      if (viz._lineMarkers) dataShapes.push("Circle");
    }
    const exitShapes = viz._previousShapes!.filter(
      d => !dataShapes.includes(d),
    );

    // Run exits in compute mode so Box/Whisker/Shape don't fall through
    // to their body-svg / body-div fallback when `_select` is unset.
    // Without `.renderMode("compute")` here, every exited shape would
    // leak a detached <svg> (Box) or <div> (Shape) into <body>.
    exitShapes.forEach(shape => {
      const inst = makeShape(shape);
      if (typeof inst.renderMode === "function") inst.renderMode("compute");
      if (typeof inst.select === "function") inst.select(null);
      inst.config(shapeConfig).data([]).render();
    });

    viz._previousShapes = dataShapes;

    // Absorb queued front annotations AFTER the shape loop so they render
    // above shapes.
    frontAnnotationShapes.forEach(inst => out.push(...collectComputed(inst)));

    // Absorb queued axis scenes AFTER shapes + annotations so axes render
    // above everything else (shapes → annotations → axes). Each axis is
    // wrapped in a group with its axis-relative transform; the chart-cells
    // group's `_chartTransform` composes with this to land at the right
    // absolute position.
    axisSceneQueue.forEach(({key, transform, axis}) => {
      if (!axis || typeof axis.toScene !== "function") return;
      const scene = axis.toScene();
      if (!scene) return;
      out.push({
        type: "group",
        key,
        transform,
        children: scene.children || [],
      });
    });

    return out;
}

/**
    Plot paint phase as a free function — orchestrates MEASURE + EMIT.

    Splits into `plotMeasure` (production-axis renders + offset
    reassignments + `viz._xFunc`/`viz._yFunc` accessor setup) and
    `plotEmit` (background rect → connectors → back annotations →
    shape loop → line markers → front annotations → axis scenes).
    `Plot._paint` is a thin shim that concats the returned nodes onto
    `viz._chartScene`.

    @param viz  The Plot instance (or any subclass: BarChart, LinePlot, …).
    @param pCtx Cross-phase locals produced by `Plot._draw`.
*/
export function plotPaint(viz: Viz, pCtx: PlotPaintContext): SceneNode[] {
  const mCtx = plotMeasure(viz, pCtx);
  return plotEmit(viz, pCtx, mCtx);
}
