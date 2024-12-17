import React from "react";
import {argTypes, AreaPlot as Viz} from "../args/AreaPlot.args";
import configify from "../helpers/configify";

export default {
  title: "Charts/Area Plot",
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
  groupBy: "id",
  x: "x",
  y: "y"
};

export const ChangingAreaOpacity = Template.bind({});
ChangingAreaOpacity.args = {
  data: [
    {id: "alpha", x: 1, y: 7},
    {id: "alpha", x: 2, y: 2},
    {id: "alpha", x: 3, y: 13},
    {id: "alpha", x: 4, y: 4},
    {id: "alpha", x: 5, y: 22},
    {id: "beta", x: 1, y: 10},
    {id: "beta", x: 2, y: 6},
    {id: "beta", x: 3, y: 3},
    {id: "beta", x: 4, y: 12},
    {id: "beta", x: 5, y: 11}
  ],
  groupBy: "id",
  shapeConfig: {
    fill: "red",
    Area: {
      fillOpacity: 0.5
    }
  }
};
ChangingAreaOpacity.parameters = {controls: {include: ["shapeConfig"]}};