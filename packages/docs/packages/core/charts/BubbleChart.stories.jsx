// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {
  argTypes,
  BubbleChart,
} from "../../../args/core/charts/BubbleChart.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/BubbleChart",
  component: BubbleChart,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          'Creates a bubble chart from an array of data: each row draws as a circle\nat its x and y values, sized by its size value. Bubbles are sized by\narea (sizeZero with a "sqrt" sizeScale): a value twice as large\ndraws a bubble with twice the area, and the largest draws at sizeMax\npixels in radius. A size legend keys the sizes, larger bubbles are drawn\nfirst so smaller ones stay on top, and each bubble is outlined in the\nchart\'s background color so overlapping bubbles stay distinct.',
      },
    },
  },
};

const Template = args => <BubbleChart config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const countries = [
  ["Brazil", "Americas", 15.1, 75.9, 216],
  ["Canada", "Americas", 53.4, 82.6, 39],
  ["Mexico", "Americas", 21.5, 75.0, 128],
  ["United States", "Americas", 74.6, 79.3, 335],
  ["China", "Asia", 21.5, 78.6, 1410],
  ["India", "Asia", 8.4, 72.0, 1429],
  ["Indonesia", "Asia", 13.4, 71.7, 278],
  ["Japan", "Asia", 45.6, 84.7, 124],
  ["France", "Europe", 50.9, 83.3, 68],
  ["Germany", "Europe", 58.9, 81.4, 84],
  ["Italy", "Europe", 46.8, 83.7, 59],
  ["Egypt", "Africa", 15.1, 70.2, 113],
  ["Ethiopia", "Africa", 2.8, 67.3, 127],
  ["Nigeria", "Africa", 5.6, 54.5, 224],
  ["South Africa", "Africa", 14.0, 66.1, 60],
].map(([country, region, gdp, life, pop]) => ({
  country,
  region,
  "GDP per Capita ($K)": gdp,
  "Life Expectancy": life,
  "Population (M)": pop,
}));

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: countries,
  groupBy: ["region", "country"],
  size: "Population (M)",
  x: "GDP per Capita ($K)",
  y: "Life Expectancy",
};
BasicExample.parameters = {
  controls: {include: ["size", "sizeMax", "x", "y"]},
  docs: {
    description: {
      story:
        "Each row draws as a bubble at its `x` and `y` values, sized by its `size` value. Bubbles are sized by area: India's bubble has about five times the area of Indonesia's, as its population is about five times larger. The size legend in the bottom-right corner keys the sizes, larger bubbles are drawn first so smaller ones stay on top, and each bubble is outlined in the chart's background color.",
    },
  },
};

export const RadiusRange = Template.bind({});
RadiusRange.args = {
  ...BasicExample.args,
  sizeMax: 30,
  sizeMin: 6,
  sizeZero: false,
};
RadiusRange.parameters = {
  controls: {include: ["sizeZero", "sizeMin", "sizeMax", "sizeScale"]},
  docs: {
    description: {
      story:
        "Set `sizeZero` to `false` to spread the radii between `sizeMin` and `sizeMax` instead. The smallest bubble grows to `sizeMin`, which keeps small values easy to see and hover, but areas no longer compare as values do.",
    },
  },
};

export const OverlapStyle = Template.bind({});
OverlapStyle.args = {
  ...BasicExample.args,
  shapeConfig: {Circle: {fillOpacity: 0.7, strokeWidth: 2}},
};
OverlapStyle.parameters = {
  controls: {include: ["shapeConfig"]},
  docs: {
    description: {
      story:
        "`shapeConfig.Circle` styles the bubbles. A translucent fill shows the bubbles hidden behind others, and a wider outline separates them further.",
    },
  },
};
