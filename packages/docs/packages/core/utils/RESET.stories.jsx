// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../../args/core/utils/RESET.args";
import {RESET} from "@d3plus/core";

export default {
  title: "Core/Utils/RESET",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "String constant used to reset an individual config property.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

import {useState} from "react";
import {Legend} from "@d3plus/react";

import CallGrid from "../../../helpers/CallGrid.jsx";

export const BasicExample = () => <CallGrid calls={[{call: "RESET", result: JSON.stringify(RESET)}]} />;
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {RESET, Treemap} from "@d3plus/core";

const viz = new Treemap().config({title: "Quarterly revenue", legend: false});

// Later: put both keys back to their defaults instead of guessing what they were.
viz.config({title: RESET, legend: RESET});`,
      language: "jsx",
    },
    description: {
      story: "A sentinel string that any config value can be set to. `config()` treats it as \"restore the default\", which matters because a chart keeps every setting it was ever given; passing `undefined` would leave the old value in place. It works at any depth, so `shapeConfig: {fill: RESET}` resets just the fill.",
    },
  },
};

const data = [
  {id: "North", color: "#1c7ed6"},
  {id: "South", color: "#e67700"},
  {id: "East", color: "#2f9e44"},
];
const LiveReset = () => {
  const [reset, setReset] = useState(false);
  const config = {data, height: 50, width: 320, shape: reset ? RESET : "Circle"};
  return (
    <div style={{display: "grid", gap: 12}}>
      <label style={{fontSize: 13, display: "flex", gap: 8, alignItems: "center"}}>
        <input type="checkbox" checked={reset} onChange={e => setReset(e.target.checked)} />
        <code>shape: {reset ? "RESET" : '"Circle"'}</code>
      </label>
      <div style={{height: 50, width: 320}}>
        <Legend config={config} />
      </div>
    </div>
  );
};
export const LiveExample = () => <LiveReset />;
LiveExample.parameters = {
  docs: {
    source: {
      code: `import {Legend, RESET} from "@d3plus/core";

const data = [
  {id: "North", color: "#1c7ed6"},
  {id: "South", color: "#e67700"},
  {id: "East", color: "#2f9e44"},
];

const legend = new Legend().select("#legend").data(data).shape("Circle").render();

// The swatches go back to the default rectangles; nothing else changes.
legend.shape(RESET).render();`,
      language: "jsx",
    },
    description: {
      story: "The same Legend instance is told to draw circles, then given `RESET` for that one key. Tick the box to watch the swatches return to the default rectangles while the data, colors, and size stay as configured.",
    },
  },
};
