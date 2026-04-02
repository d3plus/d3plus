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

export const AreaPlot = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={AreaPlotClass} {...props} />
);
export const BarChart = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={BarChartClass} {...props} />
);
export const BoxWhisker = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={BoxWhiskerClass} {...props} />
);
export const BumpChart = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={BumpChartClass} {...props} />
);
export const Donut = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={DonutClass} {...props} />
);
export const Geomap = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={GeomapClass} {...props} />
);
export const LinePlot = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={LinePlotClass} {...props} />
);
export const Matrix = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={MatrixClass} {...props} />
);
export const Network = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={NetworkClass} {...props} />
);
export const Pack = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={PackClass} {...props} />
);
export const Pie = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={PieClass} {...props} />
);
export const Plot = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={PlotClass} {...props} />
);
export const Priestley = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={PriestleyClass} {...props} />
);
export const Radar = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={RadarClass} {...props} />
);
export const RadialMatrix = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={RadialMatrixClass} {...props} />
);
export const Rings = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={RingsClass} {...props} />
);
export const Sankey = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={SankeyClass} {...props} />
);
export const StackedArea = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={StackedAreaClass} {...props} />
);
export const Tree = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={TreeClass} {...props} />
);
export const Treemap = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={TreemapClass} {...props} />
);
export const Viz = (props: D3plusComponentProps) => (
  <Renderer className="chart" constructor={VizClass} {...props} />
);

export const Axis = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={AxisClass} {...props} />
);
export const AxisBottom = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={AxisBottomClass} {...props} />
);
export const AxisLeft = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={AxisLeftClass} {...props} />
);
export const AxisRight = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={AxisRightClass} {...props} />
);
export const AxisTop = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={AxisTopClass} {...props} />
);
export const ColorScale = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={ColorScaleClass} {...props} />
);
export const Legend = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={LegendClass} {...props} />
);
export const Message = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={MessageClass} {...props} />
);
export const TextBox = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={TextBoxClass} {...props} />
);
export const Timeline = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={TimelineClass} {...props} />
);
export const Tooltip = (props: D3plusComponentProps) => (
  <Renderer className="component" constructor={TooltipClass} {...props} />
);

export const Area = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={AreaClass} {...props} />
);
export const Bar = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={BarClass} {...props} />
);
export const Box = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={BoxClass} {...props} />
);
export const Circle = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={CircleClass} {...props} />
);
export const Image = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={ImageClass} {...props} />
);
export const Line = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={LineClass} {...props} />
);
export const Path = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={PathClass} {...props} />
);
export const Rect = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={RectClass} {...props} />
);
export const Shape = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={ShapeClass} {...props} />
);
export const Whisker = (props: D3plusComponentProps) => (
  <Renderer className="shape" constructor={WhiskerClass} {...props} />
);

export const BaseClass = (props: D3plusComponentProps) => (
  <Renderer className="util" constructor={BaseClassClass} {...props} />
);

export {default as D3plusContext} from "./src/D3plusContext.jsx";
export type {
  D3plusConfig,
  RendererProps,
  D3plusConstructor,
} from "./src/Renderer.jsx";
