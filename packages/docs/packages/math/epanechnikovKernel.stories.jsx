// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/epanechnikovKernel.args";
import {epanechnikovKernel} from "@d3plus/math";

export default {
  title: "Math/epanechnikovKernel",
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "The Epanechnikov kernel, scaled to unit variance like the gaussian kernel\nso a bandwidth smooths about as much with either:\n3 / (4√5) · (1 - u²/5) for |u| ≤ √5, otherwise 0. Its density reaches\nexactly zero √5 bandwidths past the outermost observations.",
      },
    },
  },
};

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 10000) / 10000;
const calls = [0, 0.5, 1, 2, 2.3].map(u => ({
  call: `epanechnikovKernel(${u})`,
  result: String(r(epanechnikovKernel(u))),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "epanechnikovKernel", calls).docs,
    description: {
      story:
        "A parabola-shaped kernel scaled to unit variance, like `gaussianKernel`, so one bandwidth smooths about as much with either. Unlike the gaussian it reaches exactly zero √5 (about 2.24) bandwidths from an observation.",
    },
  },
};
