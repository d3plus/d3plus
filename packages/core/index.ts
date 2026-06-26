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
