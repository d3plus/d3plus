// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Donut} from "../../../args/core/charts/Donut.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Donut",
  component: Donut,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Extends the Pie visualization to create a donut chart.",
      },
    },
  }
};

const Template = (args) => <Donut config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

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
BasicExample.parameters = {controls: {include: ["value"]}, docs: {description: {story: "Each arc's angle is proportional to its `value` (Sold); the default `innerRadius` leaves the center hole that sets a donut apart from a pie."}}};
  

export const CustomHoleSize = Template.bind({});
CustomHoleSize.args = {
  data: [
    {Topping: "Powdered sugar", Sold: 40},
    {Topping: "Cinnamon", Sold: 20},
    {Topping: "Sprinkles", Sold: 25},
    {Topping: "Fruits", Sold: 30},
    {Topping: "Cream", Sold: 15}
  ],
  groupBy: "Topping",
  value: "Sold",
  innerRadius: 120
};
CustomHoleSize.parameters = {controls: {include: ["innerRadius"]}, docs: {description: {story: "Raise `innerRadius` (here 120px) to enlarge the center hole, thinning the ring into a narrow band."}}};
