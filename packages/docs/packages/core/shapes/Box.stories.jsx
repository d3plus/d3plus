// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Box} from "../../../args/core/shapes/Box.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Shapes/Box",
  component: Box,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates SVG box based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Box config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {x: "A", y: 40}, {x: "A", y: 55}, {x: "A", y: 70}, {x: "A", y: 85}, {x: "A", y: 110}, {x: "A", y: 140},
    {x: "B", y: 90}, {x: "B", y: 120}, {x: "B", y: 150}, {x: "B", y: 175}, {x: "B", y: 210}, {x: "B", y: 240}
  ],
  x: funcify(d => d.x === "A" ? 130 : 270, 'd => d.x === "A" ? 130 : 270'), y: "y"
};
BasicExample.parameters = {controls: {include: ["orient"]}, docs: {description: {story: "Points are grouped by their shared `x` category (\"A\" and \"B\"), which the `x` accessor maps to a horizontal pixel position, and each group's raw `y` values are reduced to a box-and-whisker summary of quartiles and whiskers; `orient` switches between vertical and horizontal boxes."}}};
