import React from "react";
import {argTypes, Treemap as Viz} from "../args/Treemap.args";
import configify from "../helpers/configify";

export default {
  title: "Charts/Treemap",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", value: 29},
    {id: "beta", value: 10},
    {id: "gamma", value: 2},
    {id: "delta", value: 29},
    {id: "eta", value: 25}
  ],
  groupBy: "id",
  sum: "value"
};
