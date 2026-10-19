// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, ParallelCoordinates} from "../../../args/core/charts/ParallelCoordinates.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/ParallelCoordinates",
  component: ParallelCoordinates,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a parallel coordinates chart from an array of data: one axis per\ndimension and one line per row, crossing each axis at the row's value.\nBrush along an axis to filter the lines.",
      },
    },
  }
};

const Template = (args) => <ParallelCoordinates config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import datafy from "../../../helpers/datafy";

// Seeded rows written as self-contained expressions, so each story's "Show
// code" snippet prints the generator rather than every row.
const seeded = `let seed = 5;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;`;
const cars = datafy(`(() => {
  ${seeded}
  const makes = {
    USA: ["AMC", "Buick", "Chevrolet", "Dodge", "Ford", "Plymouth"],
    Japan: ["Honda", "Mazda", "Toyota"],
    Europe: ["Fiat", "Renault", "Volkswagen"],
  };
  return Array.from({length: 48}, (_, i) => {
    const origin = ["USA", "Japan", "USA", "Europe"][i % 4];
    const cylinders = origin === "USA" ? [4, 6, 8][i % 3] : i % 5 ? 4 : 6;
    const weight = Math.round(250 + cylinders * 420 + random() * 600);
    const horsepower = Math.round(weight / 25 - 30 + random() * 30);
    return {
      name: makes[origin][i % makes[origin].length] + " '" + (70 + (i % 13)),
      origin,
      cylinders,
      horsepower,
      weight,
      acceleration: Math.round((23 - horsepower / 25 + random() * 3) * 10) / 10,
      mpg: Math.round((54 - weight / 100 + random() * 5) * 10) / 10,
    };
  });
})()`);

// 1000 rows in three clusters.
const dense = datafy(`(() => {
  ${seeded}
  const normal = () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
  return Array.from({length: 1000}, (_, i) => {
    const c = i % 3;
    const base = normal();
    return {
      id: i,
      cluster: ["Alpha", "Beta", "Gamma"][c],
      a: Math.round((50 + 15 * base + 10 * c) * 10) / 10,
      b: Math.round((30 - 8 * base + 6 * normal()) * 10) / 10,
      c: Math.round((20 + 12 * c + 5 * normal()) * 10) / 10,
      d: Math.round((60 + 10 * normal() - 12 * c) * 10) / 10,
      e: Math.round((40 + 9 * base + 4 * normal()) * 10) / 10,
    };
  });
})()`);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: cars,
  groupBy: ["origin", "name"],
};
BasicExample.parameters = {controls: {include: ["dimensions", "lineOpacity", "curve"]}, docs: {description: {story: "Each row is a line crossing one axis per dimension. With no `dimensions` set, every numeric key except the `groupBy` keys gets an axis; lines take the `groupBy` color. Hover a line to follow it, or drag along any axis to brush."}}};

export const CategoricalAxes = Template.bind({});
CategoricalAxes.args = {
  data: cars,
  groupBy: ["origin", "name"],
  dimensions: ["origin", "cylinders", "horsepower", "weight", "mpg"],
  dimensionConfig: {
    cylinders: {scale: "point", title: "Cylinders"},
    horsepower: {title: "Horsepower"},
    mpg: {reverse: true, title: "MPG (reversed)"},
    origin: {title: "Origin"},
    weight: {title: "Weight", tickFormat: funcify(d => `${d / 1000}k lb`, "d => `${d / 1000}k lb`")},
  },
  curve: "bump",
};
CategoricalAxes.parameters = {controls: {include: ["dimensions", "dimensionConfig", "curve"]}, docs: {description: {story: "A key holding text gets a categorical axis, and `scale: \"point\"` turns a numeric key into one. `dimensionConfig` sets each axis's `title`, `domain`, `reverse`, and any Axis option such as `tickFormat`; `curve(\"bump\")` eases each line into and out of every axis."}}};

export const Brushing = Template.bind({});
Brushing.args = {
  data: cars,
  groupBy: ["origin", "name"],
  dimensions: ["cylinders", "horsepower", "weight", "acceleration", "mpg"],
  brushes: {horsepower: [60, 100], mpg: [25, 45]},
};
Brushing.parameters = {controls: {include: ["brushes", "brushing", "brushConfig"]}, docs: {description: {story: "Drag along an axis to brush it: lines outside the brush gray out, and every brush must match (AND). Click an axis outside its brush to clear it. `brushes` sets them from code and holds the current selection; `on(\"brush\", fn)` reports each change."}}};

export const VerticalOrient = Template.bind({});
VerticalOrient.args = {
  data: cars,
  groupBy: ["origin", "name"],
  dimensions: ["mpg", "horsepower", "weight", "acceleration"],
  orient: "vertical",
};
VerticalOrient.parameters = {controls: {include: ["orient"]}, docs: {description: {story: "`orient(\"vertical\")` stacks the axes top to bottom, with each dimension's title to its left."}}};

export const DenseData = Template.bind({});
DenseData.args = {
  data: dense,
  groupBy: ["cluster", "id"],
  renderer: "canvas",
};
DenseData.parameters = {controls: {include: ["lineOpacity", "renderer", "dataCutoff"]}, docs: {description: {story: "With many rows the default `lineOpacity(\"auto\")` fades every line so overlaps read as density. The Canvas renderer keeps 1000 lines smooth to hover and brush."}}};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: cars,
  groupBy: ["origin", "name"],
  dimensions: ["cylinders", "horsepower", "weight", "mpg"],
  facet: "origin",
  legend: false,
};
SmallMultiples.parameters = {controls: {include: ["facet", "facetConfig"]}, docs: {description: {story: "`facet` draws a panel per value. Panels share each axis's domain, and brushing an axis in one panel brushes it in all of them."}}};
