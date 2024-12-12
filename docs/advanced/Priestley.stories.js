import React from "react";
import {argTypes, Priestley} from "../args/Priestley.args";
import configify from "../helpers/configify";
import funcify from "../helpers/funcify";

export default {
  title: "Advanced/Priestley",
  component: Priestley,
  argTypes
};

const Template = (args) => <Priestley config={configify(args, argTypes)} />;

export const GroupingBarsIntoLanes = Template.bind({});
GroupingBarsIntoLanes.args = {
  data: [
    {parent: "Group 1", id: "alpha",   start: 2004, end: 2007},
    {parent: "Group 2", id: "epsilon", start: 2007, end: 2012},
    {parent: "Group 1", id: "beta",    start: 2005, end: 2010},
    {parent: "Group 1", id: "gamma",   start: 2008, end: 2013},
    {parent: "Group 2", id: "delta",   start: 2004, end: 2007}
  ],
  groupBy: ["parent", "id"],
  shapeConfig: {
    fill: funcify(
      d => d.parent === "Group 1" ? "firebrick" : "cornflowerblue",
      `d => d.parent === "Group 1" ? "firebrick" : "cornflowerblue"`
    )
  }
};
