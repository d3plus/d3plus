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

const cars = [
  {name: "Ford Wagon '79", origin: "USA", cylinders: 6, horsepower: 82, weight: 2251, acceleration: 20.2, mpg: 35.5},
  {name: "Subaru Wagon '71", origin: "Japan", cylinders: 4, horsepower: 73, weight: 2092, acceleration: 19.2, mpg: 28.7},
  {name: "Plymouth Deluxe '78", origin: "USA", cylinders: 6, horsepower: 85, weight: 2423, acceleration: 16.5, mpg: 31.4},
  {name: "Toyota SE '76", origin: "Japan", cylinders: 4, horsepower: 87, weight: 2520, acceleration: 18.6, mpg: 30.1},
  {name: "Pontiac SE '73", origin: "USA", cylinders: 8, horsepower: 154, weight: 4047, acceleration: 18.4, mpg: 17.3},
  {name: "Toyota Sport '75", origin: "Japan", cylinders: 4, horsepower: 55, weight: 1811, acceleration: 20.5, mpg: 32.1},
  {name: "AMC Custom '77", origin: "USA", cylinders: 6, horsepower: 90, weight: 2612, acceleration: 18.5, mpg: 26.6},
  {name: "Buick Coupe '70", origin: "USA", cylinders: 4, horsepower: 85, weight: 2137, acceleration: 17.6, mpg: 28.7},
  {name: "AMC Sedan '70", origin: "USA", cylinders: 8, horsepower: 147, weight: 3604, acceleration: 18.1, mpg: 17.7},
  {name: "Buick Wagon '72", origin: "USA", cylinders: 8, horsepower: 153, weight: 3767, acceleration: 18.4, mpg: 18.4},
  {name: "Mazda Sedan '77", origin: "Japan", cylinders: 4, horsepower: 63, weight: 2263, acceleration: 21.6, mpg: 29.1},
  {name: "Oldsmobile Deluxe '76", origin: "USA", cylinders: 6, horsepower: 81, weight: 2515, acceleration: 16.9, mpg: 31.9},
  {name: "Dodge Deluxe '76", origin: "USA", cylinders: 8, horsepower: 182, weight: 4157, acceleration: 17.4, mpg: 14.3},
  {name: "Volkswagen SE '75", origin: "Europe", cylinders: 4, horsepower: 63, weight: 2167, acceleration: 20.6, mpg: 25.7},
  {name: "Buick Wagon '75", origin: "USA", cylinders: 4, horsepower: 60, weight: 2061, acceleration: 21.2, mpg: 29.1},
  {name: "Renault GL '82", origin: "Europe", cylinders: 4, horsepower: 68, weight: 2005, acceleration: 19.1, mpg: 36.4},
  {name: "Plymouth SE '77", origin: "USA", cylinders: 4, horsepower: 52, weight: 2202, acceleration: 22.2, mpg: 33.4},
  {name: "Oldsmobile Custom '75", origin: "USA", cylinders: 4, horsepower: 73, weight: 2038, acceleration: 20.8, mpg: 32},
  {name: "Dodge Deluxe '78", origin: "USA", cylinders: 8, horsepower: 180, weight: 4406, acceleration: 18.2, mpg: 15.3},
  {name: "Buick Coupe '74", origin: "USA", cylinders: 8, horsepower: 171, weight: 3704, acceleration: 16.6, mpg: 15.2},
  {name: "Mazda Sedan '74", origin: "Japan", cylinders: 6, horsepower: 82, weight: 2571, acceleration: 19.6, mpg: 20.4},
  {name: "Chevrolet GL '82", origin: "USA", cylinders: 6, horsepower: 92, weight: 2796, acceleration: 18.2, mpg: 26.4},
  {name: "Toyota SE '71", origin: "Japan", cylinders: 4, horsepower: 67, weight: 2257, acceleration: 22.2, mpg: 28.8},
  {name: "Honda SE '79", origin: "Japan", cylinders: 4, horsepower: 57, weight: 2067, acceleration: 19.8, mpg: 30},
  {name: "Toyota Coupe '82", origin: "Japan", cylinders: 4, horsepower: 57, weight: 2015, acceleration: 20.4, mpg: 34.4},
  {name: "Ford Deluxe '72", origin: "USA", cylinders: 8, horsepower: 134, weight: 3510, acceleration: 16.6, mpg: 19.1},
  {name: "Dodge Deluxe '74", origin: "USA", cylinders: 8, horsepower: 207, weight: 4909, acceleration: 17, mpg: 9},
  {name: "AMC Sport '72", origin: "USA", cylinders: 6, horsepower: 104, weight: 3078, acceleration: 20.6, mpg: 16.2},
  {name: "Chevrolet Classic '74", origin: "USA", cylinders: 4, horsepower: 72, weight: 2495, acceleration: 20.4, mpg: 31},
  {name: "Plymouth Classic '79", origin: "USA", cylinders: 4, horsepower: 54, weight: 2074, acceleration: 18.9, mpg: 35.4},
  {name: "Pontiac SE '80", origin: "USA", cylinders: 4, horsepower: 49, weight: 1867, acceleration: 21.8, mpg: 30.6},
  {name: "Fiat Deluxe '81", origin: "Europe", cylinders: 4, horsepower: 46, weight: 1805, acceleration: 22.1, mpg: 36.4},
  {name: "Chevrolet Sedan '78", origin: "USA", cylinders: 8, horsepower: 136, weight: 4450, acceleration: 18.3, mpg: 12.2},
  {name: "Subaru Wagon '75", origin: "Japan", cylinders: 4, horsepower: 47, weight: 1814, acceleration: 18.5, mpg: 33.7},
  {name: "Honda Deluxe '73", origin: "Japan", cylinders: 4, horsepower: 55, weight: 1762, acceleration: 23.5, mpg: 39.9},
  {name: "Chevrolet GL '76", origin: "USA", cylinders: 6, horsepower: 66, weight: 2389, acceleration: 20.9, mpg: 27.7},
  {name: "Dodge GL '74", origin: "USA", cylinders: 8, horsepower: 124, weight: 3321, acceleration: 19.9, mpg: 19.9},
  {name: "Pontiac Custom '82", origin: "USA", cylinders: 8, horsepower: 190, weight: 4643, acceleration: 16.8, mpg: 14.4},
  {name: "Oldsmobile Sport '80", origin: "USA", cylinders: 8, horsepower: 123, weight: 3303, acceleration: 18.6, mpg: 22.9},
  {name: "Oldsmobile SE '70 2", origin: "USA", cylinders: 4, horsepower: 69, weight: 1994, acceleration: 18.9, mpg: 32.7},
  {name: "Oldsmobile SE '72", origin: "USA", cylinders: 6, horsepower: 93, weight: 2421, acceleration: 20.3, mpg: 27.9},
  {name: "Mazda Coupe '76", origin: "Japan", cylinders: 4, horsepower: 52, weight: 2138, acceleration: 22.8, mpg: 31.2},
  {name: "Toyota Wagon '79", origin: "Japan", cylinders: 4, horsepower: 60, weight: 2024, acceleration: 18.5, mpg: 32.5},
  {name: "Plymouth Sport '76", origin: "USA", cylinders: 8, horsepower: 201, weight: 4461, acceleration: 15.2, mpg: 13},
  {name: "AMC Sport '79", origin: "USA", cylinders: 4, horsepower: 46, weight: 1971, acceleration: 18.8, mpg: 41},
  {name: "AMC Sedan '73", origin: "USA", cylinders: 8, horsepower: 187, weight: 3963, acceleration: 18.1, mpg: 15.1},
  {name: "Plymouth Classic '71", origin: "USA", cylinders: 4, horsepower: 87, weight: 2327, acceleration: 20.1, mpg: 23.3},
  {name: "Plymouth Classic '74", origin: "USA", cylinders: 8, horsepower: 84, weight: 2818, acceleration: 20.1, mpg: 28.1},
  {name: "Plymouth Wagon '77", origin: "USA", cylinders: 8, horsepower: 113, weight: 4345, acceleration: 19, mpg: 14.9},
];

// 1000 seeded rows in three clusters, so the story renders the same every load.
let seed = 11;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const normal = () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
const dense = Array.from({length: 1000}, (_, i) => {
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
