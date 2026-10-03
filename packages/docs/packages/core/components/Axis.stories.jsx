// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Axis} from "../../../args/core/components/Axis.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/Axis",
  component: Axis,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates an SVG scale based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Axis config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  domain: [0, 100],
  width: 600,
  height: 120,
  title: "Axis"
};
BasicExample.parameters = {controls: {include: ["domain", "ticks", "title", "grid"]}, docs: {description: {story: "A linear `[0, 100]` domain is spread across the 600px width with auto-generated ticks and a title; the base class defaults to `bottom` orientation."}}};

export const LogScale = Template.bind({});
LogScale.args = {
  domain: [1, 10000],
  height: 120,
  scale: "log",
  title: "Log scale",
  width: 600
};
LogScale.parameters = {controls: {include: ["scale", "domain", "gridLog"]}, docs: {description: {story: "`scale: \"log\"` spaces the ticks by powers of ten, so a `[1, 10000]` domain gets a major tick per decade with minor ticks between them. Values must stay above zero on a log axis."}}};

export const TimeScale = Template.bind({});
TimeScale.args = {
  domain: [new Date(2020, 0, 1), new Date(2024, 11, 31)],
  height: 120,
  scale: "time",
  title: "Time scale",
  width: 600
};
TimeScale.parameters = {controls: {include: ["scale", "domain", "timeLocale"]}, docs: {description: {story: "`scale: \"time\"` takes a domain of dates and labels the ticks with the date format that suits their spacing, years here; `timeLocale` swaps in another language's month and day names."}}};

export const OrdinalScale = Template.bind({});
OrdinalScale.args = {
  domain: ["Q1", "Q2", "Q3", "Q4"],
  height: 120,
  scale: "band",
  title: "Band scale",
  width: 600
};
OrdinalScale.parameters = {controls: {include: ["scale", "domain", "paddingInner", "paddingOuter"]}, docs: {description: {story: "`scale: \"band\"` (or `\"point\"`, or `\"ordinal\"`) treats the domain as a list of categories and gives each one an equal slot, with `paddingInner` and `paddingOuter` controlling the gaps. Bar charts place their bars on an axis like this."}}};

export const TicksAndFormat = Template.bind({});
TicksAndFormat.args = {
  domain: [0, 100],
  gridSize: 60,
  height: 160,
  labels: [0, 25, 50, 75, 100],
  tickFormat: funcify(d => `$${d}k`, "d => `$${d}k`"),
  ticks: [0, 25, 50, 75, 100],
  tickSize: 8,
  title: "Revenue",
  width: 600
};
TicksAndFormat.parameters = {controls: {include: ["ticks", "labels", "tickFormat", "tickSize", "gridSize"]}, docs: {description: {story: "`ticks` pins where the tick marks go and `labels` which of them get text (by default the axis thins labels to what fits, independently of `ticks`), `tickFormat` turns each value into its label, `tickSize` is the length of the tick marks, and `gridSize` extends grid lines from the ticks across the chart area."}}};
