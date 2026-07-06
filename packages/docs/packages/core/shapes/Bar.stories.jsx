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
    {id: "a", x: 90,  top: 90,  width: 70, fill: "#5d6d7e"},
    {id: "b", x: 210, top: 40,  width: 70, fill: "#cc4b4b"},
    {id: "c", x: 330, top: 150, width: 70, fill: "#3a7ca5"}
  ],
  x: "x", y: 250, y1: funcify(d => d.top, "d => d.top"), width: "width", fill: "fill"
};
BasicExample.parameters = {controls: {include: ["width"]}, docs: {description: {story: "In its default vertical mode each bar spans from the baseline `y` (250) up to its per-datum `y1` value, so the bar height is `|y1 - y|`. Bars are placed horizontally by `x`, sized by a data-bound `width`, and colored from a per-datum `fill`."}}};
