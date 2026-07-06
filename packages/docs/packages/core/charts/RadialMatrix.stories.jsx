// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, RadialMatrix} from "../../../args/core/charts/RadialMatrix.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/RadialMatrix",
  component: RadialMatrix,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a radial layout of a rows/columns Matrix of any dataset. See [this example](https://d3plus.org/examples/d3plus-matrix/radial-matrix/) for help getting started using the Matrix class.",
      },
    },
  }
};

const Template = (args) => <RadialMatrix config={configify(args, argTypes)} />;
  
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
BasicExample.parameters = {controls: {include: ["column", "row"]}, docs: {description: {story: "The row × column grid wrapped into a polar layout: `row` values become concentric rings and `column` values become angular segments, each cell shaded by `colorScale`."}}};

export const WithColorScale = Template.bind({});
WithColorScale.args = {
  data: [
    {row: "Inner", column: "A", value: 10}, {row: "Inner", column: "B", value: 25},
    {row: "Inner", column: "C", value: 15}, {row: "Inner", column: "D", value: 20},
    {row: "Middle", column: "A", value: 18}, {row: "Middle", column: "B", value: 22},
    {row: "Middle", column: "C", value: 28}, {row: "Middle", column: "D", value: 12},
    {row: "Outer", column: "A", value: 30}, {row: "Outer", column: "B", value: 16},
    {row: "Outer", column: "C", value: 24}, {row: "Outer", column: "D", value: 8}
  ],
  groupBy: ["row", "column"],
  column: "column",
  row: "row",
  colorScale: "value",
  colorScaleConfig: {scale: "jenks"},
  colorScalePosition: "right"
};
WithColorScale.parameters = {controls: {include: ["colorScale", "colorScaleConfig"]}, docs: {description: {story: "Applies a `colorScaleConfig` `scale: \"jenks\"` natural-breaks classification, so cell colors group by data clusters rather than an even linear ramp."}}};
