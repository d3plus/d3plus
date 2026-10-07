// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/lineIntersection.args";
import {lineIntersection} from "@d3plus/math";

export default {
  title: "Math/lineIntersection",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Finds the intersection point (if there is one) of the lines p1q1 and p2q2.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 100) / 100;
const show = p => (p ? JSON.stringify(p.map(r)) : "null");
const call = ([p1, q1, p2, q2]) => `lineIntersection(${[p1, q1, p2, q2].map(p => JSON.stringify(p)).join(", ")})`;

const Diagram = ({segments, dashed}) => {
  const [p1, q1, p2, q2] = segments;
  const hit = lineIntersection(p1, q1, p2, q2);
  return (
    <GeometryExample
      shapes={[
        {type: "segment", from: p1, to: q1, stroke: "#1c7ed6"},
        {type: "segment", from: p2, to: q2, stroke: "#2f9e44"},
        ...(dashed || []).map(([from, to]) => ({type: "segment", from, to, dashed: true, stroke: "#adb5bd"})),
        ...(hit ? [{type: "point", at: hit, label: show(hit)}] : []),
      ]}
      output={`${call(segments)}\n// → ${show(hit)}`}
    />
  );
};

const params = (segments, story) => ({
  docs: {
    ...sourceSnippet("math", "lineIntersection", [
      {call: call(segments), result: show(lineIntersection(...segments))},
    ]).docs,
    description: {story},
  },
});

const crossing = [[20, 160], [240, 40], [20, 40], [240, 160]];
export const BasicExample = () => <Diagram segments={crossing} />;
BasicExample.parameters = params(
  crossing,
  "Each line is given by two `[x, y]` points. The result is where the two lines meet; here the segments themselves cross, so the point lies on both.",
);

const parallel = [[20, 60], [240, 60], [20, 140], [240, 140]];
export const Parallel = () => <Diagram segments={parallel} />;
Parallel.parameters = params(
  parallel,
  "Parallel (or coincident) lines never meet, so the result is `null` instead of a point.",
);

const extended = [[20, 160], [100, 120], [160, 40], [240, 80]];
export const BeyondTheSegments = () => (
  <Diagram segments={extended} dashed={[[[100, 120], [210, 65]], [[160, 40], [210, 65]]]} />
);
BeyondTheSegments.parameters = params(
  extended,
  "The points define infinite lines, not bounded segments, so an intersection is returned even when it falls past the ends of both segments (dashed). Use `segmentsIntersect` when the segments themselves must cross.",
);
