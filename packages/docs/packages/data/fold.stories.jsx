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

export const BasicExample = () => {
  const input = {headers: ["year", "apples", "bananas"], data: [[2020, 5, 8], [2021, 7, 6]]};
  return (
    <pre style={{fontFamily: "monospace", fontSize: 13}}>
      {`fold(${JSON.stringify(input, null, 2)})\n\n→ ${JSON.stringify(fold(input), null, 2)}`}
    </pre>
  );
};
