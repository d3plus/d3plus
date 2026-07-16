import {
  AreaPlot as AreaPlotClass,
  BarChart as BarChartClass,
  BoxWhisker as BoxWhiskerClass,
  BumpChart as BumpChartClass,
  Donut as DonutClass,
  Geomap as GeomapClass,
  LinePlot as LinePlotClass,
  Matrix as MatrixClass,
  Network as NetworkClass,
  Pack as PackClass,
  Pie as PieClass,
  Plot as PlotClass,
  Priestley as PriestleyClass,
  Radar as RadarClass,
  RadialMatrix as RadialMatrixClass,
  Rings as RingsClass,
  Sankey as SankeyClass,
  StackedArea as StackedAreaClass,
  Tree as TreeClass,
  Treemap as TreemapClass,
  Viz as VizClass,
  Axis as AxisClass,
  AxisBottom as AxisBottomClass,
  AxisLeft as AxisLeftClass,
  AxisRight as AxisRightClass,
  AxisTop as AxisTopClass,
  ColorScale as ColorScaleClass,
  Legend as LegendClass,
  Message as MessageClass,
  TextBox as TextBoxClass,
  Timeline as TimelineClass,
  Tooltip as TooltipClass,
  Area as AreaClass,
  Bar as BarClass,
  Box as BoxClass,
  Circle as CircleClass,
  Image as ImageClass,
  Line as LineClass,
  Path as PathClass,
  Rect as RectClass,
  Shape as ShapeClass,
  Whisker as WhiskerClass,
  BaseClass as BaseClassClass,
} from "@d3plus/core";

import {createD3plusComponent} from "./src/createComponent.js";

export {createD3plusComponent, D3plusConfigKey} from "./src/createComponent.js";

/** Vue component for rendering a d3plus AreaPlot visualization. */
export const AreaPlot = createD3plusComponent(AreaPlotClass, "chart");
/** Vue component for rendering a d3plus BarChart visualization. */
export const BarChart = createD3plusComponent(BarChartClass, "chart");
/** Vue component for rendering a d3plus BoxWhisker visualization. */
export const BoxWhisker = createD3plusComponent(BoxWhiskerClass, "chart");
/** Vue component for rendering a d3plus BumpChart visualization. */
export const BumpChart = createD3plusComponent(BumpChartClass, "chart");
/** Vue component for rendering a d3plus Donut visualization. */
export const Donut = createD3plusComponent(DonutClass, "chart");
/** Vue component for rendering a d3plus Geomap visualization. */
export const Geomap = createD3plusComponent(GeomapClass, "chart");
/** Vue component for rendering a d3plus LinePlot visualization. */
export const LinePlot = createD3plusComponent(LinePlotClass, "chart");
/** Vue component for rendering a d3plus Matrix visualization. */
export const Matrix = createD3plusComponent(MatrixClass, "chart");
/** Vue component for rendering a d3plus Network visualization. */
export const Network = createD3plusComponent(NetworkClass, "chart");
/** Vue component for rendering a d3plus Pack visualization. */
export const Pack = createD3plusComponent(PackClass, "chart");
/** Vue component for rendering a d3plus Pie visualization. */
export const Pie = createD3plusComponent(PieClass, "chart");
/** Vue component for rendering a d3plus Plot visualization. */
export const Plot = createD3plusComponent(PlotClass, "chart");
/** Vue component for rendering a d3plus Priestley visualization. */
export const Priestley = createD3plusComponent(PriestleyClass, "chart");
/** Vue component for rendering a d3plus Radar visualization. */
export const Radar = createD3plusComponent(RadarClass, "chart");
/** Vue component for rendering a d3plus RadialMatrix visualization. */
export const RadialMatrix = createD3plusComponent(RadialMatrixClass, "chart");
/** Vue component for rendering a d3plus Rings visualization. */
export const Rings = createD3plusComponent(RingsClass, "chart");
/** Vue component for rendering a d3plus Sankey visualization. */
export const Sankey = createD3plusComponent(SankeyClass, "chart");
/** Vue component for rendering a d3plus StackedArea visualization. */
export const StackedArea = createD3plusComponent(StackedAreaClass, "chart");
/** Vue component for rendering a d3plus Tree visualization. */
export const Tree = createD3plusComponent(TreeClass, "chart");
/** Vue component for rendering a d3plus Treemap visualization. */
export const Treemap = createD3plusComponent(TreemapClass, "chart");
/** Vue component for rendering a base d3plus Viz instance. */
export const Viz = createD3plusComponent(VizClass, "chart");

/** Vue component for rendering a d3plus Axis. */
export const Axis = createD3plusComponent(AxisClass, "component");
/** Vue component for rendering a d3plus AxisBottom. */
export const AxisBottom = createD3plusComponent(AxisBottomClass, "component");
/** Vue component for rendering a d3plus AxisLeft. */
export const AxisLeft = createD3plusComponent(AxisLeftClass, "component");
/** Vue component for rendering a d3plus AxisRight. */
export const AxisRight = createD3plusComponent(AxisRightClass, "component");
/** Vue component for rendering a d3plus AxisTop. */
export const AxisTop = createD3plusComponent(AxisTopClass, "component");
/** Vue component for rendering a d3plus ColorScale. */
export const ColorScale = createD3plusComponent(ColorScaleClass, "component");
/** Vue component for rendering a d3plus Legend. */
export const Legend = createD3plusComponent(LegendClass, "component");
/** Vue component for rendering a d3plus Message. */
export const Message = createD3plusComponent(MessageClass, "component");
/** Vue component for rendering a d3plus TextBox. */
export const TextBox = createD3plusComponent(TextBoxClass, "component");
/** Vue component for rendering a d3plus Timeline. */
export const Timeline = createD3plusComponent(TimelineClass, "component");
/** Vue component for rendering a d3plus Tooltip. */
export const Tooltip = createD3plusComponent(TooltipClass, "component");

/** Vue component for rendering a d3plus Area shape. */
export const Area = createD3plusComponent(AreaClass, "shape");
/** Vue component for rendering a d3plus Bar shape. */
export const Bar = createD3plusComponent(BarClass, "shape");
/** Vue component for rendering a d3plus Box shape. */
export const Box = createD3plusComponent(BoxClass, "shape");
/** Vue component for rendering a d3plus Circle shape. */
export const Circle = createD3plusComponent(CircleClass, "shape");
/** Vue component for rendering a d3plus Image shape. */
export const Image = createD3plusComponent(ImageClass, "shape");
/** Vue component for rendering a d3plus Line shape. */
export const Line = createD3plusComponent(LineClass, "shape");
/** Vue component for rendering a d3plus Path shape. */
export const Path = createD3plusComponent(PathClass, "shape");
/** Vue component for rendering a d3plus Rect shape. */
export const Rect = createD3plusComponent(RectClass, "shape");
/** Vue component for rendering a d3plus Shape shape. */
export const Shape = createD3plusComponent(ShapeClass, "shape");
/** Vue component for rendering a d3plus Whisker shape. */
export const Whisker = createD3plusComponent(WhiskerClass, "shape");

/** Vue component for rendering a base d3plus BaseClass instance. */
export const BaseClass = createD3plusComponent(BaseClassClass, "util");
