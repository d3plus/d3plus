// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Shape} from "../../../args/core/shapes/Shape.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Shapes/Shape",
  component: Shape,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "An abstracted class for generating shapes.",
      },
    },
  }
};

const Template = (args) => <Shape config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

