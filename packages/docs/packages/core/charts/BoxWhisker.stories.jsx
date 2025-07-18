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
ChangingEndpointShapes.parameters = {controls: {include: ["shapeConfig"]}};

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
ChangingOutlierStyles.parameters = {controls: {include: ["shapeConfig"]}};

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
HorizontalChart.parameters = {controls: {include: ["discrete", "shapeConfig"]}};
