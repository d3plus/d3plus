import {addToQueue} from "@d3plus/data";

const ctx = {_queue: [], schema: {}};

addToQueue.call(ctx, "/data/fruits.csv", undefined, "nodes");
ctx._queue.length;
ctx.schema.nodes;

addToQueue.call(ctx, [{id: "a"}, {id: "b"}], undefined, "nodes");
ctx.schema.nodes;
