// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, AxisBottom} from "../../../args/core/components/AxisBottom.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/AxisBottom",
  component: AxisBottom,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Shorthand method for creating an axis where the ticks are drawn below the horizontal domain path. Extends all functionality of the base [Axis](#Axis) class.",
      },
    },
  }
};

const Template = (args) => <AxisBottom config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

