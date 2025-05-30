// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Sankey} from "../../../args/core/charts/Sankey.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Sankey",
  component: Sankey,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a sankey visualization based on a defined set of nodes and links. [Click here](http://d3plus.org/examples/d3plus-network/sankey-diagram/) for help getting started using the Sankey class.",
      },
    },
  }
};

const Template = (args) => <Sankey config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  center: "alpha",
  links: [
    {source: "alpha", target: "beta"},
    {source: "alpha", target: "gamma"},
    {source: "beta", target: "delta"},
    {source: "beta", target: "epsilon"},
    {source: "zeta", target: "gamma"},
    {source: "theta", target: "gamma"},
    {source: "eta", target: "gamma"}
  ]
};
BasicExample.parameters = {controls: {include: ["center", "links"]}};
