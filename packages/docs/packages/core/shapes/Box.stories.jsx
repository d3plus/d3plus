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
    {x: 180, y: 30}, {x: 180, y: 45}, {x: 180, y: 60}, {x: 180, y: 75}, {x: 180, y: 95}, {x: 180, y: 120},
    {x: 420, y: 50}, {x: 420, y: 70}, {x: 420, y: 90}, {x: 420, y: 110}, {x: 420, y: 140}, {x: 420, y: 175}
  ],
  x: "x", y: "y"
};
BasicExample.parameters = {controls: {include: ["orient"]}};
