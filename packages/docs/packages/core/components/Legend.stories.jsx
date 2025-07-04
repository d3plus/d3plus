// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Legend} from "../../../args/core/components/Legend.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/Legend",
  component: Legend,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates an SVG scale based on an array of data. If *data* is specified, immediately draws based on the specified array and returns the current class instance. If *data* is not specified on instantiation, it can be passed/updated after instantiation using the [data](#shape.data) method.",
      },
    },
  }
};

const Template = (args) => <Legend config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {color: "red", id: "alpha"},
    {color: "orange", id: "beta"},
    {color: "green", id: "gamma"},
    {color: "blue", id: "delta"},
    {color: "purple", id: "epsilon"}
  ],
  label: d => d.id,
  shapeConfig: {
    fill: d => d.color,
    r: 10,
    height: 20,
    width: 20
  },
  shape: "Rect",
  title: "A Basic Legend",
  height: 100,
  width: 500,
};
BasicExample.parameters = {controls: {include: ["shape", "title"]}};