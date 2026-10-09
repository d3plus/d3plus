// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/largestRect.args";
import {largestRect} from "@d3plus/math";

export default {
  title: "Math/largestRect",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Finds the largest rectangle that fits inside a given polygon, optimizing for area across configurable rotations and aspect ratios.\n\nAn angle of zero means that the longer side of the polygon (the width) will be aligned with the x axis. An angle of 90 and/or -90 means that the longer side of the polygon (the width) will be aligned with the y axis. The value can be a number between -90 and 90 specifying the angle of rotation of the polygon, a string which is parsed to a number, or an array of numbers specifying the possible rotations of the polygon.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 100) / 100;
const poly = [[30, 60], [120, 15], [230, 40], [245, 150], [150, 190], [40, 165]];
const summary = ({width, height, cx, cy, angle, area}) => ({width: r(width), height: r(height), cx: r(cx), cy: r(cy), angle: r(angle), area: r(area)});

const Diagram = ({options, optionsSource}) => {
  const rect = largestRect(poly, options);
  const call = `largestRect(poly${optionsSource ? `, ${optionsSource}` : ""})`;
  return (
    <GeometryExample
      shapes={[
        {type: "polygon", points: poly},
        ...(rect ? [{type: "polygon", points: rect.points, fill: "rgba(240, 140, 0, 0.18)", stroke: "#f08c00"}] : []),
        ...(rect ? [{type: "point", at: [rect.cx, rect.cy], fill: "#f08c00", r: 3}] : []),
      ]}
      output={`${call}\n// → ${rect ? JSON.stringify(summary(rect), null, 2).replace(/\n/g, "\n//   ") : "null"}`}
    />
  );
};

const params = (options, optionsSource, story) => ({
  docs: {
    ...sourceSnippet("math", "largestRect", [
      {
        call: `const poly = ${JSON.stringify(poly)};\nlargestRect(poly${optionsSource ? `, ${optionsSource}` : ""})`,
        result: JSON.stringify(summary(largestRect(poly, options)), null, 2),
      },
    ]).docs,
    description: {story},
  },
});

export const BasicExample = () => <Diagram />;
BasicExample.parameters = params(
  undefined,
  "",
  "Searches for the largest rectangle that fits inside a polygon, trying a range of angles and aspect ratios from several starting points. The result carries the rectangle's `points`, center, `angle`, and `area`. Treemap and Geomap use it to find room for a label inside an irregular shape. The search starts from random origins, so repeated runs can land on slightly different rectangles.",
);

export const FixedAngle = () => <Diagram options={{angle: 0}} optionsSource="{angle: 0}" />;
FixedAngle.parameters = params(
  {angle: 0},
  "{angle: 0}",
  "`angle` restricts the candidate orientations, here to horizontal only, which is what text labels need. It accepts a single angle in degrees or an array of them.",
);

export const SquareAspect = () => <Diagram options={{aspectRatio: 1}} optionsSource="{aspectRatio: 1}" />;
SquareAspect.parameters = params(
  {aspectRatio: 1},
  "{aspectRatio: 1}",
  "`aspectRatio` fixes width over height, so the search returns the largest square instead of the largest rectangle. `minAspectRatio` and `maxAspectRatio` bound the search instead of pinning it.",
);

export const FixedOrigin = () => <Diagram options={{origin: [140, 100], angle: 0}} optionsSource="{origin: [140, 100], angle: 0}" />;
FixedOrigin.parameters = params(
  {origin: [140, 100], angle: 0},
  "{origin: [140, 100], angle: 0}",
  "`origin` makes the rectangle grow from a specific point instead of random starting points, which makes the result deterministic and lets a label be centered on a chosen spot.",
);
