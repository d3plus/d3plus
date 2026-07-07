// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, BoxWhisker} from "../../../args/core/charts/BoxWhisker.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/BoxWhisker",
  component: BoxWhisker,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a simple box and whisker based on an array of data.",
      },
    },
  }
};

const Template = (args) => <BoxWhisker config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", value: 300},
    {id: "alpha", value: 20},
    {id: "alpha", value: 180},
    {id: "alpha", value: 40},
    {id: "alpha", value: 170},
    {id: "alpha", value: 125},
    {id: "alpha", value: 74},
    {id: "alpha", value: 80},
    {id: "beta", value: 180},
    {id: "beta", value: 30},
    {id: "beta", value: 120},
    {id: "beta", value: 50},
    {id: "beta", value: 140},
    {id: "beta", value: 115},
    {id: "beta", value: 14},
    {id: "beta", value: 30}
  ],
  groupBy: ["id", "value"],
  legend: false,
  x: "id",
  y: "value"
};
BasicExample.parameters = {docs: {description: {story: "One box per category summarizes its distribution: the box spans the interquartile range with a line at the median, and the whiskers reach out toward the extent of the values."}}};

export const ShowingOutliers = Template.bind({});
ShowingOutliers.args = {
  data: [
    {id: "alpha", value: 840},
    {id: "alpha", value: 940},
    {id: "alpha", value: 780},
    {id: "alpha", value: 650},
    {id: "alpha", value: 720},
    {id: "alpha", value: 430},
    {id: "alpha", value: 1850},
    {id: "alpha", value: 300},
    {id: "alpha", value: 360},
    {id: "alpha", value: 1690},
    {id: "alpha", value: 690},
    {id: "alpha", value: -950},
    {id: "alpha", value: -600},
    {id: "alpha", value: -850},
    {id: "beta", value: 980},
    {id: "beta", value: 300},
    {id: "beta", value: 120},
    {id: "beta", value: 500},
    {id: "beta", value: 140},
    {id: "beta", value: 115},
    {id: "beta", value: 14},
    {id: "beta", value: -30},
    {id: "beta", value: -1050},
    {id: "beta", value: -100},
    {id: "beta", value: -800},
    {id: "beta", value: -1100}
  ],
  groupBy: ["id", "value"],
  legend: false,
  x: "id",
  y: "value"
};
ShowingOutliers.parameters = {docs: {description: {story: "With the default Tukey whiskers, values beyond 1.5× the interquartile range fall outside the whiskers and are plotted as individual outlier points — no extra config required; this data carries several extreme highs and lows to trigger them."}}};

export const ChangingEndpointShapes = Template.bind({});
ChangingEndpointShapes.args = {
  data: [
    {id: "alpha", value: 300},
    {id: "alpha", value: 20},
    {id: "alpha", value: 180},
    {id: "alpha", value: 40},
    {id: "alpha", value: 170},
    {id: "alpha", value: 125},
    {id: "alpha", value: 74},
    {id: "alpha", value: 80},
    {id: "beta",  value: 180},
    {id: "beta",  value: 30},
    {id: "beta",  value: 120},
    {id: "beta",  value: 50},
    {id: "beta",  value: 140},
    {id: "beta",  value: 115},
    {id: "beta",  value: 14},
    {id: "beta",  value: 30},
  ],
  groupBy: ["id", "value"],
  shapeConfig: {
    whiskerConfig: {
      endpoint: funcify(
        d => d.id === "alpha" ? "Rect" : "Circle",
        "d => d.id === 'alpha' ? 'Rect' : 'Circle'"
      )
    }
  },
  x: "id",
  y: "value"
};
ChangingEndpointShapes.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "Change the cap drawn at each whisker's end through `shapeConfig.whiskerConfig.endpoint` — here a function gives the `alpha` group `Rect` caps and `beta` `Circle` caps."}}};

export const ChangingOutlierStyles = Template.bind({});
ChangingOutlierStyles.args = {
  data: [
    {id: "alpha", value: 840},
    {id: "alpha", value: 940},
    {id: "alpha", value: 780},
    {id: "alpha", value: 650},
    {id: "alpha", value: 720},
    {id: "alpha", value: 430},
    {id: "alpha", value: 1850},
    {id: "alpha", value: 300},
    {id: "alpha", value: 360},
    {id: "alpha", value: 1690},
    {id: "alpha", value: 690},
    {id: "alpha", value: -950},
    {id: "alpha", value: -600},
    {id: "alpha", value: -850},
    {id: "beta", value: 980},
    {id: "beta", value: 300},
    {id: "beta", value: 120},
    {id: "beta", value: 500},
    {id: "beta", value: 140},
    {id: "beta", value: 115},
    {id: "beta", value: 14},
    {id: "beta", value: -30},
    {id: "beta", value: -1050},
    {id: "beta", value: -100},
    {id: "beta", value: -800},
    {id: "beta", value: -1100}
  ],
  groupBy: ["id", "value"],
  shapeConfig: {
    outlier: funcify(
      d => d.id === "alpha" ? "Circle" : "Rect",
      "d => d.id === 'alpha' ? 'Circle' : 'Rect'"
    ),
    outlierConfig: {
      Rect: {
        fill: "green"
      },
      Circle: {
        fill: "red"
      }
    }
  },
  x: "id",
  y: "value"
};
ChangingOutlierStyles.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "Restyle the outlier marks with `shapeConfig.outlier`, which picks `Circle` versus `Rect` per group, and `outlierConfig`, which sets a `fill` per shape — red circles for `alpha`, green rects for `beta`."}}};

export const HorizontalChart = Template.bind({});
HorizontalChart.args = {
  data: [
    {id: "alpha", value: 300},
    {id: "alpha", value:  20},
    {id: "alpha", value: 180},
    {id: "alpha", value:  40},
    {id: "alpha", value: 170},
    {id: "alpha", value: 125},
    {id: "alpha", value:  74},
    {id: "alpha", value:  80},
    {id: "beta",  value: 180},
    {id: "beta",  value:  30},
    {id: "beta",  value: 120},
    {id: "beta",  value:  50},
    {id: "beta",  value: 140},
    {id: "beta",  value: 115},
    {id: "beta",  value:  14},
    {id: "beta",  value:  30}
  ],
  groupBy: ["id", "value"],
  discrete: "y",
  shapeConfig: {
    Box: {
      orient: "horizontal"
    }
  },
  x: "value",
  y: "id"
};
HorizontalChart.parameters = {controls: {include: ["discrete", "shapeConfig"]}, docs: {description: {story: "Lay the boxes out horizontally by setting `discrete: \"y\"` together with `shapeConfig.Box.orient: \"horizontal\"`, so categories stack down the `y` axis and each distribution spreads along `x`."}}};
