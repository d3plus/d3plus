import React from "react";
import {argTypes, Area} from "../args/Area.args";
import configify from "../helpers/configify";

export default {
  title: "Advanced/Area Chart",
  component: Area,
  argTypes
};

const Template = (args) => <Area config={configify(args, argTypes)} />;

export const ChangingAreaOpacity = Template.bind({});
ChangingAreaOpacity.args = {
  data: [
    {id: "alpha", x: 1, y: 7},
    {id: "alpha", x: 2, y: 2},
    {id: "alpha", x: 3, y: 13},
    {id: "alpha", x: 4, y: 4},
    {id: "alpha", x: 5, y: 22},
    {id: "alpha", x: 6, y: 13},
    {id: "beta", x: 1, y: 10},
    {id: "beta", x: 2, y: 6},
    {id: "beta", x: 3, y: 15},
    {id: "beta", x: 4, y: 12},
    {id: "beta", x: 5, y: 11},
    {id: "beta", x: 6, y: 7}
  ],
  groupBy: "id",
  shapeConfig: {
    Area: {
      fillOpacity: 0.5
    }
  }
};
