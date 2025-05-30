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
        component: "Creates SVG box based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Box config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

