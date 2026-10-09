// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Whisker} from "../../../args/core/shapes/Whisker.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Shapes/Whisker",
  component: Whisker,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates SVG whiskers based on an array of data: a line from each point in a given direction, capped with an endpoint shape.",
      },
    },
  }
};

const Template = (args) => <Whisker config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [{id: "a", x: 300, y: 160}],
  x: funcify(d => d.x, "d => d.x"), y: funcify(d => d.y, "d => d.y"), length: 90, orient: "vertical"
};
BasicExample.parameters = {controls: {include: ["orient", "length", "endpoint"]}, docs: {description: {story: "A single whisker drawn from `x`/`y`, extended `length` pixels in the `orient` direction and capped with an endpoint marker."}}};

export const Endpoints = Template.bind({});
Endpoints.args = {
  data: [
    {id: "a", x: 120, y: 160, endpoint: "Rect", orient: "top"},
    {id: "b", x: 260, y: 160, endpoint: "Circle", orient: "top"},
    {id: "c", x: 400, y: 160, endpoint: "Rect", orient: "right"},
    {id: "d", x: 540, y: 160, endpoint: "Circle", orient: "bottom"}
  ],
  endpoint: funcify(d => d.endpoint, "d => d.endpoint"),
  endpointConfig: {Circle: {r: 7}, Rect: {width: 24, height: 6}},
  length: 80,
  orient: funcify(d => d.orient, "d => d.orient"),
  x: funcify(d => d.x, "d => d.x"), y: funcify(d => d.y, "d => d.y")
};
Endpoints.parameters = {controls: {include: ["endpoint", "endpointConfig", "orient", "length"]}, docs: {description: {story: "`endpoint` names the shape drawn at the far end of each whisker (`Rect` or `Circle`, per datum here) and `endpointConfig` styles each kind; `orient` takes `top`, `right`, `bottom`, or `left`. Box plots build their whiskers from exactly these settings."}}};
