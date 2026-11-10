/**
    Network measures in a node's tooltip (Network, Rings, ArcDiagram, and
    Sankey): its degree (in and out when the chart draws arrows, and in
    Sankey), its betweenness and closeness, and its cluster. In a browser,
    betweenness and closeness are worked out in idle time after the chart
    draws (see `scheduleNodeStats`); a tooltip shown before they are ready
    reads "…" for them, and fills them in when they are. They are kept until the chart's nodes or
    links change.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import type {ConfigField} from "../../fluent.js";
import type {ClusterState} from "../Network/clusters.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {arrowEnds} from "./edgeArrows.js";
import type {ArrowValue} from "./edgeArrows.js";
import type {LinkGraph} from "./linkInteraction.js";
import {idleQueue} from "./idleQueue.js";
import {measuresTask, networkMeasures} from "./networkMeasures.js";
import type {MeasureArc, NetworkMeasures} from "./networkMeasures.js";

/** A measure a node's tooltip can list. */
export type NodeStat = "degree" | "betweenness" | "closeness" | "cluster";

/** Every measure, in the order a node's tooltip lists them. */
export const NODE_STATS: readonly NodeStat[] = [
  "degree",
  "betweenness",
  "closeness",
  "cluster",
];

/** One link, as the measures read it. */
export interface StatLink {
  source: string;
  target: string;
  /** Its index in `links`, for the `arrows` accessor. */
  index: number;
  /** Its value (`linkSize` or `value`), when it is a number. */
  value?: number;
  datum: DataPoint;
}

/** What a chart's links say about each node, for one `arrows` and weighting. */
export interface NodeStatsGraph {
  /** Whether a link carries an arrowhead at one end only, so in and out differ. */
  directed: boolean;
  /** Each node's links (a link to itself counts once). */
  degree: Map<string, number>;
  /** Each node's links arriving at it (directed charts). */
  inDegree: Map<string, number>;
  /** Each node's links leaving it (directed charts). */
  outDegree: Map<string, number>;
  nodes: string[];
  arcs: MeasureArc[];
}

type Row = [string, string];

/** The `nodeTooltipStats` and `nodeTooltipStatsConfig` fields. */
export function nodeStatsFields(): ConfigField[] {
  return [
    /**
        The network measures a node's tooltip lists: `true` for all of them,
        `false` for none, or an Array of `"degree"`, `"betweenness"`,
        `"closeness"`, and `"cluster"`, in the order to list them.
        @type {boolean | string[]}
    */
    {key: "nodeTooltipStats", default: true},
    /**
        Settings for the network measures: `weighted` counts a strong link
        (by `linkSize`, or Sankey's `value`) as a shorter step than a weak
        one for betweenness and closeness. Defaults to `{weighted: false}`,
        every link one step.
        @type {{weighted?: boolean}}
    */
    {key: "nodeTooltipStatsConfig", merge: true, default: {}},
  ];
}

/**
    The measures `nodeTooltipStats` asks for, in its order: every measure
    for `true`, the known names of an Array (once each), and none otherwise.
*/
export function nodeTooltipStatList(value: unknown): NodeStat[] {
  if (value === true) return [...NODE_STATS];
  if (!Array.isArray(value)) return [];
  return [...new Set(value)].filter((s): s is NodeStat =>
    NODE_STATS.includes(s as NodeStat),
  );
}

/** A link's weight: its value, or 1 when that isn't a positive number. */
const linkWeight = (value: number | undefined) =>
  value !== undefined && value > 0 && Number.isFinite(value) ? value : 1;

/**
    The degrees and the arcs the measures walk. A link is one-way when
    `arrows` puts a head on one end only (from source to target for
    `"target"`, back for `"source"`), and two-way otherwise. When `weighted`,
    a link's length is the strongest link's weight over its own, so the
    strongest link is one step and a link half as strong is two.
*/
export function nodeStatsGraph(
  nodes: string[],
  links: StatLink[],
  arrows: ArrowValue | undefined,
  weighted: boolean,
): NodeStatsGraph {
  const zero = () => new Map(nodes.map(id => [id, 0]));
  const degree = zero();
  const inDegree = zero();
  const outDegree = zero();
  const add = (map: Map<string, number>, id: string) =>
    map.set(id, (map.get(id) ?? 0) + 1);
  const strongest = weighted
    ? links.reduce((m, l) => Math.max(m, linkWeight(l.value)), 1e-300)
    : 1;
  let directed = false;
  const arcs: MeasureArc[] = [];
  for (const l of links) {
    const ends = arrows
      ? arrowEnds(arrows, l.datum, l.index)
      : {source: false, target: false};
    const forward = ends.target && !ends.source;
    const back = ends.source && !ends.target;
    if (forward || back) directed = true;
    const length = weighted ? strongest / linkWeight(l.value) : 1;
    add(degree, l.source);
    if (l.target !== l.source) add(degree, l.target);
    if (!back) {
      arcs.push({source: l.source, target: l.target, length});
      add(outDegree, l.source);
      add(inDegree, l.target);
    }
    if (!forward) {
      arcs.push({source: l.target, target: l.source, length});
      add(outDegree, l.target);
      add(inDegree, l.source);
    }
  }
  return {directed, degree, inDegree, outDegree, nodes, arcs};
}

/** What a chart graph's degrees and arcs were last read for. */
interface Memo {
  arrows: unknown;
  weighted: boolean;
  stats: NodeStatsGraph;
  /** Names the nodes and arcs, for the measures cache (see `measuresKey`). */
  key?: string;
}

const memos = new WeakMap<LinkGraph, Memo>();

/** A key naming the nodes and the arcs, so a redraw of the same network reuses its measures. */
function measuresKey(stats: NodeStatsGraph): string {
  return `${stats.nodes.join("\u0000")}|${stats.arcs
    .map(a => `${a.source}>${a.target}:${a.length}`)
    .join("\u0000")}`;
}

/** The memo's `measuresKey`, worked out once. */
const memoKey = (memo: Memo): string => (memo.key ??= measuresKey(memo.stats));

/**
    The `arrows` the measures read: every link runs from source to target
    in a chart whose links always do (Sankey sets `ctx.linksDirected`).
*/
function statArrows(viz: VizInstance): unknown {
  return viz.ctx.linksDirected === true ? true : viz.schema.arrows;
}

/** Whether `nodeTooltipStatsConfig` weights the paths by `linkSize`. */
function statWeighted(viz: VizInstance): boolean {
  const config = viz.schema.nodeTooltipStatsConfig as
    {weighted?: unknown} | undefined;
  return config?.weighted === true;
}

/**
    The chart graph's degrees and arcs, for the chart's current `arrows` and
    `nodeTooltipStatsConfig.weighted`.
    @param links The graph's links, read only when they haven't been for these settings.
*/
function memoFor(
  viz: VizInstance,
  graph: LinkGraph,
  links: () => StatLink[],
): Memo {
  const arrows = statArrows(viz);
  const weighted = statWeighted(viz);
  const memo = memos.get(graph);
  if (memo && memo.arrows === arrows && memo.weighted === weighted) return memo;
  const stats = nodeStatsGraph(
    [...graph.byNode.keys()],
    links(),
    arrows as ArrowValue | undefined,
    weighted,
  );
  const next: Memo = {arrows, weighted, stats};
  memos.set(graph, next);
  return next;
}

/** The measures worked out for the chart, by `measuresKey`. */
function measuresCache(viz: VizInstance): Map<string, NetworkMeasures> {
  let cache = viz.ctx.nodeStatsCache as
    Map<string, NetworkMeasures> | undefined;
  if (!(cache instanceof Map)) viz.ctx.nodeStatsCache = cache = new Map();
  return cache;
}

/**
    Whether the measures are worked out in idle time: in a browser, but not
    while `@d3plus/ssr` renders the chart (or anywhere without a window),
    where they are worked out when first asked for.
*/
export function nodeStatsInIdle(viz: VizInstance): boolean {
  return !viz._ssr && typeof window !== "undefined";
}

/** Whether `nodeTooltipStats` lists a measure that needs shortest paths. */
function needsPaths(viz: VizInstance): boolean {
  const list = nodeTooltipStatList(viz.schema.nodeTooltipStats);
  return list.includes("betweenness") || list.includes("closeness");
}

/**
    Queues the idle job working out a memo's measures, unless it is cached
    or queued. `refresh` runs once they are ready.
*/
function queueMeasures(viz: VizInstance, memo: Memo, refresh: () => void) {
  const key = memoKey(memo);
  const queue = idleQueue(viz);
  if (measuresCache(viz).has(key) || queue.has(key)) return;
  const task = measuresTask(memo.stats.nodes, memo.stats.arcs);
  queue.add(key, {
    step(budget) {
      // A chart taken off the page stops; a tooltip queues it again.
      if (viz._select?.node()?.isConnected === false) return true;
      if (!task.step(budget)) return false;
      measuresCache(viz).set(key, task.result());
      refresh();
      return true;
    },
  });
}

/** A graph a draw published, waiting for its measures to be queued. */
interface Published {
  graph: LinkGraph;
  links: () => StatLink[];
  refresh: () => void;
}

const drafts = new WeakMap<VizInstance, Published[]>();

/**
    Queues the measures of the graphs one draw published, and cancels (and
    forgets) any others: they belong to nodes and links the chart no longer
    draws.
*/
function settleDraw(viz: VizInstance, published: Published[]): void {
  const keys = new Set<string>();
  if (needsPaths(viz))
    for (const p of published) {
      const memo = memoFor(viz, p.graph, p.links);
      keys.add(memoKey(memo));
      queueMeasures(viz, memo, p.refresh);
    }
  idleQueue(viz).keep(keys);
  const cache = measuresCache(viz);
  for (const key of [...cache.keys()]) if (!keys.has(key)) cache.delete(key);
}

/**
    Works out a published graph's betweenness and closeness in the browser's
    idle time after the chart draws (see `IdleQueue`), so a node's tooltip
    rarely waits for them. The graphs one draw publishes (one per small
    multiple) are settled together in the first idle turn after it: their
    measures are queued, and a run for nodes and links the chart no longer
    draws is cancelled. Nothing is queued while `@d3plus/ssr` renders.
    @param refresh Runs when a graph's measures are ready, to update an open tooltip.
*/
export function scheduleNodeStats(
  viz: VizInstance,
  graph: LinkGraph,
  links: () => StatLink[],
  refresh: () => void,
): void {
  // A chart without node measures (Geomap's flows) has nothing to queue.
  if (!nodeStatsInIdle(viz) || viz.schema.nodeTooltipStats === undefined)
    return;
  let draft = drafts.get(viz);
  if (!draft) {
    drafts.set(viz, (draft = []));
    queueMicrotask(() => {
      const published = drafts.get(viz) ?? [];
      drafts.delete(viz);
      idleQueue(viz).beforeNext(() => settleDraw(viz, published));
    });
  }
  draft.push({graph, links, refresh});
}

/**
    The memo's betweenness and closeness. In a browser they come from idle
    time: until they are ready this queues them (if no draw has) and returns
    undefined. Elsewhere they are worked out now. Either way they are kept by
    their nodes and arcs, so a redraw that leaves those as they were reuses
    them.
*/
function measuresFor(
  viz: VizInstance,
  memo: Memo,
  refresh: () => void,
): NetworkMeasures | undefined {
  const key = memoKey(memo);
  const cache = measuresCache(viz);
  const cached = cache.get(key);
  if (cached) return cached;
  if (nodeStatsInIdle(viz)) {
    queueMeasures(viz, memo, refresh);
    return undefined;
  }
  const measures = networkMeasures(memo.stats.nodes, memo.stats.arcs);
  cache.set(key, measures);
  return measures;
}

/** What a node's tooltip shows for a measure still being worked out: an ellipsis. */
export const STAT_PENDING = "\u2026";

/** The name of the cluster a node is in, when clusters color the chart. */
function nodeCluster(viz: VizInstance, id: string): string | undefined {
  const state = viz.ctx.clusterState as ClusterState | undefined;
  if (!state?.active) return undefined;
  const name = state.names.get(id);
  return state.clusters.some(c => c.name === name) ? name : undefined;
}

/**
    A node's measure rows, in `nodeTooltipStats` order: "Degree" (or
    "In-degree" and "Out-degree" when the chart draws arrows, and in
    Sankey), "Betweenness", "Closeness", and "Cluster" (when clusters color
    the chart and the node is in one). Betweenness and closeness read
    `STAT_PENDING` until they are ready (see `measuresFor`), so the tooltip
    keeps its size when they fill in. `degree` says whether its
    degree is listed, so the tooltip leaves out its count of connections.
    @param links The graph's links, read once per graph, `arrows`, and
    weighting when a measure other than the cluster needs them.
    @param refresh Runs when measures this asked for become ready.
*/
export function nodeStatRows(
  viz: VizInstance,
  graph: LinkGraph,
  id: string,
  links: () => StatLink[],
  refresh: () => void = () => undefined,
): {rows: Row[]; degree: boolean} {
  const list = nodeTooltipStatList(viz.schema.nodeTooltipStats);
  if (!list.length) return {rows: [], degree: false};
  const t = (s: string) => `${viz.schema.translate(s)}`;
  const locale = viz.schema.locale as string;
  let memo: Memo | undefined;
  const read = () => (memo ??= memoFor(viz, graph, links));
  const rows: Row[] = [];
  for (const stat of list) {
    if (stat === "degree") {
      const {stats} = read();
      if (stats.directed) {
        rows.push([t("In-degree"), `${stats.inDegree.get(id) ?? 0}`]);
        rows.push([t("Out-degree"), `${stats.outDegree.get(id) ?? 0}`]);
      } else rows.push([t("Degree"), `${stats.degree.get(id) ?? 0}`]);
    } else if (stat === "cluster") {
      const name = nodeCluster(viz, id);
      if (name !== undefined) rows.push([t("Cluster"), name]);
    } else {
      const measures = measuresFor(viz, read(), refresh);
      rows.push([
        t(stat === "betweenness" ? "Betweenness" : "Closeness"),
        measures
          ? formatAbbreviate(measures[stat].get(id) ?? 0, locale)
          : STAT_PENDING,
      ]);
    }
  }
  return {rows, degree: list.includes("degree")};
}
