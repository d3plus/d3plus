// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/data/addToQueue.args";
import {addToQueue} from "@d3plus/data";

export default {
  title: "Data/addToQueue",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualizations that fold in additional data sources, like the nodes and links of Network or the topojson of Geomap.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import CallGrid from "../../helpers/CallGrid.jsx";

const queued = {_queue: [], schema: {}};
addToQueue.call(queued, "/data/fruits.csv", undefined, "nodes");
const inline = {_queue: [], schema: {}};
addToQueue.call(inline, [{id: "a"}, {id: "b"}], undefined, "nodes");

const calls = [
  {chip: "url", call: "ctx._queue.length", result: JSON.stringify(queued._queue.length)},
  {chip: "url", call: "ctx._queue[0].slice(1)", result: JSON.stringify(queued._queue[0].slice(1))},
  {chip: "url", call: "ctx.schema.nodes", result: JSON.stringify(queued.schema.nodes)},
  {chip: "inline", call: "ctx._queue.length", result: JSON.stringify(inline._queue.length)},
  {chip: "inline", call: "ctx.schema.nodes", result: JSON.stringify(inline.schema.nodes)},
];

export const BasicExample = () => <CallGrid calls={calls} />;
BasicExample.parameters = {
  docs: {
    source: {
      code: `import {addToQueue} from "@d3plus/data";

const ctx = {_queue: [], schema: {}};

addToQueue.call(ctx, "/data/fruits.csv", undefined, "nodes");
ctx._queue.length; // 1  — [load, ["/data/fruits.csv"], undefined, "nodes"]
ctx.schema.nodes;  // undefined, until the queue runs

addToQueue.call(ctx, [{id: "a"}, {id: "b"}], undefined, "nodes");
ctx.schema.nodes;  // [{id: "a"}, {id: "b"}] — stored immediately`,
      language: "jsx",
    },
    description: {
      story: "Charts call this for every data-like config (`data`, `nodes`, `links`, `topojson`): a value that must be fetched is queued as a `[load, paths, formatter, key]` entry to run before the next draw, while an inline array is stored under `key` right away. Queuing the same key twice replaces the earlier entry.",
    },
  },
};
