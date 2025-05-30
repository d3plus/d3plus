// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Tooltip} from "../../../args/core/components/Tooltip.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/Tooltip",
  component: Tooltip,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates HTML tooltips in the body of a webpage.",
      },
    },
  }
};

const Template = (args) => <Tooltip config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

