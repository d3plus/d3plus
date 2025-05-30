// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, BumpChart} from "../../../args/core/charts/BumpChart.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/BumpChart",
  component: BumpChart,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a bump chart based on an array of data.",
      },
    },
  }
};

const Template = (args) => <BumpChart config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {fruit: "apple", label: "Apple", year: 1, rank: 1},
    {fruit: "apple", label: "Apple", year: 2, rank: 2},
    {fruit: "apple", label: "Apple", year: 3, rank: 1},
    {fruit: "banana", label: "Banana", year: 1, rank: 2},
    {fruit: "banana", label: "Banana", year: 2, rank: 4},
    {fruit: "banana", label: "Banana", year: 3, rank: 3},
    {fruit: "cherry", label: "Cherry", year: 1, rank: 4},
    {fruit: "cherry", label: "Cherry", year: 2, rank: 3},
    {fruit: "cherry", label: "Cherry", year: 3, rank: 2},
    {fruit: "orange", label: "Orange", year: 1, rank: 3},
    {fruit: "orange", label: "Orange", year: 2, rank: 1},
    {fruit: "orange", label: "Orange", year: 3, rank: 4}
  ],
  groupBy: "fruit",
  discrete: "x",
  label: funcify(
    d => d.label,
    "d => d.label"
  ),
  x: "year",
  y: "rank"
};
