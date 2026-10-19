// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Violin} from "../../../args/core/charts/Violin.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Violin",
  component: Violin,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a violin plot from an array of raw observations: the value of\neach row is summarized per group as a kernel density estimate, drawn as a\nmirrored curve around the group's category. Set discrete(\"y\") for\nhorizontal violins, inner for the overlay inside each violin, and\ndensityScale for how widths compare across violins.",
      },
    },
  }
};

const Template = (args) => <Violin config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import datafy from "../../../helpers/datafy";

// Seeded flower measurements, written as a self-contained expression so each
// story's "Show code" snippet prints this generator rather than every row.
const flowers = datafy(`(() => {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  const species = [["setosa", 1.5, 0.2], ["versicolor", 4.3, 0.5], ["virginica", 5.6, 0.55]];
  return species.flatMap(([name, mean, sd]) =>
    Array.from({length: 50}, (_, i) => ({id: name + " " + (i + 1), species: name, "Petal Length": Math.round((mean + sd * normal()) * 100) / 100})),
  );
})()`);

// Seeded restaurant bills: weekend bills mix a lunch and a dinner crowd.
const bills = datafy(`(() => {
  let seed = 3;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  return ["Thursday", "Friday", "Saturday", "Sunday"].flatMap((day, d) =>
    ["Female", "Male"].flatMap((sex, s) =>
      Array.from({length: 40 + 10 * d}, () => {
        const dinner = d > 1 && random() < 0.45;
        const bill = 14 + 2 * d + 3 * s + (dinner ? 12 : 0) + (4 + s) * normal();
        return {day, sex, "Total Bill": Math.round(Math.max(3, bill) * 100) / 100};
      }),
    ),
  );
})()`);

// Seeded household incomes by region and setting.
const incomes = datafy(`(() => {
  let seed = 19;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const normal = () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  return ["Africa", "Americas", "Asia", "Europe"].flatMap((region, r) =>
    ["Rural", "Urban"].flatMap((area, a) =>
      Array.from({length: 60}, () => ({region, area, "Income (k$)": Math.round(Math.exp(2.4 + 0.25 * r + 0.35 * a + 0.45 * normal()) * 100) / 100})),
    ),
  );
})()`);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: flowers,
  groupBy: "species",
  value: "Petal Length",
};
BasicExample.parameters = {controls: {include: ["value", "inner", "densityScale", "densityConfig"]}, docs: {description: {story: "Each group's `value`s become a kernel density estimate, mirrored around the group's category: the violin is widest where observations are densest. A narrow box plot inside marks the quartiles, the median (the light line), and the whiskers. Hover a violin for its observation count and quartiles."}}};

export const Horizontal = Template.bind({});
Horizontal.args = {
  data: flowers,
  discrete: "y",
  groupBy: "species",
  inner: "quartiles",
  value: "Petal Length",
};
Horizontal.parameters = {controls: {include: ["discrete", "inner"]}, docs: {description: {story: "`discrete: \"y\"` lays the categories down the y axis for horizontal violins. `inner: \"quartiles\"` swaps the box plot for a solid line at each median and dashed lines at the quartiles."}}};

export const SwarmedPoints = Template.bind({});
SwarmedPoints.args = {
  data: flowers,
  densityScale: "width",
  groupBy: "species",
  inner: "points",
  value: "Petal Length",
};
SwarmedPoints.parameters = {controls: {include: ["inner", "innerConfig", "densityScale"]}, docs: {description: {story: "`inner: \"points\"` packs every observation into a swarm along the violin's center, each point hoverable on its own. By default (`densityScale: \"area\"`) every violin has the same area, so a tight distribution draws narrow and tall; `\"width\"` stretches every violin to the full width so their shapes are easier to compare."}}};

export const SideBySide = Template.bind({});
SideBySide.args = {
  color: "sex",
  data: bills,
  groupBy: ["day", "sex"],
  value: "Total Bill",
};
SideBySide.parameters = {controls: {include: ["groupBy", "color"]}, docs: {description: {story: "With two `groupBy` levels, the first places each violin along the axis and the second sets violins side by side within it. The weekend's two humps (lunch and dinner) show up in the curves where a box plot would hide them."}}};

export const SplitViolins = Template.bind({});
SplitViolins.args = {
  color: "sex",
  data: bills,
  groupBy: ["day", "sex"],
  inner: "quartiles",
  split: true,
  value: "Total Bill",
};
SplitViolins.parameters = {controls: {include: ["split", "inner"]}, docs: {description: {story: "`split: true` draws a category holding exactly two groups as the two halves of one violin, putting the distributions back to back."}}};

export const CountScaled = Template.bind({});
CountScaled.args = {
  data: incomes,
  densityConfig: {kernel: "epanechnikov"},
  densityScale: "count",
  groupBy: "region",
  medianSort: "descending",
  value: "Income (k$)",
};
CountScaled.parameters = {controls: {include: ["densityScale", "densityConfig", "medianSort"]}, docs: {description: {story: "`densityScale: \"count\"` weights each violin by its number of observations. `densityConfig` picks the kernel (`\"gaussian\"` or `\"epanechnikov\"`), the `bandwidth` (Silverman's rule of thumb by default), how many `points` each curve samples, and how far it runs past the data (`cut`, in bandwidths). `medianSort` orders the violins by median."}}};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: incomes,
  facet: "region",
  groupBy: "area",
  value: "Income (k$)",
};
SmallMultiples.parameters = {controls: {include: ["facet", "facetConfig"]}, docs: {description: {story: "`facet` draws one panel per region, with every panel sharing the value axis and the violins sharing one width scale."}}};
