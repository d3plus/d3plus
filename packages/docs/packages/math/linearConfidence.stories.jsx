// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/linearConfidence.args";
import {linearConfidence} from "@d3plus/math";

export default {
  title: "Math/linearConfidence",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Builds the confidence band for the mean response of a simple linear regression of points: ŷ ± t·s·√(1/n + (x − x̄)²/Sxx). Returns a function mapping an x value to its [lower, upper] bounds, or null when there are fewer than three usable points or the x values do not vary.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 100) / 100;
const noise = [0.4, -0.6, 0.9, -0.3, 0.5, -0.8, 0.2, 0.7, -0.4, 0.1];
const points = noise.map((e, i) => [i + 1, r(2 * (i + 1) + 1 + e * 2)]);
const xs = Array.from({length: 37}, (_, i) => 1 + i * 0.25);

const Diagram = ({level, levelSource}) => {
  const band = linearConfidence(points, level);
  const upper = xs.map(x => [x, band(x)[1]]);
  const lower = xs.map(x => [x, band(x)[0]]);
  const mid = xs.map(x => [x, (band(x)[0] + band(x)[1]) / 2]);
  const ys = [...upper, ...lower].map(p => p[1]);
  const call = `const band = linearConfidence(points${levelSource ? `, ${levelSource}` : ""});`;
  return (
    <GeometryExample
      width={320}
      domain={{x: [0, 11], y: [Math.min(...ys) - 1, Math.max(...ys) + 1]}}
      shapes={[
        {type: "band", upper, lower},
        {type: "polyline", points: mid, dashed: true},
        ...points.map(p => ({type: "point", at: p, r: 3})),
      ]}
      output={`${call}\n${[1, 5.5, 10].map(x => `band(${x}); // ${JSON.stringify(band(x).map(r))}`).join("\n")}`}
    />
  );
};

const params = (level, levelSource, story) => {
  const band = linearConfidence(points, level);
  return {
    docs: {
      ...sourceSnippet("math", "linearConfidence", [
        {
          call: `const points = ${JSON.stringify(points)};\nconst band = linearConfidence(points${levelSource ? `, ${levelSource}` : ""});\n[1, 5.5, 10].map(band)`,
          result: JSON.stringify([1, 5.5, 10].map(x => band(x).map(r))),
        },
      ]).docs,
      description: {story},
    },
  };
};

export const BasicExample = () => <Diagram />;
BasicExample.parameters = params(
  undefined,
  "",
  "Fits a straight line to the points and returns a function giving the `[lower, upper]` bounds of the 95% confidence band for the line at any x. The band is narrowest at the mean x and widens toward the ends, where the fit is least certain. Plot charts draw this behind a linear trend line.",
);

export const ConfidenceLevel = () => (
  <div style={{display: "grid", gap: 12}}>
    <Diagram level={0.8} levelSource="0.8" />
    <Diagram level={0.99} levelSource="0.99" />
  </div>
);
ConfidenceLevel.parameters = params(
  0.99,
  "0.99",
  "The second argument sets the confidence level: 80% gives a tighter band than the default, 99% a wider one. The result is `null` when fewer than three points are usable or the x values do not vary.",
);
