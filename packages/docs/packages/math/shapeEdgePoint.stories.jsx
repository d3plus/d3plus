// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/shapeEdgePoint.args";
import {shapeEdgePoint} from "@d3plus/math";

export default {
  title: "Math/shapeEdgePoint",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Calculates the x/y position of a point at the edge of a shape, from the center of the shape, given a specified pixel distance and radian angle.",
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
const angles = [["0", 0], ["Math.PI / 4", Math.PI / 4], ["Math.PI / 2", Math.PI / 2], ["Math.PI", Math.PI], ["-Math.PI / 3", -Math.PI / 3]];
const distance = 80;
const domain = {x: [-120, 120], y: [-120, 120]};
// The diagram's y axis points up while shapeEdgePoint's points down (SVG), so flip y for drawing.
const flip = ([x, y]) => [x, -y];

const Diagram = ({shape}) => {
  const outline =
    shape === "circle"
      ? {type: "circle", at: [0, 0], r: (distance / 240) * (260 - 32), stroke: "#adb5bd"}
      : {type: "polygon", points: [[-80, -80], [80, -80], [80, 80], [-80, 80]], fill: "none", stroke: "#adb5bd"};
  const results = angles.map(([source, a]) => [source, shapeEdgePoint(a, distance, shape)]);
  return (
    <GeometryExample
      domain={domain}
      shapes={[
        outline,
        {type: "point", at: [0, 0], fill: "#868e96", r: 3},
        ...results.map(([source, p]) => ({type: "point", at: flip(p), label: source})),
      ]}
      output={results.map(([source, p]) => `shapeEdgePoint(${source}, ${distance}, "${shape}")\n// → ${show(p)}`).join("\n")}
    />
  );
};

const params = (shape, story) => ({
  docs: {
    ...sourceSnippet(
      "math",
      "shapeEdgePoint",
      angles.map(([source, a]) => ({call: `shapeEdgePoint(${source}, ${distance}, "${shape}")`, result: show(shapeEdgePoint(a, distance, shape))})),
    ).docs,
    description: {story},
  },
});

export const Circle = () => <Diagram shape="circle" />;
Circle.parameters = params(
  "circle",
  "Given an angle in radians and a distance, returns the `[x, y]` offset from the shape's center to its edge in that direction. For a circle that is simply the point at `distance` along the angle; angles run clockwise because y grows downward in SVG. Network and Rings use this to attach links to the edge of a node.",
);

export const Square = () => <Diagram shape="square" />;
Square.parameters = params(
  "square",
  "For a square, `distance` is half the side length and the point is where the ray leaves the square, so diagonal directions reach further from the center than axis-aligned ones. Only `\"circle\"` and `\"square\"` are supported; any other shape returns `null`.",
);
