import React from "react";
import {argTypes, Sankey as Viz} from "../args/Sankey.args";
import configify from "../helpers/configify";

export default {
  title: "Charts/Sankey",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  links: [
    {source: "alpha", target: "beta"},
    {source: "alpha", target: "gamma"},
    {source: "epsilon", target: "zeta"},
    {source: "epsilon", target: "theta"},
    {source: "theta", target: "alpha"}
  ],
  nodes: [
    {id: "alpha"},
    {id: "beta"},
    {id: "gamma"},
    {id: "epsilon"},
    {id: "zeta"},
    {id: "theta"}
  ]
};
