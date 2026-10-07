// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/segmentBoxContains.args";
import {segmentBoxContains} from "@d3plus/math";

export default {
  title: "Math/segmentBoxContains",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Checks whether a point is inside the bounding box of a line segment.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const s1 = [40, 40];
const s2 = [200, 160];
const inside = [100, 120];
const outside = [220, 100];
const call = p => `segmentBoxContains(${JSON.stringify(s1)}, ${JSON.stringify(s2)}, ${JSON.stringify(p)})`;

export const BasicExample = () => (
  <GeometryExample
    shapes={[
      {type: "rect", x: s1[0], y: s1[1], width: s2[0] - s1[0], height: s2[1] - s1[1], dashed: true},
      {type: "segment", from: s1, to: s2, stroke: "#1c7ed6"},
      {type: "point", at: inside, fill: "#2f9e44", label: `${JSON.stringify(inside)} → ${segmentBoxContains(s1, s2, inside)}`},
      {type: "point", at: outside, fill: "#e03131", label: `${JSON.stringify(outside)} → ${segmentBoxContains(s1, s2, outside)}`},
    ]}
    output={`${call(inside)}\n// → ${segmentBoxContains(s1, s2, inside)}\n\n${call(outside)}\n// → ${segmentBoxContains(s1, s2, outside)}`}
  />
);
BasicExample.parameters = {
  docs: {
    ...sourceSnippet("math", "segmentBoxContains", [
      {call: call(inside), result: String(segmentBoxContains(s1, s2, inside))},
      {call: call(outside), result: String(segmentBoxContains(s1, s2, outside))},
    ]).docs,
    description: {
      story: "Tests whether a point falls within the axis-aligned bounding box of a segment (dashed), not whether it lies on the segment itself. `segmentsIntersect` combines this with `lineIntersection` to confirm that a crossing point is actually on both segments.",
    },
  },
};
