/**
    Cluster colors for the node-link charts (Network, ArcDiagram): when the
    chart's color is left to its defaults, each node takes the color of the
    community `louvain` finds it in, named after the community's
    most-connected node, so the legend lists the clusters.
*/

import {colorAssign} from "@d3plus/color";
import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {louvain} from "@d3plus/math";

import type {ConfigField} from "../../fluent.js";
import {linkedColorDefaults} from "../viz/linkGroup.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {graphNodeId, resolveGraphLinks, resolveGraphNodes} from "./graph.js";
import type {GraphLink, GraphNode} from "./graph.js";

type Accessor = (d: DataPoint, i: number) => unknown;
type Comparator = (a: DataPoint, b: DataPoint) => number;

/** A cluster's index, name, members, and most-connected node. */
export interface ClusterInfo {
  /** 0 is the largest cluster. */
  index: number;
  name: string;
  /** The members' node ids. */
  ids: string[];
  /** The id of the member with the most links. */
  hub: string;
}

/** What the chart's clusters are, for its color accessor and its labels. */
export interface ClusterState {
  /** Whether nodes are colored by cluster in this draw. */
  active: boolean;
  /** Each node id's color value: its cluster's name, or its own label when it is in no cluster. */
  names: Map<string, string>;
  /** The clusters of two or more nodes, largest first (ties by name). */
  clusters: ClusterInfo[];
}

/** The `cluster` and `clusterConfig` fields. */
export function clusterFields(): ConfigField[] {
  return [
    {key: "cluster", default: true, coerce: v => v !== false},
    {key: "clusterConfig", merge: true, default: {}},
  ];
}

/** The `color` and `shapeConfig.fill` the chart started with. */
export interface ClusterDefaults {
  color: unknown;
  fill: unknown;
}

/**
    Whether nodes are colored by cluster: `cluster` is on, and the chart's
    colors are its defaults (no `colorScale`, no `colorOrdinal`, the
    starting `color` and `shapeConfig.fill`, and no fill on the Circle or
    Rect shape config), with a single `groupBy` level.
    @param schema The chart's config.
    @param defaults The `color` and `shapeConfig.fill` the chart started with.
*/
export function clusterAutoActive(
  schema: Record<string, unknown>,
  defaults: ClusterDefaults,
): boolean {
  const shapeConfig = (schema.shapeConfig ?? {}) as Record<string, unknown>;
  const typeFill = (type: string) =>
    ((shapeConfig[type] ?? {}) as Record<string, unknown>).fill;
  return (
    schema.cluster !== false &&
    !schema.colorScale &&
    !schema.colorOrdinal &&
    schema.color === defaults.color &&
    shapeConfig.fill === defaults.fill &&
    typeFill("Circle") === undefined &&
    typeFill("Rect") === undefined &&
    Array.isArray(schema.groupBy) &&
    schema.groupBy.length === 1
  );
}

/**
    The clusters `louvain` finds among the nodes, as lists of node ids,
    largest first, weighted by each link's `linkSize` value (1 when it isn't
    a positive number). Links from a node to itself are left out.
*/
export function findClusters(
  nodes: Pick<GraphNode, "id">[],
  links: Pick<GraphLink, "source" | "target" | "size">[],
): string[][] {
  const assignment = louvain({
    nodes: nodes.map(n => n.id),
    links: links.flatMap(l =>
      l.source && l.target && l.source.id !== l.target.id
        ? [
            {
              source: l.source.id,
              target: l.target.id,
              weight: linkWeight(l.size),
            },
          ]
        : [],
    ),
  });
  const clusters: string[][] = [];
  for (const [id, c] of assignment) (clusters[c] ??= []).push(`${id}`);
  return clusters;
}

/**
    Whether clusters say more than one color per node would: at least two
    clusters of two or more nodes. One cluster holding every linked node
    (or no links at all) leaves each node its own color.
*/
export function clustersMeaningful(clusters: string[][]): boolean {
  return clusters.filter(c => c.length > 1).length > 1;
}

/** The most clusters `clusterConfig.max` keeps by default. */
export const CLUSTER_MAX = 12;

/** A link's weight between clusters: its `size`, or 1 when that isn't a positive number. */
const linkWeight = (size: number) =>
  size > 0 && Number.isFinite(size) ? size : 1;

/**
    Keeps at most `max` clusters of two or more nodes (lone nodes are left
    as they are). While there are more, the smallest (the last listed of the
    smallest) joins the cluster it shares the most link weight with (ties go
    to the larger cluster, then the one listed first), or the largest
    cluster when it has no links to any other. Returns the clusters largest
    first (ties in their listed order), lone nodes last.
    @param clusters Node id lists, largest first (see `findClusters`).
    @param max The most clusters to keep; anything below 1 keeps them all.
*/
export function capClusters(
  clusters: string[][],
  links: Pick<GraphLink, "source" | "target" | "size">[],
  max: number,
): string[][] {
  const groups = clusters
    .map((ids, order) => ({ids: [...ids], order}))
    .filter(g => g.ids.length > 1);
  const lone = clusters.filter(c => c.length < 2);
  if (!(max >= 1) || groups.length <= max) return clusters;
  const owner = new Map<string, (typeof groups)[number]>();
  for (const g of groups) for (const id of g.ids) owner.set(id, g);
  const larger = (a: (typeof groups)[number], b: (typeof groups)[number]) =>
    b.ids.length - a.ids.length || a.order - b.order;
  while (groups.length > max) {
    const small = groups.reduce((s, g) => (larger(s, g) < 0 ? g : s));
    const shared = new Map<(typeof groups)[number], number>();
    for (const l of links) {
      if (!l.source || !l.target) continue;
      const a = owner.get(l.source.id);
      const b = owner.get(l.target.id);
      if (!a || !b || a === b || (a !== small && b !== small)) continue;
      const other = a === small ? b : a;
      shared.set(other, (shared.get(other) ?? 0) + linkWeight(l.size));
    }
    let target = groups.filter(g => g !== small).sort(larger)[0];
    for (const [g, w] of shared) {
      const best = shared.get(target) ?? 0;
      if (w > best || (w === best && larger(g, target) < 0)) target = g;
    }
    target.ids.push(...small.ids);
    for (const id of small.ids) owner.set(id, target);
    groups.splice(groups.indexOf(small), 1);
  }
  return [...groups.sort(larger).map(g => g.ids), ...lone];
}

/**
    Each cluster's most-connected node: the member with the most links to
    other nodes, then the greatest total `size`, then the first listed.
*/
export function clusterHubs(
  clusters: string[][],
  links: Pick<GraphLink, "source" | "target" | "size">[],
): string[] {
  const degree = new Map<string, number>();
  const strength = new Map<string, number>();
  for (const l of links) {
    if (!l.source || !l.target || l.source.id === l.target.id) continue;
    for (const id of [l.source.id, l.target.id]) {
      degree.set(id, (degree.get(id) ?? 0) + 1);
      strength.set(id, (strength.get(id) ?? 0) + (l.size || 0));
    }
  }
  return clusters.map(ids =>
    ids.reduce((best, id) =>
      (degree.get(id) ?? 0) > (degree.get(best) ?? 0) ||
      ((degree.get(id) ?? 0) === (degree.get(best) ?? 0) &&
        (strength.get(id) ?? 0) > (strength.get(best) ?? 0))
        ? id
        : best,
    ),
  );
}

/**
    A cluster's default name: the translated "{node} cluster" with its hub's
    label in place of `{node}`.
*/
export function clusterName(
  translate: (s: string) => string,
  label: string,
): string {
  return translate("{node} cluster").replace("{node}", label);
}

/** The nodes and links as resolved for layout, keeping the ctx lookups the layout sets. */
function clusterGraph(viz: VizInstance) {
  const {nodeLookup, linkLookup} = viz.ctx;
  const nodes = resolveGraphNodes(viz);
  const links = resolveGraphLinks(viz, nodes);
  viz.ctx.nodeLookup = nodeLookup;
  viz.ctx.linkLookup = linkLookup;
  return {nodes, links};
}

/**
    The clusters for the chart's current nodes and links. Louvain depends
    only on the node ids and the links, so its result is cached on
    `viz.ctx.clusterCache` by them.
*/
function cachedClusters(
  viz: VizInstance,
  nodes: GraphNode[],
  links: GraphLink[],
): string[][] {
  const key = `${nodes.map(n => n.id).join("\u0000")}|${links
    .map(l => `${l.source?.id}>${l.target?.id}:${l.size}`)
    .join("\u0000")}`;
  const cache = viz.ctx.clusterCache as
    {key: string; clusters: string[][]} | undefined;
  if (cache && cache.key === key) return cache.clusters;
  const clusters = findClusters(nodes, links);
  viz.ctx.clusterCache = {key, clusters};
  return clusters;
}

/** Names the clusters (see `clusterName`, and `clusterConfig.label`). */
function nameClusters(
  viz: VizInstance,
  clusters: string[][],
  hubs: string[],
  byId: Map<string, GraphNode>,
): ClusterInfo[] {
  const label = (viz.schema.clusterConfig ?? {}).label as
    ((d: DataPoint, i: number, nodes: DataPoint[]) => unknown) | undefined;
  const translate = (s: string) => `${viz.schema.translate(s)}`;
  return clusters.flatMap((ids, index) => {
    if (ids.length < 2) return [];
    const hub = byId.get(hubs[index])!;
    const name =
      typeof label === "function"
        ? `${label(
            hub.data,
            index,
            ids.map(id => byId.get(id)!.data),
          )}`
        : clusterName(translate, `${viz._drawLabel(hub.data, hub.i)}`);
    return [{index, name, ids, hub: hub.id}];
  });
}

/**
    The legend's rows: one per cluster, its members' rows merged, and one
    per node in no cluster. A key holding each member's own id (such as
    `id`) is kept as the list of member ids, not merged by value, so the row
    still names every member even when the ids are numbers.
*/
export function clusterLegendRows(
  viz: VizInstance,
  clusters: ClusterInfo[],
  nodes: GraphNode[],
): DataPoint[] {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const clustered = new Set(clusters.flatMap(c => c.ids));
  const aggs = (viz.schema.aggs ?? {}) as Parameters<typeof merge>[1];
  const merged = clusters.map(c => {
    const rows = c.ids.map(id => byId.get(id)!.data);
    const idKeys = Object.keys(rows[0]).filter(k =>
      rows.every((r, j) => `${r[k]}` === c.ids[j]),
    );
    const own = {...aggs};
    for (const k of idKeys) own[k] = (objects, read) => objects.map(read);
    return merge(rows, own) as DataPoint;
  });
  return [
    ...merged,
    ...nodes.filter(n => !clustered.has(n.id)).map(n => n.data),
  ];
}

/**
    Works out this draw's clusters onto `viz.ctx.clusterState`: inactive
    unless `clusterAutoActive` holds and the clusters are meaningful. While
    active, the legend lists every node's row (so a network with `nodes` and
    no `data` gets one), and the clusters claim the palette largest first.
*/
export function prepareClusters(viz: VizInstance): void {
  const defaults = viz.ctx.clusterDefaults as ClusterDefaults;
  const off: ClusterState = {active: false, names: new Map(), clusters: []};
  viz.ctx.clusterState = off;
  if (
    !clusterAutoActive(viz.schema, defaults) ||
    !Array.isArray(viz.schema.nodes) ||
    !Array.isArray(viz.schema.links)
  )
    return;
  const {nodes, links} = clusterGraph(viz);
  const max = (viz.schema.clusterConfig ?? {}).max;
  const groups = capClusters(
    cachedClusters(viz, nodes, links),
    links,
    typeof max === "number" ? max : CLUSTER_MAX,
  );
  if (!clustersMeaningful(groups)) return;
  const byId = new Map(nodes.map(n => [n.id, n]));
  const clusters = nameClusters(
    viz,
    groups,
    clusterHubs(groups, links),
    byId,
  ).sort((a, b) => b.ids.length - a.ids.length || a.name.localeCompare(b.name));
  const names = new Map<string, string>();
  for (const n of nodes) names.set(n.id, `${viz._drawLabel(n.data, n.i)}`);
  for (const c of clusters) for (const id of c.ids) names.set(id, c.name);
  viz.ctx.clusterState = {active: true, names, clusters};
  viz._legendData = clusterLegendRows(viz, clusters, nodes);
  const palette = linkedColorDefaults(viz);
  for (const c of clusters) colorAssign(c.name, palette);
}

/**
    The cluster a row's node (or every node of a merged row) belongs to, or
    undefined when clusters are off or the row's nodes differ.
*/
export function clusterOf(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): string | undefined {
  const state = viz.ctx.clusterState as ClusterState | undefined;
  if (!state?.active) return undefined;
  const raw = viz._id?.(d, i);
  const ids = Array.isArray(raw) ? raw : [graphNodeId(viz, d, i)];
  const found = new Set(ids.map(id => state.names.get(`${id}`)));
  return found.size === 1 ? [...found][0] : undefined;
}

/**
    The legend order: while clusters are active, the clusters largest first
    (the order they take the palette in), then any lone nodes by `base`;
    otherwise `base`.
*/
export function clusterLegendSort(
  viz: VizInstance,
  base: Comparator,
): Comparator {
  return (a, b) => {
    const state = viz.ctx.clusterState as ClusterState | undefined;
    if (!state?.active) return base(a, b);
    const rank = (d: DataPoint) => {
      const name = clusterOf(viz, d, 0);
      const i = state.clusters.findIndex(c => c.name === name);
      return i < 0 ? state.clusters.length : i;
    };
    return rank(a) - rank(b) || base(a, b);
  };
}

/**
    Installs cluster colors on a Network or ArcDiagram: `color` becomes an
    accessor returning a node's cluster name while clusters are active (and
    the default `groupBy` color otherwise), `legendSort` lists the clusters
    largest first (see `clusterLegendSort`), and `_preDraw` works out the
    clusters before the legend is laid out.
*/
export function installClusters(viz: VizInstance): void {
  const base = viz.schema.color as Accessor;
  const color = (d: DataPoint, i: number) => clusterOf(viz, d, i) ?? base(d, i);
  viz.schema.color = color;
  viz.schema.legendSort = clusterLegendSort(
    viz,
    viz.schema.legendSort as Comparator,
  );
  viz.ctx.clusterDefaults = {
    color,
    fill: (viz.schema.shapeConfig as Record<string, unknown>).fill,
  } satisfies ClusterDefaults;
  const preDraw = viz._preDraw.bind(viz);
  viz._preDraw = () => {
    preDraw();
    prepareClusters(viz);
  };
}
