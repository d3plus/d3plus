// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, StackedArea} from "../../../args/core/charts/StackedArea.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/StackedArea",
  component: StackedArea,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates a stacked area plot based on an array of data.",
      },
    },
  }
};

const Template = (args) => <StackedArea config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {formatAbbreviate} from "@d3plus/format";

// Two inline-SVG icons used by the ShapeBackgroundImages example below. The
// `viewBox` is what preserves each icon's aspect ratio when it is scaled to fit
// a band (an SVG with no viewBox has no intrinsic aspect ratio, so the browser
// would stretch it).
const starIcon = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cpolygon%20points%3D%2250%2C4%2061%2C38%2098%2C38%2068%2C59%2079%2C95%2050%2C73%2021%2C95%2032%2C59%202%2C38%2039%2C38%22%20fill%3D%22%230b6e63%22%2F%3E%3C%2Fsvg%3E";
const heartIcon = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cpath%20d%3D%22M50%2C88%20C10%2C58%2020%2C18%2050%2C42%20C80%2C18%2090%2C58%2050%2C88%20Z%22%20fill%3D%22%23c0392b%22%2F%3E%3C%2Fsvg%3E";

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: [
    {id: "alpha", x: 4, y:  7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta",  x: 4, y: 17},
    {id: "beta",  x: 5, y:  8},
    {id: "beta",  x: 6, y: 13}
  ],
  groupBy: "id",
  x: "x",
  y: "y"
};
BasicExample.parameters = {controls: {include: ["x", "y"]}, docs: {description: {story: "Series stack on top of one another, so the total height at each `x` is the sum of all groups while each band shows its individual contribution."}}};

export const HorizontalChart = Template.bind({});
HorizontalChart.args = {
  data: [
    {id: "alpha", x:  7, y: 4},
    {id: "alpha", x: 25, y: 5},
    {id: "alpha", x: 13, y: 6},
    {id: "beta",  x: 17, y: 4},
    {id: "beta",  x:  8, y: 5},
    {id: "beta",  x: 13, y: 6}
  ],
  discrete: "y",
  groupBy: "id",
  x: "x",
  y: "y"
};
HorizontalChart.parameters = {controls: {include: ["discrete"]}, docs: {description: {story: "Switch the discrete axis to `\"y\"` to render the stack horizontally, with the areas extending along `x` instead of building upward."}}};

export const SharePercentages = Template.bind({});
SharePercentages.args = {
  data: [
    {id: "alpha", x: 4, y:  7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta",  x: 4, y: 17},
    {id: "beta",  x: 5, y:  8},
    {id: "beta",  x: 6, y: 13},
    {id: "gamma", x: 4, y: 10},
    {id: "gamma", x: 5, y: 18},
    {id: "gamma", x: 6, y:  5}
  ],
  groupBy: "id",
  stackOffset: "expand",
  x: "x",
  y: "y",
  yConfig: {
    tickFormat: funcify(
      d => `${formatAbbreviate(d * 100)}%`,
      "d => `${formatAbbreviate(d * 100)}%`")
  }
};
SharePercentages.parameters = {controls: {include: ["stackOffset", "yConfig"]}, docs: {description: {story: "Set `stackOffset: \"expand\"` to normalize every `x` position to 100%, turning the chart into a share-of-total view; `yConfig.tickFormat` then labels the axis as percentages."}}};

export const ShapeBackgroundImages = Template.bind({});
ShapeBackgroundImages.args = {
  data: [
    {id: "alpha", x: 4, y: 12},
    {id: "alpha", x: 5, y: 28},
    {id: "alpha", x: 6, y: 20},
    {id: "beta",  x: 4, y: 22},
    {id: "beta",  x: 5, y: 14},
    {id: "beta",  x: 6, y: 24}
  ],
  groupBy: "id",
  x: "x",
  y: "y",
  shapeConfig: {
    Area: {
      // `backgroundImageFit: "contain"` fits the whole icon inside each band's
      // largest inscribed rectangle — centered and completely visible. (The
      // default, "cover", instead fills the band's bounding box and clips to its
      // outline.) The image's aspect ratio is always preserved.
      backgroundImageFit: "contain",
      backgroundImage: funcify(
        d => (d.id === "alpha" ? starIcon : heartIcon),
        `const starIcon = "${starIcon}";\n` +
        `const heartIcon = "${heartIcon}";\n` +
        `d => d.id === "alpha" ? starIcon : heartIcon`
      )
    }
  }
};
ShapeBackgroundImages.parameters = {controls: {include: ["shapeConfig"]}, docs: {description: {story: "Set `shapeConfig.Area.backgroundImage` to a per-series URL to place an image on each stacked band. Here `backgroundImageFit: \"contain\"` fits each icon inside the band's largest inscribed rectangle — centered, fully visible, and aspect-preserved. Omit `backgroundImageFit` (or set `\"cover\"`) to instead fill the band's bounding box and clip the image to the band's outline."}}};

export const SortingAreas = Template.bind({});
SortingAreas.args = {
  data: [
    {id: "alpha", x: 4, y:  7},
    {id: "alpha", x: 5, y: 25},
    {id: "alpha", x: 6, y: 13},
    {id: "beta",  x: 4, y: 17},
    {id: "beta",  x: 5, y:  8},
    {id: "beta",  x: 6, y: 13},
    {id: "gamma", x: 4, y: 10},
    {id: "gamma", x: 5, y: 18},
    {id: "gamma", x: 6, y:  5},
    {id: "delta", x: 4, y:  8},
    {id: "delta", x: 5, y: 12},
    {id: "delta", x: 6, y:  7}
  ],
  groupBy: "id",
  stackOrder: ["alpha", "gamma", "delta", "beta"],
  x: "x",
  y: "y"
};
SortingAreas.parameters = {controls: {include: ["stackOrder"]}, docs: {description: {story: "Pass an explicit array to `stackOrder` to fix the bottom-to-top stacking sequence of the series rather than letting d3plus derive it."}}};

const streamData = [4, 5, 6, 7, 8, 9].flatMap(x => [
  {id: "alpha", x, y: 12 + 8 * Math.sin(x)},
  {id: "beta",  x, y: 18 + 6 * Math.cos(x)},
  {id: "gamma", x, y: 10 + 5 * Math.sin(x + 1)},
  {id: "delta", x, y: 14 + 7 * Math.cos(x + 2)}
]);

export const Streamgraph = Template.bind({});
Streamgraph.args = {
  data: streamData,
  groupBy: "id",
  stackOffset: "silhouette",
  stackOrder: "insideOut",
  x: "x",
  y: "y"
};
Streamgraph.parameters = {controls: {include: ["stackOrder", "stackOffset"]}, docs: {description: {story: "Combine a named order with a named offset for a streamgraph: `stackOrder: \"insideOut\"` keeps the largest series in the middle and pushes late-rising ones to the edges, while `stackOffset: \"silhouette\"` centers the stack around a free baseline instead of anchoring at zero. `stackOrder` also accepts d3's `\"appearance\"` and `\"reverse\"`; `stackOffset` also accepts `\"wiggle\"` (minimizes slope changes) and `\"expand\"`."}}};
