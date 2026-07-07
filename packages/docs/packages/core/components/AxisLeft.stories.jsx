// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, AxisLeft} from "../../../args/core/components/AxisLeft.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/AxisLeft",
  component: AxisLeft,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Shorthand method for creating an axis where the ticks are drawn to the left of the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.",
      },
    },
  }
};

const Template = (args) => <AxisLeft config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  domain: [0, 100],
  width: 140,
  height: 400,
  title: "Left Axis"
};
BasicExample.parameters = {controls: {include: ["domain", "ticks", "title"]}, docs: {description: {story: "The `[0, 100]` domain runs down the 400px height with its ticks and labels on the left of the path, the placement for a left-edge y-axis."}}};
