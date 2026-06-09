// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Image} from "../../../args/core/shapes/Image.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Shapes/Image",
  component: Image,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates SVG images based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Image config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "a", x: 320, y: 160, width: 140, height: 140,
     url: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Crect width='140' height='140' rx='12' fill='%233a7ca5'/%3E%3Ccircle cx='70' cy='70' r='45' fill='%23f5d76e'/%3E%3C/svg%3E"}
  ],
  x: "x", y: "y", width: "width", height: "height", url: "url"
};
BasicExample.parameters = {controls: {include: ["url"]}};
