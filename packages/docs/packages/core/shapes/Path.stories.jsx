// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Path} from "../../../args/core/shapes/Path.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Shapes/Path",
  component: Path,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates SVG Paths based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Path config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  // The default `d` accessor reads the `path` key from each datum; fill,
  // stroke and strokeWidth take constant values.
  data: [
    {id: "wave", path: "M40,200 C140,80 240,320 340,200 S540,80 640,200"}
  ],
  fill: "none", stroke: "#cc4b4b", strokeWidth: 4
};
BasicExample.parameters = {controls: {include: ["d"]}, docs: {description: {story: "The `d` accessor reads a raw SVG path string from each datum; with `fill: none` and a `stroke`, the cubic-Bezier path renders as an open curved stroke."}}};

export const BackgroundImage = Template.bind({});
BackgroundImage.args = {
  // A diamond whose exact bounding box is the 240×240 square [200,440]×[40,280].
  data: [
    {id: "diamond", path: "M320,40 L440,160 L320,280 L200,160 Z"}
  ],
  fill: "#7fb3d5", stroke: "#2c3e50", strokeWidth: 2,
  // The `backgroundImage` accessor returns a per-datum URL. A Path has no
  // width/height of its own, so the image fills the path's exact (DOM-free)
  // bounding box using `cover` and is clipped to the path itself — here a wide
  // 400×200 "landscape" is cover-cropped to the square bbox and shows only
  // through the diamond. (The `viewBox` keeps the image's aspect ratio when scaled.)
  backgroundImage: "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20200%22%20width%3D%22400%22%20height%3D%22200%22%3E%3Crect%20width%3D%22400%22%20height%3D%22200%22%20fill%3D%22%239ad0ec%22%2F%3E%3Ccircle%20cx%3D%22320%22%20cy%3D%2255%22%20r%3D%2228%22%20fill%3D%22%23ffd93b%22%2F%3E%3Crect%20y%3D%22150%22%20width%3D%22400%22%20height%3D%2250%22%20fill%3D%22%236ab04c%22%2F%3E%3Cpolygon%20points%3D%220%2C150%2090%2C80%20180%2C150%22%20fill%3D%22%233d7a3d%22%2F%3E%3Cpolygon%20points%3D%22140%2C150%20240%2C60%20340%2C150%22%20fill%3D%22%234c9a4c%22%2F%3E%3C%2Fsvg%3E"
};
BackgroundImage.parameters = {controls: {include: ["backgroundImage"]}, docs: {description: {story: "Setting `backgroundImage` to a per-datum URL fills each path with an image. A Path carries no width/height, so the image is sized to the path's exact bounding box (computed DOM-free from the `d` string), scaled to `cover` that box, and clipped to the path outline — so the landscape appears only inside the diamond (see issue #757)."}}};
