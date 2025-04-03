import React from "react";
import {argTypes, StackedArea as Viz} from "../../../args/core/charts/StackedArea.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";
import {formatAbbreviate} from "@d3plus/format";

export default {
  title: "Core/Charts/Stacked Area",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", x: 4, y:  7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta",  x: 4, y: 17},
    {id: "beta",  x: 5, y:  8},
    {id: "beta",  x: 6, y: 13}
  ],
  groupBy: "id",
  x: "x",
  y: "y"
};
BasicExample.parameters = {controls: {include: ["x", "y"]}};

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
  discrete: "y",
  groupBy: "id",
  x: "x",
  y: "y"
};
HorizontalChart.parameters = {controls: {include: ["discrete"]}};

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
  x: "x",
  y: "y",
  yConfig: {
    tickFormat: funcify(
      d => `${formatAbbreviate(d * 100)}%`,
      "d => `${formatAbbreviate(d * 100)}%`")
  }
};
SharePercentages.parameters = {controls: {include: ["stackOffset", "yConfig"]}};

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
  stackOrder: ["alpha", "gamma", "delta", "beta"],
  x: "x",
  y: "y"
};
SortingAreas.parameters = {controls: {include: ["stackOrder"]}};
