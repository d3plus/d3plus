/**
    `applySankeyLayout` — Sankey's chart-specific layout stage. Resolves
    nodes + links, runs d3-sankey, groups by shape, stashes `sankeyCtx` +
    `nodeLookup` + `linkLookup` on `viz.ctx`.
*/

import {groups} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../chartGeometry.js";
import type {TransformStage} from "../stages.js";

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
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
}
interface SankeyResolvedLink {
  source: number;
  target: number;
  value: number;
}

export const applySankeyLayout: TransformStage = ({viz}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = viz as any;
  const {width, height} = chartBounds(v);

  const hasNodes = Array.isArray(v.schema.nodes) && v.schema.nodes.length > 0;
  const hasLinks = Array.isArray(v.schema.links) && v.schema.links.length > 0;
  if (!hasNodes && !hasLinks) {
    v.ctx.nodeLookup = {};
    v.ctx.linkLookup = {};
    return {viz};
  }

  let _nodes: DataPoint[];
  if (hasNodes) {
    _nodes = v.schema.nodes as DataPoint[];
  } else {
    const seen = new Set<unknown>();
    const ids: unknown[] = [];
    for (const d of v.schema.links as SankeyRawLink[]) {
      const src = d[v.schema.linksSource as string];
      if (!seen.has(src)) {
        seen.add(src);
        ids.push(src);
      }
      const tgt = d[v.schema.linksTarget as string];
      if (!seen.has(tgt)) {
        seen.add(tgt);
        ids.push(tgt);
      }
    }
    _nodes = ids.map(id => ({id}) as DataPoint);
  }

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

  const links: SankeyResolvedLink[] = hasLinks
    ? (v.schema.links as SankeyRawLink[]).map((link, i) => ({
        source: nodeLookup[String(link[v.schema.linksSource as string])],
        target: nodeLookup[String(link[v.schema.linksTarget as string])],
        value: v.schema.value(link, i) as number,
      }))
    : [];

  v.ctx.linkLookup = links.reduce((obj: Record<string, number[]>, d) => {
    if (!obj[d.source]) obj[d.source] = [];
    obj[d.source].push(d.target);
    if (!obj[d.target]) obj[d.target] = [];
    obj[d.target].push(d.source);
    return obj;
  }, {});

  v.ctx.sankey
    .nodeAlign(v.schema.nodeAlign)
    .nodePadding(v.schema.nodePadding)
    .nodeWidth(v.schema.nodeWidth)
    .nodes(nodes)
    .nodeSort(v.schema.nodeSort)
    .links(links)
    .linkSort(v.schema.linkSort)
    .iterations(v.schema.iterations)
    .size([width, height])();

  const nodeGroups = Array.from(
    groups(nodes, d => d.shape),
  );
  v.ctx.sankeyCtx = {links, nodeGroups, pathFn: v.ctx.path};

  return {shapeData: nodes as unknown as DataPoint[]};
};
