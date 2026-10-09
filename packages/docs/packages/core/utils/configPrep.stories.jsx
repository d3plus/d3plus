// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../../args/core/utils/configPrep.args";
import {configPrep} from "@d3plus/core";

export default {
  title: "Core/Utils/configPrep",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Preps a config object for d3plus data, and optionally bubbles up a specific nested type. When using this function, you must bind a d3plus class' this context.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import CallGrid from "../../../helpers/CallGrid.jsx";

// configPrep reads the chart's shapeConfig, duration, and global events from
// `this`, so a bare object standing in for a chart is enough context.
const viz = {schema: {shapeConfig: {}, duration: 600, on: {}}};
const config = {
  fill: d => d.color,
  on: {
    "click.shape": () => "shape click",
    mouseenter: () => "any mouseenter",
    "click.legend": () => "legend click",
  },
};
const prepped = configPrep.call(viz, config, "shape");
const wrappedDatum = {__d3plus__: true, data: {color: "#c92a2a"}, i: 0};

const calls = [
  {call: "Object.keys(prepped)", result: JSON.stringify(Object.keys(prepped))},
  {call: "prepped.duration", result: JSON.stringify(prepped.duration)},
  {call: "Object.keys(prepped.on)", result: JSON.stringify(Object.keys(prepped.on))},
  {call: 'prepped.fill({__d3plus__: true, data: {color: "#c92a2a"}, i: 0})', result: JSON.stringify(prepped.fill(wrappedDatum, 0))},
];

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {configPrep} from "@d3plus/core";

const config = {
  fill: d => d.color,
  on: {"click.shape": onShapeClick, mouseenter: onEnter, "click.legend": onLegendClick},
};

// Bound to a chart (\`this\`), for the "shape" event namespace:
const prepped = configPrep.call(viz, config, "shape");
${calls.map(({call, result}) => `${call}; // ${result}`).join("\n")}`,
      language: "jsx",
    },
    description: {
      story: "Prepares a `shapeConfig` for the shapes a chart draws: it copies in the chart's `duration`, keeps only the events that are global (`mouseenter`) or namespaced to the requested type (`click.shape`, not `click.legend`), and wraps every accessor so that when a shape hands it a wrapped datum, the function receives the original data row underneath. Charts call it with `this` bound; a plain object with a `schema` works the same way here.",
    },
  },
};
