// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, AreaPlot} from "../../../args/core/charts/AreaPlot.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/AreaPlot",
  component: AreaPlot,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates an area plot based on an array of data.",
      },
    },
  }
};

const Template = (args) => <AreaPlot config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = {
  args: {
    data: [
      {id: "alpha", x: 1, y: 7},
      {id: "alpha", x: 2, y: 2},
      {id: "alpha", x: 3, y: 13},
      {id: "alpha", x: 4, y: 4},
      {id: "alpha", x: 5, y: 22},
      {id: "alpha", x: 6, y: 13}
    ],
    groupBy: "id",
    x: "x",
    y: "y"
  },
  parameters: {
    nextjs: {
      router: {
        pathname: "/core/charts/AreaPlot"
      }
    }
  },
  render: Template
}

export const ChangingAreaOpacity = Template.bind({});
ChangingAreaOpacity.args = {
  data: [
    {id: "alpha", x: 1, y: 7},
    {id: "alpha", x: 2, y: 2},
    {id: "alpha", x: 3, y: 13},
    {id: "alpha", x: 4, y: 4},
    {id: "alpha", x: 5, y: 22},
    {id: "beta", x: 1, y: 10},
    {id: "beta", x: 2, y: 6},
    {id: "beta", x: 3, y: 3},
    {id: "beta", x: 4, y: 12},
    {id: "beta", x: 5, y: 11}
  ],
  groupBy: "id",
  shapeConfig: {
    fill: "red",
    Area: {
      fillOpacity: 0.5
    }
  }
};
ChangingAreaOpacity.parameters = {controls: {include: ["shapeConfig"]}};