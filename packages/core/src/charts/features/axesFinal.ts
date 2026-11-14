/**
    The final half of the Plot-family axes' joint solve (see `axes.ts`): once
    the chrome has taken its margins, the y/y2 axes are measured again
    against the plot's height, and the x axis's labels against its final
    width, so the plot and its axes meet.

    @module
*/

import {max} from "d3-array";

import type Axis from "../../components/Axis/Axis.js";
import {defaultMaxSize, pinMaxSize} from "../../components/Axis/axisMaxSize.js";
import {plotAxisConfig} from "../Plot/baselineBreak.js";
import type {PlotMeasureResult, PlotPaintContext} from "./plotPaint.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";
import {
  aspectInset,
  plotAspectRatio,
  plotAxisUnits,
} from "../Plot/aspectRatio.js";

/** A measured axis's outer bounding box. */
export type AxisBounds = {width: number; height: number; x: number; y: number};

/** The y/y2 bounds + claimed widths a y-axis measure pass produces. */
export type YAxisMeasure = {
  yBounds: AxisBounds;
  yWidth: number | undefined;
  y2Bounds: AxisBounds;
  y2Width: number | undefined;
};

/** The final y-axis solve: its bounds and widths, and the x range's offsets. */
type FinalYAxes = YAxisMeasure & {xOffsetLeft: number; xOffsetRight: number};

/**
    The room the plot leaves on its right for the y2 axis and for the x/x2
    axes' last labels, once those axes start at `xOffsetLeft`. The x and x2
    test axes are re-measured from there: where an axis starts decides its
    ticks, and so which label is last and how far it reaches past the
    range's end.
*/
export function xRightInset(
  axes: {
    xTest: Axis;
    x2Test: Axis;
    showX: boolean;
    x2Exists: boolean;
    xRangeMax: number | undefined;
    width: number;
  },
  xOffsetLeft: number,
  y2Width: number | undefined,
): number {
  const {xTest, x2Test, showX, x2Exists, width} = axes;
  const xRangeMax = axes.xRangeMax || undefined;
  if (showX) xTest.range([xOffsetLeft, xRangeMax]).measure();
  if (x2Exists) x2Test.range([xOffsetLeft, xRangeMax]).measure();
  const xEnd = (xTest._getRange() as number[])[1];
  const x2End = (x2Test._getRange() as number[])[1];
  return max([0, y2Width, width - xEnd, width - x2End] as number[])!;
}

/**
    Re-measure the y/y2 axes against `yRange` and resolve the final left/right
    offsets they claim.
*/
function solveFinalYAxes(
  viz: Viz,
  pCtx: PlotPaintContext,
  yRange: number[],
): FinalYAxes {
  const {yDomain, y2Domain, yConfigScale, y2ConfigScale} = pCtx;
  const {defaultY2Config, showY, y2Exists, yC} = pCtx;
  const {yTicks, x2TestRange, xTestRange, height, width} = pCtx;
  const {yTest, y2Test} = pCtx;
  let {xOffsetRight} = pCtx;

  if (showY) {
    const yPlotConfig = plotAxisConfig(viz, "y");
    yTest
      .domain(yDomain)
      .height(height)
      .maxSize(width / 2)
      .range(yRange)
      .ticks(yTicks)
      .width(width)
      .config(yC)
      .config(yPlotConfig)
      .scale(yConfigScale);
    defaultMaxSize(yTest, yC, yPlotConfig).measure();
  }

  const yBounds = yTest.outerBounds() as AxisBounds;
  const yWidth = yBounds.width ? yBounds.width + yTest.padding() : undefined;
  const {startLabelSpace} = pCtx;
  const xOffsetLeft = max([
    0,
    yWidth,
    xTestRange[0],
    x2TestRange[0],
    viz._plotMinLeft?.(),
    startLabelSpace && (yWidth ?? 0) + startLabelSpace,
  ] as number[])!;

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
      .scale(y2ConfigScale);
    // A `maxSize` function reads the width the axis first measured with.
    pinMaxSize(y2Test, width).measure();
  }

  const y2Bounds = y2Test.outerBounds() as AxisBounds;
  const y2Width = y2Bounds.width
    ? y2Bounds.width + y2Test.padding()
    : undefined;
  xOffsetRight = xRightInset(pCtx, xOffsetLeft, y2Width);

  return {yBounds, yWidth, y2Bounds, y2Width, xOffsetLeft, xOffsetRight};
}

/**
    The height the x axis's labels claim across `xRange`, as `measureXTestAxes`
    reckons it, or `undefined` when the axis draws no labels of its own (it's
    hidden, or labels the plot's ends instead).
*/
function finalXHeight(
  pCtx: PlotPaintContext,
  xRange: number[],
): number | undefined {
  const {xTest, showX, xLabelMode} = pCtx;
  if (!showX || (xLabelMode && xLabelMode !== "axis")) return undefined;
  xTest.range(xRange).measure();
  return (xTest.outerBounds() as AxisBounds).height + xTest.padding();
}

/**
    How much further than the x axis's band slanted y-axis labels reach
    below the y range (see `Axis._labelOverflow`): the room the y range
    leaves above the x axis for them.
*/
function slantedLabelsBelow(pCtx: PlotPaintContext, inset: number): number {
  const axes = [pCtx.yTest, ...(pCtx.y2Exists ? [pCtx.y2Test] : [])];
  const reach = Math.max(0, ...axes.map(a => a._labelOverflow?.[1] ?? 0));
  return Math.max(0, Math.ceil(reach - (pCtx.xHeight + inset)));
}

/**
    The y/y2 axes' final solve, and the plot's y range, once the chrome has
    taken its margins. A `frozen` layout (a zoom repaint) keeps the previous
    draw's axis sizes and plot rect, so changing tick labels can't make the
    plot area jump mid-gesture; the axes still re-render their ticks for the
    new domains.

    The x labels claimed their height across the chart area as it stood
    before the chrome (a legend beside the plot) took its margins. Measured
    again across the final range, labels that wrap onto more or fewer lines
    resize the plot, so the x axis sits right beneath it; the returned
    `pCtx` carries that height.
*/
export function solveFinalAxes(
  viz: Viz,
  pCtx: PlotPaintContext,
  frozen?: PlotMeasureResult,
): {
  pCtx: PlotPaintContext;
  yRange: number[];
  yBottom: number;
  insetBottom: number;
  solved: FinalYAxes;
  aspectInsetY: number;
} {
  // A zoom repaint keeps the room its draw's aspect ratio took.
  if (frozen?.aspectInsetY) pCtx = shiftPlotY(pCtx, frozen.aspectInsetY);
  const {x2Height, height, horizontalMargin} = pCtx;
  // The plot's bottom edge for an x axis `xHeight` tall, less the room a
  // chart reserves between the value axis and the x axis, and `labels`
  // more for y-axis labels that reach below the range.
  const bottom = (xHeight: number, labels = 0) => {
    const yBottom = height - (xHeight + pCtx.topOffset + pCtx.verticalMargin);
    const insetBottom =
      frozen?.insetBottom ??
      Math.max(0, viz._plotInsetBottom?.(yBottom - x2Height) ?? 0) + labels;
    return {yBottom, insetBottom, yRange: [x2Height, yBottom - insetBottom]};
  };
  let fit = bottom(pCtx.xHeight);
  let solved = frozen || solveFinalYAxes(viz, pCtx, fit.yRange);
  for (let pass = 0; !frozen && pass < 3; pass++) {
    const xHeight = finalXHeight(pCtx, [
      solved.xOffsetLeft,
      pCtx.width - (solved.xOffsetRight + horizontalMargin),
    ]);
    if (xHeight === undefined || xHeight === pCtx.xHeight) break;
    viz._padding.bottom += xHeight - pCtx.xHeight;
    pCtx = {...pCtx, xHeight};
    fit = bottom(xHeight);
    solved = solveFinalYAxes(viz, pCtx, fit.yRange);
  }
  const below = frozen ? 0 : slantedLabelsBelow(pCtx, fit.insetBottom);
  if (below) {
    fit = bottom(pCtx.xHeight, below);
    solved = solveFinalYAxes(viz, pCtx, fit.yRange);
  }
  if (frozen)
    return {pCtx, ...fit, solved, aspectInsetY: frozen.aspectInsetY ?? 0};
  const held = holdAspectRatio(
    viz,
    pCtx,
    {fit, solved},
    (p: PlotPaintContext) => {
      pCtx = p;
      fit = bottom(pCtx.xHeight, below);
      return {fit, solved: solveFinalYAxes(viz, pCtx, fit.yRange)};
    },
  );
  return {pCtx, ...held.fit, solved: held.solved, aspectInsetY: held.insetY};
}

/** The paint context with the plot moved `half` down from the top and up from the bottom. */
const shiftPlotY = (
  pCtx: PlotPaintContext,
  half: number,
): PlotPaintContext => ({
  ...pCtx,
  topOffset: pCtx.topOffset + half,
  verticalMargin: pCtx.verticalMargin + half,
});

/** The plot's y range and the y axes' solve, as `solveFinalAxes` settles them. */
type Fit = {fit: {yRange: number[]}; solved: FinalYAxes};

/**
    Shrinks the plot area along one side, centered, so it holds the Plot's
    `aspectRatio` (see `Plot/aspectRatio.ts`): a narrower plot moves in
    from both sides, and a shorter one moves down from the top and up
    from the bottom, its y axes measured again (`resolve`) against the
    shorter range. The axes' domains, rounded as they draw at the new
    ranges, decide the ratio, so it settles over a few passes. Returns the
    y inset (half on each side) a zoom repaint keeps.
*/
function holdAspectRatio<T extends Fit["fit"]>(
  viz: Viz,
  pCtx: PlotPaintContext,
  state: {fit: T; solved: FinalYAxes},
  resolve: (pCtx: PlotPaintContext) => {fit: T; solved: FinalYAxes},
): {fit: T; solved: FinalYAxes; insetY: number} {
  let {fit, solved} = state;
  const scales = {
    x: pCtx.xScale === "Point" ? "point" : pCtx.xConfigScale,
    y: pCtx.yScale === "Point" ? "point" : pCtx.yConfigScale,
  };
  const ratio = plotAspectRatio(viz, scales);
  let insetX = 0,
    insetY = 0;
  for (let pass = 0; ratio && pass < 4; pass++) {
    const xRange = [
      solved.xOffsetLeft + insetX,
      pCtx.width - (solved.xOffsetRight + insetX + pCtx.horizontalMargin),
    ];
    pCtx.xTest.range(xRange).measure();
    const units = plotAxisUnits({x: pCtx.xTest, y: pCtx.yTest}, scales, {
      x: pCtx.xDomain,
      y: pCtx.yDomain,
    });
    if (!units) break;
    const [y0, y1] = fit.yRange;
    const inset = aspectInset(
      units,
      {x: xRange[1] - xRange[0], y: y1 - y0},
      ratio,
    );
    if (inset.x < 0.5 && inset.y < 0.5) break;
    insetX += inset.x / 2;
    if (inset.y >= 0.5) {
      insetY += inset.y / 2;
      pCtx = shiftPlotY(pCtx, inset.y / 2);
      ({fit, solved} = resolve(pCtx));
    }
  }
  return {
    fit,
    solved: {
      ...solved,
      xOffsetLeft: solved.xOffsetLeft + insetX,
      xOffsetRight: solved.xOffsetRight + insetX,
    },
    insetY,
  };
}
