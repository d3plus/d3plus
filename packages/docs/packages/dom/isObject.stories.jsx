// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/isObject.args";
import {isObject} from "@d3plus/dom";

export default {
  title: "Dom/isObject",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Detects if a variable is a javascript Object.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const inputs = [
  ["{}", {}],
  ["{a: 1}", {a: 1}],
  ["new Date()", new Date()],
  ["[]", []],
  ["null", null],
  ['"text"', "text"],
  ["() => 1", () => 1],
  ["document.body", typeof document === "undefined" ? null : document.body],
  ["window", typeof window === "undefined" ? null : window],
];
const calls = inputs.map(([source, value]) => ({
  call: `isObject(${source})`,
  result: JSON.stringify(isObject(value)),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("dom", "isObject", calls).docs,
    description: {
      story: "True for plain objects (and other non-array object instances such as a `Date`), false for arrays, `null`, primitives, functions, and the DOM globals `window`, `document`, and elements. `assign` relies on this to decide what to merge recursively and what to copy as a value.",
    },
  },
};
