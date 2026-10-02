// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/closest.args";
import {closest} from "@d3plus/math";

export default {
  title: "Math/closest",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Finds the closest numeric value in an array.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const inputs = [[7, [1, 5, 10]], [8, [1, 5, 10]], [2.5, [1, 2, 3, 4]], [3, []]];
const calls = inputs.map(([n, arr]) => ({
  call: `closest(${n}, ${JSON.stringify(arr)})`,
  result: String(closest(n, arr)),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "closest", calls).docs,
    description: {
      story: "Returns the array value nearest to `n`. Ties keep the earlier value (`2.5` against `[1, 2, 3, 4]` gives `2`), and an empty array gives `undefined`. Axes use it to snap a pointer position to the nearest tick or data value.",
    },
  },
};
