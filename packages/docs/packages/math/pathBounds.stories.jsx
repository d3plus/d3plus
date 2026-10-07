// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/pathBounds.args";
import {pathBounds} from "@d3plus/math";

export default {
  title: "Math/pathBounds",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Computes the exact bounding box of an SVG path string with no DOM involved,\nevaluating the true extrema of each Bézier and arc segment (not a sampled\napproximation). Returns {x, y, width, height}, or a zero-size box at the\norigin for an empty/unparseable path.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 100) / 100;
const summary = b => ({x: r(b.x), y: r(b.y), width: r(b.width), height: r(b.height)});

const Diagram = ({d}) => {
  const b = pathBounds(d);
  return (
    <GeometryExample
      shapes={[
        {type: "rect", x: b.x, y: b.y, width: b.width, height: b.height, dashed: true},
        {type: "path", d},
      ]}
      output={`pathBounds(${JSON.stringify(d)})\n// → ${JSON.stringify(summary(b))}`}
    />
  );
};

const params = (d, story) => ({
  docs: {
    ...sourceSnippet("math", "pathBounds", [{call: `pathBounds(${JSON.stringify(d)})`, result: JSON.stringify(summary(pathBounds(d)))}]).docs,
    description: {story},
  },
});

const bezier = "M 30 150 C 90 10, 170 10, 230 150";
export const BasicExample = () => <Diagram d={bezier} />;
BasicExample.parameters = params(
  bezier,
  "The exact bounding box of a path, computed from the true extrema of each curve rather than from its control points or a sampled approximation, with no DOM involved. The control points of this Bézier sit at y = 10, but the curve itself never gets that high, and the box reflects the curve.",
);

const arc = "M 40 120 A 70 70 0 0 1 180 120";
export const Arcs = () => <Diagram d={arc} />;
Arcs.parameters = params(
  arc,
  "Arc commands are handled too: the box reaches the top of the semicircle even though neither endpoint is there. Server-side rendering uses this to size `<path>` output without a browser.",
);
