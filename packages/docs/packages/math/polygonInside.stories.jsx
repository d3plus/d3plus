// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/polygonInside.args";
import {polygonInside} from "@d3plus/math";

export default {
  title: "Math/polygonInside",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Checks if one polygon is inside another polygon.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const outer = [[20, 20], [240, 30], [230, 180], [30, 170]];
const inner = [[70, 60], [180, 70], [170, 140], [80, 130]];
const overlapping = [[150, 60], [300, 70], [290, 140], [160, 130]];

const Diagram = ({a, b}) => (
  <GeometryExample
    width={320}
    shapes={[
      {type: "polygon", points: b, fill: "rgba(134, 142, 150, 0.12)", stroke: "#868e96", label: "polyB"},
      {type: "polygon", points: a, label: "polyA"},
    ]}
    output={`polygonInside(polyA, polyB)\n// → ${polygonInside(a, b)}`}
  />
);

const params = (a, b, story) => ({
  docs: {
    ...sourceSnippet("math", "polygonInside", [
      {
        call: `const polyA = ${JSON.stringify(a)};\nconst polyB = ${JSON.stringify(b)};\npolygonInside(polyA, polyB)`,
        result: String(polygonInside(a, b)),
      },
    ]).docs,
    description: {story},
  },
});

export const BasicExample = () => <Diagram a={inner} b={outer} />;
BasicExample.parameters = params(
  inner,
  outer,
  "True when every point of the first polygon lies inside the second and none of their edges cross. The layout uses this to decide whether a label's box fits within a shape.",
);

export const Overlapping = () => <Diagram a={overlapping} b={outer} />;
Overlapping.parameters = params(
  overlapping,
  outer,
  "A polygon that pokes out of the container is not inside it, even though most of its area overlaps.",
);
