// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/clamp.args";
import {clamp} from "@d3plus/math";

export default {
  title: "Math/clamp",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Constrains a number to the range from min to max, inclusive.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const inputs = [[5, 0, 10], [-3, 0, 10], [42, 0, 10], [0.25, 0, 1]];
const calls = inputs.map(([v, lo, hi]) => ({
  call: `clamp(${v}, ${lo}, ${hi})`,
  result: String(clamp(v, lo, hi)),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "clamp", calls).docs,
    description: {
      story: "Values inside the range come back unchanged, and values past either end come back as that end. Charts use it to keep font sizes, radii, and pixel positions within their bounds.",
    },
  },
};
