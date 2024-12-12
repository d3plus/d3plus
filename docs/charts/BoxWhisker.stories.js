import React from "react";
import {argTypes, BoxWhisker as Viz} from "../args/BoxWhisker.args";
import configify from "../helpers/configify";

export default {
  title: "Charts/Box Whisker",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", value: 300},
    {id: "alpha", value: 20},
    {id: "alpha", value: 180},
    {id: "alpha", value: 40},
    {id: "alpha", value: 170},
    {id: "alpha", value: 125},
    {id: "alpha", value: 74},
    {id: "alpha", value: 80},
    {id: "beta", value: 180},
    {id: "beta", value: 30},
    {id: "beta", value: 120},
    {id: "beta", value: 50},
    {id: "beta", value: 140},
    {id: "beta", value: 115},
    {id: "beta", value: 14},
    {id: "beta", value: 30}
  ],
  groupBy: ["id", "value"],
  legend: false,
  x: "id",
  y: "value"
};
