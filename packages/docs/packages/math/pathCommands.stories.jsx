// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/pathCommands.args";
import {pathCommands} from "@d3plus/math";

export default {
  title: "Math/pathCommands",
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Tokenizes an SVG path d string into its commands as written, without\nresolving them to absolute coordinates. Arc\nflags are read as single 0/1 characters, so compact arcs such as\na1 1 0 011 1 tokenize correctly. Stops at the first character that is\nnot a path command.",
      },
    },
  },
};

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const paths = ["M10,20L30 40h5Z", "m0 0 10 10 20-5", "M0,0a1 1 0 011 1"];
const calls = paths.map(d => ({
  call: `pathCommands(${JSON.stringify(d)})`,
  result: pathCommands(d)
    .map(({command, segments}) => `${command} ${JSON.stringify(segments)}`)
    .join("\n"),
}));

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "pathCommands", calls).docs,
    description: {
      story:
        "Each command keeps its letter, so relative commands stay relative, and its numbers are grouped by segment when the command repeats. The arc's flags are read as single digits, so a compact arc like `a1 1 0 011 1` gives flags `0` and `1` and the endpoint `1, 1`.",
    },
  },
};
