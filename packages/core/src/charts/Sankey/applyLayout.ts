/**
    `applySankeyLayout` — Sankey's chart-specific layout stage. Resolves
    nodes + links, runs the Sankey layout, groups by shape, stashes `sankeyCtx` +
    `nodeLookup` + `linkLookup` on `viz.ctx`.
*/

import {groups} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import type {SankeyGenerator} from "./sankeyLayout.js";

import {chartBounds} from "../features/chartGeometry.js";
import {
  makeLinkDatum,
  publishLinkGraph,
  setLinkValue,
} from "../features/linkInteraction.js";
import type {LinkDatum, LinkEnd} from "../features/linkInteraction.js";
import type {TransformStage} from "../pipeline/stages.js";
import {warnConfigOnce} from "../../utils/configWarnings.js";
import {layOutCircular} from "./circularLayout.js";
import {sankeyNodeValue} from "./circularLinks.js";
import type {CircularNode} from "./circularLinks.js";
import {sankeyAcyclicLinks} from "./sankeyCycles.js";
import {
  sankeyDrawableLinks,
  sankeyLoopWarning,
  unlinkedNodeValue,
} from "./sankeyLinks.js";

interface SankeyRawLink {
  [key: string]: unknown;
}
interface SankeyWrappedNode {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  id: string | number;
  node: DataPoint;
  shape: string;
  /** The value a node without links is sized by (see `unlinkedNodeValue`). */
  fixedValue?: number;
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
}
interface SankeyResolvedLink {
  source: number;
  target: number;
  value: number;
  /** The datum the link is drawn with (see `makeLinkDatum`). */
  datum: LinkDatum;
  /** The link's index in `links`. */
  i: number;
}

/** A link the layout has laid out: its ends are nodes. */
type LaidLink = {
  source: SankeyWrappedNode & CircularNode;
  target: SankeyWrappedNode & CircularNode;
  y0: number;
  y1: number;
};

/** A node as a link end. */
const sankeyLinkEnd = (n: SankeyWrappedNode): LinkEnd => ({
  data: n.data,
  i: n.i,
  id: String(n.id),
});

/** One node per distinct source or target value in `links`, in order. */
function nodesFromLinks(
  links: SankeyRawLink[],
  endKeys: [string, string],
): DataPoint[] {
  const ids = new Set<unknown>();
  for (const d of links) for (const key of endKeys) ids.add(d[key]);
  return Array.from(ids, id => ({id}) as DataPoint);
}

/**
    Gives each node no drawn link touches a `fixedValue` (see
    `unlinkedNodeValue`), so it draws with a height like the rest.
*/
function sizeUnlinkedNodes(
  v: Parameters<TransformStage>[0]["viz"],
  nodes: SankeyWrappedNode[],
  links: SankeyResolvedLink[],
): void {
  const linked = new Set(links.flatMap(l => [l.source, l.target]));
  const values = links.map(l => Number(l.value));
  nodes.forEach((n, i) => {
    if (linked.has(i)) return;
    let own: unknown;
    try {
      own = v.schema.value(n.data, n.i);
    } catch {
      // An accessor written for links may not read a node's row.
      own = undefined;
    }
    n.fixedValue = unlinkedNodeValue(own, values);
  });
}

/**
    The links whose ends both name a node (a link from a node to itself
    included), each with its datum and value, in the order given.
*/
function resolveLinks(
  v: Parameters<TransformStage>[0]["viz"],
  nodes: SankeyWrappedNode[],
  nodeLookup: Record<string, number>,
  hasLinks: boolean,
): SankeyResolvedLink[] {
  const endKeys = [v.schema.linksSource, v.schema.linksTarget] as string[];
  const {drawn, selfLinks} = sankeyDrawableLinks(
    hasLinks
      ? (v.schema.links as SankeyRawLink[]).map((link, i) => ({
          link,
          i,
          source: nodeLookup[String(link[endKeys[0]])] as number | undefined,
          target: nodeLookup[String(link[endKeys[1]])] as number | undefined,
        }))
      : [],
  );
  return [...drawn, ...selfLinks]
    .sort((x, y) => x.i - y.i)
    .map(({link, i, source, target}) => {
      const datum = makeLinkDatum(
        link as DataPoint,
        sankeyLinkEnd(nodes[source!]),
        sankeyLinkEnd(nodes[target!]),
        i,
        endKeys,
      );
      const value = setLinkValue(datum, v.schema.value(datum, i)) as number;
      return {source: source!, target: target!, value, datum, i};
    });
}

/** Each node's neighbors, by the links between them. */
function linkLookupOf(
  links: readonly SankeyResolvedLink[],
): Record<string, number[]> {
  return links.reduce((obj: Record<string, number[]>, d) => {
    if (!obj[d.source]) obj[d.source] = [];
    obj[d.source].push(d.target);
    if (!obj[d.target]) obj[d.target] = [];
    obj[d.target].push(d.source);
    return obj;
  }, {});
}

export const applySankeyLayout: TransformStage = ({viz}) => {
  const v = viz;
  const {width, height} = chartBounds(v);

  const hasNodes = Array.isArray(v.schema.nodes) && v.schema.nodes.length > 0;
  const hasLinks = Array.isArray(v.schema.links) && v.schema.links.length > 0;
  if (!hasNodes && !hasLinks) {
    v.ctx.nodeLookup = {};
    v.ctx.linkLookup = {};
    return {viz};
  }

  const _nodes = hasNodes
    ? (v.schema.nodes as DataPoint[])
    : nodesFromLinks(v.schema.links as SankeyRawLink[], [
        v.schema.linksSource as string,
        v.schema.linksTarget as string,
      ]);

  const nodes: SankeyWrappedNode[] = _nodes.map((n, i) => ({
    __d3plus__: true,
    data: n,
    i,
    id: v.schema.nodeId(n, i) as string | number,
    node: n,
    shape: "Rect",
  }));

  const nodeLookup: Record<string, number> = nodes.reduce(
    (obj: Record<string, number>, d, i) => {
      obj[String(d.id)] = i;
      return obj;
    },
    {},
  );
  v.ctx.nodeLookup = nodeLookup;

  const resolved = resolveLinks(v, nodes, nodeLookup, hasLinks);
  const {kept: links, looped} = sankeyAcyclicLinks(resolved);
  const circularOn = v.schema.circularLinks !== false;
  if (!circularOn && looped.length)
    warnConfigOnce(
      v,
      "sankeyLoops",
      sankeyLoopWarning(
        looped.map(l => [nodes[l.source].id, nodes[l.target].id] as const),
      ),
    );
  const circular = circularOn ? looped : [];
  const shown = circular.length
    ? [...links, ...circular].sort((x, y) => x.i - y.i)
    : links;
  publishLinkGraph(
    v,
    shown.map(l => l.datum),
    nodes.map(sankeyLinkEnd),
  );
  sizeUnlinkedNodes(v, nodes, shown);
  // A node a circular link touches is sized by its returning flow too.
  for (const i of new Set(circular.flatMap(l => [l.source, l.target])))
    nodes[i].fixedValue = sankeyNodeValue(i, shown);

  v.ctx.linkLookup = linkLookupOf(shown);

  const layout = (v.ctx.sankey as SankeyGenerator)
    .nodeAlign(v.schema.nodeAlign)
    .nodePadding(v.schema.nodePadding)
    .nodeWidth(v.schema.nodeWidth)
    .nodes(nodes)
    .nodeSort(v.schema.nodeSort)
    .links(links)
    .linkSort(v.schema.linkSort)
    .iterations(v.schema.iterations);
  const laid = layOutCircular({
    run: extent => layout.extent(extent)(),
    nodes: nodes as unknown as (SankeyWrappedNode & CircularNode)[],
    links: links as unknown as LaidLink[],
    circular,
    width,
    height,
    padding: v.schema.nodePadding as number,
  });
  const nodeGroups = Array.from(groups(nodes, d => d.shape));
  v.ctx.sankeyCtx = {
    links: [...links, ...laid],
    nodeGroups,
    width,
    height,
  };

  return {shapeData: nodes as unknown as DataPoint[]};
};
