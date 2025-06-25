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
