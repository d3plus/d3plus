// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Priestley} from "../../../args/core/charts/Priestley.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Priestley",
  component: Priestley,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a priestley timeline based on an array of data.",
      },
    },
  }
};

const Template = (args) => <Priestley config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {element: "alpha",   birth: 2004, death: 2007},
    {element: "epsilon", birth: 2007, death: 2012},
    {element: "beta",    birth: 2005, death: 2010}
  ],
  end: "death",
  groupBy: "element",
  start: "birth"
};
BasicExample.parameters = {controls: {include: ["end", "start"]}, docs: {description: {story: "Each bar spans from its `start` to its `end`, so bar length encodes duration and horizontal position shows when each element existed."}}};

export const GroupingBarsIntoLanes = Template.bind({});
GroupingBarsIntoLanes.args = {
  data: [
    {parent: "Group 1", id: "alpha",   start: 2004, end: 2007},
    {parent: "Group 2", id: "epsilon", start: 2007, end: 2012},
    {parent: "Group 1", id: "beta",    start: 2005, end: 2010},
    {parent: "Group 1", id: "gamma",   start: 2008, end: 2013},
    {parent: "Group 2", id: "delta",   start: 2004, end: 2007}
  ],
  end: "end",
  groupBy: ["parent", "id"],
  shapeConfig: {
    fill: funcify(
      d => d.parent === "Group 1" ? "firebrick" : "cornflowerblue",
      `d => d.parent === "Group 1" ? "firebrick" : "cornflowerblue"`
    )
  },
  start: "start"
};
GroupingBarsIntoLanes.parameters = {controls: {include: ["groupBy", "shapeConfig"]}, docs: {description: {story: "Passing `[\"parent\", \"id\"]` to `groupBy` nests the bars into lanes by `parent`; the `shapeConfig.fill` function then colors each bar by its parent group."}}};

const missions = [
  {mission: "Sojourner", start: 1997, end: 1997},
  {mission: "Spirit", start: 2004, end: 2010},
  {mission: "Opportunity", start: 2004, end: 2018},
  {mission: "Curiosity", start: 2012, end: 2024},
  {mission: "Perseverance", start: 2021, end: 2024}
];

export const MissionTimeline = Template.bind({});
MissionTimeline.args = {
  data: missions,
  end: "end",
  groupBy: "mission",
  start: "start"
};
MissionTimeline.parameters = {controls: {include: ["start", "end"]}, docs: {description: {story: "Rover missions as lifespans: each bar runs from its landing year (`start`) to its final year (`end`), bars that overlap in time are stacked into separate lanes automatically, and a mission that started and ended in the same year still gets a visible sliver."}}};

export const LanePadding = Template.bind({});
LanePadding.args = {
  data: missions,
  end: "end",
  groupBy: "mission",
  paddingInner: 0.6,
  paddingOuter: 0.3,
  start: "start"
};
LanePadding.parameters = {controls: {include: ["paddingInner", "paddingOuter"]}, docs: {description: {story: "`paddingInner` is the fraction of each lane left empty between bars and `paddingOuter` the space above the first and below the last lane, the same meaning they have for a d3 band scale."}}};
