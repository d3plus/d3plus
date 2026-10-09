// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/pointRotate.args";
import {pointRotate} from "@d3plus/math";

export default {
  title: "Math/pointRotate",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Rotates a point around a given origin.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 100) / 100;
const show = p => JSON.stringify(p.map(r));
const domain = {x: [-120, 120], y: [-120, 120]};

const Diagram = ({p, alpha, alphaSource, origin}) => {
  const args = origin ? [p, alpha, origin] : [p, alpha];
  const result = pointRotate(...args);
  const o = origin || [0, 0];
  const call = `pointRotate(${JSON.stringify(p)}, ${alphaSource}${origin ? `, ${JSON.stringify(origin)}` : ""})`;
  return (
    <GeometryExample
      domain={domain}
      shapes={[
        {type: "segment", from: [-120, 0], to: [120, 0], stroke: "#e9ecef"},
        {type: "segment", from: [0, -120], to: [0, 120], stroke: "#e9ecef"},
        {type: "segment", from: o, to: p, stroke: "#adb5bd", dashed: true},
        {type: "segment", from: o, to: result, stroke: "#1c7ed6"},
        {type: "point", at: o, fill: "#868e96", r: 3, label: "origin"},
        {type: "point", at: p, fill: "#868e96", label: show(p)},
        {type: "point", at: result, fill: "#1c7ed6", label: show(result)},
      ]}
      output={`${call}\n// → ${show(result)}`}
    />
  );
};

const params = (p, alpha, alphaSource, origin, story) => ({
  docs: {
    ...sourceSnippet("math", "pointRotate", [
      {
        call: `pointRotate(${JSON.stringify(p)}, ${alphaSource}${origin ? `, ${JSON.stringify(origin)}` : ""})`,
        result: show(pointRotate(p, alpha, origin)),
      },
    ]).docs,
    description: {story},
  },
});

export const BasicExample = () => <Diagram p={[100, 0]} alpha={Math.PI / 2} alphaSource="Math.PI / 2" />;
BasicExample.parameters = params(
  [100, 0],
  Math.PI / 2,
  "Math.PI / 2",
  undefined,
  "Rotates a point by an angle in radians around the origin `[0, 0]` by default. A quarter turn (π/2) moves `[100, 0]` onto the y axis; the tiny residue on x is ordinary floating-point error.",
);

export const CustomOrigin = () => <Diagram p={[80, 40]} alpha={Math.PI / 4} alphaSource="Math.PI / 4" origin={[40, 40]} />;
CustomOrigin.parameters = params(
  [80, 40],
  Math.PI / 4,
  "Math.PI / 4",
  [40, 40],
  "The third argument sets the center of rotation, so the point swings around `[40, 40]` instead of the origin. Radial layouts rotate label anchors this way.",
);
