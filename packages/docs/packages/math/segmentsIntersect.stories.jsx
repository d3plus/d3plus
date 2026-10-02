// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/segmentsIntersect.args";
import {segmentsIntersect} from "@d3plus/math";

export default {
  title: "Math/segmentsIntersect",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Checks whether the line segments p1q1 && p2q2 intersect.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const call = ([p1, q1, p2, q2]) => `segmentsIntersect(${[p1, q1, p2, q2].map(p => JSON.stringify(p)).join(", ")})`;

const Diagram = ({segments}) => {
  const [p1, q1, p2, q2] = segments;
  const result = segmentsIntersect(p1, q1, p2, q2);
  return (
    <GeometryExample
      shapes={[
        {type: "segment", from: p1, to: q1, stroke: "#1c7ed6"},
        {type: "segment", from: p2, to: q2, stroke: result ? "#e03131" : "#2f9e44"},
      ]}
      output={`${call(segments)}\n// → ${result}`}
    />
  );
};

const params = (segments, story) => ({
  docs: {
    ...sourceSnippet("math", "segmentsIntersect", [{call: call(segments), result: String(segmentsIntersect(...segments))}]).docs,
    description: {story},
  },
});

const crossing = [[20, 160], [240, 40], [20, 40], [240, 160]];
export const BasicExample = () => <Diagram segments={crossing} />;
BasicExample.parameters = params(
  crossing,
  "True when the two segments share a point. Unlike `lineIntersection`, the crossing has to fall within both segments' extents.",
);

const disjoint = [[20, 160], [100, 120], [160, 40], [240, 80]];
export const Disjoint = () => <Diagram segments={disjoint} />;
Disjoint.parameters = params(
  disjoint,
  "These segments lie on lines that do meet, but past their ends, so they do not intersect. Network and Sankey layouts use this check to detect overlapping links.",
);
