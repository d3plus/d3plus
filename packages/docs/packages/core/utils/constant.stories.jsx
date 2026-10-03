// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../../args/core/utils/constant.args";
import {constant} from "@d3plus/core";

export default {
  title: "Core/Utils/constant",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Wraps non-function variables in a simple return function.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import CallGrid from "../../../helpers/CallGrid.jsx";
import sourceSnippet from "../../../helpers/sourceSnippet.js";

const calls = [
  {call: "constant(42)()", result: JSON.stringify(constant(42)())},
  {call: 'constant("#f03e3e")({id: "alpha"})', result: JSON.stringify(constant("#f03e3e")({id: "alpha"}))},
  {call: '[1, 2, 3].map(constant("same"))', result: JSON.stringify([1, 2, 3].map(constant("same")))},
];

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("core", "constant", calls).docs,
    description: {
      story: "Wraps a plain value in a function that ignores its arguments and returns the value. Config such as `fill: \"#f03e3e\"` or `width: 10` is normalized this way, so shapes can call every setting as an accessor without checking whether it was given as a value or a function.",
    },
  },
};
