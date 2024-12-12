import React from "react";
import {argTypes, Tree} from "../args/Tree.args";
import configify from "../helpers/configify";

export default {
  title: "Advanced/Tree",
  component: Tree,
  argTypes
};

const Template = (args) => <Tree config={configify(args, argTypes)} />;

/* export const GettingStarted = Template.bind({});
GettingStarted.args = {
 data: [
   {parent: "Group 1", id: "alpha", value: 29},
   {parent: "Group 1", id: "beta", value: 10},
   {parent: "Group 1", id: "gamma", value: 2},
   {parent: "Group 2", id: "delta", value: 29},
   {parent: "Group 2", id: "eta", value: 25}
 ],
 groupBy: ["parent", "id"],
 orient: "horizontal"
};
*/
