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

export const SortedWithLegend = Template.bind({});
SortedWithLegend.args = {
  data: [
    {Topping: "Powdered sugar", Sold: 40},
    {Topping: "Cinnamon", Sold: 20},
    {Topping: "Sprinkles", Sold: 25},
    {Topping: "Fruits", Sold: 30},
    {Topping: "Cream", Sold: 15}
  ],
  groupBy: "Topping",
  legendPosition: "right",
  sort: funcify((a, b) => b.Sold - a.Sold, "(a, b) => b.Sold - a.Sold"),
  value: "Sold"
};
SortedWithLegend.parameters = {controls: {include: ["sort", "legendPosition"]}, docs: {description: {story: "`sort` orders the arcs clockwise from the top, here largest first, and `legendPosition: \"right\"` moves the legend beside the ring so the labels and the arcs read in the same order."}}};

export const DrillDown = Template.bind({});
DrillDown.args = {
  data: [
    {category: "Fruit", id: "Apple", value: 30}, {category: "Fruit", id: "Banana", value: 22},
    {category: "Fruit", id: "Cherry", value: 18},
    {category: "Vegetable", id: "Carrot", value: 20}, {category: "Vegetable", id: "Pea", value: 12},
    {category: "Vegetable", id: "Kale", value: 8}
  ],
  depth: 0,
  groupBy: ["category", "id"],
  value: "value"
};
DrillDown.parameters = {controls: {include: ["depth", "groupBy"]}, docs: {description: {story: "A two-level `groupBy` with `depth: 0` shows one arc per category; clicking an arc drills into its children and a back button returns. The ring behaves exactly like the Pie it extends."}}};
