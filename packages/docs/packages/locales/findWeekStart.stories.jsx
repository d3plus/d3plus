// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/locales/findWeekStart.args";
import {findWeekStart} from "@d3plus/locales";

export default {
  title: "Locales/findWeekStart",
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          'Returns the first day of the week (0 = Sunday … 6 = Saturday) in a locale\'s region, per CLDR: "en-US" → 0, "de-DE" → 1, "ar-EG" → 6. Accepts the same forms as the rest of d3plus: "en-US", "en_US", script tags like "sr-Latn-RS", and 2-letter language codes, which resolve to their default region through findLocale ("en" → "en-US" → 0, "ar" → "ar-SA" → 0). A locale whose region can\'t be found, or anything that isn\'t a string, starts on Monday (1).\n\nThe region table is static on purpose: Intl.Locale week info differs across Node 22, Node 24, and browsers, so reading it at runtime would make server-side and browser renders of the same chart disagree.',
      },
    },
  },
};

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const inputs = [
  "en-US",
  "en-GB",
  "de_DE",
  "ar-EG",
  "zh-Hant-TW",
  "en",
  "pt",
  "xx",
];
const calls = inputs.map(code => ({
  call: `findWeekStart(${JSON.stringify(code)})`,
  result: JSON.stringify(findWeekStart(code)),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("locales", "findWeekStart", calls).docs,
    description: {
      story:
        "Looks up the first day of the week (`0` = Sunday … `6` = Saturday) for a locale's region from a static CLDR table. Dashes and underscores both work, script subtags are skipped, and a bare language code resolves to its default region through `findLocale` first (`en` → `en-US` → Sunday). Anything without a known region starts on Monday.",
    },
  },
};
