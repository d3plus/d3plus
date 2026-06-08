// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Rect} from "../../../args/core/shapes/Rect.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Shapes/Rect",
  component: Rect,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates SVG rectangles based on an array of data. See [this example](https://d3plus.org/examples/d3plus-shape/getting-started/) for help getting started using the rectangle generator.",
      },
    },
  }
};

const Template = (args) => <Rect config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "a", x: 130, y: 160, width: 110, height: 130, fill: "#5d6d7e"},
    {id: "b", x: 290, y: 160, width: 110, height: 90,  fill: "#cc4b4b"},
    {id: "c", x: 450, y: 160, width: 110, height: 170, fill: "#3a7ca5"}
  ],
  x: "x", y: "y", width: "width", height: "height", fill: "fill"
};
BasicExample.parameters = {controls: {include: ["width", "height"]}};
