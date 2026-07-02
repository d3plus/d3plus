// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, ColorScale} from "../../../args/core/components/ColorScale.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/ColorScale",
  component: ColorScale,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates an SVG color scale based on an array of data.",
      },
    },
  }
};

const Template = (args) => <ColorScale config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

// A right-skewed spread so the scale-type differences are visible.
const skewed = [
  {value: 200}, {value: 1000}, {value: 2000}, {value: 2010}, {value: 2020},
  {value: 2030}, {value: 2040}, {value: 2100}, {value: 6400}
];

export const LinearScale = Template.bind({});
LinearScale.args = {
  data: skewed,
  height: 100,
  width: 500
};
LinearScale.parameters = {
  controls: {include: ["scale"]},
  docs: {description: {story: "The default `scale: \"linear\"` maps values to a continuous single-hue gradient (blue). A smooth ramp is best when every value matters equally and you want to read magnitude by eye."}}
};

export const JenksScale = Template.bind({});
JenksScale.args = {
  data: skewed,
  scale: "jenks",
  height: 100,
  width: 500
};
JenksScale.parameters = {
  controls: {include: ["scale", "buckets"]},
  docs: {description: {story: "`scale: \"jenks\"` splits the data into natural-breaks (ckmeans) buckets — discrete steps placed where the data clusters, minimizing within-bucket variance. This is the default for charts (Geomap choropleths) because it reveals grouping in skewed data that a linear ramp flattens."}}
};

export const BucketsScale = Template.bind({});
BucketsScale.args = {
  data: skewed,
  scale: "buckets",
  buckets: 5,
  height: 100,
  width: 500
};
BucketsScale.parameters = {
  controls: {include: ["scale", "buckets"]},
  docs: {description: {story: "`scale: \"buckets\"` divides the domain into equal-width steps — the breakpoints are evenly spaced by value (unlike jenks, which follows the data). Set the count with `buckets`."}}
};

export const QuantileScale = Template.bind({});
QuantileScale.args = {
  data: skewed,
  scale: "quantile",
  buckets: 5,
  height: 100,
  width: 500
};
QuantileScale.parameters = {
  controls: {include: ["scale", "buckets"]},
  docs: {description: {story: "`scale: \"quantile\"` puts an equal *count* of data points in each bucket, so every color represents the same share of the data. Breakpoints bunch up where values are dense."}}
};

export const LogScale = Template.bind({});
LogScale.args = {
  // Values spanning orders of magnitude — the case log scaling is for.
  data: [{value: 100}, {value: 1000}, {value: 10000}, {value: 100000}, {value: 1000000}],
  scale: "log",
  height: 100,
  width: 500
};
LogScale.parameters = {
  controls: {include: ["scale"]},
  docs: {description: {story: "`scale: \"log\"` spaces the gradient logarithmically, so each order of magnitude gets comparable color range. Use it when values span several powers of ten (all values must share a sign)."}}
};

export const DivergingScale = Template.bind({});
DivergingScale.args = {
  data: [
    {value: -6400}, {value: -2000}, {value: -500}, {value: 0},
    {value: 500}, {value: 2000}, {value: 6400}
  ],
  height: 100,
  width: 500
};
DivergingScale.parameters = {
  controls: {include: ["midpoint"]},
  docs: {description: {story: "When the data spans both sides of the midpoint (default `0`), the scale becomes **diverging** automatically: red (low) → neutral gray → blue (high), so the two directions read as opposites around the center. Move the center with `midpoint`."}}
};