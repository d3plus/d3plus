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
        component: "Creates a ring visualization based on a defined set of nodes and edges.",
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
BasicExample.parameters = {controls: {include: ["center", "links"]}, docs: {description: {story: "`center` names the focal node by id; the rest of the nodes are inferred from the `links`, with the center's direct connections forming the inner ring and the others radiating outward."}}};

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

export const DirectionalArrows = Template.bind({});
DirectionalArrows.args = {
  center: "alpha",
  arrows: "target",
  links: [
    {source: "alpha", target: "beta"},
    {source: "alpha", target: "gamma"},
    {source: "beta", target: "delta"},
    {source: "gamma", target: "epsilon"}
  ]
};
DirectionalArrows.parameters = {controls: {include: ["arrows", "arrowSize"]}, docs: {description: {story: "`arrows` draws an arrowhead at each edge's endpoint — following the bezier's tangent for the curved outer-ring links and insetting to the node for the straight center links. Use `\"both\"` or a per-link accessor for bi-directional edges."}}};

export const SizedNodes = Template.bind({});
SizedNodes.args = {
  height: 500,
  center: "alpha",
  data: [
    {id: "alpha", value: 50}, {id: "beta", value: 100}, {id: "gamma", value: 10}, {id: "delta", value: 400},
    {id: "epsilon", value: 25}, {id: "zeta", value: 800}, {id: "eta", value: 60}, {id: "theta", value: 150},
    {id: "iota", value: 5}, {id: "kappa", value: 300}
  ],
  links: [
    {source: "alpha", target: "beta"}, {source: "alpha", target: "gamma"}, {source: "alpha", target: "delta"},
    {source: "beta", target: "epsilon"}, {source: "beta", target: "zeta"}, {source: "gamma", target: "eta"},
    {source: "delta", target: "theta"}, {source: "delta", target: "iota"}, {source: "gamma", target: "kappa"}
  ],
  size: "value"
};
SizedNodes.parameters = {controls: {include: ["size", "sizeMin", "sizeMax", "sizeScale", "sizeLegend"]}, docs: {description: {story: "`size` sizes every node, including the center, with one scale (square-root by default; see `sizeScale`), kept between `sizeMin` and `sizeMax`. A size legend in the corner shows what each radius means."}}};
