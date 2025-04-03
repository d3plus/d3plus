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

export const AreaPlot = (props) => <Viz vizClass={AreaPlotClass} {...props} />;
export const BarChart = (props) => <Viz vizClass={BarChartClass} {...props} />;
export const BoxWhisker = (props) => <Viz vizClass={BoxWhiskerClass} {...props} />;
export const BumpChart = (props) => <Viz vizClass={BumpChartClass} {...props} />;
export const Donut = (props) => <Viz vizClass={DonutClass} {...props} />;
export const Geomap = (props) => <Viz vizClass={GeomapClass} {...props} />;
export const LinePlot = (props) => <Viz vizClass={LinePlotClass} {...props} />;
export const Matrix = (props) => <Viz vizClass={MatrixClass} {...props} />;
export const Network = (props) => <Viz vizClass={NetworkClass} {...props} />;
export const Pack = (props) => <Viz vizClass={PackClass} {...props} />;
export const Pie = (props) => <Viz vizClass={PieClass} {...props} />;
export const Plot = (props) => <Viz vizClass={PlotClass} {...props} />;
export const Priestley = (props) => <Viz vizClass={PriestleyClass} {...props} />;
export const Radar = (props) => <Viz vizClass={RadarClass} {...props} />;
export const RadialMatrix = (props) => <Viz vizClass={RadialMatrixClass} {...props} />;
export const Rings = (props) => <Viz vizClass={RingsClass} {...props} />;
export const Sankey = (props) => <Viz vizClass={SankeyClass} {...props} />;
export const StackedArea = (props) => <Viz vizClass={StackedAreaClass} {...props} />;
export const Tree = (props) => <Viz vizClass={TreeClass} {...props} />;
export const Treemap = (props) => <Viz vizClass={TreemapClass} {...props} />;

export {default as D3plusContext} from "./src/D3plusContext.jsx";
