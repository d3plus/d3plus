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
        component: "Creates SVG box-and-whisker plots based on an array of data, one per group of values.",
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

export const Horizontal = Template.bind({});
Horizontal.args = {
  data: [
    {group: "A", v: 40}, {group: "A", v: 55}, {group: "A", v: 70}, {group: "A", v: 85}, {group: "A", v: 110}, {group: "A", v: 140},
    {group: "B", v: 90}, {group: "B", v: 120}, {group: "B", v: 150}, {group: "B", v: 175}, {group: "B", v: 210}, {group: "B", v: 240}
  ],
  orient: "horizontal",
  x: "v",
  y: funcify(d => (d.group === "A" ? 110 : 230), 'd => d.group === "A" ? 110 : 230')
};
Horizontal.parameters = {controls: {include: ["orient", "rectWidth"]}, docs: {description: {story: "With `orient: \"horizontal\"` the roles swap: `x` carries the values that are summarized and `y` places each group's box, so the quartile boxes and whiskers run left to right."}}};

export const OutlierStyling = Template.bind({});
OutlierStyling.args = {
  data: [
    {x: "A", y: 90}, {x: "A", y: 100}, {x: "A", y: 110}, {x: "A", y: 115}, {x: "A", y: 125}, {x: "A", y: 135}, {x: "A", y: 20},
    {x: "B", y: 150}, {x: "B", y: 160}, {x: "B", y: 170}, {x: "B", y: 180}, {x: "B", y: 195}, {x: "B", y: 205}, {x: "B", y: 300}
  ],
  outlier: "Rect",
  rectWidth: 70,
  x: funcify(d => (d.x === "A" ? 130 : 270), 'd => d.x === "A" ? 130 : 270'), y: "y"
};
OutlierStyling.parameters = {controls: {include: ["outlier", "whiskerMode", "rectWidth"]}, docs: {description: {story: "Each group has one value far outside its interquartile range. Under the default `whiskerMode` (Tukey's 1.5×IQR rule) those points are drawn as outliers beyond the whiskers, here as `Rect` markers instead of the default `Circle`; `rectWidth` widens the boxes."}}};
