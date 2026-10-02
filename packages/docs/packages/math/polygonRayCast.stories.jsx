// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/polygonRayCast.args";
import {polygonRayCast} from "@d3plus/math";

export default {
  title: "Math/polygonRayCast",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Gives the two closest intersection points between a ray cast from a point inside a polygon. The two points should lie on opposite sides of the origin.",
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
const poly = [[40, 30], [200, 20], [250, 100], [210, 180], [60, 170], [20, 90]];
const origin = [130, 100];

const Diagram = ({alpha = 0, alphaSource}) => {
  const [left, right] = polygonRayCast(poly, origin, alpha);
  const dx = Math.cos(alpha) * 300;
  const dy = Math.sin(alpha) * 300;
  const call = `polygonRayCast(poly, ${JSON.stringify(origin)}${alphaSource ? `, ${alphaSource}` : ""})`;
  return (
    <GeometryExample
      shapes={[
        {type: "polygon", points: poly},
        {type: "segment", from: [origin[0] - dx, origin[1] - dy], to: [origin[0] + dx, origin[1] + dy], dashed: true, stroke: "#adb5bd"},
        {type: "point", at: origin, fill: "#868e96", label: "origin"},
        ...(left ? [{type: "point", at: left, label: show(left)}] : []),
        ...(right ? [{type: "point", at: right, label: show(right)}] : []),
      ]}
      output={`${call}\n// → [${show(left)}, ${show(right)}]`}
    />
  );
};

const params = (alpha, alphaSource, story) => ({
  docs: {
    ...sourceSnippet("math", "polygonRayCast", [
      {
        call: `const poly = ${JSON.stringify(poly)};\npolygonRayCast(poly, ${JSON.stringify(origin)}${alphaSource ? `, ${alphaSource}` : ""})`,
        result: `[${polygonRayCast(poly, origin, alpha).map(show).join(", ")}]`,
      },
    ]).docs,
    description: {story},
  },
});

export const BasicExample = () => <Diagram />;
BasicExample.parameters = params(
  0,
  "",
  "Casts a line through a point inside the polygon and returns where it meets the edges on either side: the closest crossing to the left of the origin and the closest to the right. With the default angle of 0 the ray is horizontal, which is how a label's available width at a given height is found.",
);

export const AngledRay = () => <Diagram alpha={Math.PI / 4} alphaSource="Math.PI / 4" />;
AngledRay.parameters = params(
  Math.PI / 4,
  "Math.PI / 4",
  "The third argument is the ray's angle in radians. At π/4 the two crossings sit on the diagonal through the origin.",
);
