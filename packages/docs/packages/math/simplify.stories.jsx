// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/simplify.args";
import {simplify} from "@d3plus/math";

export default {
  title: "Math/simplify",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Simplifies the points of a polygon using both the Ramer-Douglas-Peucker algorithm and basic distance-based simplification. Adapted to an ES6 module from the excellent [Simplify.js](http://mourner.github.io/simplify-js/).",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 100) / 100;
const poly = Array.from({length: 21}, (_, i) => [20 + i * 11, r(100 + Math.sin(i / 2) * 40 + ((i % 3) - 1) * 3)]);

const Diagram = ({tolerance, highestQuality}) => {
  const args = highestQuality ? [tolerance, true] : tolerance === undefined ? [] : [tolerance];
  const result = simplify(poly, ...args);
  const call = `simplify(poly${args.length ? `, ${args.join(", ")}` : ""})`;
  return (
    <GeometryExample
      shapes={[
        {type: "polyline", points: poly, stroke: "#adb5bd", dashed: true},
        ...poly.map(p => ({type: "point", at: p, r: 2, fill: "#adb5bd"})),
        {type: "polyline", points: result},
        ...result.map(p => ({type: "point", at: p, r: 3, fill: "#1c7ed6"})),
      ]}
      output={`${call}\n// → ${result.length} of ${poly.length} points kept\n// ${JSON.stringify(result)}`}
    />
  );
};

const params = (sets, story) => ({
  docs: {
    ...sourceSnippet(
      "math",
      "simplify",
      sets.map(args => ({
        call: `simplify(poly${args.length ? `, ${args.join(", ")}` : ""})`,
        result: `${simplify(poly, ...args).length} points: ${JSON.stringify(simplify(poly, ...args))}`,
      })),
    ).docs,
    description: {story},
  },
});

export const BasicExample = () => <Diagram tolerance={4} />;
BasicExample.parameters = params(
  [[4]],
  "Removes points that do not change the shape by more than `tolerance` (in coordinate units) using the Ramer–Douglas–Peucker algorithm: the dashed line is the original, the solid one keeps only the points that matter at a tolerance of 4. Geomap simplifies polygons this way before drawing.",
);

export const Tolerance = () => (
  <div style={{display: "grid", gap: 12}}>
    <Diagram tolerance={1} />
    <Diagram tolerance={12} />
  </div>
);
Tolerance.parameters = params(
  [[1], [12]],
  "A small tolerance keeps almost every point; a large one keeps only the turns, trading detail for far fewer vertices.",
);

export const HighestQuality = () => <Diagram tolerance={4} highestQuality />;
HighestQuality.parameters = params(
  [[4, true]],
  "By default a quick radial-distance pass drops near-duplicate points before the main algorithm runs. `highestQuality: true` skips that pass, which can keep a few more points at the same tolerance and runs noticeably slower on large polygons.",
);
