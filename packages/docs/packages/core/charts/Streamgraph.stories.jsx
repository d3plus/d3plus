// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {
  argTypes,
  Streamgraph,
} from "../../../args/core/charts/Streamgraph.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Charts/Streamgraph",
  component: Streamgraph,
  argTypes,
  parameters: {
    docs: {
      description: {
        component:
          'Creates a streamgraph from an array of data: a StackedArea whose layers\nflow around a central baseline instead of rising from zero. Layers stack\nwith stackOffset: "silhouette", which centers every stack on the same\nline, ordered "insideOut" (the largest layers in the middle) along\nsmooth monotoneX curves. The value axis hides its labels and gridlines,\nsince a moving baseline has no zero to read them from; each layer\'s\nthickness carries its value, and tooltips show each value and its share\nof the stack. Set stackOffset("wiggle") to keep each layer\'s slope as\nsteady as it can instead, at the cost of a stream that drifts up or down\nas its total changes.',
      },
    },
  },
};

const Template = args => <Streamgraph config={configify(args, argTypes)} />;

// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

const genres = {
  Rock: [38, 36, 33, 30, 27, 24, 21, 19, 17, 15, 14],
  Pop: [22, 24, 27, 29, 30, 31, 30, 29, 28, 27, 26],
  "Hip-Hop": [8, 10, 13, 16, 20, 24, 28, 31, 33, 34, 35],
  Electronic: [4, 5, 6, 8, 11, 14, 16, 17, 17, 16, 15],
  Country: [12, 12, 11, 11, 12, 12, 13, 13, 14, 14, 15],
  Jazz: [6, 6, 5, 5, 5, 4, 4, 4, 4, 4, 4],
};
const streamData = Object.entries(genres).flatMap(([genre, shares]) =>
  shares.map((share, i) => ({genre, year: 2014 + i, share})),
);

export const BasicExample = Template.bind({});
BasicExample.args = {
  data: streamData,
  groupBy: "genre",
  x: "year",
  y: "share",
};
BasicExample.parameters = {
  controls: {include: ["groupBy", "x", "y"]},
  docs: {
    description: {
      story:
        "Each `groupBy` series is a layer, stacked around a central baseline instead of rising from zero. The thickest layers sit in the middle, and each layer's thickness at a year is its value. The value axis shows no numbers, since the baseline moves; hover a layer for its value and its share of the stack.",
    },
  },
};

export const Wiggle = Template.bind({});
Wiggle.args = {
  ...BasicExample.args,
  stackOffset: "wiggle",
};
Wiggle.parameters = {
  controls: {include: ["stackOffset", "stackOrder"]},
  docs: {
    description: {
      story:
        'The default `stackOffset` of `"silhouette"` centers every year\'s stack on the same line, so the stream stays symmetric as its total changes. `"wiggle"` shifts the baseline to keep each layer\'s slope as steady as it can instead, which makes single layers easier to follow, while the stream drifts up or down as its total grows or shrinks.',
    },
  },
};
