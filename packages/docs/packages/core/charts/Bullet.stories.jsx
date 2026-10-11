// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Bullet} from "../../../args/core/charts/Bullet.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Bullet",
  component: Bullet,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a bullet graph from an array of data: one compact bar per row\nreading its value against qualitative bands, with a target marker,\nan optional forecast bar, and a value axis. Rows stack top to bottom,\nor side by side with orient(\"vertical\").",
      },
    },
  }
};

const Template = (args) => <Bullet config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const kpis = [
  {id: "Revenue", unit: "US$, in thousands", value: 270, target: 250, ranges: [150, 225, 300]},
  {id: "Profit", unit: "%", value: 22.5, target: 27, ranges: [20, 25, 30]},
  {id: "Order Size", unit: "US$, average", value: 410, target: 550, ranges: [350, 500, 600]},
  {id: "New Customers", unit: "count", value: 1650, target: 2100, ranges: [1400, 2000, 2500]},
  {id: "Satisfaction", unit: "out of 5", value: 4.5, target: 4.2, ranges: [3.5, 4.25, 5]},
];

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "North", value: 72, target: 80},
    {id: "South", value: 88, target: 75},
    {id: "East", value: 54, target: 70},
  ],
  bands: [50, 75],
  domain: [0, 100],
};
BasicExample.parameters = {controls: {include: ["bands", "domain", "bulletSize", "measureSize"]}, docs: {description: {story: "Each row becomes a bullet: its `value` as a bar, its `target` as a marker across the band, and `bands` as shades behind them. Threshold values split the domain into bands that step from the strongest shade to the lightest."}}};

export const KeyPerformanceIndicators = Template.bind({});
KeyPerformanceIndicators.args = {
  data: kpis,
  bands: funcify(d => d.ranges.slice(0, -1), "d => d.ranges.slice(0, -1)"),
  domain: funcify(d => [0, d.ranges[d.ranges.length - 1]], "d => [0, d.ranges[d.ranges.length - 1]]"),
  subLabel: "unit",
};
KeyPerformanceIndicators.parameters = {controls: {include: ["bands", "domain", "subLabel", "ticks"]}, docs: {description: {story: "Stephen Few's classic set of KPIs. `bands` and `domain` can be functions of the row, so each measure gets its own qualitative ranges and scale, and `subLabel` adds the unit under each name."}}};

export const SharedDomainWithForecast = Template.bind({});
SharedDomainWithForecast.args = {
  data: [
    {id: "Q1", value: 42, target: 55, forecast: 58},
    {id: "Q2", value: 61, target: 60, forecast: 70},
    {id: "Q3", value: 38, target: 65, forecast: 52},
    {id: "Q4", value: 74, target: 70, forecast: 80},
  ],
  bands: [40, 70],
  domain: [0, 100],
  sharedDomain: true,
  tickFormat: funcify(d => `${d}%`, "d => `${d}%`"),
  valueFormat: funcify(d => `${d}%`, "d => `${d}%`"),
};
SharedDomainWithForecast.parameters = {controls: {include: ["sharedDomain", "forecast", "forecastConfig"]}, docs: {description: {story: "`sharedDomain` reads every bullet against one scale, labeled by a single axis. A `forecast` (or any comparative measure) draws as a wider, paler bar behind the measure."}}};

export const Vertical = Template.bind({});
Vertical.args = {
  data: [
    {id: "North", value: 72, target: 80},
    {id: "South", value: 88, target: 75},
    {id: "East", value: 54, target: 70},
    {id: "West", value: 63, target: 60},
  ],
  bands: [50, 75],
  domain: [0, 100],
  orient: "vertical",
};
Vertical.parameters = {controls: {include: ["orient", "bulletSize"]}, docs: {description: {story: "`orient(\"vertical\")` lines the bullets up as columns, with values growing upward and each name above its bullet."}}};

export const ColoredBands = Template.bind({});
ColoredBands.args = {
  data: [
    {id: "CPU", value: 64, target: 75},
    {id: "Memory", value: 81, target: 75},
    {id: "Disk", value: 37, target: 75},
  ],
  bands: [{max: 60, color: "#2b8a3e"}, {max: 85, color: "#e67700"}, {color: "#c92a2a"}],
  domain: [0, 100],
  shapeConfig: {fill: "#f1f3f5"},
  targetConfig: {stroke: "#1f2328"},
};
ColoredBands.parameters = {controls: {include: ["bands", "shapeConfig", "targetConfig"]}, docs: {description: {story: "Bands take the same `{min, max, color}` objects as Gauge's. With colored bands, a neutral measure and a dark target read best; each measure is outlined in the background color so it separates from the band behind it."}}};

export const SmallMultiples = Template.bind({});
SmallMultiples.args = {
  data: ["Africa", "Americas", "Asia", "Europe"].flatMap((region, r) =>
    [
      {id: "Revenue", base: 240, target: 250, ranges: [150, 225]},
      {id: "Profit", base: 24, target: 27, ranges: [20, 25]},
      {id: "Orders", base: 1500, target: 1800, ranges: [1200, 1700]},
    ].map((m, k) => ({
      id: m.id,
      region,
      value: Math.round(m.base * (0.75 + ((r * 3 + k * 5) % 7) / 10)),
      target: m.target,
      ranges: m.ranges,
    })),
  ),
  bands: funcify(d => d.ranges, "d => d.ranges"),
  facet: "region",
};
SmallMultiples.parameters = {controls: {include: ["facet", "facetConfig"]}, docs: {description: {story: "With `facet`, each panel draws its own stack of bullets, and each measure reads against the same domain in every panel, so Revenue in one region compares directly with Revenue in another."}}};

export const Compact = Template.bind({});
Compact.args = {
  data: [
    {id: "Uptime", value: 97.2},
    {id: "Tests passing", value: 92.5},
    {id: "Coverage", value: 81.4},
    {id: "Docs complete", value: 68},
  ],
  bands: [70, 85],
  bulletSize: 18,
  domain: [0, 100],
  target: 90,
  ticks: false,
};
Compact.parameters = {controls: {include: ["bulletSize", "target", "ticks"]}, docs: {description: {story: "`ticks(false)` drops the axes for a compact sparkline-style list, and a number for `target` gives every row the same goal."}}};
