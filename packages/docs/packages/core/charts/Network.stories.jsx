import React from "react";
import {argTypes, Network as Viz} from "../../../args/core/charts/Network.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Network",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

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
BasicExample.parameters = {controls: {include: ["nodes", "links"]}};

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
ForceDirectedLayout.parameters = {controls: {include: ["nodes", "links"]}};

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
DataDrivenLinkSize.parameters = {controls: {include: ["linkSize"]}};
