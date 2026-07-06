// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Axis} from "../../../args/core/components/Axis.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/Axis",
  component: Axis,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates an SVG scale based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Axis config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  domain: [0, 100],
  width: 600,
  height: 120,
  title: "Axis"
};
BasicExample.parameters = {controls: {include: ["domain", "ticks", "title", "grid"]}, docs: {description: {story: "A linear `[0, 100]` domain is spread across the 600px width with auto-generated ticks and a title; the base class defaults to `bottom` orientation."}}};
