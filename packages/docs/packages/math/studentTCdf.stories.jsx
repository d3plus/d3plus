// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/studentTCdf.args";
import {studentTCdf} from "@d3plus/math";

export default {
  title: "Math/studentTCdf",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "The cumulative distribution function of Student's t-distribution.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 10000) / 10000;
const inputs = [[1.96, 30], [0, 10], [-2, 5], [2.57, 5], [12.71, 1]];
const calls = inputs.map(([t, df]) => ({
  call: `studentTCdf(${t}, ${df})`,
  result: String(r(studentTCdf(t, df))),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "studentTCdf", calls).docs,
    description: {
      story: "The cumulative distribution function of Student's t: the probability that a t statistic with `df` degrees of freedom falls below `t`. Zero always gives 0.5, and feeding a quantile back in returns its probability (`studentTCdf(2.57, 5)` is close to 0.975), since this is the inverse of `studentTQuantile`.",
    },
  },
};
