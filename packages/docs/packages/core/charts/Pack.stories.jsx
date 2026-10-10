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
        component: "Uses the d3 pack layout to create a Circle Packing chart based on an array of data.",
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
BasicExample.parameters = {controls: {include: ["sum"]}, docs: {description: {story: "`sum` sizes each leaf circle by its `value`, and the two-level `groupBy` nests those leaves inside one bubble per parent group."}}};

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

const packData = [
  {group: "A", id: "a1", value: 10}, {group: "A", id: "a2", value: 20}, {group: "A", id: "a3", value: 15},
  {group: "B", id: "b1", value: 8}, {group: "B", id: "b2", value: 18}, {group: "B", id: "b3", value: 12},
  {group: "C", id: "c1", value: 22}, {group: "C", id: "c2", value: 9}
];

export const LayoutPadding = Template.bind({});
LayoutPadding.args = {
  data: packData,
  groupBy: ["group", "id"],
  layoutPadding: 12,
  sum: "value"
};
LayoutPadding.parameters = {controls: {include: ["layoutPadding"]}, docs: {description: {story: "`layoutPadding` is the gap d3's pack layout keeps between touching circles, so a larger value spreads the leaves apart and leaves room for their labels at the cost of some area."}}};

export const PackOpacity = Template.bind({});
PackOpacity.args = {
  data: packData,
  groupBy: ["group", "id"],
  packOpacity: 0.15,
  sum: "value"
};
PackOpacity.parameters = {controls: {include: ["packOpacity"]}, docs: {description: {story: "`packOpacity` sets how solid the enclosing parent circles are drawn. Lowering it from the default keeps the grouping visible while letting the leaf circles stand out."}}};
