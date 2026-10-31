// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, SlopeChart} from "../../../args/core/charts/SlopeChart.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/SlopeChart",
  component: SlopeChart,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          'Creates a slope chart from an array of data: a LinePlot comparing each\nseries between two periods, with a line from its first value to its\nsecond. Each line is labeled at both ends with its series name and value\n(lineLabels: "both" with lineLabelConfig: {value: true}), labels that\nwould overlap are nudged apart on each side, and the value axis hides its\nlabels, ticks, and gridlines, since the labels carry the values (tooltips\nstill show them). The x axis shows the periods in the data; with more\nthan two, every period is drawn and a warning suggests filtering to two.\nMarkers sit at each end of every line. slopeColor colors each line by\nwhether it rose, fell, or stayed flat. For ranks rather than values, use\na two-period BumpChart, which labels its rank axes with the series names.',
      },
    },
  },
};

const Template = args => <SlopeChart config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const renewables = [
  ["Brazil", 41, 47],
  ["Chile", 30, 36],
  ["Peru", 31, 30],
  ["Argentina", 10, 12],
  ["Colombia", 28, 27],
  ["Mexico", 17, 22],
  ["Uruguay", 57, 58],
  ["Ecuador", 29, 29],
].flatMap(([country, before, after]) => [
  {country, year: 2015, share: before},
  {country, year: 2024, share: after},
]);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: renewables,
  groupBy: "country",
  x: "year",
  y: "share",
  yConfig: {
    tickFormat: funcify(d => `${d}%`, "d => `${d}%`"),
  },
};
BasicExample.parameters = {
  controls: {include: ["groupBy", "x", "y", "lineLabels", "lineLabelConfig"]},
  docs: {
    description: {
      story:
        "Each `groupBy` series is a line from its value in the first period to its value in the second, named at both ends with its value. The values take the y axis's `tickFormat`, here a percent sign, while the axis itself stays hidden; hover a line for its values. Labels that would overlap are spread apart on each side.",
    },
  },
};

export const DirectionColors = Template.bind({});
DirectionColors.args = {
  ...BasicExample.args,
  slopeColor: true,
};
DirectionColors.parameters = {
  controls: {include: ["slopeColor"]},
  docs: {
    description: {
      story:
        'Set `slopeColor: true` to color each line by its direction: green where the value rose, red where it fell, and gray where it held steady, in shades that suit a light or dark theme. Pass an object to pick any of the colors, e.g. `{up: "#1971c2", down: "#e8590c"}`.',
    },
  },
};

const regions = [
  "Andes",
  "Atlantic Coast",
  "Caribbean",
  "Central Plains",
  "Gulf",
  "Highlands",
  "Lake District",
  "Northern Forest",
  "Pacific Coast",
  "Pampas",
  "Patagonia",
  "River Delta",
  "Southern Cone",
  "Valley",
];

export const ManySeries = Template.bind({});
ManySeries.args = {
  data: regions.flatMap((region, i) => [
    {region, period: "Before", score: 50 + ((i * 7) % 9)},
    {region, period: "After", score: 48 + ((i * 5) % 13)},
  ]),
  groupBy: "region",
  lineLabelConfig: {
    valueFormat: funcify(v => v.toFixed(0), "v => v.toFixed(0)"),
  },
  slopeColor: true,
  x: "period",
  y: "score",
};
ManySeries.parameters = {
  controls: {include: ["lineLabelConfig", "slopeColor"]},
  docs: {
    description: {
      story:
        "Many series that start and end close together: the labels on each side spread apart until none overlap, each staying as close to its line as the others allow, with a dotted connector back to the line when it moves. The periods here are strings, drawn in the order they first appear, and `lineLabelConfig.valueFormat` formats the values.",
    },
  },
};

export const RanksWithBumpChart = Template.bind({});
RanksWithBumpChart.args = {
  ...BasicExample.args,
  lineLabelConfig: {value: false},
};
RanksWithBumpChart.parameters = {
  controls: {include: ["lineLabelConfig"]},
  docs: {
    description: {
      story:
        "Set `lineLabelConfig: {value: false}` to name the lines without their values. To compare ranks rather than values, use a BumpChart with two periods: its axes name each series at its rank on both sides.",
    },
  },
};
