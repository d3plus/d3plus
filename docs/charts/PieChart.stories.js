import React from "react";
import {argTypes, Pie as Viz} from "../args/Pie.args";
import configify from "../helpers/configify";

export default {
  title: "Charts/Pie Chart",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {Type: "Apple pie", Percentage: 30},
    {Type: "Butter pie", Percentage: 20},
    {Type: "Cherry pie", Percentage: 25},
    {Type: "Lemon pie", Percentage: 15},
    {Type: "Sugar pie", Percentage: 10}
  ],
  groupBy: "Type",
  value: "Percentage"
};
BasicExample.parameters = {controls: {include: ["value"]}};
