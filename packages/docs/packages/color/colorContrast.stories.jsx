// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorContrast.args";
import {colorContrast} from "@d3plus/color";

export default {
  title: "Color/colorContrast",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Based on the color provided, this function will return a \"white\" or \"black\" color that is suitable for text placed on top of that provided color. The choice maximizes the WCAG 2.x contrast ratio against the background, so the more legible of the two text tokens always wins.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import sourceSnippet from "../../helpers/sourceSnippet.js";

const backgrounds = ["#b22200", "#f8f9fa", "#1f77b4", "#ffeb3b", "#2c3e50", "#9ed763"];

export const BasicExample = () => (
  <div style={{display: "flex", gap: 8, flexWrap: "wrap", fontFamily: "sans-serif"}}>
    {backgrounds.map(bg => (
      <div key={bg} style={{background: bg, color: colorContrast(bg), padding: "20px 24px", borderRadius: 6, fontWeight: "bold"}}>
        {bg}
      </div>
    ))}
  </div>
);
BasicExample.parameters = {
  docs: {
    ...sourceSnippet(
      "color",
      "colorContrast",
      backgrounds.map(bg => ({
        call: `colorContrast(${JSON.stringify(bg)})`,
        result: JSON.stringify(colorContrast(bg)),
      })),
    ).docs,
    description: {story: "For each background swatch, the higher-contrast of the two text tokens is returned — the dark token over the pale `#f8f9fa` and `#ffeb3b` fills, the light token over the darker ones."},
  },
};
