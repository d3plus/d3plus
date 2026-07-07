// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorDefaults.args";
import {colorDefaults} from "@d3plus/color";

export default {
  title: "Color/colorDefaults",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A set of default color values used when assigning colors based on data.\n\nThe categorical scale is CVD-checked: its first eight slots (the identity\ntier) are open-color steps chosen to sit inside the OKLCH lightness band,\nclear the chroma floor, and stay distinguishable under protanopia and\ndeuteranopia — validate them with colorValidate. The slot order is the\ncolorblind-safety mechanism and should not be reshuffled. Slots nine and up\nare a lighter second ring of the same hues, for high-cardinality fallback\n(past ~8 series, prefer grouping the tail into \"Other\").\n\nsequential is the default single-hue anchor for magnitude ramps (blue).",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

