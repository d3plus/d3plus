// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Radar} from "../../../args/core/charts/Radar.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Radar",
  component: Radar,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a radar visualization based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Radar config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", axis: "Central",    number: 170.992},
    {id: "alpha", axis: "Kirkdale",   number: 40},
    {id: "alpha", axis: "Kensington", number: 240},
    {id: "alpha", axis: "Everton",    number: 90},
    {id: "alpha", axis: "Picton",     number: 160},
    {id: "alpha", axis: "Riverside",  number: 30},
    {id: "beta",  axis: "Central",    number: 320},
    {id: "beta",  axis: "Kirkdale",   number: 97.5},
    {id: "beta",  axis: "Kensington", number: 40},
    {id: "beta",  axis: "Everton",    number: 110},
    {id: "beta",  axis: "Picton",     number: 40},
    {id: "beta",  axis: "Riverside",  number: 110}
  ],
  groupBy: "id",
  metric: "axis",
  value: "number"
};
BasicExample.parameters = {controls: {include: ["metric", "value"]}};

export const MultipleSeries = Template.bind({});
MultipleSeries.args = {
  data: [
    {group: "A", metric: "Strength", value: 8}, {group: "A", metric: "Speed", value: 6},
    {group: "A", metric: "Stamina", value: 9}, {group: "A", metric: "Agility", value: 7},
    {group: "A", metric: "Intellect", value: 5},
    {group: "B", metric: "Strength", value: 5}, {group: "B", metric: "Speed", value: 9},
    {group: "B", metric: "Stamina", value: 6}, {group: "B", metric: "Agility", value: 8},
    {group: "B", metric: "Intellect", value: 9}
  ],
  groupBy: "group",
  metric: "metric",
  value: "value"
};
MultipleSeries.parameters = {
  controls: {include: ["metric", "value"]},
  docs: {description: {story: "Two series overlaid on the same axes, one filled polygon per group."}}
};
