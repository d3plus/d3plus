// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/text/fontFamilyStringify.args";
import {fontFamilyStringify} from "@d3plus/text";

export default {
  title: "Text/fontFamilyStringify",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Converts an Array of font-family names into a CSS font-family string.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {fontFamily} from "@d3plus/text";

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const inputs = [["Helvetica Neue", "Arial", "sans-serif"], "Inter", ["Source Code Pro", "monospace"], fontFamily];
const calls = inputs.map(family => ({
  call: `fontFamilyStringify(${family === fontFamily ? "fontFamily" : JSON.stringify(family)})`,
  result: JSON.stringify(fontFamilyStringify(family)),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("text", "fontFamily, fontFamilyStringify", calls).docs,
    description: {
      story: "Joins a font list into the comma-separated string CSS expects. Names that are not a single lowercase word (so anything with spaces or capitals) are wrapped in single quotes, while generic families such as `sans-serif` and `monospace` are left bare. A plain string is treated as a one-item list.",
    },
  },
};
