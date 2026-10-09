// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/text/strip.args";
import {strip} from "@d3plus/text";

export default {
  title: "Text/strip",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Removes all non ASCII characters from a string.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

// Each row is [value] or [value, spacer]; the live result feeds both the
// grid and the "Show code" panel.
const calls = rows =>
  rows.map(([value, spacer]) => ({
    call:
      spacer === undefined
        ? `strip(${JSON.stringify(value)})`
        : `strip(${JSON.stringify(value)}, ${JSON.stringify(spacer)})`,
    result: JSON.stringify(strip(value, spacer)),
  }));

const params = (rows, story) => ({
  docs: {...sourceSnippet("text", "strip", calls(rows)).docs, description: {story}},
});

const basicRows = [["Héllo Wörld!"], ["São Paulo"], ["naïve café"], ["Crème brûlée (2024)"]];
export const BasicExample = () => <CallGrid calls={calls(basicRows)} />;
BasicExample.parameters = params(
  basicRows,
  "Accented letters are folded to their plain ASCII equivalent, every space becomes the spacer (`-` by default), and anything else that is not a letter, digit, hyphen, or underscore is dropped, which makes the result safe for ids, class names, and file names.",
);

const spacerRows = [["São Paulo", "_"], ["New York City", "+"], ["a b c", ""]];
export const CustomSpacer = () => <CallGrid calls={calls(spacerRows)} />;
CustomSpacer.parameters = params(
  spacerRows,
  "The second argument replaces each space: an underscore for snake_case style ids, a plus sign for query strings, or an empty string to run the words together.",
);

const arabicRows = [["مرحبا بالعالم"], ["Riyadh / الرياض"]];
export const ArabicPreserved = () => <CallGrid calls={calls(arabicRows)} />;
ArabicPreserved.parameters = params(
  arabicRows,
  "Arabic letters are kept alongside ASCII, so right-to-left labels survive the same treatment: spaces still become the spacer and punctuation is still removed.",
);
