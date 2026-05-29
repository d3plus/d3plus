export {
  AreaPlot,
  BarChart,
  BoxWhisker,
  BumpChart,
  Donut,
  Geomap,
  LinePlot,
  Matrix,
  Network,
  Pack,
  Pie,
  Plot,
  Priestley,
  Radar,
  RadialMatrix,
  Rings,
  Sankey,
  StackedArea,
  Tree,
  Treemap,
  Viz,
} from "./src/charts/index.js";

// v4 factory functions — `barChart().data(...).render()` ergonomics. Thin
// aliases over the class constructors today (RFC §3.3 / strangler step 4).
// Classes remain working byte-for-byte; deprecated for v5 removal.
export {
  areaPlot,
  barChart,
  boxWhisker,
  bumpChart,
  donut,
  geomap,
  linePlot,
  matrix,
  network,
  pack,
  pie,
  plot,
  priestley,
  radar,
  radialMatrix,
  rings,
  sankey,
  stackedArea,
  tree,
  treemap,
  viz,
} from "./src/charts/factories.js";

export {
  Axis,
  AxisBottom,
  AxisLeft,
  AxisRight,
  AxisTop,
  ColorScale,
  Legend,
  Message,
  TextBox,
  Timeline,
  Tooltip,
} from "./src/components/index.js";

export {
  Area,
  Bar,
  Box,
  Circle,
  Image,
  Line,
  Path,
  Rect,
  Shape,
  Whisker,
} from "./src/shapes/index.js";

export {
  accessor,
  BaseClass,
  configPrep,
  constant,
  RESET,
} from "./src/utils/index.js";

export type {
  D3plusConfig,
  AxisConfig,
  TooltipConfig,
} from "./src/utils/index.js";

// E3/E4 internals — exposed for parity tests + advanced users wanting to build
// custom charts on the ChartDefinition contract. Not yet a stable public API.
import {
  applyGeomapLayout,
  applyMatrixLayout,
  applyNetworkLayout,
  applyPackLayout,
  applyPieLayout,
  applyPriestleyLayout,
  applyRadarLayout,
  applyRadialMatrixLayout,
  applyRingsLayout,
  applySankeyLayout,
  applyTreeLayout,
  applyTreemapLayout,
  treemapDef,
} from "./src/charts/ChartDefinition.js";
import {createFluent, installFluent} from "./src/fluent.js";
import {runStages, vizPreDrawStages} from "./src/charts/stages.js";
import {runVizPipeline} from "./src/charts/runVizPipeline.js";
import {plotEmit, plotMeasure, plotPaint} from "./src/charts/plotPaint.js";
import {vizDraw} from "./src/charts/vizDraw.js";
import {vizDrawPure} from "./src/charts/vizDrawPure.js";
import {vizPreDraw} from "./src/charts/vizPreDraw.js";
import {vizPreDrawPure, vizPostThresholdCtx} from "./src/charts/vizPreDrawPure.js";
import {resolveSpec} from "./src/charts/resolveSpec.js";
export type {ResolvedSpec} from "./src/charts/resolveSpec.js";
export type {VizContext} from "./src/charts/vizContext.js";
export type {PlotMeasureResult, PlotPaintContext} from "./src/charts/plotPaint.js";
export type {VizPreDrawResult} from "./src/charts/vizPreDrawPure.js";
export type {ShapeLike, VizLike} from "./src/charts/emitHelpers.js";
export type {
  D3Selection,
  Margin,
  Padding,
  Viz,
  VizRenderer,
} from "./src/charts/vizTypes.js";
export type {
  AnyShapeConfig,
  AreaConfig,
  BarConfig,
  BaseShapeConfig,
  BoxConfig,
  CircleConfig,
  ConstOrAccessor,
  ImageConfig,
  LineConfig,
  PathConfig,
  RectConfig,
  StringOrAccessor,
  WhiskerConfig,
} from "./src/shapes/shapeConfig.js";
import {
  backFeature,
  colorScaleFeature,
  legendFeature,
  runLayout,
  subtitleFeature,
  timelineFeature,
  titleFeature,
  totalFeature,
} from "./src/charts/features.js";
import {computeAxisLayout, measureAxis} from "./src/components/Axis.js";
export type {AxisLayout, AxisLayoutResult} from "./src/components/Axis.js";

export {
  // Chart-specific layout stages (all 12 chart subclasses).
  applyGeomapLayout,
  applyMatrixLayout,
  applyNetworkLayout,
  applyPackLayout,
  applyPieLayout,
  applyPriestleyLayout,
  applyRadarLayout,
  applyRadialMatrixLayout,
  applyRingsLayout,
  applySankeyLayout,
  applyTreeLayout,
  applyTreemapLayout,
  // Core pipeline + factory infrastructure.
  treemapDef,
  createFluent,
  installFluent,
  computeAxisLayout,
  measureAxis,
  plotEmit,
  plotMeasure,
  plotPaint,
  resolveSpec,
  runVizPipeline,
  vizDraw,
  vizDrawPure,
  vizPostThresholdCtx,
  vizPreDraw,
  vizPreDrawPure,
};

// The pipeline runners and feature modules are exported directly (above
// + below) — no separate `__test_internals__` indirection. Tests and
// advanced consumers reach for the same surface; making them go through
// a sentinel namespace was redundant noise.
export {
  runStages,
  runLayout,
  vizPreDrawStages,
  backFeature,
  colorScaleFeature,
  legendFeature,
  subtitleFeature,
  timelineFeature,
  titleFeature,
  totalFeature,
};
