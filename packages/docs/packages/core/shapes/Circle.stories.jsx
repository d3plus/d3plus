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
    {id: "a", x: 80,  y: 150, r: 55, fill: "#5d6d7e"},
    {id: "b", x: 210, y: 150, r: 75, fill: "#cc4b4b"},
    {id: "c", x: 335, y: 150, r: 45, fill: "#3a7ca5"}
  ],
  x: "x", y: "y", r: "r", fill: "fill"
};
BasicExample.parameters = {controls: {include: ["r"]}, docs: {description: {story: "Three circles positioned by `x`/`y`, each sized by its data-bound `r` and filled from a per-datum `fill`."}}};

export const TextWrapping = Template.bind({});
TextWrapping.args = {
  data: [
    {
      id: "big",
      x: 170,
      y: 170,
      r: 150,
      fill: "#3a7ca5",
      text: "Data visualization made easy — labels wrap to fill the whole circle, with shorter lines near the top and bottom."
    },
    {
      id: "small",
      x: 430,
      y: 170,
      r: 100,
      fill: "#cc4b4b",
      text: "Text follows the curve instead of a boxy square inside the circle."
    }
  ],
  x: "x", y: "y", r: "r",
  fill: funcify(d => d.fill, "d => d.fill"),
  label: funcify(d => d.text, "d => d.text")
};
TextWrapping.parameters = {controls: {include: ["r"]}, docs: {description: {story: "A `label` on a Circle now wraps to the circle's interior: each line is only as wide as the circle is at that height, so text fills the round shape — widest through the middle, shorter at the top and bottom — and auto-sizes to fit. Previously labels were confined to a square inscribed in the circle, wasting the rounded sides. Just set a `label` accessor; d3plus handles the rest."}}};
