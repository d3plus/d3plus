// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/kernelDensity.args";
import {kernelDensity} from "@d3plus/math";

export default {
  title: "Math/kernelDensity",
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Estimates the probability density of a set of observations with a kernel\ndensity estimate, evaluated on an evenly spaced grid. Each observation\ncontributes one kernel scaled to the bandwidth, and the sum is normalized\nso the curve's area is 1. Non-finite values are ignored; an empty input\nreturns an empty array.",
      },
    },
  },
};

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 1000) / 1000;
const sample = [
  1.2, 1.9, 2.1, 2.4, 2.6, 3.0, 3.1, 3.3, 4.8, 5.2, 5.5, 5.6, 6.1,
];

const Diagram = ({options, optionsSource}) => {
  const curve = kernelDensity(sample, options);
  const top = Math.max(...curve.map(p => p[1]));
  const call = `kernelDensity(values${optionsSource ? `, ${optionsSource}` : ""})`;
  const preview = curve
    .filter((_, i) => i % Math.ceil(curve.length / 4) === 0)
    .map(([x, y]) => [r(x), r(y)]);
  return (
    <GeometryExample
      width={320}
      domain={{
        x: [curve[0][0], curve[curve.length - 1][0]],
        y: [-top * 0.08, top * 1.1],
      }}
      shapes={[
        {type: "polyline", points: curve},
        ...sample.map(v => ({type: "point", at: [v, -top * 0.04], r: 2.5})),
      ]}
      output={`${call}\n// → ${curve.length} points, e.g.\n// ${JSON.stringify(preview)}`}
    />
  );
};

const params = (options, optionsSource, story) => ({
  docs: {
    ...sourceSnippet("math", "kernelDensity", [
      {
        call: `const values = ${JSON.stringify(sample)};\nkernelDensity(values${optionsSource ? `, ${optionsSource}` : ""})`,
        result: `${JSON.stringify(
          kernelDensity(sample, options)
            .slice(0, 3)
            .map(([x, y]) => [r(x), r(y)]),
        )} // …`,
      },
    ]).docs,
    description: {story},
  },
});

export const BasicExample = () => <Diagram />;
BasicExample.parameters = params(
  undefined,
  "",
  "Each observation (the dots) contributes a gaussian bump one bandwidth wide; their sum, normalized to an area of 1, is the density curve. The bandwidth defaults to Silverman's rule of thumb, and the curve runs 3 bandwidths past the data, sampled at 100 evenly spaced `[value, density]` points. Violin and Ridgeline draw these curves.",
);

export const Bandwidth = () => (
  <Diagram options={{bandwidth: 0.3}} optionsSource="{bandwidth: 0.3}" />
);
Bandwidth.parameters = params(
  {bandwidth: 0.3},
  "{bandwidth: 0.3}",
  "A smaller `bandwidth` follows the data more closely and shows more bumps; a larger one smooths them away. It can also be a function of the values, such as a different rule of thumb.",
);

export const Epanechnikov = () => (
  <Diagram
    options={{kernel: "epanechnikov", cut: 0, points: 60}}
    optionsSource={'{kernel: "epanechnikov", cut: 0, points: 60}'}
  />
);
Epanechnikov.parameters = params(
  {kernel: "epanechnikov", cut: 0, points: 60},
  '{kernel: "epanechnikov", cut: 0, points: 60}',
  '`kernel` picks the bump\'s shape: `"gaussian"` (default), `"epanechnikov"` (a parabola scaled to the gaussian\'s spread, so the same bandwidth smooths about as much), or any function of the scaled distance. `cut: 0` stops the curve at the smallest and largest value, and `points` sets how many values it is evaluated at; `extent` fixes the range outright.',
);
