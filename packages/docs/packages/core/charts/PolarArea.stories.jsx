// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, PolarArea} from "../../../args/core/charts/PolarArea.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/PolarArea",
  component: PolarArea,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          "Creates a polar area chart (Nightingale rose or coxcomb) from an array of data: every category gets an equal slice of the circle, and each wedge's radius shows its value. With a `metric`, each category stacks its `groupBy` groups outward from the center.",
      },
    },
  },
};

const Template = args => <PolarArea config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

// Deaths in the British Army in the East, April 1854 – March 1855 (after Nightingale).
const months = [
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
];
const deaths = {
  Disease: [1, 12, 11, 359, 828, 788, 503, 844, 1725, 2761, 2120, 1205],
  Wounds: [0, 0, 0, 0, 1, 81, 132, 287, 114, 83, 42, 32],
  Other: [5, 9, 6, 23, 30, 70, 128, 106, 131, 324, 361, 172],
};
const crimea = Object.keys(deaths).flatMap(cause =>
  months.map((month, m) => ({cause, month, deaths: deaths[cause][m]})),
);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {direction: "N", days: 42},
    {direction: "NE", days: 27},
    {direction: "E", days: 18},
    {direction: "SE", days: 31},
    {direction: "S", days: 64},
    {direction: "SW", days: 88},
    {direction: "W", days: 57},
    {direction: "NW", days: 38},
  ],
  groupBy: "direction",
  value: "days",
};
BasicExample.parameters = {
  controls: {include: ["groupBy", "value", "radialScale", "startAngle"]},
  docs: {
    description: {
      story:
        "Every row gets an equal slice of the circle, and its wedge's radius shows its value. The radius uses a square-root scale by default, so each wedge's area — what the eye compares — stays proportional to its value. The labels around the circle name every wedge, so the legend steps aside.",
    },
  },
};

export const NightingaleRose = Template.bind({});
NightingaleRose.args = {
  data: crimea,
  groupBy: "cause",
  metric: "month",
  value: "deaths",
  color: funcify(
    d => ({Disease: "#4c6ef5", Wounds: "#e03131", Other: "#868e96"})[d.cause],
    'd => ({Disease: "#4c6ef5", Wounds: "#e03131", Other: "#868e96"})[d.cause]',
  ),
};
NightingaleRose.parameters = {
  controls: {include: ["metric", "groupBy", "levels", "levelLabelAngle"]},
  docs: {
    description: {
      story:
        "With a `metric`, every metric value is one slice of the circle and its `groupBy` groups stack outward from the center — Florence Nightingale's diagram of the causes of death in the Crimean War. The value rings sit on nice values and are labeled along `levelLabelAngle`.",
    },
  },
};

export const LinearScale = Template.bind({});
LinearScale.args = {
  data: [
    {skill: "Python", years: 12},
    {skill: "SQL", years: 9},
    {skill: "R", years: 6},
    {skill: "Go", years: 3},
    {skill: "TypeScript", years: 7},
    {skill: "Rust", years: 2},
  ],
  groupBy: "skill",
  value: "years",
  radialScale: "linear",
  innerRadius: 50,
  padPixel: 3,
  levels: [0, 5, 10, 15, 20],
};
LinearScale.parameters = {
  controls: {
    include: ["radialScale", "innerRadius", "padPixel", "padAngle", "levels"],
  },
  docs: {
    description: {
      story:
        '`radialScale: "linear"` makes each wedge\'s length, rather than its area, proportional to its value. `innerRadius` opens an empty center, `padPixel` an even gap between wedges, and an array of `levels` sets the exact value rings.',
    },
  },
};

export const CrowdedCategories = Template.bind({});
CrowdedCategories.args = {
  data: Array.from({length: 48}, (_v, k) => {
    const h = k / 2;
    return {
      time: `${String(Math.floor(h)).padStart(2, "0")}:${k % 2 ? "30" : "00"}`,
      trips: Math.round(
        40 +
          200 * Math.exp(-((h - 8) ** 2) / 6) +
          160 * Math.exp(-((h - 18) ** 2) / 8),
      ),
    };
  }),
  groupBy: "time",
  value: "trips",
};
CrowdedCategories.parameters = {
  controls: {include: ["outerPadding"]},
  docs: {
    description: {
      story:
        "When the category labels would overlap reading horizontally, each one turns to run along its wedge's spoke instead, and the circle shrinks just enough for them to fit.",
    },
  },
};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: ["North", "South", "East"].flatMap((region, r) =>
    ["Hardware", "Software", "Services"].flatMap((product, p) =>
      ["Q1", "Q2", "Q3", "Q4"].map((quarter, q) => ({
        region,
        product,
        quarter,
        sales: 20 + ((r * 17 + p * 29 + q * 13) % 45),
      })),
    ),
  ),
  groupBy: "product",
  metric: "quarter",
  value: "sales",
  facet: "region",
};
SmallMultiples.parameters = {
  controls: {include: ["facet"]},
  docs: {
    description: {
      story:
        "`facet` draws one rose per region, side by side and sharing one legend.",
    },
  },
};
