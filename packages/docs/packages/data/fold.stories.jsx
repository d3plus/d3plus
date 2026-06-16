// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/data/fold.args";
import {fold} from "@d3plus/data";

export default {
  title: "Data/fold",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Given a JSON object where the data values and headers have been split into separate key lookups, this function will combine the data values with the headers and returns one large array of objects.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import FunctionExample from "../../helpers/FunctionExample.jsx";
import stringify from "../../helpers/stringify.js";

export const BasicExample = () => {
  const input = {headers: ["year", "apples", "bananas"], data: [[2020, 5, 8], [2021, 7, 6]]};
  // stringify mangles arrays-of-arrays, so hand-format the headers/data matrix.
  const inputStr = `{
  headers: [${input.headers.map(h => `"${h}"`).join(", ")}],
  data: [${input.data.map(row => `[${row.join(", ")}]`).join(", ")}]
}`;
  return (
    <FunctionExample input={`fold(${inputStr})`} output={stringify(fold(input))} />
  );
};
