export {
  AreaPlot,
  BarChart,
  Beeswarm,
  BoxWhisker,
  BumpChart,
  Chord,
  Donut,
  Gauge,
  Geomap,
  Histogram,
  LinePlot,
  Matrix,
  Network,
  Pack,
  Pie,
  Plot,
  Priestley,
  Pyramid,
  Radar,
  RadialMatrix,
  Rings,
  Sankey,
  StackedArea,
  Tree,
  Treemap,
  Viz,
} from "./src/charts/index.js";

export {
  Axis,
  AxisBottom,
  AxisLeft,
  AxisRight,
  AxisTop,
  ColorScale,
  Legend,
  Message,
  SizeLegend,
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
  configWarnings,
  constant,
  RESET,
} from "./src/utils/index.js";

export type {
  D3plusConfig,
  AxisConfig,
  ColorDefaultsConfig,
  ColorScaleConfig,
  LegendConfig,
  SizeLegendConfig,
  TextBoxConfig,
  TimelineConfig,
  TooltipConfig,
  TrendLineConfig,
} from "./src/utils/index.js";
export type {LinkConfig, LinkOption} from "./src/charts/viz/linkGroup.js";
export type {GaugeBand} from "./src/charts/Gauge/gaugeGeometry.js";
export type {GaugeIndicator} from "./src/charts/Gauge/dialLayout.js";
export type {FacetConfig, FacetSort, FacetValue} from "./src/charts/facet/facetConfig.js";

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

export type {
  D3Selection,
  Margin,
  Padding,
} from "./src/charts/viz/vizTypes.js";

// The v4 scene-graph pipeline (layout stages, ChartDefinitions, feature
// modules, the pure pre-draw/draw functions, fluent generation, axis
// measurement, …) is not part of the stable public API. It lives in a
// dedicated entry so it can keep evolving without semver friction:
//
//   import {runVizPipeline, treemapDef} from "@d3plus/core/internal";
//
// See ./internal.ts.
