// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/text/softHyphen.args";
import {softHyphen} from "@d3plus/text";

export default {
  title: "Text/softHyphen",
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "The soft hyphen (U+00AD): textSplit ends each syllable of a hyphenated\nword with it, and textWrap draws it as a hyphen only where a line breaks.",
      },
    },
  },
};

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";
import {textSplit} from "@d3plus/text";

const words = ["internationalization", "visualization"];
const show = s => s.replaceAll(softHyphen, "‐");
const calls = [
  {call: "softHyphen", result: JSON.stringify(softHyphen)},
  ...words.map(w => ({
    call: `textSplit(${JSON.stringify(w)})`,
    result: JSON.stringify(textSplit(w).map(show)),
  })),
];

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("text", "softHyphen, textSplit", calls).docs,
    description: {
      story:
        "`textSplit` ends every syllable but the last with the soft hyphen (shown here as ‐). It is invisible in text, so `textWrap` draws a hyphen only where it breaks a line mid-word and strips the rest.",
    },
  },
};
