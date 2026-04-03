// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Viz} from "../../../args/core/charts/Viz.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Viz",
  component: Viz,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates an x/y plot based on an array of data. See [this example](https://d3plus.org/examples/d3plus-treemap/getting-started/) for help getting started using the treemap generator.",
      },
    },
  }
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

