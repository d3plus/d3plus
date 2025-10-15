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

export const AreaPlot = (props) => <Renderer className="chart" constructor={AreaPlotClass} {...props} />;
export const BarChart = (props) => <Renderer className="chart" constructor={BarChartClass} {...props} />;
export const BoxWhisker = (props) => <Renderer className="chart" constructor={BoxWhiskerClass} {...props} />;
export const BumpChart = (props) => <Renderer className="chart" constructor={BumpChartClass} {...props} />;
export const Donut = (props) => <Renderer className="chart" constructor={DonutClass} {...props} />;
export const Geomap = (props) => <Renderer className="chart" constructor={GeomapClass} {...props} />;
export const LinePlot = (props) => <Renderer className="chart" constructor={LinePlotClass} {...props} />;
export const Matrix = (props) => <Renderer className="chart" constructor={MatrixClass} {...props} />;
export const Network = (props) => <Renderer className="chart" constructor={NetworkClass} {...props} />;
export const Pack = (props) => <Renderer className="chart" constructor={PackClass} {...props} />;
export const Pie = (props) => <Renderer className="chart" constructor={PieClass} {...props} />;
export const Plot = (props) => <Renderer className="chart" constructor={PlotClass} {...props} />;
export const Priestley = (props) => <Renderer className="chart" constructor={PriestleyClass} {...props} />;
export const Radar = (props) => <Renderer className="chart" constructor={RadarClass} {...props} />;
export const RadialMatrix = (props) => <Renderer className="chart" constructor={RadialMatrixClass} {...props} />;
export const Rings = (props) => <Renderer className="chart" constructor={RingsClass} {...props} />;
export const Sankey = (props) => <Renderer className="chart" constructor={SankeyClass} {...props} />;
export const StackedArea = (props) => <Renderer className="chart" constructor={StackedAreaClass} {...props} />;
export const Tree = (props) => <Renderer className="chart" constructor={TreeClass} {...props} />;
export const Treemap = (props) => <Renderer className="chart" constructor={TreemapClass} {...props} />;
export const Viz = (props) => <Renderer className="chart" constructor={VizClass} {...props} />;

export const Axis = (props) => <Renderer className="component" constructor={AxisClass} {...props} />;
export const AxisBottom = (props) => <Renderer className="component" constructor={AxisBottomClass} {...props} />;
export const AxisLeft = (props) => <Renderer className="component" constructor={AxisLeftClass} {...props} />;
export const AxisRight = (props) => <Renderer className="component" constructor={AxisRightClass} {...props} />;
export const AxisTop = (props) => <Renderer className="component" constructor={AxisTopClass} {...props} />;
export const ColorScale = (props) => <Renderer className="component" constructor={ColorScaleClass} {...props} />;
export const Legend = (props) => <Renderer className="component" constructor={LegendClass} {...props} />;
export const Message = (props) => <Renderer className="component" constructor={MessageClass} {...props} />;
export const TextBox = (props) => <Renderer className="component" constructor={TextBoxClass} {...props} />;
export const Timeline = (props) => <Renderer className="component" constructor={TimelineClass} {...props} />;
export const Tooltip = (props) => <Renderer className="component" constructor={TooltipClass} {...props} />;

export const Area = (props) => <Renderer className="shape" constructor={AreaClass} {...props} />;
export const Bar = (props) => <Renderer className="shape" constructor={BarClass} {...props} />;
export const Box = (props) => <Renderer className="shape" constructor={BoxClass} {...props} />;
export const Circle = (props) => <Renderer className="shape" constructor={CircleClass} {...props} />;
export const Image = (props) => <Renderer className="shape" constructor={ImageClass} {...props} />;
export const Line = (props) => <Renderer className="shape" constructor={LineClass} {...props} />;
export const Path = (props) => <Renderer className="shape" constructor={PathClass} {...props} />;
export const Rect = (props) => <Renderer className="shape" constructor={RectClass} {...props} />;
export const Shape = (props) => <Renderer className="shape" constructor={ShapeClass} {...props} />;
export const Whisker = (props) => <Renderer className="shape" constructor={WhiskerClass} {...props} />;

export const BaseClass = (props) => <Renderer className="util" constructor={BaseClassClass} {...props} />;

export {default as D3plusContext} from "./src/D3plusContext.jsx";
