// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/hash.args";
import {hash} from "@d3plus/dom";

export default {
  title: "Dom/hash",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Stable hash that serializes functions by their source, so function-valued\nconfig props (accessors, formatters) still register as changed when their\nbody changes. Wrappers use this to diff config across a framework's render\ncycles — two structurally identical config objects hash equal, so an\nunchanged config skips a re-render.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import CallGrid from "../../helpers/CallGrid.jsx";

const a = {groupBy: "id", x: d => d.year, tooltipConfig: {title: d => d.name}};
const b = {groupBy: "id", x: d => d.year, tooltipConfig: {title: d => d.name}};
const c = {groupBy: "id", x: d => d.month, tooltipConfig: {title: d => d.name}};
const circular = {label: "self"};
circular.self = circular;

const calls = [
  {call: "hash(a)", result: hash(a)},
  {call: "hash(a) === hash(b)", result: JSON.stringify(hash(a) === hash(b))},
  {call: "hash(a) === hash(c)", result: JSON.stringify(hash(a) === hash(c))},
  {call: "hash(circular)", result: hash(circular)},
];

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {hash} from "@d3plus/dom";

const a = {groupBy: "id", x: d => d.year, tooltipConfig: {title: d => d.name}};
const b = {groupBy: "id", x: d => d.year, tooltipConfig: {title: d => d.name}};
const c = {groupBy: "id", x: d => d.month, tooltipConfig: {title: d => d.name}};
const circular = {label: "self"};
circular.self = circular;

${calls.map(({call, result}) => `${call}; // ${result}`).join("\n")}`,
      language: "jsx",
    },
    description: {
      story: "A stable string for a config object. Functions are serialized by their source, so two configs built separately but with the same accessors hash the same, while changing an accessor's body (`d.year` → `d.month`) changes the hash. The framework wrappers compare hashes between renders to skip redrawing when nothing changed. Circular references are tolerated.",
    },
  },
};
