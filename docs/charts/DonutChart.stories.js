import React from "react";
import {argTypes, Donut as Viz} from "../args/Donut.args";
import configify from "../helpers/configify";

export default {
  title: "Charts/Donut Chart",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {Topping: "Powdered sugar", Sold: 40},
    {Topping: "Cinnamon", Sold: 20},
    {Topping: "Sprinkles", Sold: 25},
    {Topping: "Fruits", Sold: 30},
    {Topping: "Cream", Sold: 15}
  ],
  groupBy: "Topping",
  value: "Sold"
};
BasicExample.parameters = {controls: {include: ["value"]}};
