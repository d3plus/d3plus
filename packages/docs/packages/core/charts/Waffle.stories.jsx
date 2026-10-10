// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Waffle} from "../../../args/core/charts/Waffle.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Waffle",
  component: Waffle,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Draws a grid of unit cells filled in order by category, each category getting cells in proportion to its value. By default the grid is 10 × 10, so each cell is 1% of the total; set `unit` to make each cell a fixed amount instead. Hover a cell to highlight its whole category.",
      },
    },
  },
};

const Template = args => <Waffle config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const energy = [
  {source: "Natural Gas", share: 43.1},
  {source: "Nuclear", share: 18.6},
  {source: "Coal", share: 16.2},
  {source: "Wind", share: 10.2},
  {source: "Hydro", share: 5.7},
  {source: "Solar", share: 3.9},
  {source: "Other", share: 2.3},
];

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: energy,
  groupBy: "source",
  sum: "share",
};
BasicExample.parameters = {
  controls: {include: ["groupBy", "sum", "rows", "columns"]},
  docs: {
    description: {
      story:
        "Each of the 100 cells is 1% of the total, filled largest category first. Shares are rounded with the largest-remainder method, so the cells always add up to exactly 100. Hover a cell to highlight its whole category; the tooltip shows the category's value and share.",
    },
  },
};

export const CellShapes = Template.bind({});
CellShapes.args = {
  data: [
    {answer: "Love it", count: 412},
    {answer: "Like it", count: 655},
    {answer: "Neutral", count: 233},
    {answer: "Dislike it", count: 121},
    {answer: "Hate it", count: 64},
  ],
  groupBy: "answer",
  sum: "count",
  sort: false,
  cellShape: "circle",
  cellPadding: 4,
};
CellShapes.parameters = {
  controls: {include: ["cellShape", "cellPadding", "sort"]},
  docs: {
    description: {
      story:
        '`cellShape` draws each cell as a `"square"`, a `"rounded"` square, or a `"circle"`, and `cellPadding` sets the gap between cells. `sort: false` fills in data order, keeping the answers on their scale.',
    },
  },
};

export const FillDirection = Template.bind({});
FillDirection.args = {
  data: energy,
  groupBy: "source",
  sum: "share",
  fillDirection: "column",
  fillStart: "bottom-left",
  rows: 5,
  columns: 20,
};
FillDirection.parameters = {
  controls: {include: ["fillDirection", "fillStart", "rows", "columns"]},
  docs: {
    description: {
      story:
        '`fillDirection: "column"` fills each column before moving to the next, and `fillStart` picks the corner the first cell sits in. A 5 × 20 grid still holds 100 cells, so each is still 1%.',
    },
  },
};

export const UnitCounts = Template.bind({});
UnitCounts.args = {
  data: [
    {type: "General Admission", attendees: 18400},
    {type: "Student", attendees: 6870},
    {type: "VIP", attendees: 3150},
    {type: "Staff", attendees: 1240},
  ],
  groupBy: "type",
  sum: "attendees",
  unit: 500,
  columns: 12,
  cellShape: "rounded",
};
UnitCounts.parameters = {
  controls: {include: ["unit", "columns"]},
  docs: {
    description: {
      story:
        "`unit: 500` makes each cell 500 attendees instead of a share of the total. The grid keeps its 12 `columns` and adds rows until every cell fits, so a larger total draws a taller waffle.",
    },
  },
};

/** A person silhouette in `color`, as an inline SVG data URI. */
const person = color =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="5" r="4" fill="${color}"/><path d="M4 23v-6.5a8 7 0 0 1 16 0V23z" fill="${color}"/></svg>`,
  )}`;

export const Pictogram = Template.bind({});
Pictogram.args = {
  data: [
    {mode: "Drove", people: 14, color: "#1a6fb5"},
    {mode: "Transit", people: 5, color: "#e8833a"},
    {mode: "Biked", people: 3, color: "#3f9b4f"},
    {mode: "Walked", people: 2, color: "#8a5cc2"},
    {mode: "Remote", people: 6, color: "#9aa0a6"},
  ],
  groupBy: "mode",
  sum: "people",
  color: "color",
  icon: funcify(d => person(d.color), "d => person(d.color)"),
  unit: 1,
  cellPadding: 4,
};
Pictogram.parameters = {
  controls: {include: ["icon", "unit"]},
  docs: {
    description: {
      story:
        "`icon` turns the waffle into a pictogram: every cell draws the image its accessor returns (here, `person` builds a silhouette SVG in each category's color) in place of the fill. With `unit: 1`, each icon is one person.",
    },
  },
};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: [
    {age: "18–29", device: "Phone", value: 58},
    {age: "18–29", device: "Laptop", value: 27},
    {age: "18–29", device: "Tablet", value: 6},
    {age: "18–29", device: "Desktop", value: 9},
    {age: "30–49", device: "Phone", value: 44},
    {age: "30–49", device: "Laptop", value: 31},
    {age: "30–49", device: "Tablet", value: 10},
    {age: "30–49", device: "Desktop", value: 15},
    {age: "50–64", device: "Phone", value: 31},
    {age: "50–64", device: "Laptop", value: 28},
    {age: "50–64", device: "Tablet", value: 17},
    {age: "50–64", device: "Desktop", value: 24},
    {age: "65+", device: "Phone", value: 22},
    {age: "65+", device: "Laptop", value: 21},
    {age: "65+", device: "Tablet", value: 26},
    {age: "65+", device: "Desktop", value: 31},
  ],
  groupBy: "device",
  sum: "value",
  facet: "age",
  sort: false,
  cellShape: "rounded",
};
SmallMultiples.parameters = {
  controls: {include: ["facet", "cellShape"]},
  docs: {
    description: {
      story:
        "`facet` draws one waffle per age group, side by side, with one shared legend. Each panel's cells are that group's own shares, so the panels compare at a glance.",
    },
  },
};
