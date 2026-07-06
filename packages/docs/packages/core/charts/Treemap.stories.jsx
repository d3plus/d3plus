// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Treemap} from "../../../args/core/charts/Treemap.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Treemap",
  component: Treemap,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Uses the [d3 treemap layout](https://github.com/mbostock/d3/wiki/Treemap-Layout) to creates SVG rectangles based on an array of data. See [this example](https://d3plus.org/examples/d3plus-hierarchy/getting-started/) for help getting started using the treemap generator.",
      },
    },
  }
};

const Template = (args) => <Treemap config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

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
BasicExample.parameters = {controls: {include: ["sum"]}, docs: {description: {story: "Each rectangle's area is proportional to its `sum` of the `value` field, giving one tile per `groupBy` id."}}};

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
NestedData.parameters = {controls: {include: ["groupBy"]}, docs: {description: {story: "A two-level `groupBy` ([\"parent\", \"id\"]) nests child rectangles inside their parent groups, so each group occupies its own region of the layout."}}};

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
ChangingTilingMethod.parameters = {controls: {include: ["tile"]}, docs: {description: {story: "`tile: \"slice\"` arranges children as parallel strips instead of the default squarified layout that favors square-ish tiles; use it when preserving order along one axis matters more than aspect ratio."}}};

export const SmallDataThreshold = Template.bind({});
SmallDataThreshold.args = {
  colorScale: "Total Population",
  data: "https://api.datausa.io/tesseract/data.jsonrecords?cube=pums_5&drilldowns=State&measures=Total%20Population&Year=2023",
  groupBy: "State",
  sum: "Total Population",
  threshold: 0.0025,
  thresholdName: "States"
};
SmallDataThreshold.parameters = {controls: {include: ["threshold", "thresholdName"]}, docs: {description: {story: "`threshold: 0.0025` merges every state below 0.25% of the total sum into one catch-all rectangle labeled by `thresholdName` (\"States\"), keeping tiny slivers from cluttering the layout."}}};
