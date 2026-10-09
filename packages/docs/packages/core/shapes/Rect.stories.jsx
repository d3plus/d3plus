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
        component: "Creates SVG rectangles based on an array of data.",
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
    {id: "a", x: 75,  y: 150, width: 110, height: 130, fill: "#5d6d7e"},
    {id: "b", x: 200, y: 150, width: 110, height: 90,  fill: "#cc4b4b"},
    {id: "c", x: 325, y: 150, width: 110, height: 170, fill: "#3a7ca5"}
  ],
  x: "x", y: "y", width: "width", height: "height", fill: funcify(d => d.fill, "d => d.fill")
};
BasicExample.parameters = {controls: {include: ["width", "height"]}, docs: {description: {story: "Three rectangles centered on their `x`/`y` with data-bound `width`/`height` and a per-datum `fill`."}}};

export const Labels = Template.bind({});
Labels.args = {
  data: [
    {id: "North", x: 95, y: 150, width: 150, height: 150, fill: "#5d6d7e"},
    {id: "South", x: 260, y: 150, width: 150, height: 110, fill: "#cc4b4b"},
    {id: "East", x: 425, y: 150, width: 150, height: 190, fill: "#3a7ca5"}
  ],
  fill: funcify(d => d.fill, "d => d.fill"), height: "height",
  label: funcify(d => `${d.id}\n${d.width}×${d.height}`, "d => `${d.id}\\n${d.width}×${d.height}`"),
  labelConfig: {fontColor: "#fff", fontSize: 14, textAnchor: "middle", verticalAlign: "middle"},
  width: "width", x: "x", y: "y"
};
Labels.parameters = {controls: {include: ["label", "labelConfig"]}, docs: {description: {story: "`label` returns the text drawn inside each rectangle (a newline splits it into lines) and `labelConfig` is a TextBox configuration for it, so font size, color, and alignment follow the same keys as a standalone TextBox. Labels that do not fit are hidden rather than overflowing."}}};
