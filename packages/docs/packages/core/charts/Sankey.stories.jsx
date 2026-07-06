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
BasicExample.parameters = {controls: {include: ["center", "links"]}, docs: {description: {story: "Supplying only `links` lets the layout infer every node from the `source`/`target` ids and route the flows between them."}}};

export const DataDrivenLinkWidth = Template.bind({});
DataDrivenLinkWidth.args = {
  links: [
    {source: "Source A", target: "Hub 1", value: 30},
    {source: "Source A", target: "Hub 2", value: 20},
    {source: "Source B", target: "Hub 1", value: 25},
    {source: "Source B", target: "Hub 2", value: 15},
    {source: "Hub 1", target: "Out X", value: 35},
    {source: "Hub 1", target: "Out Y", value: 20},
    {source: "Hub 2", target: "Out X", value: 15},
    {source: "Hub 2", target: "Out Y", value: 20}
  ],
  value: "value"
};
DataDrivenLinkWidth.parameters = {
  controls: {include: ["value"]},
  docs: {description: {story: "Each link's `value` sets its thickness, so flows are weighted by magnitude."}}
};

export const NodeSpacing = Template.bind({});
NodeSpacing.args = {
  links: [
    {source: "alpha", target: "beta"}, {source: "alpha", target: "gamma"},
    {source: "beta", target: "delta"}, {source: "beta", target: "epsilon"},
    {source: "gamma", target: "delta"}
  ],
  nodeWidth: 30,
  nodePadding: 40
};
NodeSpacing.parameters = {controls: {include: ["nodeWidth", "nodePadding"]}, docs: {description: {story: "`nodeWidth` sets how thick each node bar is drawn and `nodePadding` the vertical gap between nodes in a column—raise `nodePadding` to spread crowded columns apart."}}};
