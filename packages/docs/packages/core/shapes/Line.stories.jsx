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
BasicExample.parameters = {controls: {include: ["x", "y"]}, docs: {description: {story: "Points sharing the same `id` connect into one continuous line, with `x`/`y` placing each vertex."}}};

export const MultipleSeries = Template.bind({});
MultipleSeries.args = {
  data: [
    {id: "a", x: 50, y: 220, color: "#3a7ca5"}, {id: "a", x: 230, y: 120, color: "#3a7ca5"}, {id: "a", x: 410, y: 180, color: "#3a7ca5"}, {id: "a", x: 590, y: 70, color: "#3a7ca5"},
    {id: "b", x: 50, y: 100, color: "#cc4b4b"}, {id: "b", x: 230, y: 200, color: "#cc4b4b"}, {id: "b", x: 410, y: 90, color: "#cc4b4b"}, {id: "b", x: 590, y: 160, color: "#cc4b4b"},
    {id: "c", x: 50, y: 160, color: "#5d6d7e"}, {id: "c", x: 230, y: 60, color: "#5d6d7e"}, {id: "c", x: 410, y: 240, color: "#5d6d7e"}, {id: "c", x: 590, y: 200, color: "#5d6d7e"}
  ],
  id: "id", stroke: funcify(d => d.color, "d => d.color"), strokeWidth: 3, x: "x", y: "y"
};
MultipleSeries.parameters = {controls: {include: ["stroke", "strokeWidth"]}, docs: {description: {story: "Points are grouped into lines by `id`, so three ids give three lines from one data array; `stroke` and `strokeWidth` read per-datum values like any other accessor."}}};

export const Curves = Template.bind({});
Curves.args = {
  data: [
    {id: "series", x: 50, y: 220}, {id: "series", x: 160, y: 120},
    {id: "series", x: 270, y: 180}, {id: "series", x: 380, y: 70},
    {id: "series", x: 490, y: 150}, {id: "series", x: 600, y: 60}
  ],
  curve: "monotoneX", id: "id", strokeWidth: 3, x: "x", y: "y"
};
Curves.parameters = {controls: {include: ["curve"]}, docs: {description: {story: "`curve` names a d3 curve: `linear` (the default) joins points with straight segments, `monotoneX` smooths between them without overshooting, and `step`, `basis`, `cardinal`, and the rest are available by name."}}};
