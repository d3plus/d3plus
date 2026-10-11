// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, RadialBar} from "../../../args/core/charts/RadialBar.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/RadialBar",
  component: RadialBar,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a radial bar chart from an array of data: each row is a\nconcentric track whose arc length shows its value, or, with\ndiscrete(\"angle\"), a bar radiating out from an inner circle.",
      },
    },
  }
};

const Template = (args) => <RadialBar config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const browsers = [
  {browser: "Chrome", share: 64.7},
  {browser: "Safari", share: 18.6},
  {browser: "Edge", share: 5.3},
  {browser: "Firefox", share: 2.8},
  {browser: "Samsung Internet", share: 2.4},
  {browser: "Opera", share: 2.2},
];

const countries = [
  "Norway",
  "Sweden",
  "Denmark",
  "Finland",
  "Iceland",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Portugal",
  "Poland",
  "Austria",
  "Belgium",
  "Netherlands",
  "Ireland",
  "Greece",
  "Czechia",
  "Hungary",
  "Slovakia",
  "Croatia",
];
const renewables = countries.map((country, i) => ({
  country,
  share: 12 + ((i * 37) % 70),
}));

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: browsers,
  groupBy: "browser",
  value: "share",
};
BasicExample.parameters = {
  controls: {include: ["groupBy", "value", "maxAngle", "trackPadding"]},
  docs: {
    description: {
      story:
        "Each row is a concentric track, the largest value outermost, and its bar's arc length shows its value along a 270° sweep. Every track's label sits in the open quarter before its start, and the value ticks run around the outside.",
    },
  },
};

export const HalfCircle = Template.bind({});
HalfCircle.args = {
  data: [
    {goal: "Revenue", progress: 82},
    {goal: "Retention", progress: 64},
    {goal: "NPS", progress: 47},
    {goal: "Hiring", progress: 91},
  ],
  groupBy: "goal",
  value: "progress",
  startAngle: -90,
  maxAngle: 180,
  domain: [0, 100],
  ticks: [0, 25, 50, 75, 100],
};
HalfCircle.parameters = {
  controls: {include: ["startAngle", "maxAngle", "domain", "ticks"]},
  docs: {
    description: {
      story:
        "`startAngle` and `maxAngle` set the sweep — here a half circle, which the chart moves down to fill the space. A fixed `domain` reads every bar as progress toward 100, against explicit `ticks`.",
    },
  },
};

export const CircularBarChart = Template.bind({});
CircularBarChart.args = {
  data: renewables,
  groupBy: "country",
  value: "share",
  discrete: "angle",
};
CircularBarChart.parameters = {
  controls: {include: ["discrete", "innerRadius", "trackPadding", "levels"]},
  docs: {
    description: {
      story:
        '`discrete: "angle"` gives every row an equal slice of the circle instead, with a bar rising from the inner circle whose length shows its value. Value rings mark the scale, and crowded labels turn along their spokes.',
    },
  },
};

export const OpenCircularBars = Template.bind({});
OpenCircularBars.args = {
  data: renewables.slice(0, 12),
  groupBy: "country",
  value: "share",
  discrete: "angle",
  maxAngle: 300,
  sort: null,
  track: false,
  padPixel: 2,
};
OpenCircularBars.parameters = {
  controls: {include: ["maxAngle", "sort", "track", "padPixel"]},
  docs: {
    description: {
      story:
        "A 300° sweep leaves a gap at the top, `sort: null` keeps the data's order, and `track: false` drops the background tracks so the value rings show through.",
    },
  },
};

export const StyledTracks = Template.bind({});
StyledTracks.args = {
  data: browsers,
  groupBy: "browser",
  value: "share",
  innerRadius: 30,
  trackPadding: 0.5,
  trackConfig: {fill: "#dbe4ff"},
  color: funcify(() => "#3b5bdb", '() => "#3b5bdb"'),
};
StyledTracks.parameters = {
  controls: {include: ["innerRadius", "trackPadding", "trackConfig"]},
  docs: {
    description: {
      story:
        "`trackPadding` thins each track, `innerRadius` sizes the hollow center, and `trackConfig` paints the background tracks.",
    },
  },
};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: ["2024", "2025", "2026"].flatMap((year, y) =>
    ["Design", "Engineering", "Marketing", "Sales", "Support"].map(
      (team, t) => ({
        year,
        team,
        people: 8 + ((y * 11 + t * 7) % 30),
      }),
    ),
  ),
  groupBy: "team",
  value: "people",
  facet: "year",
};
SmallMultiples.parameters = {
  controls: {include: ["facet"]},
  docs: {
    description: {
      story:
        "`facet` draws one chart per year, side by side, each sorted by its own values.",
    },
  },
};
