// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Area} from "../../../args/core/shapes/Area.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Shapes/Area",
  component: Area,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates SVG areas based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Area config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  // The default accessors read the `x`/`y`/`id` keys directly, so the data
  // keys are chosen to match them. `fill`/`fillOpacity` take constant values.
  data: [
    {id: "a", x: 40, y: 80}, {id: "a", x: 160, y: 180}, {id: "a", x: 280, y: 110},
    {id: "a", x: 400, y: 200}, {id: "a", x: 520, y: 90}, {id: "a", x: 640, y: 160}
  ],
  fill: "#3a7ca5", fillOpacity: 0.5
};
BasicExample.parameters = {controls: {include: ["curve"]}, docs: {description: {story: "The six points share one `id`, so they join into a single filled area; `fillOpacity` renders it as a translucent band, and the `curve` control changes how the vertices are interpolated."}}};

export const Band = Template.bind({});
Band.args = {
  data: [
    {id: "range", x: 40, top: 60, bottom: 120}, {id: "range", x: 160, top: 120, bottom: 220},
    {id: "range", x: 280, top: 70, bottom: 150}, {id: "range", x: 400, top: 150, bottom: 240},
    {id: "range", x: 520, top: 50, bottom: 130}, {id: "range", x: 640, top: 110, bottom: 200}
  ],
  fill: "#3a7ca5", fillOpacity: 0.35,
  y0: funcify(d => d.top, "d => d.top"),
  y1: funcify(d => d.bottom, "d => d.bottom")
};
Band.parameters = {controls: {include: ["y0", "y1"]}, docs: {description: {story: "Setting both `y0` and `y1` draws a band between two edges instead of filling down to a baseline, which is how confidence intervals and min/max envelopes are drawn behind a line."}}};

export const CurveAndSeries = Template.bind({});
CurveAndSeries.args = {
  data: [
    {id: "a", x: 40, y: 120}, {id: "a", x: 200, y: 200}, {id: "a", x: 360, y: 90}, {id: "a", x: 520, y: 180}, {id: "a", x: 680, y: 110},
    {id: "b", x: 40, y: 220}, {id: "b", x: 200, y: 150}, {id: "b", x: 360, y: 240}, {id: "b", x: 520, y: 130}, {id: "b", x: 680, y: 210}
  ],
  curve: "monotoneX",
  fill: funcify(d => (d.id === "a" ? "#3a7ca5" : "#cc4b4b"), 'd => d.id === "a" ? "#3a7ca5" : "#cc4b4b"'),
  fillOpacity: 0.45
};
CurveAndSeries.parameters = {controls: {include: ["curve", "fill"]}, docs: {description: {story: "Each distinct `id` becomes its own area, and `curve` picks the d3 interpolation between points; `monotoneX` rounds the corners without overshooting the data."}}};
