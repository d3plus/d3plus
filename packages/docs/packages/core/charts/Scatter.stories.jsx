// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Scatter} from "../../../args/core/charts/Scatter.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Scatter",
  component: Scatter,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Creates a scatter plot from an array of data: each row draws as a point at\nits x and y values, on continuous axes (set discrete to place points\nalong a category axis). Points are sizeMin pixels in radius; a size\naccessor scales them between sizeMin and sizeMax and adds a size\nlegend (see BubbleChart for bubbles sized by area). Hover any point for\nits values.",
      },
    },
  },
};

const Template = args => <Scatter config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const penguins = [
  ["Adelie", 39.1, 18.7],
  ["Adelie", 37.8, 17.1],
  ["Adelie", 40.6, 18.6],
  ["Adelie", 36.7, 19.3],
  ["Adelie", 38.9, 17.8],
  ["Adelie", 41.1, 17.6],
  ["Adelie", 35.9, 19.2],
  ["Adelie", 42.2, 18.5],
  ["Chinstrap", 46.5, 17.9],
  ["Chinstrap", 50.0, 19.5],
  ["Chinstrap", 51.3, 19.2],
  ["Chinstrap", 45.4, 18.7],
  ["Chinstrap", 52.7, 19.8],
  ["Chinstrap", 49.6, 18.2],
  ["Chinstrap", 47.0, 17.3],
  ["Chinstrap", 50.9, 17.9],
  ["Gentoo", 46.1, 13.2],
  ["Gentoo", 50.0, 16.3],
  ["Gentoo", 48.7, 14.1],
  ["Gentoo", 47.6, 14.5],
  ["Gentoo", 46.5, 13.5],
  ["Gentoo", 45.4, 14.6],
  ["Gentoo", 49.9, 16.1],
  ["Gentoo", 50.5, 15.9],
].map(([species, bill, depth], i) => ({
  id: `${species} ${i + 1}`,
  species,
  "Bill Length (mm)": bill,
  "Bill Depth (mm)": depth,
}));

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: penguins,
  groupBy: ["species", "id"],
  x: "Bill Length (mm)",
  y: "Bill Depth (mm)",
};
BasicExample.parameters = {
  controls: {include: ["x", "y", "groupBy"]},
  docs: {
    description: {
      story:
        "Each row draws as a point at its `x` and `y` values, on two continuous axes. Grouping by `species` first colors the points by species and adds a legend; hover any point for its values.",
    },
  },
};

export const SizedPoints = Template.bind({});
SizedPoints.args = {
  data: penguins.map((d, i) => ({
    ...d,
    "Body Mass (g)": 3400 + ((i * 397) % 2400),
  })),
  groupBy: ["species", "id"],
  size: "Body Mass (g)",
  x: "Bill Length (mm)",
  y: "Bill Depth (mm)",
};
SizedPoints.parameters = {
  controls: {include: ["size", "sizeMin", "sizeMax"]},
  docs: {
    description: {
      story:
        "A `size` accessor scales each point's radius between `sizeMin` and `sizeMax` and adds a size legend. To size points by area, so a value twice as large draws twice the area, use BubbleChart.",
    },
  },
};

export const TrendLine = Template.bind({});
TrendLine.args = {
  ...BasicExample.args,
  trendLine: true,
};
TrendLine.parameters = {
  controls: {include: ["trendLine", "trendLineConfig"]},
  docs: {
    description: {
      story:
        "Set `trendLine: true` to fit a least-squares line to each series (here each `species`), drawn behind the points. Hover a line for its equation and R².",
    },
  },
};
