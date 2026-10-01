// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/regression.args";
import {regression} from "@d3plus/math";

export default {
  title: "Math/regression",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Fits a regression model to a set of [x, y] points. Points with non-finite values, or that fall outside a model's domain (y ≤ 0 for exponential, x ≤ 0 for logarithmic, either for power), are ignored. Returns null when there are too few usable points or the x values do not vary.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

