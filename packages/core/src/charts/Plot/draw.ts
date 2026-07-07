/**
    `drawPlot` — Plot's layout/measure orchestration, extracted from the
    class body. Allocates throwaway measure-only axes, threads the data
    through the `pipeline.ts` stages, computes the padding the axes need,
    runs the base `Viz` draw, then hands a fully-populated context to
    `_paint`.
*/
import {groups} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import {AxisBottom, AxisLeft, AxisTop, TextBox} from "../../components/index.js";
import type {Axis} from "../../components/index.js";
import * as shapes from "../../shapes/index.js";
import type {D3Scale} from "../../utils/index.js";

import {measureAxes} from "../features/axes.js";
import type {LineLabelMeasurement} from "../features/axes.js";
import type {LabelWidth, PlotPaintContext} from "../features/plotPaint.js";
import Viz from "../viz/Viz.js";
import {runStages} from "../pipeline/stages.js";
import type {PlotConfigScales, PlotScales} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  computePlotAxisValues,
  computePlotInitialDomains,
  computePlotScales,
  extendPlotOppScales,
  formatPlotData,
  measurePlotLineLabels,
  preparePlotAxisLayout,
} from "./pipeline.js";

/** A formatted Plot data row (the PlotDatum shape produced by `formatPlotData`). */
type Row = Record<string, unknown>;
/** The four configured scales threaded between the layout stages. */
type Scales = {x: D3Scale; y: D3Scale; x2: D3Scale; y2: D3Scale};

const testLineShape = new shapes.Line();
const testTextBox = new TextBox();

const superDraw = (viz: VizInstance, callback?: () => void) =>
  (Viz.prototype._draw as (...args: unknown[]) => unknown).call(viz, callback);

/** Runs format + per-axis-value stages; returns formatted data and axis-value bundles. */
function runPlotDataStages(viz: VizInstance) {
  const plotCtx = runStages({viz}, [formatPlotData, computePlotAxisValues]);
  // Time flags (xTime/x2Time/yTime/y2Time) are written onto `viz` by
  // `formatPlotData` and read directly via `viz._xTime` etc. downstream.
  return {
    data: plotCtx.plotFormattedData!,
    axisData: plotCtx.plotAxisData!,
    x2Exists: plotCtx.x2Exists!,
    y2Exists: plotCtx.y2Exists!,
    xData: plotCtx.xData!,
    x2Data: plotCtx.x2Data!,
    yData: plotCtx.yData!,
    y2Data: plotCtx.y2Data!,
    stackGroup: plotCtx.plotStackGroup!,
  };
}

/** Runs domain + scale stages; returns domains, stack data, and scale bundles. */
function runPlotLayoutStages(
  viz: VizInstance,
  data: Row[],
  axisData: Row[],
  stackGroup: (d: DataPoint, i: number) => string,
  axisValues: {xData: unknown[]; x2Data: unknown[]; yData: unknown[]; y2Data: unknown[]},
) {
  const {xData, x2Data, yData, y2Data} = axisValues;
  // Stacked/non-stacked domain construction + domain/scale setup are stages
  // on `plotDef`. Run them together and read all the outputs the paint phase
  // below needs.
  const layoutCtx = runStages(
    {
      viz,
      plotFormattedData: data,
      plotAxisData: axisData,
      xData,
      x2Data,
      yData,
      y2Data,
      plotStackGroup: stackGroup,
    },
    [computePlotInitialDomains, computePlotScales],
  );
  return {
    plotInitialDomains: layoutCtx.plotInitialDomains!,
    plotDiscreteKeys: layoutCtx.plotDiscreteKeys!,
    plotStackData: layoutCtx.plotStackData!,
    plotStackKeys: layoutCtx.plotStackKeys!,
    plotDomains: layoutCtx.plotDomains!,
    plotScales: layoutCtx.plotScales!,
    plotConfigScales: layoutCtx.plotConfigScales!,
    plotOpps: layoutCtx.plotOpps!,
  };
}

/** Extends opposite-axis scales via buffers; returns the reassigned x/y/x2/y2. */
function runPlotExtendScales(
  viz: VizInstance,
  data: Row[],
  axisData: Row[],
  layoutCtx: {plotScales: PlotScales; plotConfigScales: PlotConfigScales},
  scales: Scales,
): Scales {
  // Opposite-axis scale extension via buffers lives in the
  // `extendPlotOppScales` stage. Reassigns x/y/x2/y2 from the stage's
  // returned scales bundle.
  const extCtx = runStages(
    {
      viz,
      plotFormattedData: data,
      plotAxisData: axisData,
      plotScales: {...layoutCtx.plotScales, ...scales},
      plotConfigScales: layoutCtx.plotConfigScales,
    },
    [extendPlotOppScales],
  );
  const ext = extCtx.plotScales!;
  return {x: ext.x, y: ext.y, x2: ext.x2, y2: ext.y2};
}

/** Runs axis-layout prep; returns domains, default configs, show flags, ticks, and bar labels. */
function runPlotAxisPrep(
  viz: VizInstance,
  axisData: Row[],
  layoutCtx: {plotScales: PlotScales},
  scales: Scales,
  exists: {x2Exists: boolean; y2Exists: boolean},
  axisValues: {x2Data: unknown[]; y2Data: unknown[]; yData: unknown[]},
) {
  const {x2Exists, y2Exists} = exists;
  const {x2Data, y2Data, yData} = axisValues;
  // Axis-layout-prep lives in `preparePlotAxisLayout`.
  // Produces xDomain/yDomain/etc., defaultConfig/showX/showY, yC, barLabels,
  // and the four ticks arrays (null when ticks show, [] when redundant).
  const prepCtx = runStages(
    {
      viz,
      plotAxisData: axisData,
      plotScales: {...layoutCtx.plotScales, ...scales},
      x2Exists,
      y2Exists,
      x2Data,
      y2Data,
      yData,
    },
    [preparePlotAxisLayout],
  );
  return {
    plotDefaultConfig: prepCtx.plotDefaultConfig!,
    plotDefaultX2Config: prepCtx.plotDefaultX2Config!,
    plotDefaultY2Config: prepCtx.plotDefaultY2Config!,
    plotShowX: prepCtx.plotShowX!,
    plotShowY: prepCtx.plotShowY!,
    plotYC: prepCtx.plotYC!,
    plotBarLabels: prepCtx.plotBarLabels!,
    plotXTicks: prepCtx.plotXTicks!,
    plotX2Ticks: prepCtx.plotX2Ticks!,
    plotYTicks: prepCtx.plotYTicks!,
    plotY2Ticks: prepCtx.plotY2Ticks!,
    plotXDomain: prepCtx.plotXDomain!,
    plotX2Domain: prepCtx.plotX2Domain!,
    plotYDomain: prepCtx.plotYDomain!,
    plotY2Domain: prepCtx.plotY2Domain!,
  };
}

/** Builds the line-label width measure callback for the four-axis margin solve. */
function makePlotLineLabelMeasure(
  viz: VizInstance,
  data: Row[],
  layoutCtx: {plotScales: PlotScales; plotConfigScales: PlotConfigScales},
  y2Exists: boolean,
  testAxes: {xTest: Axis; yTest: Axis},
): () => LineLabelMeasurement {
  const {xTest, yTest} = testAxes;
  return () => {
    const lineLabelCtx = runStages(
      {
        viz,
        plotFormattedData: data,
        plotScales: layoutCtx.plotScales,
        plotConfigScales: layoutCtx.plotConfigScales,
        plotTestAxes: {xTest, yTest},
        plotLineLabelTest: {testLineShape, testTextBox},
        y2Exists,
      },
      [measurePlotLineLabels],
    );
    return {
      labelWidths: lineLabelCtx.plotLabelWidths as LabelWidth[],
      largestLabel: lineLabelCtx.plotLargestLabel,
      xRangeMax: lineLabelCtx.plotXRangeMax,
    };
  };
}

export function drawPlot(viz: VizInstance, callback?: () => void) {
  if (!viz._filteredData.length && !viz._annotations?.length) {
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
  const {data, axisData, x2Exists, y2Exists, xData, x2Data, yData, y2Data, stackGroup} = runPlotDataStages(viz);

  const height = viz.schema.height - viz._margin.top - viz._margin.bottom,
    opp = viz.schema.discrete ? (viz.schema.discrete === "x" ? "y" : "x") : undefined,
    width = viz.schema.width - viz._margin.left - viz._margin.right;

  // xData/x2Data/yData/y2Data computed by `computePlotAxisValues` stage.

  const layoutCtx = runPlotLayoutStages(viz, data, axisData, stackGroup, {xData, x2Data, yData, y2Data});
  const domains = layoutCtx.plotDomains;
  const discreteKeys = layoutCtx.plotDiscreteKeys;
  const stackData = layoutCtx.plotStackData;
  const stackKeys = layoutCtx.plotStackKeys;
  let {x, y, x2, y2} = layoutCtx.plotScales;
  const {xScale, yScale} = layoutCtx.plotScales;
  const {xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale} = layoutCtx.plotConfigScales;

  const shapeData = groups(
    data,
    (d: Row) => d.shape as string,
  ).sort(([a], [b]) => viz.schema.shapeSort(a, b));

  ({x, y, x2, y2} = runPlotExtendScales(viz, data, axisData, layoutCtx, {x, y, x2, y2}));

  const prepCtx = runPlotAxisPrep(viz, axisData, layoutCtx, {x, y, x2, y2}, {x2Exists, y2Exists}, {x2Data, y2Data, yData});
  const xDomain = prepCtx.plotXDomain as number[];
  const x2Domain = prepCtx.plotX2Domain as number[];
  const yDomain = prepCtx.plotYDomain as number[];
  const y2Domain = prepCtx.plotY2Domain as number[];
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
  // pure layout pass, zero DOM creation. The coupled four-axis margin
  // solve lives in `measureAxes` (charts/axes.ts); the line-label width
  // measure (Plot-pipeline-specific) interleaves mid-solve via the
  // injected callback. `showLineLabels` is read by the shape-emission
  // block downstream.
  const showLineLabels = viz.schema.lineLabels && !y2Exists;
  const measureLineLabels = makePlotLineLabelMeasure(viz, data, layoutCtx, y2Exists, {xTest, yTest});

  const {
    yBounds,
    y2Bounds,
    yWidth,
    y2Width,
    xC,
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
  } = measureAxes(
    viz,
    {
      xTest, yTest, x2Test, y2Test,
      xDomain, x2Domain, yDomain, y2Domain,
      xTicks, x2Ticks, yTicks, y2Ticks,
      xConfigScale, x2ConfigScale, yConfigScale, y2ConfigScale,
      defaultX2Config, defaultY2Config, yC, showX, showY,
      x2Exists, y2Exists, height, width, xData,
      xScalePadding: x.padding ? x.padding() : 0,
    },
    measureLineLabels,
  );

  superDraw(viz, callback);
  const horizontalMargin = viz._margin.left + viz._margin.right;
  const verticalMargin = viz._margin.top + viz._margin.bottom;
  // The local layout types (DomainValue domains, D3Scale scales, dynamically-
  // keyed rows) are broader than PlotPaintContext's; the emit reads each field
  // as the concrete type its producer guaranteed, so bridge at this boundary.
  const pCtx = {
    domains, shapeData, axisData, data, discreteKeys, stackData, stackKeys,
    x, y, x2, y2, xScale, yScale, xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale,
    xDomain, yDomain, x2Domain, y2Domain, xData, yData, x2Data, y2Data, x2Exists, y2Exists,
    showX, showY, defaultConfig, defaultX2Config, defaultY2Config, yC, xC,
    xTicks, yTicks, x2Ticks, y2Ticks, labelWidths, largestLabel, xRangeMax,
    xTest, yTest, x2Test, y2Test, yBounds, y2Bounds, yWidth, y2Width, xHeight, x2Height,
    xOffsetLeft, xOffsetRight, topOffset, xTestRange, x2TestRange, height, width,
    opp, barLabels, showLineLabels, stackGroup, horizontalMargin, verticalMargin,
  } as unknown as PlotPaintContext;
  return viz._paint!(pCtx);
}
