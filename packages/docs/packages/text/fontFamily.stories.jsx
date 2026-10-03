// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/text/fontFamily.args";
import {fontFamily} from "@d3plus/text";

export default {
  title: "Text/fontFamily",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "The default fallback font list used for all text labels as an Array of Strings.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import FunctionExample from "../../helpers/FunctionExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

export const BasicExample = () => (
  <FunctionExample input="fontFamily" output={JSON.stringify(fontFamily, null, 2)} />
);
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("text", "fontFamily", [{call: "fontFamily", result: JSON.stringify(fontFamily)}]).docs,
    description: {
      story: "The fallback stack every chart uses for its text, from Inter down to the generic `sans-serif`. Pass your own array to a chart's `fontFamily` config, or use this one as the base when you only want to prepend a brand font.",
    },
  },
};
