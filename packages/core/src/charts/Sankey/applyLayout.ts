/**
    `applySankeyLayout` — Sankey's chart-specific layout stage. Resolves
    nodes + links, runs d3-sankey, groups by shape, stashes `sankeyCtx` +
    `nodeLookup` + `linkLookup` on `viz.ctx`.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

import {groups} from "d3-array";

import {chartBounds} from "../chartGeometry.js";
import type {TransformStage} from "../stages.js";

export const applySankeyLayout: TransformStage = ({viz}) => {
  const v = viz as any;
  const {width, height} = chartBounds(v);

  const hasNodes = Array.isArray(v._nodes) && v._nodes.length > 0;
  const hasLinks = Array.isArray(v._links) && v._links.length > 0;
  if (!hasNodes && !hasLinks) {
    v.ctx.nodeLookup = {};
    v.ctx.linkLookup = {};
    return {viz};
  }

  let _nodes: any[];
  if (hasNodes) {
    _nodes = v._nodes;
  } else {
    const seen = new Set<unknown>();
    const ids: unknown[] = [];
    for (const d of v._links as any[]) {
      const src = d[v._linksSource];
      if (!seen.has(src)) {
        seen.add(src);
        ids.push(src);
      }
      const tgt = d[v._linksTarget];
      if (!seen.has(tgt)) {
        seen.add(tgt);
        ids.push(tgt);
      }
    }
    _nodes = ids.map((id: any) => ({id}));
  }

  const nodes = _nodes.map((n: any, i: any) => ({
    __d3plus__: true,
    data: n,
    i,
    id: v._nodeId(n, i),
    node: n,
    shape: "Rect",
  }));

  const nodeLookup = nodes.reduce(
    (obj: any, d: any, i: any) => {
      obj[d.id] = i;
      return obj;
    },
    {},
  );
  v.ctx.nodeLookup = nodeLookup;

  const links = hasLinks
    ? (v._links as any[]).map((link: any, i: any) => ({
        source: nodeLookup[link[v._linksSource]],
        target: nodeLookup[link[v._linksTarget]],
        value: v._value(link, i),
      }))
    : [];

  v.ctx.linkLookup = links.reduce((obj: any, d: any) => {
    if (!obj[d.source]) obj[d.source] = [];
    obj[d.source].push(d.target);
    if (!obj[d.target]) obj[d.target] = [];
    obj[d.target].push(d.source);
    return obj;
  }, {});

  v.ctx.sankey
    .nodeAlign(v._nodeAlign)
    .nodePadding(v._nodePadding)
    .nodeWidth(v._nodeWidth)
    .nodes(nodes)
    .nodeSort(v._nodeSort)
    .links(links)
    .linkSort(v._linkSort)
    .iterations(v._iterations)
    .size([width, height])();

  const nodeGroups = Array.from(
    groups(
      nodes as Record<string, unknown>[],
      (d: Record<string, unknown>) => d.shape as string,
    ),
  );
  v.ctx.sankeyCtx = {links, nodeGroups, pathFn: v.ctx.path};

  return {shapeData: nodes};
};
