// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Circle} from "../../../args/core/shapes/Circle.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Shapes/Circle",
  component: Circle,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates SVG circles based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Circle config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "a", x: 150, y: 160, r: 60, fill: "#5d6d7e"},
    {id: "b", x: 320, y: 160, r: 90, fill: "#cc4b4b"},
    {id: "c", x: 510, y: 160, r: 45, fill: "#3a7ca5"}
  ],
  x: "x", y: "y", r: "r", fill: "fill"
};
BasicExample.parameters = {controls: {include: ["r"]}};
