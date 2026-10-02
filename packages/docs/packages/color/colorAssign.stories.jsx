// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorAssign.args";
import {colorAssign} from "@d3plus/color";

export default {
  title: "Color/colorAssign",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Assigns a color to a value using a predefined set of defaults.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {Swatch} from "../../helpers/Swatch.jsx";
import CallGrid from "../../helpers/CallGrid.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const literal = v => (v === undefined ? "undefined" : JSON.stringify(v));

// Each row is [value] or [value, overrides]; the assigned color is live.
const calls = rows =>
  rows.map(([value, overrides]) => ({
    call: `colorAssign(${literal(value)}${overrides ? `, ${JSON.stringify(overrides)}` : ""})`,
    result: JSON.stringify(colorAssign(value, overrides)),
    color: colorAssign(value, overrides),
  }));

const renderSwatch = (result, row) => (
  <span style={{display: "inline-flex", alignItems: "center", gap: 8}}>
    <Swatch color={row.color} label="" size={18} />
    <code>{result}</code>
  </span>
);

const params = (rows, story) => ({
  docs: {...sourceSnippet("color", "colorAssign", calls(rows)).docs, description: {story}},
});

const basicRows = [[null], [undefined], [true], [false], ["#1c7ed6"], ["rebeccapurple"], ["Apples"], ["Bananas"], ["Apples"]];
export const BasicExample = () => <CallGrid calls={calls(basicRows)} renderResult={renderSwatch} />;
BasicExample.parameters = params(
  basicRows,
  "Turns any data value into a color using `colorDefaults`: `null` and `undefined` get the `missing` grey, `true` and `false` get the `on` green and `off` red, a valid CSS color is passed through unchanged, and any other value is fed to the ordinal `scale`, so the same string (`\"Apples\"`) always gets the same color.",
);

const overrideRows = [
  [true, {on: "#0ca678"}],
  [false, {off: "#f03e3e"}],
  [null, {missing: "#868e96"}],
];
export const Overrides = () => <CallGrid calls={calls(overrideRows)} renderResult={renderSwatch} />;
Overrides.parameters = params(
  overrideRows,
  "The second argument overrides any of the default slots for that call. Charts pass their `colorDefaults` config here, which is how a theme changes the missing, on, and off colors everywhere at once.",
);
