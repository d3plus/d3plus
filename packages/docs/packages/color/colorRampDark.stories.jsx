// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorRampDark.args";
import {colorRampDark} from "@d3plus/color";

export default {
  title: "Color/colorRampDark",
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Builds an n-step single-hue ramp for a dark background: from a deep,\nlow-chroma tint of the base just above the background up to the bright base\ncolor, stepped evenly in OKLab. Low values recede into the background and\nhigh values glow, the mirror of colorRamp on a light background.\n\nReturned dimmest→brightest (low→high), so it swaps in for colorRamp\nwherever a ramp maps low values to its first step. The brightest step is\nthe base color itself for a continuous ramp.",
      },
    },
  },
};

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import sourceSnippet from "../../helpers/sourceSnippet.js";

const background = "#212529";
const bases = ["#4dabf7", "#69db7c", "#ff6b6b"];

const Swatches = ({colors}) => (
  <div style={{display: "flex"}}>
    {colors.map((c, i) => (
      <div key={i} title={c} style={{background: c, width: 56, height: 56}} />
    ))}
  </div>
);

const Panel = ({children}) => (
  <div
    style={{
      display: "inline-flex",
      flexDirection: "column",
      gap: 8,
      padding: 16,
      background,
      fontFamily: "sans-serif",
    }}
  >
    {children}
  </div>
);

export const BasicExample = () => (
  <Panel>
    {bases.map(base => (
      <Swatches key={base} colors={colorRampDark(base, 6, {background})} />
    ))}
  </Panel>
);
BasicExample.parameters = {
  docs: {
    ...sourceSnippet(
      "color",
      "colorRampDark",
      bases.map(base => ({
        call: `colorRampDark(${JSON.stringify(base)}, 6, {background: "${background}"})`,
        result: JSON.stringify(colorRampDark(base, 6, {background})),
      })),
    ).docs,
    description: {
      story:
        "Builds a six-step ramp from each of three bright base hues on a dark background, returned dimmest to brightest with the base color itself as the final step. The dim end is a low-chroma tint just above the background, so the lowest step still reads as a mark.",
    },
  },
};

export const OrdinalRamp = () => (
  <Panel>
    {bases.map(base => (
      <Swatches
        key={base}
        colors={colorRampDark(base, 5, {background, ordinal: true})}
      />
    ))}
  </Panel>
);
OrdinalRamp.parameters = {
  docs: {
    ...sourceSnippet(
      "color",
      "colorRampDark",
      bases.map(base => ({
        call: `colorRampDark(${JSON.stringify(base)}, 5, {background: "${background}", ordinal: true})`,
        result: JSON.stringify(
          colorRampDark(base, 5, {background, ordinal: true}),
        ),
      })),
    ).docs,
    description: {
      story:
        "With `{ordinal: true}` the dim end is lifted further off the background and keeps more chroma, so every step reads as a distinct mark: the ramp for ordered *discrete* categories on a dark surface.",
    },
  },
};
