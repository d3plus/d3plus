/**
    `drawPlot` — Plot's layout/measure orchestration, extracted from the
    class body. Allocates throwaway measure-only axes, threads the data
    through the `pipeline.ts` stages, computes the padding the axes need,
    runs the base `Viz` draw, then hands a fully-populated context to
    `_paint`.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import {groups, max} from "d3-array";

import {AxisBottom, AxisLeft, AxisTop, TextBox} from "../../components/index.js";
import * as shapes from "../../shapes/index.js";

import Viz from "../Viz.js";
import {runStages} from "../stages.js";
import {
  computePlotAxisValues,
  computePlotInitialDomains,
  computePlotScales,
  extendPlotOppScales,
  formatPlotData,
  measurePlotLineLabels,
  preparePlotAxisLayout,
} from "./pipeline.js";

const testLineShape = new shapes.Line();
const testTextBox = new TextBox();

const superDraw = (viz: any, callback?: () => void) =>
  (Viz.prototype._draw as (...args: unknown[]) => unknown).call(viz, callback);

export function drawPlot(viz: any, callback?: () => void) {
  if (!viz._filteredData.length && !viz._annotations.length) {
    // Empty data: still run super._draw so the chart shell (title /
    // legend / total / timeline / colorScale) refreshes — features
    // tear down their DOM via .data([]) in their layout body, and
    // vizDrawPure resets _chartScene/_featurePanels/_shapes. Without
    // this, the previous render's chart shell (incl. aria-labels)
    // lingers in the DOM and toScene() emits stale nodes.
    superDraw(viz, callback);
    return viz;
  }

  // Throwaway measure-only axes. Allocated per draw, configured + measured
  // below, then garbage-collected when the function returns. Plot no longer
  // owns long-lived Axis instances just to compute layout. gridSize(0)
  // signals "labels-only" measure: the production axes (`_xAxis`,
  // `_yAxis`, …) handle grid rendering with their default gridSize.
  const xTest = new AxisBottom().align("end").gridSize(0);
  const x2Test = new AxisTop().align("start").gridSize(0);
  const yTest = new AxisLeft().align("start").gridSize(0);
  const y2Test = new AxisLeft().align("end").gridSize(0);

  // Plot's data-format + time-axis + sizeScale prep extracted to the
  // `formatPlotData` TransformStage, and per-axis values extracted to
  // `computePlotAxisValues`. Both run here; downstream paint code reads
  // their outputs from the returned context.
  const plotCtx = runStages({viz}, [
    formatPlotData,
    computePlotAxisValues,
  ]) as {
    plotFormattedData: any[];
    plotAxisData: any[];
    x2Exists: boolean;
    y2Exists: boolean;
    xData: any[];
    x2Data: any[];
    yData: any[];
    y2Data: any[];
  };
  const data = plotCtx.plotFormattedData;
  const axisData = plotCtx.plotAxisData;
  const {x2Exists, y2Exists, xData, x2Data, yData, y2Data} = plotCtx;
  const stackGroup = (plotCtx as any).plotStackGroup as (d: any, i: number) => string;
  // Time flags (xTime/x2Time/yTime/y2Time) are written onto `viz` by
  // `formatPlotData` and read directly via `viz._xTime` etc. in the
  // remainder of this function.

  const height = viz.schema.height - viz._margin.top - viz._margin.bottom,
    opp = viz.schema.discrete ? (viz.schema.discrete === "x" ? "y" : "x") : undefined,
    // `opps`/`opp2` previously used inline for log/baseline domain
    // adjustments — that's now part of `computePlotScales`. `opp` is still
    // read by the stacking branch below.
    parent = viz._select,
    transition = viz._transition,
    width = viz.schema.width - viz._margin.left - viz._margin.right;

  // xData/x2Data/yData/y2Data computed by `computePlotAxisValues` stage.

  // Stacked/non-stacked domain construction + domain/scale setup are stages
  // on `plotDef`. Run them together and read all the outputs the paint phase
  // below needs.
  const layoutCtx = runStages({
    viz,
    plotFormattedData: data,
    plotAxisData: axisData,
    xData,
    x2Data,
    yData,
    y2Data,
    plotStackGroup: stackGroup,
  } as any, [computePlotInitialDomains, computePlotScales]) as {
    plotInitialDomains: Record<string, any[]>;
    plotDiscreteKeys: any[];
    plotStackData: any[];
    plotStackKeys: any[];
    plotDomains: Record<string, any[]>;
    plotScales: any;
    plotConfigScales: any;
    plotOpps: any;
  };
  const domains = layoutCtx.plotDomains;
  const discreteKeys = layoutCtx.plotDiscreteKeys;
  const stackData = layoutCtx.plotStackData;
  const stackKeys = layoutCtx.plotStackKeys;
  let {x, y, x2, y2} = layoutCtx.plotScales;
  const {xScale, yScale} = layoutCtx.plotScales;
  const {xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale} = layoutCtx.plotConfigScales;

  const shapeData = groups(
    data,
    (d: Record<string, unknown>) => d.shape as string,
  ).sort(([a], [b]) => viz.schema.shapeSort(a, b));

  // Opposite-axis scale extension via buffers lives in the
  // `extendPlotOppScales` stage. Reassigns x/y/x2/y2 from the stage's
  // returned scales bundle.
  const extCtx = runStages({
    viz,
    plotFormattedData: data,
    plotAxisData: axisData,
    plotScales: {...layoutCtx.plotScales, x, y, x2, y2},
    plotConfigScales: layoutCtx.plotConfigScales,
  } as any, [extendPlotOppScales]) as {plotScales: any};
  x = extCtx.plotScales.x;
  y = extCtx.plotScales.y;
  x2 = extCtx.plotScales.x2;
  y2 = extCtx.plotScales.y2;

  // Axis-layout-prep lives in `preparePlotAxisLayout`.
  // Produces xDomain/yDomain/etc., defaultConfig/showX/showY, yC, barLabels,
  // and the four ticks arrays (null when ticks show, [] when redundant).
  const prepCtx = runStages({
    viz,
    plotAxisData: axisData,
    plotScales: {...layoutCtx.plotScales, x, y, x2, y2},
    x2Exists,
    y2Exists,
    x2Data,
    y2Data,
    yData,
  } as any, [preparePlotAxisLayout]) as {
    plotDefaultConfig: any;
    plotDefaultX2Config: any;
    plotDefaultY2Config: any;
    plotShowX: boolean;
    plotShowY: boolean;
    plotYC: any;
    plotBarLabels: string[];
    plotXTicks: any[] | null;
    plotX2Ticks: any[] | null;
    plotYTicks: any[] | null;
    plotY2Ticks: any[] | null;
    plotXDomain: any[];
    plotX2Domain: any[];
    plotYDomain: any[];
    plotY2Domain: any[];
  };
  const xDomain = prepCtx.plotXDomain;
  const x2Domain = prepCtx.plotX2Domain;
  const yDomain = prepCtx.plotYDomain;
  const y2Domain = prepCtx.plotY2Domain;
  const defaultConfig = prepCtx.plotDefaultConfig;
  const defaultX2Config = prepCtx.plotDefaultX2Config;
  const defaultY2Config = prepCtx.plotDefaultY2Config;
  const showX = prepCtx.plotShowX;
  const showY = prepCtx.plotShowY;
  const yC = prepCtx.plotYC;
  const xTicks = prepCtx.plotXTicks;
  const x2Ticks = prepCtx.plotX2Ticks;
  const yTicks = prepCtx.plotYTicks;
  const y2Ticks = prepCtx.plotY2Ticks;
  const barLabels = prepCtx.plotBarLabels;

  // Test axes use `.measure()` instead of `.select(testGroup).render()` —
  // pure layout pass, zero DOM creation. No `g.d3plus-plot-test` DOM
  // subtree attached to `viz._select`.
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

  const yBounds = yTest.outerBounds();
  const yWidth = yBounds.width
    ? yBounds.width + yTest.padding()
    : undefined;

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

  const y2Bounds = y2Test.outerBounds();
  const y2Width = y2Bounds.width
    ? y2Bounds.width + y2Test.padding()
    : undefined;
  const xC: Record<string, unknown> = {
    data: xData,
    locale: viz.schema.locale,
    rounding: viz.schema.xDomain ? "none" : "outside",
    scalePadding: x.padding ? x.padding() : 0,
  };
  if (!showY && showX) {
    xC.barConfig = {stroke: "transparent"};
    xC.tickSize = 0;
    xC.shapeConfig = {
      labelBounds: (d: any, i: any) => {
        const {height, y} = d.labelBounds;
        const width = viz.schema.width / 2;
        const x = i ? -width : 0;
        return {x, y, width, height};
      },
      labelConfig: {
        padding: 0,
        rotate: 0,
        textAnchor: (d: any) => (xTicks && d.id === xTicks[0] ? "start" : "end"),
      },
      labelRotation: false,
    };
  }

  let xRangeMax = undefined;

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

  // Line-label width measurement lives in the `measurePlotLineLabels`
  // stage. Pre-measured test axes + label test shapes are passed via
  // context. `showLineLabels` is still read by the shape-emission block
  // downstream.
  const showLineLabels = viz.schema.lineLabels && !y2Exists;
  const lineLabelCtx = runStages({
    viz,
    plotFormattedData: data,
    plotScales: layoutCtx.plotScales,
    plotConfigScales: layoutCtx.plotConfigScales,
    plotTestAxes: {xTest, yTest},
    plotLineLabelTest: {testLineShape, testTextBox},
    y2Exists,
  } as any, [measurePlotLineLabels]) as {
    plotLabelWidths: any[];
    plotLargestLabel: number | undefined;
    plotXRangeMax: number | undefined;
  };
  const labelWidths = lineLabelCtx.plotLabelWidths;
  const largestLabel = lineLabelCtx.plotLargestLabel;
  if (lineLabelCtx.plotXRangeMax !== undefined)
    xRangeMax = lineLabelCtx.plotXRangeMax;

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

  const xTestRange = xTest._getRange();
  const x2TestRange = x2Test._getRange();

  const x2Bounds = x2Test.outerBounds();
  const x2Height = x2Exists ? x2Bounds.height + x2Test.padding() : 0;

  const xOffsetLeft = max([yWidth, xTestRange[0], x2TestRange[0]]);

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
  ]);
  const xBounds = xTest.outerBounds();
  const xHeight = xBounds.height + (showY ? xTest.padding() : 0);

  viz._padding.left += xOffsetLeft;
  viz._padding.right += xOffsetRight;
  viz._padding.bottom += xHeight;
  viz._padding.top += x2Height + topOffset;

  superDraw(viz, callback);
  const horizontalMargin = viz._margin.left + viz._margin.right;
  const verticalMargin = viz._margin.top + viz._margin.bottom;
  const pCtx: any = {domains, shapeData, axisData, data, discreteKeys, stackData, stackKeys, x, y, x2, y2, xScale, yScale, xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale, xDomain, yDomain, x2Domain, y2Domain, xData, yData, x2Data, y2Data, x2Exists, y2Exists, showX, showY, defaultConfig, defaultX2Config, defaultY2Config, yC, xC, xTicks, yTicks, x2Ticks, y2Ticks, labelWidths, largestLabel, xRangeMax, xTest, yTest, x2Test, y2Test, yBounds, y2Bounds, yWidth, y2Width, xHeight, x2Height, xOffsetLeft, xOffsetRight, topOffset, xTestRange, x2TestRange, height, width, parent, transition, opp, barLabels, showLineLabels, stackGroup, horizontalMargin, verticalMargin};
  return viz._paint(pCtx);
}
