// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Legend} from "../../../args/core/components/Legend.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/Legend",
  component: Legend,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates an SVG legend based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Legend config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {color: "red", id: "alpha"},
    {color: "orange", id: "beta"},
    {color: "green", id: "gamma"},
    {color: "blue", id: "delta"},
    {color: "purple", id: "epsilon"}
  ],
  label: d => d.id,
  shapeConfig: {
    fill: d => d.color,
    r: 10,
    height: 20,
    width: 20
  },
  shape: "Rect",
  title: "A Basic Legend",
  height: 100,
  width: 500,
};
BasicExample.parameters = {controls: {include: ["shape", "title"]}, docs: {description: {story: "Each datum becomes a labeled entry drawn with `Rect` markers whose `fill` is read per datum from `shapeConfig`; `label` sets the entry text and `title` the heading above them."}}};
export const CircleMarkers = Template.bind({});
CircleMarkers.args = {
  data: [
    {color: "#cc4b4b", id: "alpha"},
    {color: "#3a7ca5", id: "beta"},
    {color: "#5d9e6e", id: "gamma"},
    {color: "#b07cc6", id: "delta"}
  ],
  label: d => d.id,
  shapeConfig: {fill: d => d.color, r: 12},
  shape: "Circle",
  title: "Circle Markers",
  height: 100,
  width: 500
};
CircleMarkers.parameters = {controls: {include: ["shape", "title"]}, docs: {description: {story: "Setting `shape` to `Circle` marks each entry with a filled dot sized by `shapeConfig.r` instead of a rectangle."}}};
