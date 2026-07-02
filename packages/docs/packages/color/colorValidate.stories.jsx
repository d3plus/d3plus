// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorValidate.args";
import {colorValidate} from "@d3plus/color";

export default {
  title: "Color/colorValidate",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Validates a chart color palette against the computable accessibility checks.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import sourceSnippet from "../../helpers/sourceSnippet.js";
import {colorDefaults, colorRamp} from "@d3plus/color";

const STATE_COLOR = {pass: "#2b8a3e", warn: "#e8590c", fail: "#c92a2a"};

const Report = ({palette, result}) => (
  <div style={{fontFamily: "sans-serif", fontSize: 13}}>
    <div style={{display: "flex", marginBottom: 12}}>
      {palette.map((c, i) => (
        <div key={i} title={c} style={{background: c, width: 44, height: 44}} />
      ))}
    </div>
    <table style={{borderCollapse: "collapse"}}>
      <tbody>
        {result.checks.map(({name, state, detail}) => (
          <tr key={name}>
            <td style={{padding: "3px 12px 3px 0", fontWeight: "bold", color: STATE_COLOR[state]}}>
              {state.toUpperCase()}
            </td>
            <td style={{padding: "3px 12px 3px 0", whiteSpace: "nowrap"}}>{name}</td>
            <td style={{padding: "3px 0", color: "#666"}}>{detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <p style={{marginTop: 10, fontWeight: "bold"}}>
      {result.ok ? "✓ No hard failures." : "✗ Fix the failing checks."}
    </p>
  </div>
);

export const DefaultPalette = () => {
  const palette = colorDefaults.scale.range().slice(0, 8);
  return <Report palette={palette} result={colorValidate(palette)} />;
};
DefaultPalette.parameters = sourceSnippet("color", "colorValidate, colorDefaults", [{
  call: "colorValidate(colorDefaults.scale.range().slice(0, 8))",
  result: JSON.stringify(colorValidate(colorDefaults.scale.range().slice(0, 8)), null, 2),
}]);

export const OrdinalRamp = () => {
  const palette = colorRamp(colorDefaults.sequential, 5, {ordinal: true});
  return <Report palette={palette} result={colorValidate(palette, {ordinal: true})} />;
};
OrdinalRamp.parameters = {
  docs: {
    ...sourceSnippet("color", "colorValidate, colorRamp, colorDefaults", [{
      call: "colorValidate(colorRamp(colorDefaults.sequential, 5, {ordinal: true}), {ordinal: true})",
      result: JSON.stringify(
        colorValidate(colorRamp(colorDefaults.sequential, 5, {ordinal: true}), {ordinal: true}),
        null,
        2,
      ),
    }]).docs,
    description: {story: "Pass `{ordinal: true}` to validate an ordered single-hue ramp instead: it checks monotone lightness, visible step gaps, a light end that still clears the surface, and a single hue — the categorical checks would fail a correct ramp by design."},
  },
};

