import React from "react";
import {argTypes, StackedArea} from "../args/StackedArea.args";
import configify from "../helpers/configify";
import funcify from "../helpers/funcify";

import { formatAbbreviate } from 'd3plus-format';

export default {
  title: "Advanced/Stacked Area",
  component: StackedArea,
  argTypes
};

const Template = (args) => <StackedArea config={configify(args, argTypes)} />;

export const HorizontalChart = Template.bind({});
HorizontalChart.args = {
  data: [
    {id: "alpha", x:  7, y: 4},
    {id: "alpha", x: 25, y: 5},
    {id: "alpha", x: 13, y: 6},
    {id: "beta",  x: 17, y: 4},
    {id: "beta",  x:  8, y: 5},
    {id: "beta",  x: 13, y: 6}
  ],
  groupBy: "id",
  discrete: "y"
};

export const SharePercentages = Template.bind({});
SharePercentages.args = {
  data: [
    {id: "alpha", x: 4, y:  7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta",  x: 4, y: 17},
    {id: "beta",  x: 5, y:  8},
    {id: "beta",  x: 6, y: 13},
    {id: "gamma", x: 4, y: 10},
    {id: "gamma", x: 5, y: 18},
    {id: "gamma", x: 6, y:  5}
  ],
  groupBy: "id",
  stackOffset: "expand",
  yConfig: {
    tickFormat: funcify(
      d => `${formatAbbreviate(d * 100)}%`,
      "d => `${formatAbbreviate(d * 100)}%`")
  }
};

export const SortingAreas = Template.bind({});
SortingAreas.args = {
  data: [
    {id: "alpha", x: 4, y:  7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta",  x: 4, y: 17},
    {id: "beta",  x: 5, y:  8},
    {id: "beta",  x: 6, y: 13},
    {id: "gamma", x: 4, y: 10},
    {id: "gamma", x: 5, y: 18},
    {id: "gamma", x: 6, y:  5},
    {id: "delta", x: 4, y:  8},
    {id: "delta", x: 5, y: 12},
    {id: "delta", x: 6, y:  7}
  ],
  groupBy: "id",
  stackOrder: ["alpha", "gamma", "delta", "beta"]
}
