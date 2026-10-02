// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/locales/findLocale.args";
import {findLocale} from "@d3plus/locales";

export default {
  title: "Locales/findLocale",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Converts a 2-letter language code into a full language-region locale string (e.g., \"en\" to \"en-US\").",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const inputs = ["en", "pt", "es", "de", "fr", "zh", "xx", "en-GB"];
const calls = inputs.map(code => ({
  call: `findLocale(${JSON.stringify(code)})`,
  result: JSON.stringify(findLocale(code)),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("locales", "findLocale", calls).docs,
    description: {
      story: "Expands a two-letter language code to the full language-region tag the dictionaries are keyed by, preferring a well-known default (`en` → `en-US`, `pt` → `pt-BR`) and otherwise the region that matches the language (`de` → `de-DE`). A full five-character tag or an unknown code is returned unchanged.",
    },
  },
};
