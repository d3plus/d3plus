import {afterEach, it} from "vitest";
import assert from "assert";

import {
  IDLE_BUDGET,
  IdleQueue,
  idleQueue,
  makeLinkDatum,
  measuresTask,
  networkMeasures,
  nodeConnectionRows,
  nodeStatsInIdle,
  publishLinkGraph,
  requestIdle,
  setLinkValue,
  STAT_PENDING,
} from "../../internal.ts";

/**
    Network measures worked out in idle time: the task that spreads them
    over turns, the idle queue that runs it, and how a chart's node tooltip
    reads them before and after they are ready.
*/

const tick = () => new Promise(r => setTimeout(r, 2));

/** Waits (up to a second) until `done()` holds. */
async function until(done) {
  for (let i = 0; i < 400 && !done(); i++) await tick();
  assert.ok(done(), "in time");
}

afterEach(() => {
  delete globalThis.window;
  delete globalThis.requestIdleCallback;
});

/** A ring of `n` nodes with a chord across it, both ways. */
function ring(n) {
  const nodes = Array.from({length: n}, (_, i) => `n${i}`);
  const pairs = nodes.map((id, i) => [id, nodes[(i + 1) % n]]);
  pairs.push([nodes[0], nodes[Math.floor(n / 2)]]);
  const arcs = pairs.flatMap(([a, b]) => [
    {source: a, target: b},
    {source: b, target: a},
  ]);
  return {nodes, arcs};
}

it("measuresTask — any number of steps reach the same measures as one", () => {
  const {nodes, arcs} = ring(30);
  const whole = networkMeasures(nodes, arcs);
  const task = measuresTask(nodes, arcs);
  let steps = 0;
  while (!task.step(0)) steps++;
  assert.strictEqual(steps, 29, "a zero budget still searches one node");
  assert.deepStrictEqual(task.result(), whole);
  const weighted = arcs.map((a, i) => ({...a, length: 1 + (i % 3)}));
  const chunked = measuresTask(nodes, weighted);
  while (!chunked.step(0));
  assert.deepStrictEqual(chunked.result(), networkMeasures(nodes, weighted));
  assert.strictEqual(measuresTask([], []).step(0), true, "nothing to do");
});

it("requestIdle — uses requestIdleCallback when there is one, else a timer", async () => {
  const calls = [];
  globalThis.requestIdleCallback = (fn, options) => {
    calls.push(options);
    fn({timeRemaining: () => 7});
  };
  let deadline;
  requestIdle(d => (deadline = d));
  assert.strictEqual(deadline.timeRemaining(), 7);
  assert.ok(calls[0].timeout > 0, "with a timeout, so it runs on a busy page");
  delete globalThis.requestIdleCallback;
  let ran = false;
  requestIdle(d => (ran = d === undefined));
  assert.strictEqual(ran, false, "later");
  await until(() => ran);
});

it("IdleQueue — runs jobs in turns of at most IDLE_BUDGET, once per name, after beforeNext", async () => {
  const queue = new IdleQueue();
  const log = [];
  const budgets = [];
  const job = (name, steps) => ({
    step(budget) {
      budgets.push(budget);
      log.push(name);
      return --steps === 0;
    },
  });
  queue.beforeNext(() => log.push("before"));
  queue.add("a", job("a", 2));
  queue.add("a", job("a2", 1));
  queue.add("b", job("b", 1));
  assert.ok(queue.has("a") && queue.has("b"));
  await until(() => !queue.has("a") && !queue.has("b"));
  assert.strictEqual(log[0], "before");
  assert.strictEqual(log.filter(n => n === "a").length, 2);
  assert.strictEqual(log.filter(n => n === "b").length, 1);
  assert.ok(!log.includes("a2"), "a second job of one name is dropped");
  assert.ok(budgets.every(b => b <= IDLE_BUDGET));
});

it("IdleQueue — keep cancels the jobs it doesn't name", async () => {
  const queue = new IdleQueue();
  const ran = [];
  const forever = name => ({step: () => (ran.push(name), false)});
  queue.add("old", forever("old"));
  queue.add("new", {step: () => (ran.push("new"), true)});
  queue.keep(new Set(["new"]));
  assert.strictEqual(queue.has("old"), false);
  await until(() => !queue.has("new"));
  assert.deepStrictEqual(ran, ["new"]);
  assert.strictEqual(idleQueue(ran), idleQueue(ran), "one queue per owner");
});

/** A stand-in chart in a page, with a tooltip that records its renders. */
function pageViz(schema = {}) {
  globalThis.window = globalThis;
  const tooltip = {shown: [], renders: 0};
  tooltip.data = () => tooltip.shown;
  tooltip.render = () => (tooltip.renders++, tooltip);
  return {
    ctx: {},
    schema: {
      locale: "en-US",
      translate: s => s,
      nodeTooltipStats: true,
      ...schema,
    },
    _tooltipClass: tooltip,
    _drawLabel: d => d.id,
  };
}

const nodeData = ["a", "b", "c", "d"].map(id => ({id}));
const ends = nodeData.map((data, i) => ({data, i, id: data.id}));

/** Publishes links between the given pairs on `viz`, as a draw does. */
function publish(viz, pairs) {
  const at = id => ends.find(e => e.id === id);
  const links = pairs.map(([s, t], i) => {
    const d = makeLinkDatum({source: s, target: t}, at(s), at(t), i);
    setLinkValue(d, 1);
    return d;
  });
  return publishLinkGraph(viz, links, ends);
}

const path = [
  ["a", "b"],
  ["b", "c"],
  ["c", "d"],
];

it("nodeStatsInIdle — in a page, but not while @d3plus/ssr renders or outside one", () => {
  assert.strictEqual(nodeStatsInIdle({}), false, "no window");
  globalThis.window = globalThis;
  assert.strictEqual(nodeStatsInIdle({}), true);
  assert.strictEqual(nodeStatsInIdle({_ssr: true}), false);
});

it("a drawn chart works out its measures in idle time; an open node tooltip fills them in", async () => {
  const viz = pageViz();
  publish(viz, path);
  // Right after the draw, before any idle time: the degree, and an
  // ellipsis for each measure still to come.
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[1]), [
    ["Degree", "2"],
    ["Betweenness", STAT_PENDING],
    ["Closeness", STAT_PENDING],
  ]);
  assert.strictEqual(STAT_PENDING, "\u2026");
  viz.schema.nodeTooltipStats = ["closeness", "cluster"];
  assert.deepStrictEqual(
    nodeConnectionRows(viz, nodeData[1]),
    [
      ["Connections", "2"],
      ["Closeness", STAT_PENDING],
    ],
    "only the measures asked for",
  );
  viz.schema.nodeTooltipStats = true;
  viz._tooltipClass.shown = [nodeData[1]];
  await until(() => viz.ctx.nodeStatsCache?.size === 1);
  assert.strictEqual(viz._tooltipClass.renders, 1, "the open tooltip updates");
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[1]), [
    ["Degree", "2"],
    ["Betweenness", "0.67"],
    ["Closeness", "0.75"],
  ]);
});

it("a closed tooltip, or one on a link, isn't rendered again", async () => {
  const viz = pageViz();
  const graph = publish(viz, path);
  viz._tooltipClass.shown = [graph.links[0]];
  await until(() => viz.ctx.nodeStatsCache?.size === 1);
  assert.strictEqual(viz._tooltipClass.renders, 0);
});

it("a redraw with new links cancels the run for the old ones", async () => {
  const viz = pageViz();
  // A ring of 3000 nodes takes many idle turns.
  const big = Array.from({length: 3000}, (_, i) => {
    const data = {id: `r${i}`};
    return {data, i, id: data.id};
  });
  const links = big.map((end, i) => {
    const next = big[(i + 1) % big.length];
    return makeLinkDatum({}, end, next, i);
  });
  publishLinkGraph(viz, links, big);
  await until(() => idleQueue(viz).size === 1);
  await tick();
  publish(viz, [...path, ["d", "a"]]);
  await until(() => idleQueue(viz).size === 0);
  assert.strictEqual(viz.ctx.nodeStatsCache.size, 1, "only the new network");
  const [measures] = viz.ctx.nodeStatsCache.values();
  assert.strictEqual(measures.betweenness.size, 4);
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[1]).slice(1), [
    ["Betweenness", "0.17"],
    ["Closeness", "0.75"],
  ]);
});

it("a redraw of the same network reuses its measures", async () => {
  const viz = pageViz();
  publish(viz, path);
  await until(() => viz.ctx.nodeStatsCache?.size === 1);
  const [first] = viz.ctx.nodeStatsCache.values();
  publish(viz, path);
  await tick();
  await tick();
  assert.strictEqual(viz.ctx.nodeStatsCache.size, 1);
  assert.strictEqual([...viz.ctx.nodeStatsCache.values()][0], first);
});

it("nothing is queued when no measure needs paths, and turning them off cancels a run", async () => {
  const viz = pageViz({nodeTooltipStats: ["degree", "cluster"]});
  publish(viz, path);
  await tick();
  await tick();
  assert.strictEqual(viz.ctx.nodeStatsCache?.size ?? 0, 0);
  viz.schema.nodeTooltipStats = true;
  publish(viz, path);
  viz.schema.nodeTooltipStats = false;
  publish(viz, path);
  await tick();
  await tick();
  assert.strictEqual(viz.ctx.nodeStatsCache?.size ?? 0, 0);
});

it("while @d3plus/ssr renders, nothing is queued and a tooltip works them out at once", async () => {
  const viz = {...pageViz(), _ssr: true};
  publish(viz, path);
  await tick();
  assert.strictEqual(viz.ctx.nodeStatsCache, undefined);
  assert.deepStrictEqual(nodeConnectionRows(viz, nodeData[1]), [
    ["Degree", "2"],
    ["Betweenness", "0.67"],
    ["Closeness", "0.75"],
  ]);
});
