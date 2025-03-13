import React from "react";

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
  Treemap as TreemapClass
} from "@d3plus/core";

import Viz from "./src/Viz.jsx";

export const AreaPlot = (props) => <Viz instance={new AreaPlotClass()} {...props} />;
export const BarChart = (props) => <Viz instance={new BarChartClass()} {...props} />;
export const BoxWhisker = (props) => <Viz instance={new BoxWhiskerClass()} {...props} />;
export const BumpChart = (props) => <Viz instance={new BumpChartClass()} {...props} />;
export const Donut = (props) => <Viz instance={new DonutClass()} {...props} />;
export const Geomap = (props) => <Viz instance={new GeomapClass()} {...props} />;
export const LinePlot = (props) => <Viz instance={new LinePlotClass()} {...props} />;
export const Matrix = (props) => <Viz instance={new MatrixClass()} {...props} />;
export const Network = (props) => <Viz instance={new NetworkClass()} {...props} />;
export const Pack = (props) => <Viz instance={new PackClass()} {...props} />;
export const Pie = (props) => <Viz instance={new PieClass()} {...props} />;
export const Plot = (props) => <Viz instance={new PlotClass()} {...props} />;
export const Priestley = (props) => <Viz instance={new PriestleyClass()} {...props} />;
export const Radar = (props) => <Viz instance={new RadarClass()} {...props} />;
export const RadialMatrix = (props) => <Viz instance={new RadialMatrixClass()} {...props} />;
export const Rings = (props) => <Viz instance={new RingsClass()} {...props} />;
export const Sankey = (props) => <Viz instance={new SankeyClass()} {...props} />;
export const StackedArea = (props) => <Viz instance={new StackedAreaClass()} {...props} />;
export const Tree = (props) => <Viz instance={new TreeClass()} {...props} />;
export const Treemap = (props) => <Viz instance={new TreemapClass()} {...props} />;

export {default as D3plusContext} from "./src/D3plusContext.jsx";
