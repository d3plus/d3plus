// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/pointDistanceSquared.args";
import {pointDistanceSquared} from "@d3plus/math";

export default {
  title: "Math/pointDistanceSquared",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Returns the squared euclidean distance between two points.",
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
const distance = pointDistanceSquared(p1, p2);
const call = `pointDistanceSquared(${JSON.stringify(p1)}, ${JSON.stringify(p2)})`;

export const BasicExample = () => (
  <GeometryExample
    shapes={[
      {type: "segment", from: p1, to: p2, dashed: true, label: `√${distance} = ${Math.sqrt(distance)}`},
      {type: "point", at: p1, label: JSON.stringify(p1)},
      {type: "point", at: p2, label: JSON.stringify(p2)},
    ]}
    output={`${call}\n// → ${distance}`}
  />
);
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "pointDistanceSquared", [{call, result: String(distance)}]).docs,
    description: {
      story: "The distance before the square root is taken. Comparing squared distances ranks points by distance just as well and skips the `Math.sqrt`, so the layout code uses this whenever it only needs to know which of several points is nearest.",
    },
  },
};
