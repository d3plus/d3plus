// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Rings} from "../../../args/core/charts/Rings.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Rings",
  component: Rings,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a ring visualization based on a defined set of nodes and edges. [Click here](http://d3plus.org/examples/d3plus-network/simple-rings/) for help getting started using the Rings class.",
      },
    },
  }
};

const Template = (args) => <Rings config={configify(args, argTypes)} />;
  
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

export const LargerNetwork = Template.bind({});
LargerNetwork.args = {
  center: "Hub",
  nodes: [
    {id: "Hub"}, {id: "A"}, {id: "B"}, {id: "C"}, {id: "D"}, {id: "E"},
    {id: "A1"}, {id: "A2"}, {id: "B1"}, {id: "C1"}, {id: "D1"}
  ],
  links: [
    {source: "Hub", target: "A"}, {source: "Hub", target: "B"}, {source: "Hub", target: "C"},
    {source: "Hub", target: "D"}, {source: "Hub", target: "E"},
    {source: "A", target: "A1"}, {source: "A", target: "A2"}, {source: "B", target: "B1"},
    {source: "C", target: "C1"}, {source: "D", target: "D1"}
  ]
};
LargerNetwork.parameters = {
  controls: {include: ["center"]},
  docs: {description: {story: "Nodes one hop from the center sit on the inner ring; their neighbors fan out to an outer ring."}}
};
