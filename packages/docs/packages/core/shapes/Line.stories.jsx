// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Line} from "../../../args/core/shapes/Line.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Shapes/Line",
  component: Line,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates SVG lines based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Line config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "series", x: 50,  y: 220}, {id: "series", x: 160, y: 120},
    {id: "series", x: 270, y: 180}, {id: "series", x: 380, y: 70},
    {id: "series", x: 490, y: 150}, {id: "series", x: 600, y: 60}
  ],
  id: "id", x: "x", y: "y"
};
BasicExample.parameters = {controls: {include: ["x", "y"]}};
