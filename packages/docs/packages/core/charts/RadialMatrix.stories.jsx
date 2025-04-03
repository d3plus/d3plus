import React from "react";
import {argTypes, RadialMatrix as Viz} from "../../../args/core/charts/RadialMatrix.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Radial Matrix",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: "https://api.oec.world/tesseract/data.jsonrecords?cube=trade_i_baci_a_17&drilldowns=Year,Exporter+Continent,Importer+Continent&measures=Trade+Value&Year=2018",
  groupBy: ["Exporter Continent", "Importer Continent"],
  column: "Importer Continent",
  row: "Exporter Continent",
  colorScale: "Trade Value"
};
BasicExample.parameters = {controls: {include: ["column", "row"]}};
