// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/finite.args";
import {finite} from "@d3plus/math";

export default {
  title: "Math/finite",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Whether a value is a finite number: not NaN, ±Infinity, or a\nnon-number such as a numeric string, null, or an array.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const inputs = [["0", 0], ["-2.5", -2.5], ["NaN", NaN], ["Infinity", Infinity], ['"3"', "3"], ["null", null]];
const calls = inputs.map(([source, v]) => ({
  call: `finite(${source})`,
  result: String(finite(v)),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "finite", calls).docs,
    description: {
      story: "True only for a number that is not `NaN` or infinite. A numeric string is not a number, so `\"3\"` is false; in TypeScript it also narrows the value to `number`.",
    },
  },
};
