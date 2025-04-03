import React from "react";
import {argTypes, Radar as Viz} from "../../../args/core/charts/Radar.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Radar Plot",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", axis: "Central",    number: 170.992},
    {id: "alpha", axis: "Kirkdale",   number: 40},
    {id: "alpha", axis: "Kensington", number: 240},
    {id: "alpha", axis: "Everton",    number: 90},
    {id: "alpha", axis: "Picton",     number: 160},
    {id: "alpha", axis: "Riverside",  number: 30},
    {id: "beta",  axis: "Central",    number: 320},
    {id: "beta",  axis: "Kirkdale",   number: 97.5},
    {id: "beta",  axis: "Kensington", number: 40},
    {id: "beta",  axis: "Everton",    number: 110},
    {id: "beta",  axis: "Picton",     number: 40},
    {id: "beta",  axis: "Riverside",  number: 110}
  ],
  groupBy: "id",
  metric: "axis",
  value: "number"
};
BasicExample.parameters = {controls: {include: ["metric", "value"]}};

export const CustomizingLabels = Template.bind({});
CustomizingLabels.args = {
  data: [
    {Geography: "Midwest Region",   sport: "Soccer",   total: 20},
    {Geography: "West Region",      sport: "Soccer",   total: 10},
    {Geography: "Southwest Region", sport: "Soccer",   total: 20},
    {Geography: "Southeast Region", sport: "Soccer",   total: 20},
    {Geography: "Northeast Region", sport: "Soccer",   total: 20},
    {Geography: "Midwest Region",   sport: "Baseball", total: 15},
    {Geography: "West Region",      sport: "Baseball", total: 21},
    {Geography: "Southwest Region", sport: "Baseball", total: 10},
    {Geography: "Southeast Region", sport: "Baseball", total: 15},
    {Geography: "Northeast Region", sport: "Baseball", total: 12}
  ],
  groupBy: "sport",
  metric: "Geography",
  value: "total",
  axisConfig: {
    shapeConfig: {
      labelConfig: {
        fontColor: "green"
      }
    }
  }
};
CustomizingLabels.parameters = {controls: {include: ["axisConfig"]}};

export const ChangingColors = Template.bind({});
ChangingColors.args = {
  data: [
    {Geography: "Midwest",   sport: "Soccer",   total: 20},
    {Geography: "West",      sport: "Soccer",   total: 10},
    {Geography: "Southwest", sport: "Soccer",   total: 20},
    {Geography: "Southeast", sport: "Soccer",   total: 20},
    {Geography: "Northeast", sport: "Soccer",   total: 20},
    {Geography: "Midwest",   sport: "Baseball", total: 15},
    {Geography: "West",      sport: "Baseball", total: 21},
    {Geography: "Southwest", sport: "Baseball", total: 10},
    {Geography: "Southeast", sport: "Baseball", total: 15},
    {Geography: "Northeast", sport: "Baseball", total: 12}
  ],
  groupBy: "sport",
  metric: "Geography",
  value: "total",
  shapeConfig: {
    fill: funcify(
      d => d.sport === "Soccer" ? "green" : "orange",
      `d => d.sport === "Soccer" ? "green" : "orange"`
    )
  }
};
ChangingColors.parameters = {controls: {include: ["shapeConfig"]}};
