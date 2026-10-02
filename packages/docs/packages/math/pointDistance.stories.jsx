// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/pointDistance.args";
import {pointDistance} from "@d3plus/math";

export default {
  title: "Math/pointDistance",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Calculates the pixel distance between two points.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const p1 = [40, 160];
const p2 = [200, 40];
const distance = pointDistance(p1, p2);
const call = `pointDistance(${JSON.stringify(p1)}, ${JSON.stringify(p2)})`;

export const BasicExample = () => (
  <GeometryExample
    shapes={[
      {type: "segment", from: p1, to: p2, dashed: true, label: String(distance)},
      {type: "point", at: p1, label: JSON.stringify(p1)},
      {type: "point", at: p2, label: JSON.stringify(p2)},
    ]}
    output={`${call}\n// → ${distance}`}
  />
);
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "pointDistance", [{call, result: String(distance)}]).docs,
    description: {
      story: "The straight-line (Euclidean) distance between two `[x, y]` points, in whatever units the coordinates use. A 160 by 120 offset gives the classic 200.",
    },
  },
};
