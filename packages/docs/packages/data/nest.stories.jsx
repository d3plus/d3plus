// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/data/nest.args";
import {nest} from "@d3plus/data";

export default {
  title: "Data/nest",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Groups a flat array of data by one or more key accessors into nested {key, values} entries, one level per accessor. A row whose keys run out before the last level becomes a leaf at the depth where they stopped instead of leaving an empty level.",
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
];
const dataSource = `const data = [
  {region: "North", year: 2023, sales: 120},
  {region: "North", year: 2024, sales: 135},
  {region: "South", year: 2023, sales: 80},
];`;
const show = value => JSON.stringify(value, null, 2);
const call = "nest(data, d => d.region)";
const result = nest(data, d => d.region);

export const BasicExample = () => <FunctionExample input={`${dataSource}\n\n${call}`} output={show(result)} />;
BasicExample.parameters = {
  docs: {
    source: {code: `import {nest} from "@d3plus/data";\n\n${dataSource}\n\n${call};\n// → ${show(result).replace(/\n/g, "\n//   ")}`, language: "jsx"},
    description: {
      story: "The hierarchy builder charts such as Tree use: like `nestGroups`, but a single accessor can be passed without wrapping it in an array, and rows whose keys run out before the last level are collapsed into leaves instead of leaving an empty level behind.",
    },
  },
};
