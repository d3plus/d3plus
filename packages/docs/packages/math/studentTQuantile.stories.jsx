// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/studentTQuantile.args";
import {studentTQuantile} from "@d3plus/math";

export default {
  title: "Math/studentTQuantile",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "The inverse cumulative distribution function (quantile) of Student's t-distribution: the t value below which a proportion p of the distribution lies.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 10000) / 10000;
const inputs = [[0.975, 1], [0.975, 5], [0.975, 30], [0.975, 1000], [0.95, 10], [0.5, 10]];
const calls = inputs.map(([p, df]) => ({
  call: `studentTQuantile(${p}, ${df})`,
  result: String(r(studentTQuantile(p, df))),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "studentTQuantile", calls).docs,
    description: {
      story: "The t value below which a proportion `p` of Student's t-distribution lies, for `df` degrees of freedom. `0.975` gives the critical value for a two-sided 95% interval: large with one degree of freedom, and converging on the normal distribution's 1.96 as `df` grows. `linearConfidence` uses it to size its band.",
    },
  },
};
