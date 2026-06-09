// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/color/colorLegible.args";
import {colorLegible} from "@d3plus/color";

export default {
  title: "Color/colorLegible",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Darkens a color so that it will appear legible on a white background.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = () => {
  const colors = ["#aaddff", "#ffeb3b", "#c8e6c9", "#ff8a80", "#e0e0e0"];
  return (
    <div style={{display: "flex", gap: 12, fontFamily: "sans-serif"}}>
      {colors.map(c => (
        <div key={c} style={{textAlign: "center"}}>
          <div style={{background: c, padding: "14px 18px", borderRadius: 4}}>{c}</div>
          <div style={{color: colorLegible(c), padding: "10px", fontWeight: "bold"}}>legible on white</div>
        </div>
      ))}
    </div>
  );
};
