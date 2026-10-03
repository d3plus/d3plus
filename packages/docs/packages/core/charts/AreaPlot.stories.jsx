// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, AreaPlot} from "../../../args/core/charts/AreaPlot.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/AreaPlot",
  component: AreaPlot,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates an area plot based on an array of data.",
      },
    },
  }
};

const Template = (args) => <AreaPlot config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = {
  args: {
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
  },
  parameters: {
    nextjs: {
      router: {
        pathname: "/core/charts/AreaPlot"
      }
    },
    docs: {
      description: {
        story: "A single-series area chart: `groupBy` defines the series and the region fills from the baseline up to each `y` value."
      }
    }
  },
  render: Template
}

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
ChangingAreaOpacity.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "Set `shapeConfig.Area.fillOpacity` to 0.5 so that where the two series overlap you can still see both areas through each other rather than one occluding the other."}}};
const seriesData = ["alpha", "beta", "gamma"].flatMap((id, s) =>
  [1, 2, 3, 4, 5, 6].map(x => ({id, x, y: 6 + ((x * 7 + s * 5) % 11) + s * 3})),
);

export const StackedSeries = Template.bind({});
StackedSeries.args = {
  data: seriesData,
  groupBy: "id",
  stacked: true,
  x: "x",
  y: "y",
};
StackedSeries.parameters = {controls: {include: ["stacked", "stackOrder", "stackOffset"]}, docs: {description: {story: "`stacked: true` piles the series on top of one another so the outline of the whole is the total at each `x`, with `stackOrder` and `stackOffset` controlling which series sits at the bottom and how the stack is normalized. Compare the overlapping, translucent areas above."}}};

const monthly = ["alpha", "beta"].flatMap((id, s) =>
  Array.from({length: 12}, (_, m) => ({
    id,
    date: `2024-${String(m + 1).padStart(2, "0")}-01`,
    y: 10 + ((m * 5 + s * 7) % 13) + s * 4,
  })),
);

export const TimeAxis = Template.bind({});
TimeAxis.args = {
  data: monthly,
  groupBy: "id",
  time: "date",
  x: "date",
  y: "y",
};
TimeAxis.parameters = {controls: {include: ["time", "x"]}, docs: {description: {story: "Pointing `x` and `time` at a field of date strings makes the x axis a time scale: the `2024-01-01` style values are parsed into dates, ticks are labeled by month, and the areas flow across the calendar instead of across category positions."}}};
