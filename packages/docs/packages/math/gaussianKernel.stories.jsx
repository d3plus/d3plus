// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/gaussianKernel.args";
import {gaussianKernel} from "@d3plus/math";

export default {
  title: "Math/gaussianKernel",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "The standard normal (gaussian) kernel: e^(-u²/2) / √(2π).",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 10000) / 10000;
const calls = [0, 0.5, 1, 2, 3].map(u => ({call: `gaussianKernel(${u})`, result: String(r(gaussianKernel(u)))}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "gaussianKernel", calls).docs,
    description: {
      story: "The standard normal density, `kernelDensity`'s default kernel. It takes the distance from an observation in bandwidths, peaks at about 0.3989, and never quite reaches zero.",
    },
  },
};
