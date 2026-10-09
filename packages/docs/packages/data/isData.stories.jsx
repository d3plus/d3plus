// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/data/isData.args";
import {isData} from "@d3plus/data";

export default {
  title: "Data/isData",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Returns true/false whether the argument provided to the function should be loaded using an internal XHR request. Valid data can either be a string URL or an Object with \"url\" and \"headers\" keys.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const inputs = [
  ["/data/cities.json", "/data/cities.json"],
  ["{url: \"https://api.example.com/rows\", headers: {Authorization: \"Bearer …\"}}", {url: "https://api.example.com/rows", headers: {Authorization: "Bearer …"}}],
  ["[{id: 1}, {id: 2}]", [{id: 1}, {id: 2}]],
  ["{data: [{id: 1}]}", {data: [{id: 1}]}],
  ["null", null],
  ["42", 42],
];
const calls = inputs.map(([source, value]) => ({
  call: `isData(${source})`,
  result: JSON.stringify(isData(value)),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("data", "isData", calls).docs,
    description: {
      story: "Answers one question for a `data` config value: does it have to be fetched? A string is treated as a URL and an object with a `url` property (plus any `fetch` options such as `headers`) is a request; inline arrays and anything else are used as they are.",
    },
  },
};
