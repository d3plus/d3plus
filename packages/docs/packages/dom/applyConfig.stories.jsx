// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/dom/applyConfig.args";
import {applyConfig} from "@d3plus/dom";

export default {
  title: "Dom/applyConfig",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Merges the supplied config objects over a fresh {select: node} target,\nroutes any <field> + <field>Format pairs to their loader methods, then\napplies whatever remains via instance.config(). Shared by every d3plus\nframework wrapper so this routing lives in exactly one place.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import FunctionExample from "../../helpers/FunctionExample.jsx";

// A stand-in for a d3plus class: it records what applyConfig asks of it.
const recorder = () => {
  const calls = [];
  const instance = {
    config: c => calls.push(["config", c]),
    data: (d, format) => calls.push(["data", d, typeof format === "function" ? "formatter" : format]),
  };
  return {instance, calls};
};
const node = typeof document === "undefined" ? null : document.createElement("div");
const show = calls =>
  calls
    .map(([method, ...args]) => `${method}(${args.map(a => (a === node ? "<div>" : JSON.stringify(a))).join(", ")})`)
    .join("\n");

const basic = recorder();
applyConfig(basic.instance, node, {width: 300, title: "Default title"}, undefined, {width: 400, legend: false});
export const BasicExample = () => (
  <FunctionExample
    input={`applyConfig(viz, container,
  {width: 300, title: "Default title"},
  undefined,
  {width: 400, legend: false},
)`}
    output={show(basic.calls)}
  />
);
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {applyConfig} from "@d3plus/dom";

applyConfig(viz, container, {width: 300, title: "Default title"}, undefined, {width: 400, legend: false});
// viz.config({select: container, width: 400, title: "Default title", legend: false})`,
      language: "jsx",
    },
    description: {
      story: "What every framework wrapper does with the props it receives: merge the config objects left to right (later ones win, `undefined` entries are skipped) over `{select: container}`, then hand the result to the instance's `config()`.",
    },
  },
};

const routed = recorder();
applyConfig(routed.instance, node, {data: "/data/fruits.csv", dataFormat: rows => rows.slice(0, 3), groupBy: "name"});
export const FormatRouting = () => (
  <FunctionExample
    input={`applyConfig(viz, container, {
  data: "/data/fruits.csv",
  dataFormat: rows => rows.slice(0, 3),
  groupBy: "name",
})`}
    output={show(routed.calls)}
  />
);
FormatRouting.parameters = {
  docs: {
    source: {
      code: `import {applyConfig} from "@d3plus/dom";

applyConfig(viz, container, {data: "/data/fruits.csv", dataFormat: rows => rows.slice(0, 3), groupBy: "name"});
// viz.data("/data/fruits.csv", rows => rows.slice(0, 3))
// viz.config({select: container, groupBy: "name"})`,
      language: "jsx",
    },
    description: {
      story: "A data-like field paired with its `<field>Format` function (`data`/`dataFormat`, and likewise `nodes`, `links`, and `topojson`) is routed to the matching loader method, which takes the formatter as its second argument, and both keys are removed before the rest goes through `config()`.",
    },
  },
};
