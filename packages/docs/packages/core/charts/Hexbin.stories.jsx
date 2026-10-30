// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Hexbin} from "../../../args/core/charts/Hexbin.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Hexbin",
  component: Hexbin,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Creates a 2D binned density chart from raw observations: each row is a\npoint at its x and y values (rows without numeric values are\nskipped), and the points are grouped into hexagons (binShape) of\nbinSize pixels, colored on the colorScale by how many each holds (or by\nbinValue). Empty bins aren't drawn. contours adds density contours,\nand points draws the observations beneath. groupBy names the\nobservations for filter and the legend (off by default), and facet\nbins each panel on its own, on one shared colorScale.",
      },
    },
  },
};

const Template = args => <Hexbin config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

// 2,000 heights and weights from a seeded bivariate normal: weight rises
// with height (ρ ≈ 0.7), and age tracks weight loosely.
let seed = 11;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const normal = () =>
  Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
const people = Array.from({length: 2000}, () => {
  const a = normal();
  const b = normal();
  return {
    "Height (cm)": Math.round((170 + 9 * a) * 10) / 10,
    "Weight (kg)": Math.round((72 + 11 * (0.7 * a + 0.71 * b)) * 10) / 10,
    Age: Math.round(40 + 6 * b + 8 * normal()),
  };
});

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: people,
  x: "Height (cm)",
  y: "Weight (kg)",
};
BasicExample.parameters = {
  controls: {include: ["binShape", "binSize", "x", "y"]},
  docs: {
    description: {
      story:
        "Two thousand overlapping points are unreadable as a scatter. Hexbin groups them into hexagons `binSize` pixels across and colors each by how many observations it holds, on a continuous colorScale. Empty hexagons aren't drawn. Zooming bins the observations again at the new scale and refits the colorScale to the bins in view. Hover a hexagon for its count and its height and weight ranges.",
    },
  },
};

export const SquareBins = Template.bind({});
SquareBins.args = {
  ...BasicExample.args,
  binShape: "square",
  binSize: 16,
};
SquareBins.parameters = {
  controls: {include: ["binShape", "binSize"]},
  docs: {
    description: {
      story:
        'Set `binShape` to `"square"` for a grid of squares, `binSize` pixels on a side. Like hexagons, squares are binned on screen, so they stay square whatever the axes\' ranges, and keep their size when the chart zooms.',
    },
  },
};

export const DensityContours = Template.bind({});
DensityContours.args = {
  ...BasicExample.args,
  binShape: false,
  contours: "filled",
  points: true,
};
DensityContours.parameters = {
  controls: {include: ["contours", "contourConfig", "points", "pointConfig"]},
  docs: {
    description: {
      story:
        'With `binShape(false)` and `contours`, the observations are summarized as density contours instead: `"filled"` shades each level with an opacity ramp, and `"lines"` outlines them. `points` draws the observations beneath. `contourConfig` sets the kernel\'s `bandwidth` (in pixels) and how many levels (`thresholds`) to draw.',
    },
  },
};

export const ContoursOverBins = Template.bind({});
ContoursOverBins.args = {
  ...BasicExample.args,
  contours: true,
};
ContoursOverBins.parameters = {
  controls: {include: ["contours", "contourConfig", "binSize"]},
  docs: {
    description: {
      story:
        "Contours can be drawn over the bins. Contour levels are in observations per bin, the count a bin would hold there, so both share one colorScale; over bins, the contour lines take the chart's text color and leave hover to the bins.",
    },
  },
};

export const MeanPerBin = Template.bind({});
MeanPerBin.args = {
  ...BasicExample.args,
  binValue: {value: "Age", agg: "mean", label: "Mean Age"},
};
MeanPerBin.parameters = {
  controls: {include: ["binValue"]},
  docs: {
    description: {
      story:
        '`binValue` colors each bin by the `"sum"` or `"mean"` of a field over its observations instead of their count. Here each hexagon shows the mean age of the people in it, and its tooltip adds their count.',
    },
  },
};
