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

import FunctionExample from "../../helpers/FunctionExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";
import stringify from "../../helpers/stringify.js";

const input = [
  {id: "foo", group: "A", value: 10},
  {id: "bar", group: "A", value: 20}
];
const call = `merge(${stringify(input)})`;
const result = stringify(merge(input));

export const BasicExample = () => <FunctionExample input={call} output={result} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("data", "merge", [{call, result}]).docs,
    description: {story: "Collapses the two objects into one, applying the default aggregations: numeric `value` fields are summed to `30`, the differing `id` strings collect into an array, and the shared `group: \"A\"` collapses to a single value."},
  },
};
