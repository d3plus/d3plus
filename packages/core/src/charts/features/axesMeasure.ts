/**
    The MEASURE half of the Plot-family joint axis solve (see `axes.ts` for
    the EMIT half): throwaway test axes measure label widths/heights, the
    coupled offsets are solved, and the four-side claim is written to
    `viz._padding.*`. Runs BEFORE the base `Viz` draw finalizes margins.
*/

import {max} from "d3-array";

import AxisBottom from "../../components/Axis/AxisBottom.js";
import type Axis from "../../components/Axis/Axis.js";
import {barLabelsNeedAxis, type BarLabelCheck} from "../Plot/barLabelFit.js";
import {plotAxisConfig} from "../Plot/baselineBreak.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";
import {xRightInset} from "./axesFinal.js";
import {cornerControlsHeight} from "./features.js";
import type {AxisBounds, YAxisMeasure} from "./axesFinal.js";
import {
  END_LABEL_AXIS_CONFIG,
  endLabelSpace,
  labelsXEnds,
  measureEndLabels,
} from "./plotEndLabels.js";
import type {XLabelMode} from "./plotEndLabels.js";
import type {LabelWidth} from "./plotPaint.js";
import {buildXConfig} from "./xAxisConfig.js";

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
  /** Category labels the bars carry in place of the category axis's ticks. */
  barLabelCheck?: BarLabelCheck;
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
  xLabelMode: XLabelMode;
  /** The category axis keeps its ticks, which the bars had no room to label. */
  barLabelsOnAxis: boolean;
  /** The x and y ticks the axes were measured with (see `barLabelsOnAxis`). */
  xTicks: unknown[] | null;
  yTicks: unknown[] | null;
}

/** Measure the y/y2 test axes and report their bounds + claimed widths. */
function measureYTestAxes(viz: Viz, inputs: AxisMeasureInputs): YAxisMeasure {
  const {
    yTest,
    y2Test,
    yDomain,
    y2Domain,
    yTicks,
    y2Ticks,
    yConfigScale,
    y2ConfigScale,
    defaultY2Config,
    yC,
    showY,
    y2Exists,
    height,
    width,
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
      .config(plotAxisConfig(viz, "y"))
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
  const y2Width = y2Bounds.width
    ? y2Bounds.width + y2Test.padding()
    : undefined;

  return {yBounds, yWidth, y2Bounds, y2Width};
}

/**
    Measure the x/x2 test axes, interleaving the line-label measure between
    the two x-axis passes so its `xRangeMax` can re-bound the x range.
*/
function measureXTestPasses(
  viz: Viz,
  inputs: AxisMeasureInputs,
  xC: Record<string, unknown>,
  measureLineLabels: () => LineLabelMeasurement,
  ends: boolean,
): LineLabelMeasurement {
  const {
    xTest,
    x2Test,
    xDomain,
    x2Domain,
    xTicks,
    x2Ticks,
    xConfigScale,
    x2ConfigScale,
    defaultX2Config,
    showX,
    x2Exists,
    height,
    width,
  } = inputs;

  let xRangeMax: number | undefined = undefined;
  const xOverrides = ends ? END_LABEL_AXIS_CONFIG : {};

  if (showX) {
    xTest
      .domain(xDomain)
      .height(height)
      .maxSize(height / 2)
      .range([undefined, xRangeMax])
      .ticks(xTicks)
      .width(width)
      .config(xC)
      .config(plotAxisConfig(viz, "x"))
      .config(xOverrides)
      .scale(xConfigScale)
      .measure();
  }

  const {
    labelWidths,
    largestLabel,
    xRangeMax: measuredXRangeMax,
  } = measureLineLabels();
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
      .config(plotAxisConfig(viz, "x"))
      .config(xOverrides)
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

  return {labelWidths, largestLabel, xRangeMax};
}

/**
    Measure the x/x2 test axes and solve the coupled four-side offsets.
*/
function measureXTestAxes(
  viz: Viz,
  inputs: AxisMeasureInputs,
  xC: Record<string, unknown>,
  yWidth: number | undefined,
  y2Width: number | undefined,
  measureLineLabels: () => LineLabelMeasurement,
  ends: boolean,
): Omit<
  AxisMeasureResult,
  | "yBounds"
  | "y2Bounds"
  | "yWidth"
  | "y2Width"
  | "xC"
  | "barLabelsOnAxis"
  | "xTicks"
  | "yTicks"
> {
  const {xTest, x2Test, yTest, showX, showY, x2Exists, height, width} = inputs;

  const {labelWidths, largestLabel, xRangeMax} = measureXTestPasses(
    viz,
    inputs,
    xC,
    measureLineLabels,
    ends,
  );

  const xTestRange = xTest._getRange() as number[];
  const x2TestRange = x2Test._getRange() as number[];

  const x2Bounds = x2Test.outerBounds() as AxisBounds;
  const x2Height = x2Exists ? x2Bounds.height + x2Test.padding() : 0;

  const xOffsetLeft = max([
    0,
    yWidth,
    xTestRange[0],
    x2TestRange[0],
    viz._plotMinLeft?.(),
  ] as number[])!;

  const yLabelConfig = yTest.shapeConfig().labelConfig as {
    fontSize: () => number;
  };
  const topOffset =
    (showY ? yLabelConfig.fontSize() / 2 : 0) + (viz._plotInsetTop ?? 0);

  const xOffsetRight = xRightInset(
    {xTest, x2Test, showX, x2Exists, xRangeMax, width},
    xOffsetLeft,
    y2Width,
  );
  const xBounds = xTest.outerBounds() as AxisBounds;
  const endSpace = ends
    ? endLabelSpace(measureEndLabels(xTest), height - x2Height)
    : 0;
  const xHeight = ends
    ? endSpace
    : xBounds.height + (showY || showX ? xTest.padding() : 0);
  const xLabelMode: XLabelMode = !ends ? "axis" : endSpace ? "ends" : "none";

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
    xLabelMode,
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
  measureInputs: AxisMeasureInputs,
  measureLineLabels: () => LineLabelMeasurement,
): AxisMeasureResult {
  let inputs = measureInputs;
  const check = inputs.barLabelCheck;
  // Horizontal bars: the y axis measures first, so the x axis's height
  // comes from a throwaway measure.
  const yOnAxis =
    check?.axis === "y" &&
    barLabelsNeedAxis(
      viz,
      check,
      barPlot(
        viz,
        inputs,
        0,
        provisionalXHeight(viz, inputs) + provisionalTopOffset(viz, inputs),
      ),
    );
  if (yOnAxis) inputs = {...inputs, yTicks: null};

  const {yBounds, yWidth, y2Bounds, y2Width} = measureYTestAxes(viz, inputs);

  // Vertical bars: the y axes have claimed their width.
  const xOnAxis =
    check?.axis === "x" &&
    barLabelsNeedAxis(
      viz,
      check,
      barPlot(viz, inputs, (yWidth ?? 0) + (y2Width ?? 0), 0),
    );
  if (xOnAxis) inputs = {...inputs, xTicks: null};

  const ends = labelsXEnds(viz, inputs.showX, inputs.showY);
  const xC = buildXConfig(viz, inputs);

  const xResult = measureXTestAxes(
    viz,
    inputs,
    xC,
    yWidth,
    y2Width,
    measureLineLabels,
    ends,
  );

  viz._padding.left += xResult.xOffsetLeft;
  viz._padding.right += xResult.xOffsetRight;
  viz._padding.bottom += xResult.xHeight;
  viz._padding.top += xResult.x2Height + xResult.topOffset;

  return {
    yBounds,
    y2Bounds,
    yWidth,
    y2Width,
    xC,
    ...xResult,
    barLabelsOnAxis: yOnAxis || xOnAxis,
    xTicks: inputs.xTicks,
    yTicks: inputs.yTicks,
  };
}

/**
    The plot area a bar's label gets measured against: the chart area less
    the axes' claims (`left`, `bottom`) and the corner controls' reach,
    which the top margin always clears (a small-multiples panel's chrome is
    already claimed).
*/
function barPlot(
  viz: Viz,
  inputs: AxisMeasureInputs,
  left: number,
  bottom: number,
): {width: number; height: number} {
  const corner = viz._facetStep === "panel" ? 0 : cornerControlsHeight(viz);
  return {
    width: inputs.width - left,
    height: inputs.height - bottom - corner,
  };
}

/**
    The room above the plot for the y axis's top label (see
    `measureXTestAxes`), read from the y test axis's config ahead of its
    measure.
*/
function provisionalTopOffset(viz: Viz, inputs: AxisMeasureInputs): number {
  const {yTest, yC, showY} = inputs;
  if (showY) yTest.config(yC).config(plotAxisConfig(viz, "y"));
  const labelConfig = yTest.shapeConfig().labelConfig as {
    fontSize: () => number;
  };
  return (showY ? labelConfig.fontSize() / 2 : 0) + (viz._plotInsetTop ?? 0);
}

/** The x axis's height, from a throwaway measure ahead of the joint solve. */
function provisionalXHeight(viz: Viz, inputs: AxisMeasureInputs): number {
  if (!inputs.showX) return 0;
  const axis = new AxisBottom().align("end").gridSize(0);
  axis
    .domain(inputs.xDomain)
    .height(inputs.height)
    .maxSize(inputs.height / 2)
    .range([undefined, undefined])
    .ticks(inputs.xTicks)
    .width(inputs.width)
    .config(buildXConfig(viz, inputs))
    .config(plotAxisConfig(viz, "x"))
    .scale(inputs.xConfigScale)
    .measure();
  return (axis.outerBounds() as AxisBounds).height + axis.padding();
}
