import React from "react";
import {argTypes, Radar} from "../args/Radar.args";
import configify from "../helpers/configify";
import funcify from "../helpers/funcify";

export default {
  title: "Advanced/Radar Plot",
  component: Radar,
  argTypes
};

const Template = (args) => <Radar config={configify(args, argTypes)} />;

export const AddingCustomLabels = Template.bind({});
AddingCustomLabels.args = {
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
