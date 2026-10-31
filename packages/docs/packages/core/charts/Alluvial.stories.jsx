// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Alluvial} from "../../../args/core/charts/Alluvial.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Alluvial",
  component: Alluvial,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Creates an alluvial (parallel sets) chart from plain data rows: one\ncolumn per entry in dimensions, one node per category in each column,\nand bands between neighboring columns sized by how many rows (or how\nmuch value) flow between each pair of categories. Each band keeps the\ncolor of its rows' category in the colorBy column across every column.",
      },
    },
  },
};

const Template = args => <Alluvial config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

// Titanic passengers and crew by class, sex, age, and survival.
const titanic = [
  ["1st", "Male", "Child", "Yes", 5],
  ["1st", "Male", "Adult", "No", 118],
  ["1st", "Male", "Adult", "Yes", 57],
  ["1st", "Female", "Child", "Yes", 1],
  ["1st", "Female", "Adult", "No", 4],
  ["1st", "Female", "Adult", "Yes", 140],
  ["2nd", "Male", "Child", "Yes", 11],
  ["2nd", "Male", "Adult", "No", 154],
  ["2nd", "Male", "Adult", "Yes", 14],
  ["2nd", "Female", "Child", "Yes", 13],
  ["2nd", "Female", "Adult", "No", 13],
  ["2nd", "Female", "Adult", "Yes", 80],
  ["3rd", "Male", "Child", "No", 35],
  ["3rd", "Male", "Child", "Yes", 13],
  ["3rd", "Male", "Adult", "No", 387],
  ["3rd", "Male", "Adult", "Yes", 75],
  ["3rd", "Female", "Child", "No", 17],
  ["3rd", "Female", "Child", "Yes", 14],
  ["3rd", "Female", "Adult", "No", 89],
  ["3rd", "Female", "Adult", "Yes", 76],
  ["Crew", "Male", "Adult", "No", 670],
  ["Crew", "Male", "Adult", "Yes", 192],
  ["Crew", "Female", "Adult", "No", 3],
  ["Crew", "Female", "Adult", "Yes", 20],
].map(([pclass, sex, age, survived, count]) => ({
  class: pclass,
  sex,
  age,
  survived,
  count,
}));

// One row per order, so the chart counts rows.
const orders = [
  ["West", "Chairs", "Online", 6],
  ["West", "Chairs", "Store", 3],
  ["West", "Tables", "Online", 2],
  ["West", "Desks", "Store", 1],
  ["East", "Chairs", "Online", 2],
  ["East", "Tables", "Store", 5],
  ["East", "Desks", "Online", 3],
  ["North", "Desks", "Store", 4],
  ["North", "Chairs", "Online", 1],
].flatMap(([region, product, channel, n]) =>
  Array.from({length: n}, () => ({region, product, channel})),
);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: orders,
  dimensions: ["region", "product", "channel"],
};
BasicExample.parameters = {
  controls: {include: ["dimensions", "nodeSort"]},
  docs: {
    description: {
      story:
        "Each entry in `dimensions` is a column, and each category in it a node. With no `value`, every row counts once, so a band's width is the number of orders that share its two categories. Bands keep their region's color all the way across, so each region's orders can be followed from left to right.",
    },
  },
};

export const SummedValues = Template.bind({});
SummedValues.args = {
  data: titanic,
  dimensions: [
    {value: "class", title: "Class"},
    {value: "sex", title: "Sex"},
    {value: "age", title: "Age"},
    {value: "survived", title: "Survived"},
  ],
  value: "count",
};
SummedValues.parameters = {
  controls: {include: ["value", "dimensions"]},
  docs: {
    description: {
      story:
        "When each row is already a count, `value` sums it. A `{value, title}` dimension names its column; here the Titanic's 2,201 passengers and crew flow from class to survival.",
    },
  },
};

export const ColorBy = Template.bind({});
ColorBy.args = {
  data: titanic,
  dimensions: ["class", "sex", "age", "survived"],
  value: "count",
  colorBy: "survived",
  nodeSort: "data",
};
ColorBy.parameters = {
  controls: {include: ["colorBy", "nodeSort"]},
  docs: {
    description: {
      story:
        '`colorBy` picks the column whose categories color the bands (a key, a title, or a column index). Coloring by survival shows, in every column, how many survived. `nodeSort: "data"` keeps the categories in the order they appear in the data.',
    },
  },
};

export const AccessorDimension = Template.bind({});
AccessorDimension.args = {
  data: titanic,
  dimensions: [
    "sex",
    {
      value: funcify(
        d => (d.class === "Crew" ? "Crew" : "Passenger"),
        'd => (d.class === "Crew" ? "Crew" : "Passenger")',
      ),
      title: "role",
    },
    "survived",
  ],
  value: "count",
  nodeSort: "value",
};
AccessorDimension.parameters = {
  controls: {include: ["dimensions", "nodeSort"]},
  docs: {
    description: {
      story:
        'A dimension can be computed with an accessor. `nodeSort: "value"` orders every column largest first, in place of the default `"crossings"`, which orders each column after the first by where its flows come from to untangle the bands.',
    },
  },
};
