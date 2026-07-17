"use client";

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

import Renderer from "./src/Renderer.jsx";
import type {RendererProps} from "./src/Renderer.jsx";

/** Props for d3plus React wrapper components (omits the internal constructor prop). */
export type D3plusComponentProps = Omit<RendererProps, "constructor">;

/** React component for rendering a d3plus AreaPlot visualization. */
export const AreaPlot = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={AreaPlotClass} {...props} />
);
/** React component for rendering a d3plus BarChart visualization. */
export const BarChart = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={BarChartClass} {...props} />
);
/** React component for rendering a d3plus BoxWhisker visualization. */
export const BoxWhisker = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={BoxWhiskerClass} {...props} />
);
/** React component for rendering a d3plus BumpChart visualization. */
export const BumpChart = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={BumpChartClass} {...props} />
);
/** React component for rendering a d3plus Donut visualization. */
export const Donut = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={DonutClass} {...props} />
);
/** React component for rendering a d3plus Geomap visualization. */
export const Geomap = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={GeomapClass} {...props} />
);
/** React component for rendering a d3plus LinePlot visualization. */
export const LinePlot = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={LinePlotClass} {...props} />
);
/** React component for rendering a d3plus Matrix visualization. */
export const Matrix = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={MatrixClass} {...props} />
);
/** React component for rendering a d3plus Network visualization. */
export const Network = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={NetworkClass} {...props} />
);
/** React component for rendering a d3plus Pack visualization. */
export const Pack = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={PackClass} {...props} />
);
/** React component for rendering a d3plus Pie visualization. */
export const Pie = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={PieClass} {...props} />
);
/** React component for rendering a d3plus Plot visualization. */
export const Plot = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={PlotClass} {...props} />
);
/** React component for rendering a d3plus Priestley visualization. */
export const Priestley = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={PriestleyClass} {...props} />
);
/** React component for rendering a d3plus Radar visualization. */
export const Radar = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={RadarClass} {...props} />
);
/** React component for rendering a d3plus RadialMatrix visualization. */
export const RadialMatrix = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={RadialMatrixClass} {...props} />
);
/** React component for rendering a d3plus Rings visualization. */
export const Rings = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={RingsClass} {...props} />
);
/** React component for rendering a d3plus Sankey visualization. */
export const Sankey = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={SankeyClass} {...props} />
);
/** React component for rendering a d3plus StackedArea visualization. */
export const StackedArea = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={StackedAreaClass} {...props} />
);
/** React component for rendering a d3plus Tree visualization. */
export const Tree = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={TreeClass} {...props} />
);
/** React component for rendering a d3plus Treemap visualization. */
export const Treemap = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={TreemapClass} {...props} />
);
/** React component for rendering a base d3plus Viz instance. */
export const Viz = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={VizClass} {...props} />
);

/** React component for rendering a d3plus Axis. */
export const Axis = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={AxisClass} {...props} />
);
/** React component for rendering a d3plus AxisBottom. */
export const AxisBottom = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={AxisBottomClass} {...props} />
);
/** React component for rendering a d3plus AxisLeft. */
export const AxisLeft = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={AxisLeftClass} {...props} />
);
/** React component for rendering a d3plus AxisRight. */
export const AxisRight = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={AxisRightClass} {...props} />
);
/** React component for rendering a d3plus AxisTop. */
export const AxisTop = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={AxisTopClass} {...props} />
);
/** React component for rendering a d3plus ColorScale. */
export const ColorScale = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={ColorScaleClass} {...props} />
);
/** React component for rendering a d3plus Legend. */
export const Legend = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={LegendClass} {...props} />
);
/** React component for rendering a d3plus Message. */
export const Message = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={MessageClass} {...props} />
);
/** React component for rendering a d3plus TextBox. */
export const TextBox = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={TextBoxClass} {...props} />
);
/** React component for rendering a d3plus Timeline. */
export const Timeline = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={TimelineClass} {...props} />
);
/** React component for rendering a d3plus Tooltip. */
export const Tooltip = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={TooltipClass} {...props} />
);

/** React component for rendering a d3plus Area shape. */
export const Area = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={AreaClass} {...props} />
);
/** React component for rendering a d3plus Bar shape. */
export const Bar = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={BarClass} {...props} />
);
/** React component for rendering a d3plus Box shape. */
export const Box = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={BoxClass} {...props} />
);
/** React component for rendering a d3plus Circle shape. */
export const Circle = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={CircleClass} {...props} />
);
/** React component for rendering a d3plus Image shape. */
export const Image = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={ImageClass} {...props} />
);
/** React component for rendering a d3plus Line shape. */
export const Line = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={LineClass} {...props} />
);
/** React component for rendering a d3plus Path shape. */
export const Path = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={PathClass} {...props} />
);
/** React component for rendering a d3plus Rect shape. */
export const Rect = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={RectClass} {...props} />
);
/** React component for rendering a d3plus Shape shape. */
export const Shape = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={ShapeClass} {...props} />
);
/** React component for rendering a d3plus Whisker shape. */
export const Whisker = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={WhiskerClass} {...props} />
);

/** React component for rendering a d3plus BaseClass instance. */
export const BaseClass = (props: D3plusComponentProps) => (
  <Renderer className="util" constructor={BaseClassClass} {...props} />
);

export {default as D3plusContext} from "./src/D3plusContext.jsx";
export type {
  D3plusConfig,
  RendererProps,
  D3plusConstructor,
} from "./src/Renderer.jsx";
