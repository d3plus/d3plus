// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorAdd.args";
import {colorAdd} from "@d3plus/color";

export default {
  title: "Color/colorAdd",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Adds two colors together.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {SwatchRow} from "../../helpers/Swatch.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

// Each row is [c1, c2] or [c1, c2, o1, o2]; the mixed color is computed live.
const mixes = rows =>
  rows.map(([c1, c2, o1, o2]) => {
    const args = [c1, c2, ...(o1 === undefined ? [] : [o1, o2])];
    return {
      c1,
      c2,
      o2,
      result: colorAdd(...args),
      call: `colorAdd(${args.map(a => JSON.stringify(a)).join(", ")})`,
    };
  });

const Mixes = ({rows}) => (
  <div style={{display: "grid", gap: 16}}>
    {mixes(rows).map(({c1, c2, o2, result, call}) => (
      <SwatchRow
        key={call}
        colors={[c1, c2, result]}
        labels={[c1, o2 === undefined ? c2 : `${c2} × ${o2}`, result]}
        separators={["+", "="]}
      />
    ))}
  </div>
);

const params = (rows, story) => ({
  docs: {
    ...sourceSnippet(
      "color",
      "colorAdd",
      mixes(rows).map(({call, result}) => ({call, result: JSON.stringify(result)})),
    ).docs,
    description: {story},
  },
});

const basicRows = [["#ff0000", "#0000ff"], ["red", "yellow"], ["#1c7ed6", "#2f9e44"]];
export const BasicExample = () => <Mixes rows={basicRows} />;
BasicExample.parameters = params(
  basicRows,
  "Mixes two colors by meeting halfway in HSL: the hue lands between the two along the shorter way around the wheel, and saturation and lightness are averaged. Red and blue give purple, red and yellow give orange.",
);

const opacityRows = [["#ff0000", "#0000ff", 1, 0.25], ["#ff0000", "#0000ff", 1, 0.5], ["#ff0000", "#0000ff", 1, 1]];
export const WithOpacity = () => <Mixes rows={opacityRows} />;
WithOpacity.parameters = params(
  opacityRows,
  "The optional third and fourth arguments weight each color from 0 to 1. The weights scale the hue, saturation, and lightness terms before they are averaged, so a partial weight is not a simple fade: at `o2: 0.25` red and blue mix to a dark brown, at `0.5` to an olive, and only at `1` to the full purple.",
);
