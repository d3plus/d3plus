import React from "react";
import {argTypes, Area as Viz} from "../args/Area.args";
import configify from "../helpers/configify";

export default {
  title: "Charts/Area Chart",
  component: Viz,
  argTypes
};

const Template = (args) => <Viz config={configify(args, argTypes)} />;

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", x: 1, y: 7},
    {id: "alpha", x: 2, y: 2},
    {id: "alpha", x: 3, y: 13},
    {id: "alpha", x: 4, y: 4},
    {id: "alpha", x: 5, y: 22},
    {id: "alpha", x: 6, y: 13}
  ],
  groupBy: "id"
};
