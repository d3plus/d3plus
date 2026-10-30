/**
    Streamgraph — a StackedArea flowing around a central baseline.
*/

import {assign} from "@d3plus/dom";

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {resolveStackOffset, resolveStackOrder} from "../Plot/stackHelpers.js";
import StackedArea from "../StackedArea/index.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    The value axis config that hides its labels, ticks, and gridlines: the
    stream's baseline moves, so its positions name no values.
*/
export const streamValueAxis = {
  labels: [],
  ticks: [],
};

export const streamgraphDef: ChartDefinition = {
  name: "Streamgraph",
  paintDriven: true,

  setup: viz => {
    viz._stackOffset = resolveStackOffset("silhouette");
    viz._stackOrder = resolveStackOrder(
      "insideOut",
    ) as VizInstance["_stackOrder"];
    viz._yConfig = assign({}, viz._yConfig ?? {}, streamValueAxis);
  },

  ctx: {},

  fields: [
    /** Hovering badges the x axis only: y positions name no values. */
    {key: "axisHover", default: "x"},
    /** Layers flow along smooth curves through their points. */
    {key: "shapeConfig", merge: true, default: {Area: {curve: "monotoneX"}}},
  ],
};

/**
    Creates a streamgraph from an array of data: a StackedArea whose layers
    flow around a central baseline instead of rising from zero. Layers stack
    with `stackOffset: "silhouette"`, which centers every stack on the same
    line, ordered `"insideOut"` (the largest layers in the middle) along
    smooth `monotoneX` curves. The value axis hides its labels and gridlines,
    since a moving baseline has no zero to read them from; each layer's
    thickness carries its value, and tooltips show each value and its share
    of the stack. Set `stackOffset("wiggle")` to keep each layer's slope as
    steady as it can instead, at the cost of a stream that drifts up or down
    as its total changes.
*/
export default makeChart(streamgraphDef, StackedArea);
