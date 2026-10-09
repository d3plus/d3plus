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

export const DirectionalArrows = Template.bind({});
DirectionalArrows.args = {
  nodes: [
    {id: "alpha", x: 1, y: 1.5},
    {id: "beta", x: 2, y: 1},
    {id: "gamma", x: 2, y: 2},
    {id: "delta", x: 3, y: 1.5}
  ],
  links: [
    {source: 0, target: 1},
    {source: 0, target: 2},
    {source: 1, target: 3},
    {source: 2, target: 3}
  ],
  arrows: "target"
};
DirectionalArrows.parameters = {controls: {include: ["arrows", "arrowSize"]}, docs: {description: {story: "`arrows` draws an arrowhead at the node boundary to show edge direction. Use `\"target\"`, `\"source\"`, `\"both\"`, or a per-link accessor for bi-directional edges. `arrowSize` overrides the automatic size."}}};

export const SizeLegend = Template.bind({});
SizeLegend.args = {
  height: 500,
  nodes: [
    {id: "Hub", value: 900}, {id: "Alpha", value: 420}, {id: "Beta", value: 260}, {id: "Gamma", value: 120},
    {id: "Delta", value: 610}, {id: "Epsilon", value: 60}, {id: "Zeta", value: 180}, {id: "Eta", value: 30},
    {id: "Theta", value: 340}, {id: "Iota", value: 90}, {id: "Kappa", value: 15}, {id: "Lambda", value: 220}
  ],
  links: [
    {source: "Hub", target: "Alpha"}, {source: "Hub", target: "Beta"}, {source: "Hub", target: "Gamma"},
    {source: "Hub", target: "Delta"}, {source: "Alpha", target: "Epsilon"}, {source: "Alpha", target: "Zeta"},
    {source: "Beta", target: "Eta"}, {source: "Delta", target: "Theta"}, {source: "Delta", target: "Iota"},
    {source: "Gamma", target: "Kappa"}, {source: "Theta", target: "Lambda"}, {source: "Zeta", target: "Lambda"}
  ],
  size: "value",
  sizeMin: 4
};
SizeLegend.parameters = {controls: {include: ["size", "sizeMin", "sizeMax", "sizeLegend"]}, docs: {description: {story: "Sizing nodes with `size` adds a size legend. When there's room it is drawn in the open space around the nodes (see `legendInset`), otherwise in the bottom-right corner. It is drawn with the chart's own radius scale, which Network fits to the space between nodes. Zoom in and the circles keep their size while the labels change to the values those circles now represent on screen."}}};

export const LegendInset = Template.bind({});
LegendInset.args = {
  height: 500,
  data: [
    {id: "Hub", region: "Core"}, {id: "Alpha", region: "North"}, {id: "Beta", region: "North"},
    {id: "Gamma", region: "East"}, {id: "Delta", region: "East"}, {id: "Epsilon", region: "South"},
    {id: "Zeta", region: "South"}, {id: "Eta", region: "West"}
  ],
  groupBy: ["region", "id"],
  nodes: [
    {id: "Hub", x: 0, y: 0}, {id: "Alpha", x: -1, y: -1.2}, {id: "Beta", x: 0.4, y: -1.4},
    {id: "Gamma", x: 1.3, y: -0.3}, {id: "Delta", x: 1.2, y: 0.6}, {id: "Epsilon", x: 0.2, y: 1.3},
    {id: "Zeta", x: -0.8, y: 1}, {id: "Eta", x: -1.4, y: 0.1}
  ],
  links: [
    {source: "Hub", target: "Alpha"}, {source: "Hub", target: "Beta"}, {source: "Hub", target: "Gamma"},
    {source: "Hub", target: "Delta"}, {source: "Hub", target: "Epsilon"}, {source: "Hub", target: "Zeta"},
    {source: "Hub", target: "Eta"}, {source: "Alpha", target: "Beta"}, {source: "Gamma", target: "Delta"}
  ]
};
LegendInset.parameters = {controls: {include: ["legendInset", "legendInsetConfig"]}, docs: {description: {story: "A network gathered in the middle of a wide chart leaves its corners empty, so the legend is drawn in one of them, over a translucent box, instead of taking a margin. Zoom in and the nodes slide under the box while the legend stays readable. Set `legendInset` to `false` to keep the legend in its margin."}}};
