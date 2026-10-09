// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/data/concat.args";
import {concat} from "@d3plus/data";

export default {
  title: "Data/concat",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Reduce and concat all the elements included in arrayOfArrays if they are arrays. If it is a JSON object try to concat the array under given key data. If the key doesn't exists in object item, a warning message is lauched to the console. You need to implement DataFormat callback to concat the arrays manually.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import FunctionExample from "../../helpers/FunctionExample.jsx";

const show = value => JSON.stringify(value, null, 2);

// Each example pairs the call a user would write with its live result.
const example = (code, result, story) => {
  const Story = () => <FunctionExample input={code} output={show(result)} />;
  Story.parameters = {
    docs: {
      source: {code: `import {concat} from "@d3plus/data";\n\n${code};\n// → ${show(result).replace(/\n/g, "\n//   ")}`, language: "jsx"},
      description: {story},
    },
  };
  return Story;
};

export const BasicExample = example(
  `concat([[{id: 1}], [{id: 2}, {id: 3}]])`,
  concat([[{id: 1}], [{id: 2}, {id: 3}]]),
  "Flattens an array of arrays into one array of rows, in order. This is what a chart does when its `data` config lists several sources.",
);

export const ObjectsWithDataKey = example(
  `concat([{data: [{id: 1}]}, [{id: 2}], {data: [{id: 3}]}])`,
  concat([{data: [{id: 1}]}, [{id: 2}], {data: [{id: 3}]}]),
  "An element can also be an object whose `data` property holds the rows, the shape many APIs respond with, and the two forms can be mixed in one call.",
);

export const CustomKey = example(
  `concat([{rows: [{id: 1}]}, {rows: [{id: 2}]}], "rows")`,
  concat([{rows: [{id: 1}]}, {rows: [{id: 2}]}], "rows"),
  "The second argument names the property to read when a response nests its rows under something other than `data`.",
);
