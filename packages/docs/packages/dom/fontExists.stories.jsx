// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/fontExists.args";
import {fontExists} from "@d3plus/dom";

export default {
  title: "Dom/fontExists",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Given either a single font-family or a list of fonts, returns the name of the first font that can be rendered, or false if none are installed on the user's machine.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {useEffect, useState} from "react";
import {onFontsLoaded} from "@d3plus/dom";

import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const inputs = ["Inter", ["Nope Font", "Georgia"], "Comic Sans MS, Arial, sans-serif", "Nope Font"];
const calls = () =>
  inputs.map(font => ({
    call: `fontExists(${JSON.stringify(font)})`,
    result: JSON.stringify(fontExists(font)),
  }));

// Verdicts for web fonts can change once they finish downloading, so the grid
// is re-evaluated whenever the browser reports a font load.
const Live = () => {
  const [, bump] = useState(0);
  useEffect(() => onFontsLoaded(() => bump(n => n + 1)), []);
  return <CallGrid calls={calls()} />;
};

export const BasicExample = () => <Live />;
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("dom", "fontExists", calls()).docs,
    description: {
      story: "Returns the first family in a list that the browser can actually render, or `false` when none can. A family is judged by measuring a test string with it and comparing against the generic fallbacks, so the answers depend on the fonts installed on the viewing machine, and a web font that has not finished loading reads as missing until it arrives. Charts use this to pick a real font from a `fontFamily` stack.",
    },
  },
};
