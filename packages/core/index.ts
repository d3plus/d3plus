export {
  AreaPlot,
  BarChart,
  Beeswarm,
  BoxWhisker,
  BubbleChart,
  Bullet,
  BumpChart,
  Calendar,
  Candlestick,
  Chord,
  Donut,
  Dumbbell,
  FanChart,
  Funnel,
  Gantt,
  Gauge,
  Geomap,
  Hexbin,
  Histogram,
  Icicle,
  LinePlot,
  Lollipop,
  Marimekko,
  Matrix,
  Network,
  Pack,
  ParallelCoordinates,
  Pie,
  Plot,
  PolarArea,
  Priestley,
  Pyramid,
  Radar,
  RadialBar,
  RadialMatrix,
  Ridgeline,
  Rings,
  Sankey,
  Scatter,
  SlopeChart,
  StackedArea,
  Streamgraph,
  Sunburst,
  Tree,
  Treemap,
  Violin,
  Viz,
  Waffle,
  Waterfall,
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
  ConfidenceBandSetting,
  ConfidenceBound,
  KeyboardNavConfig,
  LegendConfig,
  PointLabelConfig,
  SaveControlConfig,
  SaveFormat,
  SizeLegendConfig,
  TextBoxConfig,
  TimelineConfig,
  TooltipConfig,
  TrendLineConfig,
} from "./src/utils/index.js";
export type {LinkConfig, LinkOption} from "./src/charts/viz/linkGroup.js";
export type {
  Annotation,
  AnnotationRef,
  AnnotationTextStyle,
  AnnotationValue,
  CalloutAnnotation,
  ReferenceBandConfig,
  ReferenceLineConfig,
  ReferenceStyle,
} from "./src/charts/features/annotationTypes.js";
export type {
  RangeBreakRule,
  RangeBreakTime,
} from "./src/components/Axis/rangeBreaks.js";
export type {
  ThemeColorScaleTokens,
  ThemeConfig,
  ThemeOverlayTokens,
  ThemeSetting,
  ThemeTableTokens,
  ThemeTokens,
  ThemeTooltipTokens,
} from "./src/utils/theme.js";
export type {
  ColorScaleType,
  ColorScaleTypeSetting,
} from "./src/components/ColorScale/colorScaleType.js";
export type {ColorScaleHoverMarkConfig} from "./src/components/ColorScale/colorScaleHoverMark.js";
export type {BulletBandInput} from "./src/charts/Bullet/bulletGeometry.js";
export type {
  ConnectGaps,
  ConnectGapsConfig,
} from "./src/charts/Plot/connectGaps.js";
export type {
  FunnelConversion,
  FunnelConversionOption,
} from "./src/charts/Funnel/funnelLabels.js";
export type {FunnelCurve} from "./src/charts/Funnel/funnelGeometry.js";
export type {GaugeBand} from "./src/charts/Gauge/gaugeGeometry.js";
export type {GaugeIndicator} from "./src/charts/Gauge/dialLayout.js";
export type {
  BrushRange,
  BrushSelection,
} from "./src/charts/ParallelCoordinates/brushFilter.js";
export type {DimensionOptions} from "./src/charts/ParallelCoordinates/dimensions.js";
export type {
  FacetConfig,
  FacetSort,
  FacetValue,
} from "./src/charts/facet/facetConfig.js";

export type {
  AnyShapeConfig,
  AreaConfig,
  BarConfig,
  BaseShapeConfig,
  BoxConfig,
  CircleConfig,
  ConstOrAccessor,
  CssColor,
  ImageConfig,
  LineConfig,
  Orient,
  PathConfig,
  RectConfig,
  SideOrient,
  StringOrAccessor,
  WhiskerConfig,
} from "./src/shapes/shapeConfig.js";

export type {D3Selection, Margin, Padding} from "./src/charts/viz/vizTypes.js";

// The v4 scene-graph pipeline (layout stages, ChartDefinitions, feature
// modules, the pure pre-draw/draw functions, fluent generation, axis
// measurement, …) is not part of the stable public API. It lives in a
// dedicated entry so it can keep evolving without semver friction:
//
//   import {runVizPipeline, treemapDef} from "@d3plus/core/internal";
//
// See ./internal.ts.
