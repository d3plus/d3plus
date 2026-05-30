/**
    The Plot-family axes module: the production-axis render + joint range
    solve, factored out of the Plot paint phase so any viz that lays out
    against d3plus `Axis` instances can reuse it.

    Plot's four axes (`x`/`x2`/`y`/`y2`) are NOT four independent margin
    claims — they are a single coupled solve. The y-axis label width sets
    where the x range starts (`xOffsetLeft = max([yWidth, …])`); the
    x2-axis height shifts the y range's top and the whole chart transform;
    the x range start in turn moves where the y axis sits (`xTrans`). So
    this module owns the joint solve internally and reports one unit, rather
    than exposing four separable features.

    The module exposes the joint solve as two halves:

      - `measureAxes` — the MEASURE half: throwaway test axes measure label
        widths/heights, the coupled offsets are solved
        (`xOffsetLeft = max([yWidth, …])`, `x2Height`, `topOffset`,
        `xHeight`), and the four-side claim is written to `viz._padding.*`
        and returned. Runs BEFORE the base `Viz` draw finalizes margins.
        The line-label width measure interleaves mid-solve via an injected
        callback (it is Plot-pipeline-specific, so the axes module doesn't
        own it).
      - `renderAxes` — the EMIT half: runs AFTER margins are finalized,
        rendering the production axes
        (`viz._xAxis`/`_yAxis`/`_x2Axis`/`_y2Axis`) in compute mode against
        the final ranges, setting `viz._xFunc`/`_yFunc` (with their
        log-scale zero handling), and queueing the axis scene nodes for the
        caller to drain after the shape loop (so axes layer above shapes).

    Both halves degrade to a single axis (or any subset) through the
    `showX`/`showY`/`x2Exists`/`y2Exists` guards: a consumer that wants only
    an x-axis passes the other sides' flags as `false`, and the `max([…])`
    offsets collapse accordingly.

    @module
*/

import {max} from "d3-array";

import type Axis from "../components/Axis.js";

import {bumpLineLabels} from "./lineLabels.js";
import type {LabelWidth, PlotMeasureResult, PlotPaintContext} from "./plotPaint.js";
import type {VizInstance as Viz} from "./vizTypes.js";

/** A measured axis's outer bounding box. */
type AxisBounds = {width: number; height: number; x: number; y: number};

/** A queued production-axis scene, drained after the shape loop. */
type AxisScene = {key: string; transform: {x: number; y: number}; axis: Axis};

/** The y/y2 bounds + claimed widths a y-axis measure pass produces. */
type YAxisMeasure = {yBounds: AxisBounds; yWidth: number | undefined; y2Bounds: AxisBounds; y2Width: number | undefined};

/** A position accessor: maps a datum to a pixel coordinate on its axis. */
type PositionAccessor = (d: unknown, which?: string) => number;

/** Derives an axis's transform relative to `_chartTransform`. */
type RelativeTransform = (which: "x" | "x2" | "y" | "y2") => {x: number; y: number};

/**
    The line-label measurement the joint solve interleaves between the first
    and second x-axis measure passes. Plot supplies this via a callback that
    runs the `measurePlotLineLabels` pipeline stage; a consumer with no line
    labels returns empty widths and an undefined `xRangeMax`.
*/
export interface LineLabelMeasurement {
  labelWidths: LabelWidth[];
  largestLabel: number | undefined;
  xRangeMax: number | undefined;
}

/**
    The stable per-draw inputs the joint margin solve reads — exactly the
    values the Plot pipeline stages (`computePlotScales`,
    `preparePlotAxisLayout`) already produce. The four `*Test` axes are
    throwaway instances the caller allocates per draw; `measureAxes`
    configures and measures them, then the caller discards them.
*/
export interface AxisMeasureInputs {
  xTest: Axis;
  yTest: Axis;
  x2Test: Axis;
  y2Test: Axis;
  xDomain: number[];
  x2Domain: number[];
  yDomain: number[];
  y2Domain: number[];
  xTicks: unknown[] | null;
  x2Ticks: unknown[] | null;
  yTicks: unknown[] | null;
  y2Ticks: unknown[] | null;
  xConfigScale: string;
  x2ConfigScale: string;
  yConfigScale: string;
  y2ConfigScale: string;
  defaultX2Config: Record<string, unknown>;
  defaultY2Config: Record<string, unknown>;
  yC: Record<string, unknown>;
  showX: boolean;
  showY: boolean;
  x2Exists: boolean;
  y2Exists: boolean;
  height: number;
  width: number;
  xData: unknown[];
  /** `x.padding()` when the x scale is banded, else 0 — feeds the x config. */
  xScalePadding: number;
}

/** The four-side margin claim + offsets the joint solve produces. */
export interface AxisMeasureResult {
  yBounds: AxisBounds;
  y2Bounds: AxisBounds;
  yWidth: number | undefined;
  y2Width: number | undefined;
  xC: Record<string, unknown>;
  xRangeMax: number | undefined;
  labelWidths: LabelWidth[];
  largestLabel: number | undefined;
  xTestRange: number[];
  x2TestRange: number[];
  x2Height: number;
  xOffsetLeft: number;
  xOffsetRight: number;
  topOffset: number;
  xHeight: number;
}

/** Measure the y/y2 test axes and report their bounds + claimed widths. */
function measureYTestAxes(viz: Viz, inputs: AxisMeasureInputs): YAxisMeasure {
  const {
    yTest, y2Test, yDomain, y2Domain, yTicks, y2Ticks,
    yConfigScale, y2ConfigScale, defaultY2Config, yC,
    showY, y2Exists, height, width,
  } = inputs;

  if (showY) {
    yTest
      .domain(yDomain)
      .height(height)
      .maxSize(width / 2)
      .range([undefined, undefined])
      .ticks(yTicks)
      .width(width)
      .config(yC)
      .config(viz._yConfig)
      .scale(yConfigScale)
      .measure();
  }

  const yBounds = yTest.outerBounds() as AxisBounds;
  const yWidth = yBounds.width ? yBounds.width + yTest.padding() : undefined;

  if (y2Exists) {
    y2Test
      .domain(y2Domain)
      .height(height)
      .range([undefined, undefined])
      .ticks(y2Ticks)
      .width(width)
      .config(yC)
      .config(defaultY2Config)
      .config(viz._y2Config)
      .scale(y2ConfigScale)
      .measure();
  }

  const y2Bounds = y2Test.outerBounds() as AxisBounds;
  const y2Width = y2Bounds.width ? y2Bounds.width + y2Test.padding() : undefined;

  return {yBounds, yWidth, y2Bounds, y2Width};
}

/** Build the shared x-axis config object, including the no-y-axis variant. */
function buildXConfig(viz: Viz, inputs: AxisMeasureInputs): Record<string, unknown> {
  const {xTicks, showX, showY, xData, xScalePadding} = inputs;

  const xC: Record<string, unknown> = {
    data: xData,
    locale: viz.schema.locale,
    rounding: viz.schema.xDomain ? "none" : "outside",
    scalePadding: xScalePadding,
  };
  if (!showY && showX) {
    xC.barConfig = {stroke: "transparent"};
    xC.tickSize = 0;
    xC.shapeConfig = {
      labelBounds: (d: {labelBounds: {height: number; y: number}}, i: number) => {
        const {height, y} = d.labelBounds;
        const width = viz.schema.width / 2;
        const x = i ? -width : 0;
        return {x, y, width, height};
      },
      labelConfig: {
        padding: 0,
        rotate: 0,
        textAnchor: (d: {id: unknown}) =>
          xTicks && d.id === xTicks[0] ? "start" : "end",
      },
      labelRotation: false,
    };
  }

  return xC;
}

/**
    Measure the x/x2 test axes and solve the coupled four-side offsets,
    interleaving the line-label measure between the two x-axis passes.
*/
function measureXTestAxes(
  viz: Viz,
  inputs: AxisMeasureInputs,
  xC: Record<string, unknown>,
  yWidth: number | undefined,
  y2Width: number | undefined,
  measureLineLabels: () => LineLabelMeasurement,
): Omit<AxisMeasureResult, "yBounds" | "y2Bounds" | "yWidth" | "y2Width" | "xC"> {
  const {
    xTest, x2Test, yTest, xDomain, x2Domain, xTicks, x2Ticks,
    xConfigScale, x2ConfigScale, defaultX2Config,
    showX, showY, x2Exists, height, width,
  } = inputs;

  let xRangeMax: number | undefined = undefined;

  if (showX) {
    xTest
      .domain(xDomain)
      .height(height)
      .maxSize(height / 2)
      .range([undefined, xRangeMax])
      .ticks(xTicks)
      .width(width)
      .config(xC)
      .config(viz._xConfig)
      .scale(xConfigScale)
      .measure();
  }

  const {labelWidths, largestLabel, xRangeMax: measuredXRangeMax} =
    measureLineLabels();
  if (measuredXRangeMax !== undefined) xRangeMax = measuredXRangeMax;

  if (showX && xRangeMax) {
    xTest
      .domain(xDomain)
      .height(height)
      .maxSize(height / 2)
      .range([undefined, xRangeMax])
      .ticks(xTicks)
      .width(width)
      .config(xC)
      .config(viz._xConfig)
      .scale(xConfigScale)
      .measure();
  }

  if (x2Exists) {
    x2Test
      .domain(x2Domain)
      .height(height)
      .range([undefined, xRangeMax])
      .ticks(x2Ticks)
      .width(width)
      .config(xC)
      .tickSize(0)
      .config(defaultX2Config)
      .config(viz._x2Config)
      .scale(x2ConfigScale)
      .measure();
  }

  const xTestRange = xTest._getRange() as number[];
  const x2TestRange = x2Test._getRange() as number[];

  const x2Bounds = x2Test.outerBounds() as AxisBounds;
  const x2Height = x2Exists ? x2Bounds.height + x2Test.padding() : 0;

  const xOffsetLeft = max([yWidth, xTestRange[0], x2TestRange[0]] as number[])!;

  if (showX) {
    xTest.range([xOffsetLeft, undefined]).measure();
  }

  const topOffset = showY
    ? yTest.shapeConfig().labelConfig.fontSize() / 2
    : 0;

  const xOffsetRight = max([
    y2Width,
    width - xTestRange[1],
    width - x2TestRange[1],
  ] as number[])!;
  const xBounds = xTest.outerBounds() as AxisBounds;
  const xHeight = xBounds.height + (showY ? xTest.padding() : 0);

  return {
    xRangeMax,
    labelWidths,
    largestLabel,
    xTestRange,
    x2TestRange,
    x2Height,
    xOffsetLeft,
    xOffsetRight,
    topOffset,
    xHeight,
  };
}

/**
    MEASURE half of the joint axis solve. Configures + measures the four
    throwaway test axes, solves the coupled offsets, writes the resulting
    four-side claim to `viz._padding.*`, and returns the offsets + the
    measured bounds + the line-label measurement for the paint phase.

    `measureLineLabels` is invoked once, after the first x-axis measure and
    before the re-measure, so its `xRangeMax` can re-bound the x range.
*/
export function measureAxes(
  viz: Viz,
  inputs: AxisMeasureInputs,
  measureLineLabels: () => LineLabelMeasurement,
): AxisMeasureResult {
  const {yBounds, yWidth, y2Bounds, y2Width} = measureYTestAxes(viz, inputs);

  const xC = buildXConfig(viz, inputs);

  const xResult = measureXTestAxes(viz, inputs, xC, yWidth, y2Width, measureLineLabels);

  viz._padding.left += xResult.xOffsetLeft;
  viz._padding.right += xResult.xOffsetRight;
  viz._padding.bottom += xResult.xHeight;
  viz._padding.top += xResult.x2Height + xResult.topOffset;

  return {yBounds, y2Bounds, yWidth, y2Width, xC, ...xResult};
}

/**
    Re-measure the y/y2 axes against `yRange` and resolve the final left/right
    offsets they claim.
*/
function solveFinalYAxes(
  viz: Viz,
  pCtx: PlotPaintContext,
  yRange: number[],
): YAxisMeasure & {xOffsetLeft: number; xOffsetRight: number} {
  const {yDomain, y2Domain, yConfigScale, y2ConfigScale} = pCtx;
  const {defaultY2Config, showY, y2Exists, yC} = pCtx;
  const {yTicks, x2TestRange, xTestRange, height, width} = pCtx;
  const {yTest, y2Test} = pCtx;
  let {xOffsetRight} = pCtx;

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

  const yBounds = yTest.outerBounds() as AxisBounds;
  const yWidth = yBounds.width ? yBounds.width + yTest.padding() : undefined;
  const xOffsetLeft = max([yWidth, xTestRange[0], x2TestRange[0]] as number[])!;

  if (y2Exists) {
    y2Test
      .config(yC)
      .domain(y2Domain)
      .gridSize(0)
      .height(height)
      .range(yRange)
      .width(width - max([0, xOffsetRight - (pCtx.y2Width as number)])!)
      .title(false)
      .config(viz._y2Config)
      .config(defaultY2Config)
      .scale(y2ConfigScale)
      .measure();
  }

  const y2Bounds = y2Test.outerBounds() as AxisBounds;
  const y2Width = y2Bounds.width
    ? y2Bounds.width + y2Test.padding()
    : undefined;
  xOffsetRight = max([
    0,
    y2Width,
    width - xTestRange[1],
    width - x2TestRange[1],
  ] as number[])!;

  return {yBounds, yWidth, y2Bounds, y2Width, xOffsetLeft, xOffsetRight};
}

/**
    Set `viz._chartTransform` and derive the per-axis relative transform
    helper used when absorbing axis scenes into `_chartScene`.
*/
function setupAxisTransforms(
  viz: Viz,
  pCtx: PlotPaintContext,
  xOffsetLeft: number,
  yWidth: number | undefined,
): RelativeTransform {
  const {x2Height, topOffset} = pCtx;

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
  return (which: "x" | "x2" | "y" | "y2") => ({
    x: axisAbsoluteTransforms[which].x - chartTransform.x,
    y: axisAbsoluteTransforms[which].y - chartTransform.y,
  });
}

/**
    Render the production x/x2 axes against `xRange`, queue their scenes, and
    build the `viz._xFunc` position accessor.
*/
function renderXAxes(
  viz: Viz,
  pCtx: PlotPaintContext,
  xRange: number[],
  axisRelativeTransform: RelativeTransform,
  axisSceneQueue: AxisScene[],
): PositionAccessor {
  const {xDomain, x2Domain, xConfigScale, x2ConfigScale} = pCtx;
  const {defaultX2Config, showX, x2Exists, xC} = pCtx;
  const {xTicks, x2Ticks, x2Height, topOffset, height, width, verticalMargin} = pCtx;

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
      .height(height - (pCtx.xHeight + topOffset + verticalMargin))
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

  const x = (d: unknown, x?: string): number => {
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
  viz._xFunc = x;
  return x;
}

/**
    Render the production y/y2 axes against `yRange`, queue their scenes, and
    build the `viz._yFunc` position accessor.
*/
function renderYAxes(
  viz: Viz,
  pCtx: PlotPaintContext,
  xRange: number[],
  yRange: number[],
  xOffsetRight: number,
  y2Width: number | undefined,
  axisRelativeTransform: RelativeTransform,
  axisSceneQueue: AxisScene[],
): PositionAccessor {
  const {yDomain, y2Domain, yConfigScale, y2ConfigScale} = pCtx;
  const {defaultY2Config, showY, y2Exists, yC} = pCtx;
  const {yTicks, x2Height, height, width} = pCtx;

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

  const y = (d: unknown, y?: string): number => {
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
  viz._yFunc = y;
  return y;
}

/**
    Render the production axes and solve the final ranges/offsets.

    Reads `pCtx`, runs each production-mode axis through
    `renderMode("compute").select(null).render()`, computes the final
    `xRange`/`yRange` + offsets, sets `viz._xFunc` / `viz._yFunc` accessors,
    bumps the line labels, and queues axis scenes for the emit phase.
    Returns everything `plotEmit` needs to consume.
*/
export function renderAxes(viz: Viz, pCtx: PlotPaintContext): PlotMeasureResult {
    let {x, y} = pCtx;
    const {labelWidths} = pCtx;
    const {xHeight, x2Height, topOffset, height, horizontalMargin, verticalMargin} = pCtx;

    let yRange = [x2Height, height - (xHeight + topOffset + verticalMargin)];

    const {yBounds, yWidth, y2Bounds, y2Width, xOffsetLeft, xOffsetRight} =
      solveFinalYAxes(viz, pCtx, yRange);

    const xRange = [xOffsetLeft, pCtx.width - (xOffsetRight + horizontalMargin)];

    const axisRelativeTransform = setupAxisTransforms(viz, pCtx, xOffsetLeft, yWidth);

    // Queued axis scenes — pushed onto `_chartScene` AFTER the shape loop so
    // axes render above shapes.
    const axisSceneQueue: AxisScene[] = [];

    x = renderXAxes(viz, pCtx, xRange, axisRelativeTransform, axisSceneQueue);

    yRange = [
      viz._xAxis.outerBounds().y + x2Height,
      height - (xHeight + topOffset + verticalMargin),
    ];

    y = renderYAxes(
      viz, pCtx, xRange, yRange, xOffsetRight, y2Width,
      axisRelativeTransform, axisSceneQueue,
    );

    const labelPositions = bumpLineLabels(viz, labelWidths, yRange);

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
