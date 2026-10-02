// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorLighter.args";
import {colorLighter} from "@d3plus/color";

export default {
  title: "Color/colorLighter",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {SwatchRow} from "../../helpers/Swatch.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

// Each row is [color] or [color, strength]; the lightened color is live.
const calls = rows =>
  rows.map(([c, i]) => ({
    call: `colorLighter(${JSON.stringify(c)}${i === undefined ? "" : `, ${i}`})`,
    result: JSON.stringify(colorLighter(c, i)),
    colors: [c, colorLighter(c, i)],
    labels: [c, i === undefined ? colorLighter(c, i) : `${i}: ${colorLighter(c, i)}`],
  }));

const Rows = ({rows}) => (
  <div style={{display: "grid", gap: 16}}>
    {calls(rows).map(({call, colors, labels}) => (
      <SwatchRow key={call} colors={colors} labels={labels} separators={["→"]} />
    ))}
  </div>
);

const params = (rows, story) => ({
  docs: {...sourceSnippet("color", "colorLighter", calls(rows)).docs, description: {story}},
});

const basicRows = [["#1c7ed6"], ["#c92a2a"], ["#2f9e44"]];
export const BasicExample = () => <Rows rows={basicRows} />;
BasicExample.parameters = params(
  basicRows,
  "Lightens a color by moving its HSL lightness halfway toward white while taking the same amount off its saturation, so the result reads as a tint rather than the neon that plain brightening produces. Charts use it for hover states and the lighter second ring of the categorical palette.",
);

const strengthRows = [["#1c7ed6", 0.25], ["#1c7ed6", 0.5], ["#1c7ed6", 0.75], ["#1c7ed6", 1]];
export const Strength = () => <Rows rows={strengthRows} />;
Strength.parameters = params(
  strengthRows,
  "The second argument sets how far toward white to go, from 0 (unchanged) to 1 (white). It is scaled by the room the color has left, so a strength of 0.5 always lands halfway between the color and white.",
);
