// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/data/merge.args";
import {merge} from "@d3plus/data";

export default {
  title: "Data/merge",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Combines an Array of Objects together and returns a new Object.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = () => {
  const input = [
    {id: "foo", group: "A", value: 10},
    {id: "bar", group: "A", value: 20}
  ];
  return (
    <pre style={{fontFamily: "monospace", fontSize: 13}}>
      {`merge(${JSON.stringify(input, null, 2)})\n\n→ ${JSON.stringify(merge(input), null, 2)}`}
    </pre>
  );
};
