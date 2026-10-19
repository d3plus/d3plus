// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/silvermanBandwidth.args";
import {silvermanBandwidth} from "@d3plus/math";

export default {
  title: "Math/silvermanBandwidth",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Silverman's rule-of-thumb bandwidth for a gaussian kernel density estimate:\n0.9 · min(σ, IQR / 1.34) · n^(-1/5). When one of the two spreads is zero\nthe other is used; when the values don't vary at all (including a single\nvalue) the spread falls back to a tenth of their magnitude, or 1 for zeros.\nNon-finite values are ignored. Returns NaN when there are no values.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 1000) / 1000;
const inputs = [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 3, 4, 5, 6, 7, 8, 9, 1000], [5, 5, 5, 5], [42]];
const calls = inputs.map(values => ({
  call: `silvermanBandwidth(${JSON.stringify(values)})`,
  result: String(r(silvermanBandwidth(values))),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "silvermanBandwidth", calls).docs,
    description: {
      story: "Silverman's rule of thumb, `0.9 · min(σ, IQR / 1.34) · n^(-1/5)`: the default `kernelDensity` bandwidth. Taking the smaller of the standard deviation and the scaled interquartile range keeps one outlier (the second call) from oversmoothing the rest. Values that don't vary fall back to a tenth of their magnitude.",
    },
  },
};
