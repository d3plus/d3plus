// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/parseSides.args";
import {parseSides} from "@d3plus/dom";

export default {
  title: "Dom/parseSides",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Converts a string of directional CSS shorthand values into an object with the values expanded.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const inputs = ["10", "10 20", "10 20 30", "10 20 30 40", 15, "1em 2px", "auto 5"];
const calls = inputs.map(value => ({
  call: `parseSides(${JSON.stringify(value)})`,
  result: JSON.stringify(parseSides(value)),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("dom", "parseSides", calls).docs,
    description: {
      story: "Expands CSS shorthand the way `margin` and `padding` do: one value applies to all sides, two mean vertical then horizontal, three mean top, horizontal, bottom, and four go clockwise from the top. Units are ignored and anything that is not a number becomes 0. Config such as `padding` and `labelPadding` accepts this shorthand.",
    },
  },
};
