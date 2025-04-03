import React from "react";
import {argTypes, Treemap as Viz} from "../../../args/core/charts/Treemap.args";
import configify from "../../../helpers/configify";

export default {
  title: "Core/Charts/Treemap",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", value: 29},
    {id: "beta", value: 10},
    {id: "gamma", value: 2},
    {id: "delta", value: 29},
    {id: "eta", value: 25}
  ],
  groupBy: "id",
  sum: "value"
};
BasicExample.parameters = {controls: {include: ["sum"]}};

export const NestedData = Template.bind({});
NestedData.args = {
  data: [
    {parent: "Group 1", id: "alpha", value: 29},
    {parent: "Group 1", id: "beta", value: 10},
    {parent: "Group 1", id: "gamma", value: 2},
    {parent: "Group 2", id: "delta", value: 29},
    {parent: "Group 2", id: "eta", value: 25}
  ],
  groupBy: ["parent", "id"],
  sum: "value"
};
NestedData.parameters = {controls: {include: ["groupBy"]}};

export const ChangingTilingMethod = Template.bind({});
ChangingTilingMethod.args = {
  data: [
    {"Group": "Store", "Sub-Group": "Convenience Store", "Number of Stores": 100},
    {"Group": "Store", "Sub-Group": "Grocery Store", "Number of Food Stores": 150},
    {"Group": "Store", "Sub-Group": "Supercenters", "Number of Food Stores": 30},
    {"Group": "Other", "Sub-Group": "Farmer's Market", "Number of Food Stores": 50},
    {"Group": "Restaurant", "Sub-Group": "Fast-Food Restaurant", "Number of Food Stores": 60},
    {"Group": "Restaurant", "Sub-Group": "Full-Service Restaurant", "Number of Food Stores": 120}
  ],
  groupBy: ["Group", "Sub-Group"],
  sum: "Number of Food Stores",
  tile: "slice"
};
ChangingTilingMethod.parameters = {controls: {include: ["tile"]}};

export const SmallDataThreshold = Template.bind({});
SmallDataThreshold.args = {
  colorScale: "Population",
  data: "https://datausa.io/api/data?measures=Population&drilldowns=State&Year=2018",
  groupBy: "State",
  sum: "Population",
  threshold: 0.0025,
  thresholdName: "States"
};
SmallDataThreshold.parameters = {controls: {include: ["threshold", "thresholdName"]}};
