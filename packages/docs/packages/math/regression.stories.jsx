// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/math/regression.args";
import {regression} from "@d3plus/math";

export default {
  title: "Math/regression",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Fits a regression model to a set of [x, y] points. Points with non-finite values, or that fall outside a model's domain (y ≤ 0 for exponential, x ≤ 0 for logarithmic, either for power), are ignored. Returns null when there are too few usable points or the x values do not vary.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import GeometryExample from "../../helpers/GeometryExample.jsx";
import sourceSnippet from "../../helpers/sourceSnippet.js";

const r = n => Math.round(n * 1000) / 1000;
const noise = [0.4, -0.6, 0.9, -0.3, 0.5, -0.8, 0.2, 0.7, -0.4, 0.1];
const sample = fn => noise.map((e, i) => [i + 1, r(fn(i + 1) + e)]);
const xs = Array.from({length: 37}, (_, i) => 1 + i * 0.25);
const summary = ({type, coefficients, r2, n}) => ({type, coefficients: coefficients.map(r), r2: r(r2), n});

const Diagram = ({points, type, options, optionsSource}) => {
  const fit = regression(points, type, options);
  const curve = xs.map(x => [x, fit.predict(x)]);
  const ys = [...points, ...curve].map(p => p[1]);
  const call = `regression(points, "${type}"${optionsSource ? `, ${optionsSource}` : ""})`;
  return (
    <GeometryExample
      width={320}
      domain={{x: [0, 11], y: [Math.min(...ys) - 1, Math.max(...ys) + 1]}}
      shapes={[{type: "polyline", points: curve}, ...points.map(p => ({type: "point", at: p, r: 3}))]}
      output={`${call}\n// → ${JSON.stringify(summary(fit), null, 2).replace(/\n/g, "\n//   ")}`}
    />
  );
};

const params = (points, type, options, optionsSource, story) => ({
  docs: {
    ...sourceSnippet("math", "regression", [
      {
        call: `const points = ${JSON.stringify(points)};\nregression(points, "${type}"${optionsSource ? `, ${optionsSource}` : ""})`,
        result: JSON.stringify(summary(regression(points, type, options)), null, 2),
      },
    ]).docs,
    description: {story},
  },
});

const linear = sample(x => 2 * x + 1);
export const Linear = () => <Diagram points={linear} type="linear" />;
Linear.parameters = params(
  linear,
  "linear",
  undefined,
  "",
  "Least-squares fit of `y = c0 + c1·x`. The result holds the `coefficients`, a `predict(x)` function for drawing the line, the coefficient of determination `r2`, and the number of points `n` used. Plot charts expose this as a trend line.",
);

const quadratic = sample(x => 0.5 * x * x - 3 * x + 10);
export const Polynomial = () => <Diagram points={quadratic} type="polynomial" options={{order: 2}} optionsSource="{order: 2}" />;
Polynomial.parameters = params(
  quadratic,
  "polynomial",
  {order: 2},
  "{order: 2}",
  "`\"polynomial\"` fits `y = c0 + c1·x + c2·x² …` up to the `order` option (default 2). Coefficients are reported in original units, lowest power first.",
);

const exponential = sample(x => 2 * Math.exp(0.3 * x));
export const Exponential = () => <Diagram points={exponential} type="exponential" />;
Exponential.parameters = params(
  exponential,
  "exponential",
  undefined,
  "",
  "`\"exponential\"` fits `y = a·e^(b·x)`; points with `y ≤ 0` cannot be log-transformed and are left out of the fit.",
);

const logarithmic = sample(x => 5 + 3 * Math.log(x));
export const Logarithmic = () => <Diagram points={logarithmic} type="logarithmic" />;
Logarithmic.parameters = params(
  logarithmic,
  "logarithmic",
  undefined,
  "",
  "`\"logarithmic\"` fits `y = a + b·ln(x)`, so points with `x ≤ 0` are ignored. A `\"power\"` type (`y = a·x^b`) is also available with the same rules on both axes.",
);
