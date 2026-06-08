// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Pack} from "../../../args/core/charts/Pack.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Pack",
  component: Pack,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Uses the [d3 pack layout](https://github.com/d3/d3-hierarchy#pack) to creates Circle Packing chart based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Pack config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {parent: "Group 1", id: "alpha", value: 29},
    {parent: "Group 1", id: "beta", value: 10},
    {parent: "Group 1", id: "gamma", value: 2},
    {parent: "Group 2", id: "delta", value: 29},
    {parent: "Group 2", id: "eta", value: 25}
  ],
  groupBy: ["parent", "id"],
  sum: funcify(d => d.value, "d => d.value")
};
BasicExample.parameters = {controls: {include: ["sum"]}};

export const NestedGroups = Template.bind({});
NestedGroups.args = {
  data: [
    {group: "A", id: "a1", value: 10}, {group: "A", id: "a2", value: 20}, {group: "A", id: "a3", value: 15},
    {group: "B", id: "b1", value: 8}, {group: "B", id: "b2", value: 18}, {group: "B", id: "b3", value: 12},
    {group: "C", id: "c1", value: 22}, {group: "C", id: "c2", value: 9}
  ],
  groupBy: ["group", "id"],
  sum: "value"
};
NestedGroups.parameters = {
  controls: {include: ["groupBy"]},
  docs: {description: {story: "An array `groupBy` packs leaf circles inside a circle for each parent group."}}
};
