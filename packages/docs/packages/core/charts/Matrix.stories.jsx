// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Matrix} from "../../../args/core/charts/Matrix.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Matrix",
  component: Matrix,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a simple rows/columns Matrix view of any dataset. See [this example](https://d3plus.org/examples/d3plus-matrix/getting-started/) for help getting started using the Matrix class.",
      },
    },
  }
};

const Template = (args) => <Matrix config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: "https://api.oec.world/tesseract/data.jsonrecords?cube=trade_i_baci_a_17&drilldowns=Year,Exporter+Continent,Importer+Continent&measures=Trade+Value&Year=2018",
  groupBy: ["Exporter Continent", "Importer Continent"],
  column: "Importer Continent",
  row: "Exporter Continent",
  colorScale: "Trade Value"
};
BasicExample.parameters = {controls: {include: ["column", "row"]}, docs: {description: {story: "Draws a cell at every `row` × `column` intersection (exporter vs. importer continent); `groupBy` supplies both dimensions and `colorScale` shades each cell by Trade Value."}}};

export const WithColorScale = Template.bind({});
WithColorScale.args = {
  data: [
    {row: "R1", column: "C1", value: 10}, {row: "R1", column: "C2", value: 25}, {row: "R1", column: "C3", value: 15},
    {row: "R2", column: "C1", value: 30}, {row: "R2", column: "C2", value: 20}, {row: "R2", column: "C3", value: 5},
    {row: "R3", column: "C1", value: 18}, {row: "R3", column: "C2", value: 12}, {row: "R3", column: "C3", value: 28}
  ],
  groupBy: ["row", "column"],
  column: "column",
  row: "row",
  colorScale: "value",
  colorScaleConfig: {scale: "jenks"},
  colorScalePosition: "right"
};
WithColorScale.parameters = {controls: {include: ["colorScale", "colorScaleConfig", "colorScalePosition"]}, docs: {description: {story: "Shades cells with a `colorScaleConfig` `scale: \"jenks\"` (natural-breaks) classification and moves the legend to the right via `colorScalePosition`."}}};
