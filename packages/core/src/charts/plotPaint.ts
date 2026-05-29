/* eslint no-cond-assign: 0 */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/**
    `plotPaint(viz, pCtx)` — the Plot paint phase as a free function.

    RFC §3.1 architectural seam for Plot, sibling to `runVizPipeline(viz)`.
    The paint phase (production axis rendering, shape buffer setup, and
    shape emission with event handlers) used to live as `Plot._paint`;
    extracting it lets callers drive the paint step without going
    through the class. `Plot._paint` is now a thin shim that calls into
    here, so behavior is unchanged.

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

import * as shapes from "../shapes/index.js";
import {collectComputed, shapeConfigFor} from "./emitHelpers.js";
import type {VizInstance as Viz} from "./vizTypes.js";

/**
    Cross-phase locals threaded from `Plot._draw` (and its extracted pipeline
    stages) into `plotPaint`. Fully `any`-typed internally for back-compat
    with the legacy plot codepath, but documented as the contract any pure
    consumer of `plotPaint` must supply.

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
        `showLineLabels`, `stackGroup`. (`parent`/`transition` are removed
        v4 carry-overs.)
*/
export interface PlotPaintContext {
  // Data + domain
  data: DataPoint[];
  shapeData: DataPoint[];
  axisData: DataPoint[];
  domains: Record<string, unknown>;
  discreteKeys: unknown;
  stackData: unknown;
  stackKeys: unknown[];
  xData: unknown[];
  yData: unknown[];
  x2Data: unknown[];
  y2Data: unknown[];
  xDomain: unknown[];
  yDomain: unknown[];
  x2Domain: unknown[];
  y2Domain: unknown[];
  // Accessors + scales
  x: (d: DataPoint, axis?: string) => number;
  y: (d: DataPoint, axis?: string) => number;
  x2: (d: DataPoint) => number;
  y2: (d: DataPoint) => number;
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
  labelWidths: unknown[];
  largestLabel: number;
  xRangeMax: number;
  xTest: unknown;
  yTest: unknown;
  x2Test: unknown;
  y2Test: unknown;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  x: (d: any, axis?: any) => number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y: (d: any, axis?: any) => number;
  xRange: number[];
  yRange: number[];
  xOffsetLeft: number;
  xOffsetRight: number;
  yWidth: number | undefined;
  y2Width: number | undefined;
  yBounds: {width: number; height: number; x: number; y: number};
  y2Bounds: {width: number; height: number; x: number; y: number};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  axisSceneQueue: {key: string; transform: {x: number; y: number}; axis: any}[];
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
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const {domains, xDomain, yDomain, x2Domain, y2Domain} = pCtx;
    let {x, y} = pCtx;
    const {xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale} = pCtx;
    const {defaultX2Config, defaultY2Config, showX, showY, x2Exists, y2Exists, xC, yC} = pCtx;
    const {xTicks, yTicks, x2Ticks, y2Ticks, labelWidths, yTest, x2TestRange, xTestRange} = pCtx;
    let {yBounds, y2Bounds, yWidth, y2Width, xOffsetLeft, xOffsetRight} = pCtx;
    const {xHeight, x2Height, topOffset, height, width, horizontalMargin, verticalMargin} = pCtx;
    const {y2Test} = pCtx;
    /* eslint-enable @typescript-eslint/no-explicit-any */

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

    yBounds = yTest.outerBounds();
    yWidth = yBounds.width ? yBounds.width + yTest.padding() : undefined;
    xOffsetLeft = max([yWidth, xTestRange[0], x2TestRange[0]]);

    if (y2Exists) {
      y2Test
        .config(yC)
        .domain(y2Domain)
        .gridSize(0)
        .height(height)
        .range(yRange)
        .width(width - max([0, xOffsetRight - y2Width])!)
        .title(false)
        .config(viz._y2Config)
        .config(defaultY2Config)
        .scale(y2ConfigScale)
        .measure();
    }

    y2Bounds = y2Test.outerBounds();
    y2Width = y2Bounds.width
      ? y2Bounds.width + y2Test.padding()
      : undefined;
    xOffsetRight = max([
      0,
      y2Width,
      width - xTestRange[1],
      width - x2TestRange[1],
    ]);
    const xRange = [xOffsetLeft, width - (xOffsetRight + horizontalMargin)];

    // Legacy `g.d3plus-plot-background` removed in v4. The background Rect
    // (when fill != "transparent") absorbs into `_chartScene` directly —
    // since `_chartScene` is wrapped with `_chartTransform = (margin.left,
    // margin.top + x2Height + topOffset)`, the rect's coords are passed
    // RELATIVE to that origin. See the absorb call further down.

    // Capture the shape-group offset so `_chartScene` nodes appear at the
    // same position legacy `g.d3plus-plot-shapes` had.
    viz._chartTransform = {
      x: viz._margin.left,
      y: viz._margin.top + x2Height + topOffset,
    };

    // Per-axis absolute transforms (legacy values). Stored so we can derive
    // each axis's transform RELATIVE to `_chartTransform` when absorbing
    // axis scenes into `_chartScene` (the chart-cells group already applies
    // _chartTransform). The 4 legacy `g.d3plus-plot-{x,x2,y,y2}-axis` elem()
    // calls are gone — axes are scene-only in v4 (`renderMode("compute")`
    // creates a detached svg behind the scenes; `axis.toScene()` produces
    // the visible output).
    const xTrans = xOffsetLeft > yWidth ? xOffsetLeft - yWidth : 0;
    const axisAbsoluteTransforms = {
      x: {x: viz._margin.left, y: viz._margin.top + x2Height + topOffset},
      x2: {x: viz._margin.left, y: viz._margin.top + topOffset},
      y: {x: viz._margin.left + xTrans, y: viz._margin.top + topOffset},
      y2: {x: -viz._margin.right, y: viz._margin.top + topOffset},
    };
    const axisRelativeTransform = (which: "x" | "x2" | "y" | "y2") => ({
      x: axisAbsoluteTransforms[which].x - viz._chartTransform!.x,
      y: axisAbsoluteTransforms[which].y - viz._chartTransform!.y,
    });
    // Queued axis scenes — pushed onto `_chartScene` AFTER the shape loop
    // so axes render ABOVE shapes (preserving legacy DOM z-order).
    const axisSceneQueue: {key: string; transform: {x: number; y: number}; axis: any}[] = [];

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

    viz._xFunc = x = (d: any, x: any) => {
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
        .width(width - max([0, xOffsetRight - y2Width])!)
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

    let labelPositions = {};
    if (labelWidths) {
      groups(labelWidths as any[], (d: any) => d.xValue).forEach(([, values]) => {
        const minFontSize = max(values.map((d: any) => d.fontSize));
        const yBuckets = range(yRange[0], yRange[1], minFontSize).reverse();
        const bumpLimit = (yRange[1] - yRange[0]) / 8;

        /***/
        function bumpPrevious(this: any, d: any, i: any, arr: any) {
          if (!d.defaultY) d.defaultY = this._yAxis._getPosition(d.value);
          if (i) {
            const prev = arr[i - 1];
            const {fontSize, padding} = d;
            const y = d.newY || d.defaultY;
            const prevY = prev.newY || prev.defaultY;
            if (y - fontSize / 2 - padding < prevY) {
              const newY = yBuckets.find(n => n < prevY);
              const change = d.defaultY - newY!;
              if (change < bumpLimit) {
                prev.newY = newY;
                if (i) bumpPrevious(prev, i - 1, arr);
              }
            }
          }
        }

        values.forEach(bumpPrevious.bind(viz));
      });

      labelPositions = (labelWidths as any[]).reduce((obj: any, d: any) => {
        if (d.newY) obj[d.id] = d.newY;
        return obj;
      }, {});
    }

    viz._yFunc = y = (d: any, y: any) => {
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

    /* eslint-disable @typescript-eslint/no-explicit-any */
    // Re-destructure pCtx for emit-only reads. Names listed are exactly
    // what the emit body below references; measure-only names (xTest /
    // yTest / x2Test / y2Test / xTestRange / x2TestRange / showX /
    // showY / xTicks / x2Ticks / y2Ticks / defaultConfig / defaultX2Config /
    // defaultY2Config) are intentionally omitted.
    const {data, shapeData, domains, discreteKeys, stackData, stackKeys, xDomain, yDomain} = pCtx;
    const {xScale, yScale} = pCtx;
    const {x2Exists, y2Exists} = pCtx;
    const {labelWidths, largestLabel, yTicks} = pCtx;
    const {xHeight, x2Height, topOffset, height, width, verticalMargin} = pCtx;
    const {opp, showLineLabels} = pCtx;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const {x, y, xRange, yRange, yOffset, axisSceneQueue, labelPositions} = mCtx;

    // Background Rect: skip rendering when transparent (the default) — under
    // the v4 scene path it would emit a 5th `rect.d3plus-render-rect` that
    // confuses bar-counting tests. When a user customizes
    // `backgroundConfig.fill` to a real color, render it normally.
    if (viz._backgroundConfig.fill && viz._backgroundConfig.fill !== "transparent") {
      // Coords are relative to `_chartTransform` (margin.left, margin.top +
      // x2Height + topOffset). Legacy used absolute coords; we subtract the
      // chart-transform offset so the absorbed scene rect lands at the same
      // visual position. yRange[0] = x2Height (see line ~940), so the y
      // simplification is (yRange[1] - yRange[0]) / 2.
      const bgRect = new shapes.Rect()
        .renderMode("compute")
        .data([{}])
        .x(xRange[0] - viz._margin.left + (xRange[1] - xRange[0]) / 2)
        .width(xRange[1] - xRange[0])
        .y((yRange[1] - yRange[0]) / 2)
        .height(yRange[1] - yRange[0])
        .config(viz._backgroundConfig);
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

    const labelConnectors = (labelWidths as any[]).filter((d: any) => d.newY !== undefined);
    if (labelConnectors.length) {
      const data = labelConnectors
        .map(d =>
          assign(
            {
              x: viz._xAxis._getPosition.bind(viz._xAxis)(d.xValue),
              y: d.defaultY,
            },
            d,
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
              d,
            ),
          ),
        );

      // Connector lines: compute-mode emit → absorbed into _chartScene. The
      // legacy `g.d3plus-plot-connectors` group is gone; the chart-wide
      // `_chartTransform` provides the same positioning the legacy group's
      // transform did.
      const connectorLine = new shapes.Line()
        .config({
          data: data as DataPoint[],
          stroke: (d: any) => d.fontColor,
          x: (d: any) => d.x,
          y: (d: any) => d.y,
        })
        .config(viz._labelConnectorConfig)
        .renderMode("compute");
      connectorLine.render();
      out.push(...collectComputed(connectorLine));
    }

    // Legacy `g.d3plus-plot-annotations` / `g.d3plus-plot-annotations-front`
    // groups removed in v4. Annotations now run in `renderMode("compute")`
    // and their scenes are absorbed into `_chartScene`. Layering: "back"
    // annotations absorb here (before the main shape loop below); "front"
    // annotations queue and absorb AFTER the shape loop (preserving the
    // legacy z-order: back → shapes → front).
    const frontAnnotationShapes: any[] = [];
    const renderAnnotation = (annotation: any) => {
      const inst = new (shapes as any)[annotation.shape]()
        .renderMode("compute")
        .duration(viz._duration)
        .config(annotation)
        .config({
          x: (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
          x0:
            viz._discrete === "x"
              ? (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x))
              : x(domains.x[0]),
          x1:
            viz._discrete === "x"
              ? null
              : (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
          y: (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y)),
          y0:
            viz._discrete === "y"
              ? (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y))
              : y(domains.y[1]) - yOffset,
          y1:
            viz._discrete === "y"
              ? null
              : (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y) - yOffset),
        });
      inst.render();
      return inst;
    };

    Object.keys(viz._previousAnnotations).forEach(layer => {
      const annotationData = viz._annotations.filter(
        (d: any) => (layer === "back" && !d.layer) || d.layer === layer,
      );
      const annotationShapes = annotationData.map((d: any) => d.shape);
      annotationData.forEach((annotation: any) => {
        const inst = renderAnnotation(annotation);
        if (layer === "front") frontAnnotationShapes.push(inst);
        else out.push(...collectComputed(inst));
      });
      // Exits: render with empty data in compute mode so their scenes go
      // empty; no DOM to clean up in v4.
      const exitAnnotations = viz._previousAnnotations[layer].filter(
        (d: any) => !annotationShapes.includes(d),
      );
      exitAnnotations.forEach((shape: any) => {
        new (shapes as any)[shape]()
          .renderMode("compute")
          .data([])
          .render();
      });

      viz._previousAnnotations[layer] = annotationShapes;
    });

    const discrete = viz._discrete || "x";

    const shapeConfig = {
      discrete: viz._discrete,
      duration: viz._duration,
      label: (d: any) => viz._drawLabel(d.data, d.i),
      x: (d: any) => (d.x2 !== undefined ? x(d.x2, "x2") : x(d.x)),
      x0:
        discrete === "x"
          ? (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x))
          : x(
              typeof viz._baseline === "number"
                ? viz._baseline
                : domains.x[0],
            ),
      x1: discrete === "x" ? null : (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
      y: (d: any) => (d.y2 !== undefined ? y(d.y2, "y2") : y(d.y)),
      y0:
        discrete === "y"
          ? (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y))
          : y(
              typeof viz._baseline === "number"
                ? viz._baseline
                : domains.y[1],
            ) - yOffset,
      y1:
        discrete === "y"
          ? null
          : (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y) - yOffset),
    };

    const events = Object.keys(viz._on);
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
    shapeData.forEach(([key, values]: [string, any[]]) => {
      const d = {key, values};
      const shapeConfigInner = Object.assign({}, shapeConfig);
      if (viz._stacked && ["Area", "Bar"].includes(d.key)) {
        const scale = opp === "x" ? x : y;
        (shapeConfigInner as any)[`${opp}`] = (shapeConfigInner as any)[`${opp}0`] = (d: any) => {
          const dataIndex = stackKeyIndex.get(d.id) ?? -1;
          const discreteIndex = discreteKeyIndex.get(d.discrete) ?? -1;
          const scaleIndex = d[opp!] < 0 ? 1 : 0;
          return dataIndex >= 0
            ? scale(stackData[dataIndex][discreteIndex][scaleIndex])
            : scale(domains[opp!][opp === "x" ? 0 : 1]);
        };
        (shapeConfigInner as any)[`${opp}1`] = (d: any) => {
          const dataIndex = stackKeyIndex.get(d.id) ?? -1;
          const discreteIndex = discreteKeyIndex.get(d.discrete) ?? -1;
          const scaleIndex = d[opp!] < 0 ? 0 : 1;
          return dataIndex >= 0
            ? scale(stackData[dataIndex][discreteIndex][scaleIndex])
            : scale(domains[opp!][opp === "x" ? 0 : 1]);
        };
      }

      const s = new (shapes as any)[d.key]()
        .renderMode("compute")
        .config(shapeConfigInner)
        .data(d.values);

      if (d.key === "Bar") {
        let space;
        const scale = viz._discrete === "x" ? x : y;
        const scaleType = viz._discrete === "x" ? xScale : yScale;
        const vals = viz._discrete === "x" ? xDomain : yDomain;
        const range = viz._discrete === "x" ? xRange : yRange;
        if (scaleType !== "Point" && vals.length === 2) {
          const allPositions = Array.from(
            new Set(d.values.map((d: any) => scale(d[viz._discrete as string]))),
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
        if (viz._groupPadding < space) space -= viz._groupPadding;

        let barSize = space || 1;

        const barGroups = groups(
          d.values as Record<string, unknown>[],
          (d: Record<string, unknown>) => d[viz._discrete],
          (d: Record<string, unknown>) => d.group,
        );

        const ids = merge(
          barGroups.map(([, innerEntries]) => innerEntries.map(([k]) => k)),
        );
        const uniqueIds = Array.from(new Set(ids));

        if (
          max(barGroups.map(([, innerEntries]) => innerEntries.length)) === 1
        ) {
          (s as any)[viz._discrete]((d: any, i: any) => (shapeConfig as any)[viz._discrete](d, i));
        } else {
          barSize =
            (barSize - viz._barPadding * uniqueIds.length - 1) /
            uniqueIds.length;

          const offset = space / 2 - barSize / 2;

          const xMod = scales
            .scaleLinear()
            .domain([0, uniqueIds.length - 1])
            .range([-offset, offset]);

          (s as any)[viz._discrete](
            (d: any, i: any) =>
              (shapeConfig as any)[viz._discrete](d, i) +
              xMod(uniqueIds.indexOf(d.group)),
          );
        }

        s.width(barSize);
        s.height(barSize);
      } else if (d.key === "Line") {
        s.duration(width * 1.5);

        if (viz._confidence) {
          const areaConfig = Object.assign({}, shapeConfig);
          const discrete = viz._discrete || "x";
          const key = discrete === "x" ? "y" : "x";
          const scaleFunction = discrete === "x" ? y : x;
          (areaConfig as any)[`${key}0`] = (d: any) =>
            scaleFunction(viz._confidence[0] ? d.lci : d[key]);
          (areaConfig as any)[`${key}1`] = (d: any) =>
            scaleFunction(viz._confidence[1] ? d.hci : d[key]);

          const area = new shapes.Area()
            .renderMode("compute")
            .config(areaConfig)
            .data(d.values as DataPoint[]);
          const confidenceConfig = Object.assign(
            viz._shapeConfig,
            viz._confidenceConfig,
          );

          area
            .config(
              assign(
                shapeConfigFor(viz, "Line", confidenceConfig),
                shapeConfigFor(viz, "Area", confidenceConfig),
              ) as any,
            )
            .render();

          out.push(...collectComputed(area));
        }

        s.config({
          discrete: shapeConfig.discrete || "x",
          label: showLineLabels
            ? (d: any, i: any) => {
                const visible =
                  typeof viz._lineLabels === "function"
                    ? viz._lineLabels(d.data, d.i)
                    : true;
                if (!visible) return false;
                const labelData = labelWidths.find((l: any) => l.id === d.id);
                if (labelData) {
                  const yPos = labelData.newY || labelData.defaultY;
                  const allLabels = labelWidths.filter((l: any) => l.newY === yPos);
                  if (allLabels.length > 1)
                    return allLabels[0].id !== d.id
                      ? false
                      : `+${formatAbbreviate(
                          allLabels.length,
                          viz._locale,
                        )} ${viz._translate("more")}`;
                  return viz._drawLabel(d, i);
                }
                return false;
              }
            : false,
          labelBounds: showLineLabels
            ? (d: any, i: any, s: any) => {
                const [firstX, firstY] = s.points[0];
                const [lastX, lastY] = s.points[s.points.length - 1];
                const height = viz._height / 4;
                const mod = (labelPositions as any)[d.id]
                  ? lastY - (labelPositions as any)[d.id]
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

      viz._wirePlotShapeEvents(s, d.key, events);

      const userConfig = shapeConfigFor(viz, d.key);
      if (viz._shapeConfig.duration === undefined) delete userConfig.duration;
      s.config(userConfig as any).render();

      out.push(...collectComputed(s));

      if (d.key === "Line") {
        const markers = new shapes.Circle()
          .renderMode("compute")
          .data(viz._lineMarkers ? (d.values as DataPoint[]) : [])
          .config(shapeConfig)
          .config(viz._lineMarkerConfig)
          .id((d: any) => `${d.id}_${d.discrete}`);

        viz._wirePlotShapeEvents(markers, "Circle", events);
        markers.render();
        out.push(...collectComputed(markers));
      }
    });

    const dataShapes = shapeData.map(([key]: [string, any]) => key);
    if (dataShapes.includes("Line")) {
      if (viz._confidence) dataShapes.push("Area");
      if (viz._lineMarkers) dataShapes.push("Circle");
    }
    const exitShapes = viz._previousShapes.filter(
      (d: any) => !dataShapes.includes(d),
    );

    // Run exits in compute mode so Box/Whisker/Shape don't fall through
    // to their body-svg / body-div fallback when `_select` is unset.
    // Without `.renderMode("compute")` here, every exited shape would
    // leak a detached <svg> (Box) or <div> (Shape) into <body>.
    exitShapes.forEach((shape: any) => {
      const inst = new (shapes as any)[shape]();
      if (typeof inst.renderMode === "function") inst.renderMode("compute");
      if (typeof inst.select === "function") inst.select(null);
      inst.config(shapeConfig).data([]).render();
    });

    viz._previousShapes = dataShapes;

    // Absorb queued front annotations AFTER the shape loop so they render
    // above shapes (preserving the legacy "front" z-order).
    frontAnnotationShapes.forEach(inst => out.push(...collectComputed(inst)));

    // Absorb queued axis scenes AFTER shapes + annotations so axes render
    // ABOVE everything else (matching the legacy DOM order: shapes →
    // annotations → axis groups appended last). Each axis is wrapped in a
    // group with its axis-relative transform; the chart-cells group's
    // `_chartTransform` composes with this to land at the legacy absolute
    // position.
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
