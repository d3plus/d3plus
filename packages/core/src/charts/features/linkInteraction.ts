/**
    Link interaction shared by the node-link charts (Network, Rings, Sankey,
    ArcDiagram): the datum each link is drawn with, its tooltip and spoken
    label, what hovering a link or a node highlights, and the connections a
    node's tooltip lists.

    A link's datum is its row from `links`, with `source` and `target`
    replaced by the data of the nodes they name. `linkSize`, `value`,
    `shapeConfig` functions, arrow accessors, and the tooltip all receive it,
    so they read node fields directly (`d.source.name`). The chart's
    bookkeeping for each datum (its index in `links`, the ids of its ends, its
    value) is kept beside it in a WeakMap, so the datum holds only the link's
    own fields.
*/

import type {DataPoint} from "@d3plus/data";
import {rtl} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";

import type {VizInstance} from "../viz/vizTypes.js";

/**
    A link as accessors and tooltips receive it: the link's own fields, with
    `source` and `target` set to the data of the nodes at its ends.
*/
export type LinkDatum = DataPoint & {source: DataPoint; target: DataPoint};

/** One end of a link: the node's datum, its index, and its id. */
export interface LinkEnd {
  data: DataPoint;
  i: number;
  id: string;
}

/** The links of a chart, and each node's links by node id. */
export interface LinkGraph {
  links: LinkDatum[];
  /** Whether the links' values differ, so tooltips and labels report them. */
  sized: boolean;
  byNode: Map<string, LinkDatum[]>;
}

/** What the chart knows about a link datum. */
export interface LinkMeta {
  /** The link's index in `links`. */
  index: number;
  /** The link's row in `links`. */
  raw: DataPoint;
  source: LinkEnd;
  target: LinkEnd;
  /** The keys of `raw` that name its ends. */
  endKeys: string[];
  /** The link's value (`linkSize` or `value`), when it is a number. */
  value?: number;
  graph?: LinkGraph;
}

type Predicate = (d: DataPoint, i: number) => boolean;
type NodeKey = (d: DataPoint, i: number) => string;
type Row = [string, string];

const metas = new WeakMap<object, LinkMeta>();
const nodeEntries = new WeakMap<
  object,
  WeakMap<object, {id: string; graph: LinkGraph}>
>();

/** What the chart recorded for a link datum, if `d` is one. */
export function linkMeta(d: unknown): LinkMeta | undefined {
  return d && typeof d === "object" ? metas.get(d) : undefined;
}

/** Whether `d` is a link datum. */
export function isLinkDatum(d: unknown): d is LinkDatum {
  return linkMeta(d) !== undefined;
}

/**
    The datum a link is drawn with: `raw`'s fields, with `source` and
    `target` set to the data of the nodes at its ends.
    @param raw The link's row in `links`.
    @param source The node at its source end.
    @param target The node at its target end.
    @param index The link's index in `links`.
    @param endKeys The keys of `raw` that name its ends.
*/
export function makeLinkDatum(
  raw: DataPoint,
  source: LinkEnd,
  target: LinkEnd,
  index: number,
  endKeys: string[] = ["source", "target"],
): LinkDatum {
  const datum = {...raw, source: source.data, target: target.data};
  metas.set(datum, {index, raw, source, target, endKeys});
  return datum as LinkDatum;
}

/**
    Records a link's value (from `linkSize` or `value`) for its tooltip and
    spoken label, and returns it.
*/
export function setLinkValue<T>(d: LinkDatum, value: T): T {
  const meta = linkMeta(d);
  const n = typeof value === "number" ? value : Number(value);
  if (meta && value !== null && value !== "" && Number.isFinite(n))
    meta.value = n;
  return value;
}

/**
    Indexes a chart's links by node and stores the result on `viz.ctx.linkGraph`.
    Each of `nodes` (including any without links) is recognized by its datum
    from then on, so its tooltip can list its connections.
*/
export function publishLinkGraph(
  viz: VizInstance,
  links: LinkDatum[],
  nodes: LinkEnd[],
): LinkGraph {
  const values = new Set(links.map(l => linkMeta(l)?.value));
  const byNode = new Map<string, LinkDatum[]>(nodes.map(n => [n.id, []]));
  const graph: LinkGraph = {links, sized: values.size > 1, byNode};
  for (const link of links) {
    const meta = linkMeta(link)!;
    meta.graph = graph;
    const ids = new Set([meta.source.id, meta.target.id]);
    for (const id of ids) {
      if (!byNode.has(id)) byNode.set(id, []);
      byNode.get(id)!.push(link);
    }
  }
  let entries = nodeEntries.get(viz);
  if (!entries) nodeEntries.set(viz, (entries = new WeakMap()));
  for (const n of nodes)
    if (n.data && typeof n.data === "object")
      entries.set(n.data, {id: n.id, graph});
  viz.ctx.linkGraph = graph;
  return graph;
}

/** The node id and graph recorded for a node datum, if `d` is one. */
export function linkNodeOf(
  viz: VizInstance,
  d: unknown,
): {id: string; graph: LinkGraph} | undefined {
  if (!d || typeof d !== "object") return undefined;
  return nodeEntries.get(viz)?.get(d);
}

/** Languages written right to left, by their primary language subtag. */
const RTL_LANGUAGES = new Set(["ar", "dv", "fa", "he", "ps", "ur", "yi"]);

/** Whether a locale code (`"ar-SA"`) names a language written right to left. */
export function rtlLocale(locale: unknown): boolean {
  const language = `${locale ?? ""}`.split(/[-_]/)[0].toLowerCase();
  return RTL_LANGUAGES.has(language);
}

/**
    The arrows a chart's tooltips point from a link's source to its target
    with: `["→", "←"]`, mirrored to `["←", "→"]` when the chart's locale is
    written right to left or the page's direction is (see `rtl`).
*/
export function linkArrows(viz: VizInstance): [string, string] {
  const mirrored =
    rtlLocale(viz.schema.locale) ||
    (typeof document !== "undefined" && !!document.body && rtl());
  return mirrored ? ["←", "→"] : ["→", "←"];
}

/** A link end's label, as its node's tooltip titles it. */
export function linkEndLabel(viz: VizInstance, end: LinkEnd): string {
  return `${viz._drawLabel(end.data, end.i) ?? end.id}`;
}

/** A link's tooltip title: "Source → Target" ("Source ← Target" right to left). */
export function linkTooltipTitle(viz: VizInstance, d: LinkDatum): string {
  const meta = linkMeta(d);
  if (!meta) return "";
  const [forward] = linkArrows(viz);
  return `${linkEndLabel(viz, meta.source)} ${forward} ${linkEndLabel(viz, meta.target)}`;
}

/** A tooltip cell's text for one field value, or null for a value it skips. */
export function linkCellText(viz: VizInstance, v: unknown): string | null {
  const locale = viz.schema.locale as string;
  if (typeof v === "number")
    return Number.isFinite(v) ? formatAbbreviate(v, locale) : null;
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return `${v}`;
  if (v instanceof Date && !isNaN(v.getTime()))
    return v.toLocaleDateString(locale);
  return null;
}

/**
    A link's tooltip rows: its value (when the chart's links differ in value
    and no field of the link already shows it), then each of the link's own
    fields other than the ones naming its ends.
*/
export function linkTooltipRows(viz: VizInstance, d: LinkDatum): Row[] {
  const meta = linkMeta(d);
  if (!meta) return [];
  const fields: Row[] = [];
  let shown = false;
  for (const [key, v] of Object.entries(meta.raw)) {
    if (meta.endKeys.includes(key) || key.startsWith("__")) continue;
    const text = linkCellText(viz, v);
    if (text === null) continue;
    if (v === meta.value) shown = true;
    fields.push([key, text]);
  }
  const rows: Row[] = [];
  if (meta.graph?.sized && meta.value !== undefined && !shown)
    rows.push([
      viz.schema.translate("Value") as string,
      linkCellText(viz, meta.value)!,
    ]);
  return rows.concat(fields);
}

/**
    A link's spoken label: "Source to Target." When the chart's links differ
    in value, its value follows: "Source to Target, 4."
*/
export function linkAriaLabel(viz: VizInstance, d: LinkDatum): string {
  const meta = linkMeta(d);
  if (!meta) return "";
  const value =
    meta.graph?.sized && meta.value !== undefined ? `, ${meta.value}` : "";
  return `${linkEndLabel(viz, meta.source)} ${viz.schema.translate("to")} ${linkEndLabel(viz, meta.target)}${value}.`;
}

/**
    What hovering a link highlights: the link and the nodes at its two ends.
    Rows that aren't recorded nodes (legend entries) match by `nodeKey`.
*/
export function linkHighlight(
  viz: VizInstance,
  d: LinkDatum,
  nodeKey?: NodeKey,
): Predicate {
  const meta = linkMeta(d)!;
  const ids = new Set([meta.source.id, meta.target.id]);
  return (h, hi) => {
    const m = linkMeta(h);
    if (m) return m.index === meta.index;
    const id = linkNodeOf(viz, h)?.id ?? nodeKey?.(h, hi);
    return id !== undefined && ids.has(`${id}`);
  };
}

/** A node's links in `graph`, the other end of each, and its direction, strongest first. */
export function nodeConnections(
  graph: LinkGraph,
  id: string,
): {link: LinkDatum; other: LinkEnd; outgoing: boolean; value?: number}[] {
  return (graph.byNode.get(id) ?? [])
    .map(link => {
      const meta = linkMeta(link)!;
      const outgoing = meta.source.id === id;
      return {
        link,
        other: outgoing ? meta.target : meta.source,
        outgoing,
        value: meta.value,
        index: meta.index,
      };
    })
    .sort(
      (a, b) =>
        (b.value ?? -Infinity) - (a.value ?? -Infinity) || a.index - b.index,
    )
    .map(({link, other, outgoing, value}) => ({link, other, outgoing, value}));
}

/**
    What hovering a node highlights: the node, the nodes it links to, and the
    links between them. Null when `d` isn't a recorded node. Rows that aren't
    recorded nodes (legend entries) match by `nodeKey`.
*/
export function nodeHighlight(
  viz: VizInstance,
  d: DataPoint,
  nodeKey?: NodeKey,
): Predicate | null {
  const entry = linkNodeOf(viz, d);
  if (!entry) return null;
  const links = nodeConnections(entry.graph, entry.id);
  const ids = new Set([entry.id, ...links.map(c => c.other.id)]);
  const indices = new Set(links.map(c => linkMeta(c.link)!.index));
  return (h, hi) => {
    const m = linkMeta(h);
    if (m) return indices.has(m.index);
    const id = linkNodeOf(viz, h)?.id ?? nodeKey?.(h, hi);
    return id !== undefined && ids.has(`${id}`);
  };
}

/**
    How many links a node's tooltip lists: `nodeTooltipLinks` when it is a
    number (`true` is 3, `false` none), else 3 when the links differ in value
    and none when they don't.
*/
export function nodeTooltipLinkLimit(
  viz: VizInstance,
  graph: LinkGraph,
): number {
  const limit = viz.schema.nodeTooltipLinks as unknown;
  if (limit === false) return 0;
  if (limit === true) return 3;
  if (typeof limit === "number" && Number.isFinite(limit))
    return Math.max(0, Math.floor(limit));
  return graph.sized ? 3 : 0;
}

/**
    A node's tooltip rows: its number of connections, then its strongest
    links ("→ Target" or "← Source", with the link's value when the links
    differ in value), up to `nodeTooltipLinkLimit`. The arrows mirror right
    to left (see `linkArrows`).
*/
export function nodeConnectionRows(viz: VizInstance, d: DataPoint): Row[] {
  const entry = linkNodeOf(viz, d);
  if (!entry) return [];
  const {graph, id} = entry;
  const connections = nodeConnections(graph, id);
  const rows: Row[] = [
    [viz.schema.translate("Connections") as string, `${connections.length}`],
  ];
  const [forward, back] = linkArrows(viz);
  for (const c of connections.slice(0, nodeTooltipLinkLimit(viz, graph))) {
    const value =
      graph.sized && c.value !== undefined ? linkCellText(viz, c.value)! : "";
    rows.push([
      `${c.outgoing ? forward : back} ${linkEndLabel(viz, c.other)}`,
      value,
    ]);
  }
  return rows;
}

/**
    The node-link charts' default `tooltipConfig`: a link is titled
    "Source → Target" and lists its value and fields; a node is titled by its
    label and lists its connections.
*/
export function linkTooltipConfig(viz: VizInstance): {
  title: (d: DataPoint, i: number) => string;
  tbody: (d: DataPoint, i: number) => Row[];
} {
  return {
    title: (d, i) =>
      isLinkDatum(d)
        ? linkTooltipTitle(viz, d)
        : viz._drawLabel(d, typeof d.i === "number" ? d.i : i),
    tbody: d =>
      isLinkDatum(d) ? linkTooltipRows(viz, d) : nodeConnectionRows(viz, d),
  };
}

/** The smallest stroke width a link's hit path takes, in pixels. */
export const LINK_HIT_WIDTH = 8;

/**
    A transparent path over a link, wider than it, so thin links are easy to
    point at. Keyboard navigation skips it (its key ends in `::hit`).
*/
export function linkHitPath(
  key: string,
  d: string,
  datum: LinkDatum,
  strokeWidth: unknown,
): {
  type: "path";
  key: string;
  d: string;
  datum: LinkDatum;
  index: number;
  paint: {fill: string; stroke: string; strokeWidth: number};
} {
  const width = typeof strokeWidth === "number" ? strokeWidth : 1;
  return {
    type: "path",
    key: `${key}::hit`,
    d,
    datum,
    index: linkMeta(datum)?.index ?? 0,
    paint: {
      fill: "none",
      stroke: "transparent",
      strokeWidth: Math.max(LINK_HIT_WIDTH, width + 4),
    },
  };
}
