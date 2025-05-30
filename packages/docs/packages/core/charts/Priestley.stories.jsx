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
BasicExample.parameters = {controls: {include: ["end", "start"]}};

export const GroupingBarsIntoLanes = Template.bind({});
GroupingBarsIntoLanes.args = {
  data: [
    {parent: "Group 1", id: "alpha",   start: 2004, end: 2007},
    {parent: "Group 2", id: "epsilon", start: 2007, end: 2012},
    {parent: "Group 1", id: "beta",    start: 2005, end: 2010},
    {parent: "Group 1", id: "gamma",   start: 2008, end: 2013},
    {parent: "Group 2", id: "delta",   start: 2004, end: 2007}
  ],
  end: "death",
  groupBy: ["parent", "id"],
  shapeConfig: {
    fill: funcify(
      d => d.parent === "Group 1" ? "firebrick" : "cornflowerblue",
      `d => d.parent === "Group 1" ? "firebrick" : "cornflowerblue"`
    )
  },
  start: "birth"
};
GroupingBarsIntoLanes.parameters = {controls: {include: ["groupBy", "shapeConfig"]}};
