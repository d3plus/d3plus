import React from "react";
import {argTypes, BumpChart as Viz} from "../args/BumpChart.args";
import configify from "../helpers/configify";
import funcify from "../helpers/funcify";

export default {
  title: "Charts/Bump Chart",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

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
    d => d["label"],
    "d => d['label']"
  ),
  x: "year",
  y: "rank",
  y2: "rank"
};
