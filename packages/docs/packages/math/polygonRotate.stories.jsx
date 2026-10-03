// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/polygonRotate.args";
import {polygonRotate} from "@d3plus/math";

export default {
  title: "Math/polygonRotate",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Rotates a polygon around a given origin.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 100) / 100;
const poly = [[60, 70], [200, 60], [210, 130], [90, 150]];
const center = [140, 100];
const alpha = Math.PI / 6;
const rotated = polygonRotate(poly, alpha, center);
const show = pts => JSON.stringify(pts.map(p => p.map(r)));
const call = `polygonRotate(poly, Math.PI / 6, ${JSON.stringify(center)})`;

export const BasicExample = () => (
  <GeometryExample
    shapes={[
      {type: "polygon", points: poly, fill: "none", stroke: "#adb5bd", dashed: true},
      {type: "polygon", points: rotated},
      {type: "point", at: center, fill: "#868e96", r: 3, label: "origin"},
    ]}
    output={`${call}\n// → ${show(rotated).replace(/\],\[/g, "],\n//    [")}`}
  />
);
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "polygonRotate", [
      {call: `const poly = ${JSON.stringify(poly)};\n${call}`, result: show(rotated)},
    ]).docs,
    description: {
      story: "Rotates every point of a polygon by the same angle (radians) around an origin, which defaults to `[0, 0]`. Here the dashed shape turns 30° about its own center into the solid one. `largestRect` tries candidate rectangles at many angles this way.",
    },
  },
};
