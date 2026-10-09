// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/linearPrediction.args";
import {linearPrediction} from "@d3plus/math";

export default {
  title: "Math/linearPrediction",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Builds the prediction band for a new observation under a simple linear regression of points: ŷ ± t·s·√(1 + 1/n + (x − x̄)²/Sxx). Wider than the confidence band of linearConfidence, since it covers the scatter of individual values as well as the uncertainty of the fitted line, which makes it the band to draw around a forecast. Returns a function mapping an x value to its [lower, upper] bounds, or null when there are fewer than three usable points or the x values do not vary.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

