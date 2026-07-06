// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Network} from "../../../args/core/charts/Network.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Network",
  component: Network,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a network visualization based on a defined set of nodes and edges. [Click here](http://d3plus.org/examples/d3plus-network/getting-started/) for help getting started using the Network class.",
      },
    },
  }
};

const Template = (args) => <Network config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  groupBy: "id",
  nodes: [
    {id: "alpha", x: 1, y: 1},
    {id: "beta", x: 2, y: 1},
    {id: "gamma", x: 1, y: 2},
    {id: "epsilon", x: 3, y: 2},
    {id: "zeta", x: 2.5, y: 1.5},
    {id: "theta", x: 2, y: 2}
  ],
  links: [
    {source: 0, target: 1},
    {source: 0, target: 2},
    {source: 3, target: 4},
    {source: 3, target: 5},
    {source: 5, target: 0}
  ]
};
BasicExample.parameters = {controls: {include: ["nodes", "links"]}, docs: {description: {story: "Each node supplies its own `x`/`y` coordinates, so d3plus places nodes exactly rather than solving a layout for them."}}};

export const ForceDirectedLayout = Template.bind({});
ForceDirectedLayout.args = {
  nodes: [
    {id: "alpha"},
    {id: "beta"},
    {id: "gamma"},
    {id: "epsilon"},
    {id: "zeta"},
    {id: "theta"}
  ],
  links: [
    {source: 0, target: 1, weight: 10},
    {source: 0, target: 2, weight: 10},
    {source: 3, target: 4, weight: 10},
    {source: 3, target: 5, weight: 5},
    {source: 5, target: 0, weight: 20},
    {source: 2, target: 1, weight: 12},
    {source: 4, target: 5, weight: 12}
  ],
  linkSize: funcify(
    d => d.weight,
    "d => d.weight"
  )
};
ForceDirectedLayout.parameters = {controls: {include: ["nodes", "links"]}, docs: {description: {story: "Omitting `x`/`y` from the nodes lets a force simulation position them automatically—reach for this when connections matter but there's no meaningful spatial layout."}}};

export const DataDrivenLinkSize = Template.bind({});
DataDrivenLinkSize.args = {
  nodes: [
    {id: "alpha"},
    {id: "beta"},
    {id: "gamma"},
    {id: "epsilon"},
    {id: "zeta"},
    {id: "theta"}
  ],
  links: [
    {source: 0, target: 1, weight: 10},
    {source: 0, target: 2, weight: 10},
    {source: 3, target: 4, weight: 10},
    {source: 3, target: 5, weight: 5},
    {source: 5, target: 0, weight: 20},
    {source: 2, target: 1, weight: 12},
    {source: 4, target: 5, weight: 12}
  ],
  linkSize: funcify(
    d => d.weight,
    "d => d.weight"
  )
};
DataDrivenLinkSize.parameters = {controls: {include: ["linkSize"]}, docs: {description: {story: "`linkSize` takes an accessor returning each link's `weight`, which d3plus runs through a linear scale to set stroke thickness—heavier links render thicker."}}};
