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

