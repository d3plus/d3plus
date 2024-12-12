import React from "react";
import {argTypes, Plot as Viz} from "../args/Plot.args";
import configify from "../helpers/configify";

export default {
  title: "Charts/Scatter Plot",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", x: 4, y: 7},
    {id: "beta", x: 5, y: 2},
    {id: "gamma", x: 6, y: 13},
    {id: "delta", x: 2, y: 11},
    {id: "epsilon", x: 5, y: 5},
    {id: "zeta", x: 3, y: 4},
    {id: "eta", x: 2.5, y: 6},
    {id: "theta", x: 5.5, y: 9}
  ],
  groupBy: "id"
};
