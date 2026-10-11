// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Pyramid} from "../../../args/core/charts/Pyramid.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Pyramid",
  component: Pyramid,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a population pyramid: horizontal bars for two groups (the first\ngroupBy level, e.g. Male / Female) extending in opposite directions\nfrom a shared center line, one row per y category (e.g. age band).\nValues stay positive — the left side is mirrored internally and the value\naxis reads magnitudes on both halves. The category labels run down a\ngutter between the halves (or beside the chart, with categoryPosition).\nDeeper groupBy levels stack within each side.",
      },
    },
  }
};

const Template = (args) => <Pyramid config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import datafy from "../../../helpers/datafy";

// A synthetic, aging population: fewer births and a baby boom that moves up
// the pyramid each decade. Written as a self-contained expression so each
// story's "Show code" snippet prints this generator rather than every row.
const generator = `const bands = Array.from({length: 21}, (_, i) => i === 20 ? "100+" : \`\${i * 5}-\${i * 5 + 4}\`);
  const population = (band, year, sex) => {
    const age = band * 5, shift = (year - 2000) / 10;
    const births = 1 - 0.07 * shift * Math.max(0, 1 - age / 40);
    const boom = 1 + 0.3 * Math.exp(-((age - (35 + 10 * shift)) ** 2) / 120);
    const survival = Math.exp(-Math.pow(age / (70 + 3 * shift + (sex === "Female" ? 5 : 0)), 5));
    return Math.round(1200000 * births * boom * survival);
  };`;
const latest = datafy(`(() => {
  ${generator}
  return bands.flatMap((Age, band) => ["Male", "Female"].map(Sex => ({
    Age, Sex, Population: population(band, 2020, Sex), "Population 2000": population(band, 2000, Sex),
  })));
})()`);
const byArea = datafy(`(() => {
  ${generator}
  return bands.flatMap((Age, band) => ["Male", "Female"].flatMap(Sex => [
    {Age, Sex, Area: "Urban", Population: Math.round(population(band, 2020, Sex) * 0.62)},
    {Age, Sex, Area: "Rural", Population: Math.round(population(band, 2020, Sex) * 0.38)},
  ]));
})()`);
const byYear = datafy(`(() => {
  ${generator}
  return [2000, 2010, 2020].flatMap(Year => bands.flatMap((Age, band) => ["Male", "Female"].map(Sex => ({
    Year, Age, Sex, Population: population(band, Year, Sex),
  }))));
})()`);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: latest,
  groupBy: "Sex",
  x: "Population",
  y: "Age",
};
BasicExample.parameters = {controls: {include: ["categoryPosition", "sides", "sideTitles", "symmetric"]}, docs: {description: {story: "Pass positive values: the first `groupBy` level splits the rows into two sides, the first side (here Male) is mirrored to the left, and the value axis reads magnitudes outward from zero on both halves. The `y` categories (age bands) run down a gutter between the halves, bottom to top in data order, and each side is named above its half."}}};

export const LeftLabels = Template.bind({});
LeftLabels.args = {
  data: latest,
  groupBy: "Sex",
  x: "Population",
  y: "Age",
  categoryPosition: "left",
};
LeftLabels.parameters = {controls: {include: ["categoryPosition", "yConfig"]}, docs: {description: {story: "`categoryPosition(\"left\")` moves the categories onto a regular axis beside the chart, so the two halves meet on a single zero line."}}};

export const StackedSides = Template.bind({});
StackedSides.args = {
  data: byArea,
  groupBy: ["Sex", "Area"],
  x: "Population",
  y: "Age",
};
StackedSides.parameters = {controls: {include: ["groupBy", "stackOrder"]}, docs: {description: {story: "Deeper `groupBy` levels stack within each side. A sub-group keeps one color and one legend entry on both sides, and is stacked at the same distance from the center line on each, largest nearest the center."}}};

export const PercentAndComparison = Template.bind({});
PercentAndComparison.args = {
  data: latest,
  groupBy: "Sex",
  x: "Population",
  y: "Age",
  percent: true,
  comparison: "Population 2000",
};
PercentAndComparison.parameters = {controls: {include: ["percent", "comparison", "comparisonConfig"]}, docs: {description: {story: "`percent(true)` draws every bar as a share of the whole population, so pyramids of different sizes compare by shape. `comparison` traces a second value for each row as an outline around each side — here the same population in 2000, scaled to its own total."}}};

export const Timeline = Template.bind({});
Timeline.args = {
  data: byYear,
  groupBy: "Sex",
  x: "Population",
  y: "Age",
  time: "Year",
  axisPersist: true,
};
Timeline.parameters = {controls: {include: ["time", "axisPersist"]}, docs: {description: {story: "With `time`, the timeline steps (or plays) through the years. `axisPersist(true)` keeps one symmetric axis sized to every year, so the pyramid's shape change reads directly."}}};
