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
        component:
          "Creates a simple box and whisker based on an array of data.",
      },
    },
  },
};

const Template = args => <BoxWhisker config={configify(args, argTypes)} />;

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
    {id: "beta", value: 30},
  ],
  groupBy: ["id", "value"],
  legend: false,
  x: "id",
  y: "value",
};
BasicExample.parameters = {
  docs: {
    description: {
      story:
        "One box per category summarizes its distribution: the box spans the interquartile range with a line at the median, and the whiskers reach out toward the extent of the values.",
    },
  },
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
    {id: "beta", value: -1100},
  ],
  groupBy: ["id", "value"],
  legend: false,
  x: "id",
  y: "value",
};
ShowingOutliers.parameters = {
  docs: {
    description: {
      story:
        "With the default Tukey whiskers, values beyond 1.5× the interquartile range fall outside the whiskers and are plotted as individual outlier points — no extra config required; this data carries several extreme highs and lows to trigger them.",
    },
  },
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
    {id: "beta", value: 180},
    {id: "beta", value: 30},
    {id: "beta", value: 120},
    {id: "beta", value: 50},
    {id: "beta", value: 140},
    {id: "beta", value: 115},
    {id: "beta", value: 14},
    {id: "beta", value: 30},
  ],
  groupBy: ["id", "value"],
  shapeConfig: {
    whiskerConfig: {
      endpoint: funcify(
        d => (d.id === "alpha" ? "Rect" : "Circle"),
        "d => d.id === 'alpha' ? 'Rect' : 'Circle'",
      ),
    },
  },
  x: "id",
  y: "value",
};
ChangingEndpointShapes.parameters = {
  controls: {include: ["shapeConfig"]},
  docs: {
    description: {
      story:
        "Change the cap drawn at each whisker's end through `shapeConfig.whiskerConfig.endpoint` — here a function gives the `alpha` group `Rect` caps and `beta` `Circle` caps.",
    },
  },
};

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
    {id: "beta", value: -1100},
  ],
  groupBy: ["id", "value"],
  shapeConfig: {
    outlier: funcify(
      d => (d.id === "alpha" ? "Circle" : "Rect"),
      "d => d.id === 'alpha' ? 'Circle' : 'Rect'",
    ),
    outlierConfig: {
      Rect: {
        fill: "green",
      },
      Circle: {
        fill: "red",
      },
    },
  },
  x: "id",
  y: "value",
};
ChangingOutlierStyles.parameters = {
  controls: {include: ["shapeConfig"]},
  docs: {
    description: {
      story:
        "Restyle the outlier marks with `shapeConfig.outlier`, which picks `Circle` versus `Rect` per group, and `outlierConfig`, which sets a `fill` per shape — red circles for `alpha`, green rects for `beta`.",
    },
  },
};

export const HorizontalChart = Template.bind({});
HorizontalChart.args = {
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
    {id: "beta", value: 30},
  ],
  groupBy: ["id", "value"],
  discrete: "y",
  shapeConfig: {
    Box: {
      orient: "horizontal",
    },
  },
  x: "value",
  y: "id",
};
HorizontalChart.parameters = {
  controls: {include: ["discrete", "shapeConfig"]},
  docs: {
    description: {
      story:
        'Lay the boxes out horizontally by setting `discrete: "y"` together with `shapeConfig.Box.orient: "horizontal"`, so categories stack down the `y` axis and each distribution spreads along `x`.',
    },
  },
};

export const ColoringBoxes = Template.bind({});
ColoringBoxes.args = {
  data: [
    {id: "alpha", region: "North", value: 300},
    {id: "alpha", region: "North", value: 20},
    {id: "alpha", region: "North", value: 180},
    {id: "alpha", region: "North", value: 40},
    {id: "alpha", region: "North", value: 170},
    {id: "alpha", region: "North", value: 125},
    {id: "alpha", region: "North", value: 74},
    {id: "alpha", region: "North", value: 80},
    {id: "beta", region: "South", value: 180},
    {id: "beta", region: "South", value: 30},
    {id: "beta", region: "South", value: 120},
    {id: "beta", region: "South", value: 50},
    {id: "beta", region: "South", value: 140},
    {id: "beta", region: "South", value: 115},
    {id: "beta", region: "South", value: 14},
    {id: "beta", region: "South", value: 30},
    {id: "gamma", region: "North", value: 210},
    {id: "gamma", region: "North", value: 95},
    {id: "gamma", region: "North", value: 160},
    {id: "gamma", region: "North", value: 130},
    {id: "gamma", region: "North", value: 110},
    {id: "gamma", region: "North", value: 145},
    {id: "gamma", region: "North", value: 60},
    {id: "gamma", region: "North", value: 120},
  ],
  color: "region",
  groupBy: ["id", "value"],
  x: "id",
  y: "value",
};
ColoringBoxes.parameters = {
  controls: {include: ["color", "shapeConfig"]},
  docs: {
    description: {
      story:
        "Boxes fill with the chart's color like any other shape, so `color` (or `shapeConfig.fill`) colors them to match the legend, and their outliers take the same color. The median line turns white over a dark fill; set `shapeConfig.Box.rectConfig.fill` to color the boxes on their own.",
    },
  },
};

export const PrecomputedStatistics = Template.bind({});
PrecomputedStatistics.args = {
  data: [
    {
      id: "alpha",
      min: 20,
      q1: 78.5,
      median: 145,
      q3: 172.5,
      max: 313.5,
      outliers: [900],
    },
    {
      id: "beta",
      min: 30,
      q1: 66.25,
      median: 117.5,
      q3: 135,
      max: 180,
      outliers: [],
    },
    {
      id: "gamma",
      min: 24.4,
      q1: 112.5,
      median: 142.5,
      q3: 171.3,
      max: 230,
      outliers: [-60],
    },
  ],
  boxMin: "min",
  boxQ1: "q1",
  boxMedian: "median",
  boxQ3: "q3",
  boxMax: "max",
  boxOutliers: "outliers",
  legend: false,
  x: "id",
};
PrecomputedStatistics.parameters = {
  controls: {
    include: ["boxMin", "boxQ1", "boxMedian", "boxQ3", "boxMax", "boxOutliers"],
  },
  docs: {
    description: {
      story:
        "When your data already holds each box's summary (as many analytics APIs return it), name its fields with `boxMin`, `boxQ1`, `boxMedian`, `boxQ3`, and `boxMax`, plus `boxOutliers` for an array of outlying values. Each row then draws one box from those values with nothing computed, the value axis spans every whisker and outlier, and the tooltip lists the statistics.",
    },
  },
};
