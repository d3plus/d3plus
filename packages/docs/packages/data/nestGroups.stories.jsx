// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/data/nestGroups.args";
import {nestGroups} from "@d3plus/data";

export default {
  title: "Data/nestGroups",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Recursively groups data by each key function, producing {key, values} objects compatible with d3-hierarchy.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import FunctionExample from "../../helpers/FunctionExample.jsx";

const data = [
  {region: "North", year: 2023, sales: 120},
  {region: "North", year: 2024, sales: 135},
  {region: "South", year: 2023, sales: 80},
  {region: "South", year: 2024, sales: 95},
];
const dataSource = `const data = [
  {region: "North", year: 2023, sales: 120},
  {region: "North", year: 2024, sales: 135},
  {region: "South", year: 2023, sales: 80},
  {region: "South", year: 2024, sales: 95},
];`;
const show = value => JSON.stringify(value, null, 2);

const example = (call, result, story) => {
  const Story = () => <FunctionExample input={`${dataSource}\n\n${call}`} output={show(result)} />;
  Story.parameters = {
    docs: {
      source: {code: `import {nestGroups} from "@d3plus/data";\n\n${dataSource}\n\n${call};\n// → ${show(result).replace(/\n/g, "\n//   ")}`, language: "jsx"},
      description: {story},
    },
  };
  return Story;
};

export const BasicExample = example(
  "nestGroups(data, [d => d.region])",
  nestGroups(data, [d => d.region]),
  "Groups rows by the value each accessor returns, producing `{key, values}` entries in first-seen order. One accessor gives one level.",
);

export const MultiLevel = example(
  "nestGroups(data, [d => d.region, d => d.year])",
  nestGroups(data, [d => d.region, d => d.year]),
  "Each additional accessor nests another level inside the previous one, which is the shape `d3-hierarchy` expects and what a chart builds from a multi-key `groupBy`.",
);

export const EmptyKeys = example(
  "nestGroups(data, [])",
  nestGroups(data, []),
  "With no accessors the rows come back untouched, so a caller can pass whatever depth of `groupBy` it has without special-casing zero.",
);
