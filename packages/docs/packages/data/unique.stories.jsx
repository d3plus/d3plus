// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/data/unique.args";
import {unique} from "@d3plus/data";

export default {
  title: "Data/unique",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "ES5 implementation to reduce an Array of values to unique instances.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import FunctionExample from "../../helpers/FunctionExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const arr = [1, 2, 2, 3, 3, 3, 4];
const call = `unique([${arr.join(", ")}])`;
const result = `[${unique(arr).join(", ")}]`;

export const BasicExample = () => <FunctionExample input={call} output={result} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("data", "unique", [{call, result}]).docs,
    description: {story: "Reduces `[1, 2, 2, 3, 3, 3, 4]` to `[1, 2, 3, 4]`, keeping the first occurrence of each value and dropping later duplicates."},
  },
};
