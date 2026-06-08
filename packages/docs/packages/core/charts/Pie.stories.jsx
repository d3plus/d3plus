// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Pie} from "../../../args/core/charts/Pie.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Pie",
  component: Pie,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Uses the [d3 pie layout](https://github.com/d3/d3-shape#pies) to creates SVG arcs based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Pie config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

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

export const PaddedSlices = Template.bind({});
PaddedSlices.args = {
  data: [
    {id: "Apple", value: 30}, {id: "Banana", value: 22}, {id: "Cherry", value: 18},
    {id: "Date", value: 15}, {id: "Elderberry", value: 10}
  ],
  groupBy: "id",
  value: "value",
  padPixel: 4
};
PaddedSlices.parameters = {controls: {include: ["padPixel", "padAngle"]}};

export const DrillDownOnClick = Template.bind({});
DrillDownOnClick.args = {
  data: [
    {category: "Fruit", id: "Apple", value: 30}, {category: "Fruit", id: "Banana", value: 22},
    {category: "Fruit", id: "Cherry", value: 18},
    {category: "Vegetable", id: "Carrot", value: 20}, {category: "Vegetable", id: "Pea", value: 12},
    {category: "Vegetable", id: "Kale", value: 8}
  ],
  groupBy: ["category", "id"],
  value: "value"
};
DrillDownOnClick.parameters = {
  controls: {include: ["groupBy"]},
  docs: {description: {story: "A hierarchical `groupBy` ([\"category\", \"id\"]) renders the top level first; click a slice to drill into its children. A back button appears automatically to return."}}
};
