/**
    Network measures in a node's tooltip (Network, Rings, ArcDiagram, and
    Sankey): its degree (in and out when the chart draws arrows), its
    betweenness and closeness, and its cluster. They are worked out the
    first time a node's tooltip asks for them, and kept until the chart's
    nodes or links change.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import type {ConfigField} from "../../fluent.js";
import type {ClusterState} from "../Network/clusters.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {arrowEnds} from "./edgeArrows.js";
import type {ArrowValue} from "./edgeArrows.js";
import type {LinkGraph} from "./linkInteraction.js";
import {networkMeasures} from "./networkMeasures.js";
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

/** The `nodeTooltipStats` and `nodeTooltipStatsWeighted` fields. */
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
        Whether betweenness and closeness count a strong link (by `linkSize`,
        or Sankey's `value`) as a shorter step than a weak one. Defaults to
        `false`, every link one step.
    */
    {key: "nodeTooltipStatsWeighted", default: false},
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

/** What a chart graph's measures were last worked out for. */
interface Memo {
  arrows: unknown;
  weighted: boolean;
  stats: NodeStatsGraph;
  measures?: NetworkMeasures;
}

const memos = new WeakMap<LinkGraph, Memo>();

/** A key naming the nodes and the arcs, so a redraw of the same network reuses its measures. */
function measuresKey(stats: NodeStatsGraph): string {
  return `${stats.nodes.join("\u0000")}|${stats.arcs
    .map(a => `${a.source}>${a.target}:${a.length}`)
    .join("\u0000")}`;
}

/**
    The chart graph's degrees and arcs, for the chart's current `arrows` and
    `nodeTooltipStatsWeighted`.
    @param links The graph's links, read only when they haven't been for these settings.
*/
function memoFor(
  viz: VizInstance,
  graph: LinkGraph,
  links: () => StatLink[],
): Memo {
  const arrows = viz.schema.arrows;
  const weighted = viz.schema.nodeTooltipStatsWeighted === true;
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

/**
    The memo's betweenness and closeness, worked out on first use. The
    result is kept on `viz.ctx.nodeStatsCache` by its nodes and arcs, so a
    redraw that leaves them as they were reuses it.
*/
function measuresFor(viz: VizInstance, memo: Memo): NetworkMeasures {
  if (memo.measures) return memo.measures;
  const key = measuresKey(memo.stats);
  const cache = viz.ctx.nodeStatsCache as
    {key: string; measures: NetworkMeasures} | undefined;
  const measures =
    cache?.key === key
      ? cache.measures
      : networkMeasures(memo.stats.nodes, memo.stats.arcs);
  viz.ctx.nodeStatsCache = {key, measures};
  memo.measures = measures;
  return measures;
}

/** The name of the cluster a node is in, when clusters color the chart. */
function nodeCluster(viz: VizInstance, id: string): string | undefined {
  const state = viz.ctx.clusterState as ClusterState | undefined;
  if (!state?.active) return undefined;
  const name = state.names.get(id);
  return state.clusters.some(c => c.name === name) ? name : undefined;
}

/**
    A node's measure rows, in `nodeTooltipStats` order: "Degree" (or
    "In-degree" and "Out-degree" when the chart draws arrows),
    "Betweenness", "Closeness", and "Cluster" (when clusters color the
    chart and the node is in one). `degree` says whether its degree is
    listed, so the tooltip leaves out its count of connections.
    @param links The graph's links, read once per graph, `arrows`, and
    `nodeTooltipStatsWeighted` when a measure other than the cluster needs them.
*/
export function nodeStatRows(
  viz: VizInstance,
  graph: LinkGraph,
  id: string,
  links: () => StatLink[],
): {rows: Row[]; degree: boolean} {
  const list = nodeTooltipStatList(viz.schema.nodeTooltipStats);
  if (!list.length) return {rows: [], degree: false};
  const t = (s: string) => `${viz.schema.translate(s)}`;
  const locale = viz.schema.locale as string;
  const share = (v: number | undefined) => formatAbbreviate(v ?? 0, locale);
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
      const value = measuresFor(viz, read())[stat].get(id);
      rows.push([
        t(stat === "betweenness" ? "Betweenness" : "Closeness"),
        share(value),
      ]);
    }
  }
  return {rows, degree: list.includes("degree")};
}
