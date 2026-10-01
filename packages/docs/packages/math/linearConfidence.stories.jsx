// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/linearConfidence.args";
import {linearConfidence} from "@d3plus/math";

export default {
  title: "Math/linearConfidence",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Builds the confidence band for the mean response of a simple linear regression of points: ŷ ± t·s·√(1/n + (x − x̄)²/Sxx). Returns a function mapping an x value to its [lower, upper] bounds, or null when there are fewer than three usable points or the x values do not vary.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

