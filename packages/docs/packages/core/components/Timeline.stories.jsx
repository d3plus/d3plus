// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Timeline} from "../../../args/core/components/Timeline.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/Timeline",
  component: Timeline,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates an interactive timeline brush component for selecting time periods within a visualization.",
      },
    },
  }
};

const Template = (args) => <Timeline config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  align: "start",
  brushing: false,
  domain: [2012, 2020],
  height: 100,
  playButton: true,
  width: 400
};
BasicExample.parameters = {controls: {include: ["domain", "playButton"]}, docs: {description: {story: "With `brushing: false`, the timeline selects a single period across the `domain`; enabling `playButton` adds controls to step through the periods automatically."}}};
export const RangeSelection = Template.bind({});
RangeSelection.args = {
  domain: [2000, 2020],
  brushing: true,
  height: 100,
  width: 520
};
RangeSelection.parameters = {
  controls: {include: ["domain", "brushing"]},
  docs: {description: {story: "With `brushing: true`, viewers can drag to select a time range instead of a single period."}}
};

export const TickFormat = Template.bind({});
TickFormat.args = {
  domain: [2000, 2020],
  height: 100,
  tickFormat: funcify(
    d => `'${String(d instanceof Date ? d.getFullYear() : d).slice(-2)}`,
    "d => `'${String(d instanceof Date ? d.getFullYear() : d).slice(-2)}`"
  ),
  ticks: [2000, 2004, 2008, 2012, 2016, 2020],
  width: 520
};
TickFormat.parameters = {controls: {include: ["ticks", "tickFormat"]}, docs: {description: {story: "The timeline is an Axis, so `ticks` chooses which periods get a mark and `tickFormat` rewrites their labels; abbreviating the years keeps a long range readable at a narrow width."}}};

export const InitialSelection = Template.bind({});
InitialSelection.args = {
  brushing: true,
  domain: [2000, 2020],
  height: 100,
  selection: [2008, 2012],
  snapping: false,
  width: 520
};
InitialSelection.parameters = {controls: {include: ["selection", "snapping", "brushMin"]}, docs: {description: {story: "`selection` sets the range (or single period) that is highlighted before the viewer touches anything, and `snapping: false` lets the brush handles rest between ticks instead of jumping to the nearest period."}}};
