import React from "react";
import {argTypes, Network as Viz} from "../args/Network.args";
import configify from "../helpers/configify";
import funcify from "../helpers/funcify";

export default {
  title: "Charts/Network",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
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
