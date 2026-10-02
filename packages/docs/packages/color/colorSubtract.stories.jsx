// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorSubtract.args";
import {colorSubtract} from "@d3plus/color";

export default {
  title: "Color/colorSubtract",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Subtracts one color from another.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {SwatchRows} from "../../helpers/Swatch.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

// Each row is [c1, c2] or [c1, c2, o1, o2]; the result is computed live.
const mixes = rows =>
  rows.map(([c1, c2, o1, o2]) => {
    const args = [c1, c2, ...(o1 === undefined ? [] : [o1, o2])];
    return {
      c1,
      c2,
      o2,
      result: colorSubtract(...args),
      call: `colorSubtract(${args.map(a => JSON.stringify(a)).join(", ")})`,
    };
  });

const Mixes = ({rows}) => (
  <SwatchRows
    rows={mixes(rows).map(({c1, c2, o2, result}) => ({
      colors: [c1, c2, result],
      labels: [c1, o2 === undefined ? c2 : `${c2} × ${o2}`, result],
    }))}
    separators={["−", "="]}
  />
);

const params = (rows, story) => ({
  docs: {
    ...sourceSnippet(
      "color",
      "colorSubtract",
      mixes(rows).map(({call, result}) => ({call, result: JSON.stringify(result)})),
    ).docs,
    description: {story},
  },
});

const basicRows = [["#ff00ff", "#0000ff"], ["orange", "yellow"], ["#1c7ed6", "#2f9e44"]];
export const BasicExample = () => <Mixes rows={basicRows} />;
BasicExample.parameters = params(
  basicRows,
  "The inverse of `colorAdd`: removes the second color's contribution from the first in HSL, pushing the hue away from it and un-averaging saturation and lightness. Taking blue out of magenta leaves red; taking yellow out of orange leaves a redder orange.",
);

const opacityRows = [["#ff00ff", "#0000ff", 1, 0.25], ["#ff00ff", "#0000ff", 1, 0.5], ["#ff00ff", "#0000ff", 1, 1]];
export const WithOpacity = () => <Mixes rows={opacityRows} />;
WithOpacity.parameters = params(
  opacityRows,
  "The weights work as in `colorAdd`, scaling the subtracted terms before they are applied, so a partial weight swings the hue rather than fading: magenta minus a quarter of blue lands on cyan, minus half on green, and only the full weight reaches red.",
);
