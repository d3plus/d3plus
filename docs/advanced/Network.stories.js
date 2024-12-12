import React from "react";
import {argTypes, Network} from "../args/Network.args";
import configify from "../helpers/configify";
import funcify from "../helpers/funcify";

export default {
  title: "Advanced/Network",
  component: Network,
  argTypes
};

const Template = (args) => <Network config={configify(args, argTypes)} />;

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
}
