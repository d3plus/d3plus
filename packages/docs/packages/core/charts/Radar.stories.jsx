// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Radar} from "../../../args/core/charts/Radar.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Radar",
  component: Radar,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a radar visualization based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Radar config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", axis: "Central",    number: 170.992},
    {id: "alpha", axis: "Kirkdale",   number: 40},
    {id: "alpha", axis: "Kensington", number: 240},
    {id: "alpha", axis: "Everton",    number: 90},
    {id: "alpha", axis: "Picton",     number: 160},
    {id: "alpha", axis: "Riverside",  number: 30},
    {id: "beta",  axis: "Central",    number: 320},
    {id: "beta",  axis: "Kirkdale",   number: 97.5},
    {id: "beta",  axis: "Kensington", number: 40},
    {id: "beta",  axis: "Everton",    number: 110},
    {id: "beta",  axis: "Picton",     number: 40},
    {id: "beta",  axis: "Riverside",  number: 110}
  ],
  groupBy: "id",
  metric: "axis",
  value: "number"
};
BasicExample.parameters = {controls: {include: ["metric", "value"]}, docs: {description: {story: "`metric` names the field that becomes each spoke of the web while `value` sets how far along a spoke each point reaches; the two `groupBy` ids draw as separate polygons."}}};

export const MultipleSeries = Template.bind({});
MultipleSeries.args = {
  data: [
    {group: "A", metric: "Strength", value: 8}, {group: "A", metric: "Speed", value: 6},
    {group: "A", metric: "Stamina", value: 9}, {group: "A", metric: "Agility", value: 7},
    {group: "A", metric: "Intellect", value: 5},
    {group: "B", metric: "Strength", value: 5}, {group: "B", metric: "Speed", value: 9},
    {group: "B", metric: "Stamina", value: 6}, {group: "B", metric: "Agility", value: 8},
    {group: "B", metric: "Intellect", value: 9}
  ],
  groupBy: "group",
  metric: "metric",
  value: "value"
};
MultipleSeries.parameters = {
  controls: {include: ["metric", "value"]},
  docs: {description: {story: "Two series overlaid on the same axes, one filled polygon per group."}}
};

const skillData = ["Analyst", "Engineer", "Designer"].flatMap((group, g) =>
  ["Research", "Writing", "Coding", "Design", "Testing", "Planning", "Presenting", "Mentoring"].map((metric, m) => ({
    group,
    metric,
    value: 3 + ((m * 3 + g * 5) % 7),
  })),
);

export const MoreMetrics = Template.bind({});
MoreMetrics.args = {
  data: skillData,
  groupBy: "group",
  metric: "metric",
  value: "value"
};
MoreMetrics.parameters = {controls: {include: ["metric", "value"]}, docs: {description: {story: "Eight `metric` values make eight evenly spaced spokes, and three `groupBy` series become three overlaid polygons, which is the typical skills-profile use of a radar."}}};

export const LevelsAndPadding = Template.bind({});
LevelsAndPadding.args = {
  data: skillData,
  groupBy: "group",
  levels: 3,
  metric: "metric",
  outerPadding: 90,
  value: "value"
};
LevelsAndPadding.parameters = {controls: {include: ["levels", "outerPadding"]}, docs: {description: {story: "`levels` sets roughly how many concentric rings are drawn behind the polygons (three here instead of the default six). Like axis ticks, the rings land on round values, so the count is a target rather than an exact number. `outerPadding` reserves space between the outermost ring and the edge for the spoke labels."}}};

const scoreData = ["2024", "2025"].flatMap((group, g) =>
  ["Speed", "Power", "Range", "Comfort", "Safety", "Price", "Design", "Support"].map((metric, m) => ({
    group,
    metric,
    value: 30 + ((m * 23 + g * 37) % 65),
  })),
);

export const LevelLabels = Template.bind({});
LevelLabels.args = {
  data: scoreData,
  groupBy: "group",
  levelFormat: funcify(
    d => `${d}%`,
    "d => `${d}%`"
  ),
  levels: [0, 25, 50, 75, 100],
  metric: "metric",
  value: "value"
};
LevelLabels.parameters = {controls: {include: ["levels", "levelFormat", "levelLabels"]}, docs: {description: {story: "Each ring is labeled with its value along the vertical axis. Passing an array to `levels` sets the exact ring values (here a 0–100 scale), and `levelFormat` formats each label. Set `levelLabels` to `false` to hide them."}}};

export const LevelLabelStyling = Template.bind({});
LevelLabelStyling.args = {
  data: skillData,
  groupBy: "group",
  levelLabelAngle: 22.5,
  levelLabelConfig: {
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    padding: 3
  },
  levels: 4,
  metric: "metric",
  value: "value"
};
LevelLabelStyling.parameters = {controls: {include: ["levelLabelAngle", "levelLabelConfig", "levels"]}, docs: {description: {story: "`levelLabelAngle` turns the labels to any direction, in degrees clockwise from 12 o'clock — 22.5 runs them between the top two spokes instead of along one. `levelLabelConfig` styles the text and its backdrop (`background: false` removes the backdrop)."}}};
