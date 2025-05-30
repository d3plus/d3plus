// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Pie} from "../../../args/core/charts/Pie.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Pie",
  component: Pie,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Uses the [d3 pie layout](https://github.com/d3/d3-shape#pies) to creates SVG arcs based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Pie config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {Type: "Apple pie", Percentage: 30},
    {Type: "Butter pie", Percentage: 20},
    {Type: "Cherry pie", Percentage: 25},
    {Type: "Lemon pie", Percentage: 15},
    {Type: "Sugar pie", Percentage: 10}
  ],
  groupBy: "Type",
  value: "Percentage"
};
BasicExample.parameters = {controls: {include: ["value"]}};
