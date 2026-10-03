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
  // The default accessors read the `x`/`y`/`width`/`height`/`url` keys
  // directly from each datum.
  data: [
    {id: "a", x: 320, y: 160, width: 140, height: 140,
     url: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Crect width='140' height='140' rx='12' fill='%233a7ca5'/%3E%3Ccircle cx='70' cy='70' r='45' fill='%23f5d76e'/%3E%3C/svg%3E"}
  ]
};
BasicExample.parameters = {controls: {include: ["url"]}, docs: {description: {story: "A single datum places one image at its `x`/`y` at the given `width`/`height`; the `url` accessor here points to an inline SVG data URI."}}};

const icon = (color, size) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='${size}' height='${size}' rx='${size / 8}' fill='${color}'/><circle cx='${size / 2}' cy='${size / 2}' r='${size / 4}' fill='white' fill-opacity='0.85'/></svg>`,
  )}`;

export const MultipleImages = Template.bind({});
MultipleImages.args = {
  data: [
    {id: "a", x: 120, y: 160, width: 80, height: 80, url: icon("#3a7ca5", 80)},
    {id: "b", x: 260, y: 160, width: 120, height: 120, url: icon("#cc4b4b", 120)},
    {id: "c", x: 420, y: 160, width: 60, height: 60, url: icon("#5d6d7e", 60)}
  ],
  opacity: funcify(d => (d.id === "c" ? 0.5 : 1), 'd => d.id === "c" ? 0.5 : 1')
};
MultipleImages.parameters = {controls: {include: ["width", "height", "opacity"]}, docs: {description: {story: "One image per datum, each sized by its own `width` and `height` and centered on its `x`/`y`; `opacity` fades the third. Geomap and Network use this shape for icons and flags."}}};
