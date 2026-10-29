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
        component:
          "Creates a Sankey visualization based on a defined set of nodes and links.",
      },
    },
  },
};

const Template = args => <Sankey config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  links: [
    {source: "alpha", target: "beta"},
    {source: "alpha", target: "gamma"},
    {source: "beta", target: "delta"},
    {source: "beta", target: "epsilon"},
    {source: "zeta", target: "gamma"},
    {source: "theta", target: "gamma"},
    {source: "eta", target: "gamma"},
  ],
};
BasicExample.parameters = {
  controls: {include: ["links"]},
  docs: {
    description: {
      story:
        "Supplying only `links` lets the layout infer every node from the `source`/`target` ids and route the flows between them.",
    },
  },
};

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
    {source: "Hub 2", target: "Out Y", value: 20},
  ],
  value: "value",
};
DataDrivenLinkWidth.parameters = {
  controls: {include: ["value"]},
  docs: {
    description: {
      story:
        "Each link's `value` sets its thickness, so flows are weighted by magnitude.",
    },
  },
};

export const NodeSpacing = Template.bind({});
NodeSpacing.args = {
  links: [
    {source: "alpha", target: "beta"},
    {source: "alpha", target: "gamma"},
    {source: "beta", target: "delta"},
    {source: "beta", target: "epsilon"},
    {source: "gamma", target: "delta"},
  ],
  nodeWidth: 30,
  nodePadding: 40,
};
NodeSpacing.parameters = {
  controls: {include: ["nodeWidth", "nodePadding"]},
  docs: {
    description: {
      story:
        "`nodeWidth` sets how thick each node bar is drawn and `nodePadding` the vertical gap between nodes in a column—raise `nodePadding` to spread crowded columns apart.",
    },
  },
};

export const DirectionalArrows = Template.bind({});
DirectionalArrows.args = {
  value: "value",
  links: [
    {source: "Source A", target: "Hub", value: 30},
    {source: "Source B", target: "Hub", value: 20},
    {source: "Hub", target: "Out X", value: 30},
    {source: "Hub", target: "Out Y", value: 20},
  ],
  arrows: "target",
};
DirectionalArrows.parameters = {
  controls: {include: ["arrows", "arrowSize"]},
  docs: {
    description: {
      story:
        '`arrows` adds an arrowhead where each flow enters its target node, reinforcing the left-to-right direction. Use `"both"` for bi-directional flows or a per-link accessor.',
    },
  },
};

export const NodeLabels = Template.bind({});
NodeLabels.args = {
  links: [
    {source: "Coal", target: "Electricity", value: 30},
    {source: "Natural Gas", target: "Electricity", value: 25},
    {source: "Natural Gas", target: "Industrial", value: 14},
    {source: "Nuclear", target: "Electricity", value: 18},
    {source: "Geothermal", target: "Electricity", value: 0.4},
    {source: "Petroleum", target: "Transportation", value: 35},
    {source: "Electricity", target: "Residential", value: 20},
    {source: "Electricity", target: "Commercial", value: 18},
    {source: "Electricity", target: "Industrial", value: 12},
    {source: "Residential", target: "Energy Services", value: 14},
    {source: "Residential", target: "Rejected Energy", value: 6},
    {source: "Commercial", target: "Energy Services", value: 12},
    {source: "Commercial", target: "Rejected Energy", value: 6},
    {source: "Industrial", target: "Energy Services", value: 18},
    {source: "Industrial", target: "Rejected Energy", value: 8},
    {source: "Transportation", target: "Energy Services", value: 8},
    {source: "Transportation", target: "Rejected Energy", value: 27},
  ],
  value: "value",
  shapeConfig: {Rect: {labelConfig: {fontWeight: 600}}},
};
NodeLabels.parameters = {
  controls: {include: ["shapeConfig"]},
  docs: {
    description: {
      story:
        "Each node is labeled beside it, over its outgoing flows, or over its incoming flows in the last column. A node too thin for a line of text, like Geothermal here, goes unlabeled. `label` sets the text, `shapeConfig.Rect.labelConfig` styles it, and `shapeConfig: {Rect: {label: false}}` turns the labels off.",
    },
  },
};
