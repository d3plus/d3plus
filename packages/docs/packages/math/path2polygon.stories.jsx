// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/path2polygon.args";
import {path2polygon} from "@d3plus/math";

export default {
  title: "Math/path2polygon",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Transforms a path string into an Array of points, with no DOM involved.\nStraight segments contribute their endpoints; curves and arcs are flattened\ninto line segments no longer than segmentLength. Higher segmentLength\nvalues lower computation time but yield more rigid curves.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 100) / 100;
const d = "M 20 150 C 80 20, 160 20, 240 150";

const Diagram = ({segmentLength}) => {
  const points = path2polygon(d, segmentLength);
  const call = `path2polygon(${JSON.stringify(d)}${segmentLength === undefined ? "" : `, ${segmentLength}`})`;
  return (
    <GeometryExample
      shapes={[
        {type: "path", d, stroke: "#adb5bd"},
        {type: "polyline", points},
        ...points.map(p => ({type: "point", at: p, r: 3})),
      ]}
      output={`${call}\n// → ${points.length} points\n// ${JSON.stringify(points.map(p => p.map(r)))}`}
    />
  );
};

const params = (segmentLength, story) => ({
  docs: {
    ...sourceSnippet("math", "path2polygon", [
      {
        call: `path2polygon(${JSON.stringify(d)}${segmentLength === undefined ? "" : `, ${segmentLength}`})`,
        result: JSON.stringify(path2polygon(d, segmentLength).map(p => p.map(r))),
      },
    ]).docs,
    description: {story},
  },
});

export const BasicExample = () => <Diagram />;
BasicExample.parameters = params(
  undefined,
  "Turns an SVG path string into an array of `[x, y]` points without touching the DOM: straight segments contribute their endpoints and curves are flattened into straight pieces no longer than `segmentLength` (50 by default). The grey curve is the path, the blue polyline its polygon.",
);

export const SegmentLength = () => (
  <div style={{display: "grid", gap: 12}}>
    <Diagram segmentLength={10} />
    <Diagram segmentLength={100} />
  </div>
);
SegmentLength.parameters = params(
  10,
  "A shorter `segmentLength` follows the curve closely at the cost of more points; a longer one is faster but more angular. Shapes use the polygon for hit-testing and for fitting labels with `largestRect`.",
);
