// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorDefaults.args";
import {colorDefaults} from "@d3plus/color";

export default {
  title: "Color/colorDefaults",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "A set of default color values used when assigning colors based on data.\n\nThe categorical scale is CVD-checked: its first eight slots (the identity\ntier) are open-color steps chosen to sit inside the OKLCH lightness band,\nclear the chroma floor, and stay distinguishable under protanopia and\ndeuteranopia — validate them with colorValidate. The slot order is the\ncolorblind-safety mechanism and should not be reshuffled. Slots nine and up\nare a lighter second ring of the same hues, for high-cardinality fallback\n(past ~8 series, prefer grouping the tail into \"Other\").\n\nsequential is the default single-hue anchor for magnitude ramps (blue).",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {Swatch, SwatchRow} from "../../helpers/Swatch.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const named = ["dark", "light", "missing", "off", "on", "sequential"];

export const BasicExample = () => (
  <div style={{display: "flex", gap: 16, flexWrap: "wrap"}}>
    {named.map(key => (
      <Swatch key={key} color={colorDefaults[key]} label={`${key}: ${colorDefaults[key]}`} />
    ))}
  </div>
);
BasicExample.parameters = {
  docs: {
    ...sourceSnippet(
      "color",
      "colorDefaults",
      named.map(key => ({call: `colorDefaults.${key}`, result: JSON.stringify(colorDefaults[key])})),
    ).docs,
    description: {
      story: "The named slots every chart starts from: `dark` and `light` for text and backgrounds, `missing` for values with no data, `on` and `off` for booleans, and `sequential` as the single hue that magnitude color scales ramp toward. Override any of them through a chart's `colorDefaults` config.",
    },
  },
};

const range = colorDefaults.scale.range();
export const CategoricalScale = () => (
  <div style={{display: "grid", gap: 12}}>
    <SwatchRow colors={range.slice(0, 8)} labels={range.slice(0, 8).map((c, i) => `${i + 1}`)} size={40} />
    <SwatchRow colors={range.slice(8)} labels={range.slice(8).map((c, i) => `${i + 9}`)} size={40} />
  </div>
);
CategoricalScale.parameters = {
  docs: {
    ...sourceSnippet("color", "colorDefaults", [
      {call: "colorDefaults.scale.range()", result: JSON.stringify(range)},
    ]).docs,
    description: {
      story: "`scale` is the ordinal scale categories are assigned from, in order. The first eight are the identity tier, chosen and ordered so neighbouring series stay distinguishable under the common forms of color-vision deficiency (check them with `colorValidate`); the next eight are a lighter ring of the same hues for charts with more series than that.",
    },
  },
};
