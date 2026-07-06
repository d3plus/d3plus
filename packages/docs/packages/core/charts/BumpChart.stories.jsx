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
BasicExample.parameters = {docs: {description: {story: "Each `groupBy` series traces its `rank` (`y`) across the `discrete` `x` years, and lines swap vertical position wherever ranks change."}}};

export const ExpandedRanking = Template.bind({});
ExpandedRanking.args = {
  groupBy: "fruit",
  discrete: "x",
  x: "year",
  y: "rank",
  data: [
    {fruit: "apple", year: 2020, rank: 1}, {fruit: "apple", year: 2021, rank: 2}, {fruit: "apple", year: 2022, rank: 1}, {fruit: "apple", year: 2023, rank: 3},
    {fruit: "banana", year: 2020, rank: 2}, {fruit: "banana", year: 2021, rank: 4}, {fruit: "banana", year: 2022, rank: 3}, {fruit: "banana", year: 2023, rank: 1},
    {fruit: "cherry", year: 2020, rank: 4}, {fruit: "cherry", year: 2021, rank: 3}, {fruit: "cherry", year: 2022, rank: 2}, {fruit: "cherry", year: 2023, rank: 4},
    {fruit: "date", year: 2020, rank: 3}, {fruit: "date", year: 2021, rank: 1}, {fruit: "date", year: 2022, rank: 4}, {fruit: "date", year: 2023, rank: 2}
  ]
};
ExpandedRanking.parameters = {
  controls: {include: ["x", "y"]},
  docs: {description: {story: "Four competitors tracked across four years; lines cross as ranks change."}}
};
