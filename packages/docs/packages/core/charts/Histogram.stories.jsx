// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Histogram} from "../../../args/core/charts/Histogram.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Histogram",
  component: Histogram,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a histogram from an array of raw observations.",
      },
    },
  }
};

const Template = (args) => <Histogram config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import datafy from "../../../helpers/datafy";

// Seeded normal samples, written as self-contained expressions so each story's
// "Show code" snippet prints this generator rather than every generated row.
const seeded = `let seed = 42;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = (mu, sigma) =>
    mu + sigma * Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());`;
const heights = datafy(`(() => {
  ${seeded}
  return Array.from({length: 1000}, () => ({"Height (cm)": normal(170, 10)}));
})()`);
const bySex = datafy(`(() => {
  ${seeded}
  return [
    ...Array.from({length: 600}, () => ({Sex: "Male", "Height (cm)": normal(176, 7)})),
    ...Array.from({length: 600}, () => ({Sex: "Female", "Height (cm)": normal(163, 6.5)})),
  ];
})()`);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: heights,
  value: "Height (cm)",
};
BasicExample.parameters = {controls: {include: ["value", "binThresholds"]}, docs: {description: {story: "Pass raw observations and name the numeric field with `value`. The values are binned along a linear x axis (Sturges' rule by default) and each bar's height is the number of observations in its bin."}}};

export const StackedGroups = Template.bind({});
StackedGroups.args = {
  data: bySex,
  groupBy: "Sex",
  value: "Height (cm)",
};
StackedGroups.parameters = {controls: {include: ["groupBy", "stackOrder"]}, docs: {description: {story: "Every `groupBy` series is binned on the same edges and stacked within each bin, so the full bar is the overall distribution."}}};

export const BinWidth = Template.bind({});
BinWidth.args = {
  data: heights,
  value: "Height (cm)",
  binWidth: 2.5,
};
BinWidth.parameters = {controls: {include: ["binWidth", "binDomain"]}, docs: {description: {story: "`binWidth` sets a uniform bin size, with edges at multiples of the width. `binThresholds` (a count, an array of edges, or a d3-array threshold function) and `binDomain` give finer control."}}};

export const Density = Template.bind({});
Density.args = {
  data: bySex,
  groupBy: "Sex",
  value: "Height (cm)",
  binNormalize: "density",
};
Density.parameters = {controls: {include: ["binNormalize"]}, docs: {description: {story: "`binNormalize(\"density\")` scales heights so the bars' total area is 1, making the histogram comparable to a probability density curve; `\"relative\"` makes the heights sum to 1 instead."}}};
