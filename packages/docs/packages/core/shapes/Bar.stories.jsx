// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Bar} from "../../../args/core/shapes/Bar.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Shapes/Bar",
  component: Bar,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates SVG areas based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Bar config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "a", x: 130, y: 250, width: 80, height: 100, fill: "#5d6d7e"},
    {id: "b", x: 250, y: 250, width: 80, height: 160, fill: "#cc4b4b"},
    {id: "c", x: 370, y: 250, width: 80, height: 70,  fill: "#3a7ca5"}
  ],
  x: "x", y: "y", width: "width", height: "height", fill: "fill"
};
BasicExample.parameters = {controls: {include: ["width", "height"]}, docs: {description: {story: "Each datum draws one bar sized by its data-bound `width` and `height` and colored from a per-datum `fill`, positioned by `x`/`y`."}}};
