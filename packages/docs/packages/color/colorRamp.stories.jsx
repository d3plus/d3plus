// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorRamp.args";
import {colorRamp} from "@d3plus/color";

export default {
  title: "Color/colorRamp",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Builds an n-step single-hue ramp from a pale tint to the given base color,\nstepped evenly in OKLab so each step looks equally far from the next.\n\nThis replaces lightening in HSL (which desaturates toward pure white and\nshifts hue, so the pale end loses its identity and can render as white). In\nOKLab the hue is held fixed and lightness/chroma taper together, so the ramp\nreads as one hue getting lighter.\n\nReturned lightest→darkest; the darkest step is the base color itself for a\ncontinuous ramp.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import sourceSnippet from "../../helpers/sourceSnippet.js";

const bases = ["#1c7ed6", "#2f9e44", "#ae3ec9"];

const Swatches = ({colors}) => (
  <div style={{display: "flex"}}>
    {colors.map((c, i) => (
      <div key={i} title={c} style={{background: c, width: 56, height: 56}} />
    ))}
  </div>
);

export const BasicExample = () => (
  <div style={{display: "flex", flexDirection: "column", gap: 8, fontFamily: "sans-serif"}}>
    {bases.map(base => <Swatches key={base} colors={colorRamp(base, 6)} />)}
  </div>
);
BasicExample.parameters = sourceSnippet(
  "color",
  "colorRamp",
  bases.map(base => ({
    call: `colorRamp(${JSON.stringify(base)}, 6)`,
    result: JSON.stringify(colorRamp(base, 6)),
  })),
);

export const OrdinalRamp = () => (
  <div style={{display: "flex", flexDirection: "column", gap: 8, fontFamily: "sans-serif"}}>
    {bases.map(base => <Swatches key={base} colors={colorRamp(base, 5, {ordinal: true})} />)}
  </div>
);
OrdinalRamp.parameters = {
  docs: {
    ...sourceSnippet(
      "color",
      "colorRamp",
      bases.map(base => ({
        call: `colorRamp(${JSON.stringify(base)}, 5, {ordinal: true})`,
        result: JSON.stringify(colorRamp(base, 5, {ordinal: true})),
      })),
    ).docs,
    description: {story: "With `{ordinal: true}` the palest step is held darker so every step still reads as a distinct mark against the surface — the ramp for ordered *discrete* categories, versus the default continuous ramp whose light end may fade into the background."},
  },
};
