// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorGrayscale.args";
import {colorGrayscale} from "@d3plus/color";

export default {
  title: "Color/colorGrayscale",
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Strips a color's saturation while keeping its lightness and alpha, so a\nde-emphasized mark keeps the contrast it had (and a transparent fill stays\ntransparent). Values d3-color can't parse, such as \"none\", are returned\nunchanged.",
      },
    },
  },
};

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {SwatchRows} from "../../helpers/Swatch.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const colors = ["#1c7ed6", "#c92a2a", "#f59f00", "rgba(47, 158, 68, 0.5)"];
const calls = colors.map(c => ({
  call: `colorGrayscale(${JSON.stringify(c)})`,
  result: JSON.stringify(colorGrayscale(c)),
}));

export const BasicExample = () => (
  <SwatchRows
    rows={colors.map(c => ({
      colors: [c, colorGrayscale(c)],
      labels: [c, colorGrayscale(c)],
    }))}
    separators={["→"]}
  />
);
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("color", "colorGrayscale", calls).docs,
    description: {
      story:
        "Removes a color's saturation but keeps its lightness and alpha, so each gray is as light as the color it replaces. Charts use it to fade the marks outside a highlight while their labels keep the contrast they were given.",
    },
  },
};
