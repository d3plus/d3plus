/**
    `applyTreemapLayout` — Treemap's chart-specific layout stage.
*/

import {hierarchy} from "d3-hierarchy";
import type {HierarchyNode, HierarchyRectangularNode} from "d3-hierarchy";

import {merge, nestGroups} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";

/** A laid-out treemap leaf node (carries `share` + `rank` populated below). */
export type TreemapShapeNode = Omit<HierarchyRectangularNode<DataPoint>, "id"> & {
  __d3plus__: true;
  id: string | number;
  i: number | undefined;
  x: number;
  y: number;
  share: number;
};

export const applyTreemapLayout: TransformStage = ({viz}) => {
  const data = viz._filteredData as DataPoint[] | undefined;
  if (!data || !data.length) return {shapeData: []};

  const {width, height} = chartBounds(viz);

  type Branch = {values?: DataPoint[]; key?: string | number} & Record<string, unknown>;

  const nestedData = nestGroups(
    data,
    viz.schema.groupBy.slice(0, viz._drawDepth + 1),
  ) as unknown as Branch[];

  const root = hierarchy<Branch>(
    {values: nestedData} as Branch,
    d => (d.values as Branch[] | undefined),
  )
    .sum(viz.schema.sum as (d: Branch) => number)
    .sort(viz.schema.sort as (a: HierarchyNode<Branch>, b: HierarchyNode<Branch>) => number);

  // d3-hierarchy treemap is a fluent builder; configure then invoke on root.
  interface TreemapGenerator {
    padding: (n: number) => TreemapGenerator;
    size: (s: [number, number]) => TreemapGenerator;
    tile: (t: unknown) => TreemapGenerator;
    (n: HierarchyNode<Branch>): HierarchyRectangularNode<Branch>;
  }
  const built = (viz.ctx.treemap as TreemapGenerator)
    .padding(viz.schema.layoutPadding as number)
    .size([width, height])
    .tile(viz.schema.tile);
  const tmapData = built(root);

  const shapeData: TreemapShapeNode[] = [];

  function extractLayout(children: HierarchyRectangularNode<Branch>[]): void {
    for (const node of children) {
      if (node.depth <= viz._drawDepth) {
        extractLayout((node.children ?? []) as HierarchyRectangularNode<Branch>[]);
        continue;
      }
      const branchData = node.data as Branch;
      const values = (branchData.values ?? []) as DataPoint[];
      const index =
        values.length === 1 ? data!.indexOf(values[0]) : undefined;
      const enriched = node as unknown as TreemapShapeNode;
      enriched.__d3plus__ = true;
      enriched.id = branchData.key as string | number;
      enriched.i = index !== undefined && index > -1 ? index : undefined;
      // Replace the wrapper branch with the merged source datum.
      (enriched as unknown as {data: DataPoint}).data = merge(
        values,
        viz.schema.aggs as Parameters<typeof merge>[1],
      ) as DataPoint;
      enriched.x = node.x0 + (node.x1 - node.x0) / 2;
      enriched.y = node.y0 + (node.y1 - node.y0) / 2;
      shapeData.push(enriched);
    }
  }
  if (tmapData.children) {
    extractLayout(tmapData.children as HierarchyRectangularNode<Branch>[]);
  }

  // Per-record rank — attached to the source datum so `ariaLabel` reads
  // `d.rank` directly instead of indexOf'ing a viz-level array.
  const sortFn = viz.schema.sort as (
    a: TreemapShapeNode,
    b: TreemapShapeNode,
  ) => number;
  shapeData
    .slice()
    .sort(sortFn)
    .forEach((d, i) => {
      (d.data as DataPoint & {rank?: number}).rank = i;
    });

  const total = tmapData.value as number;
  const sumFn = viz.schema.sum as (d: DataPoint) => number;
  shapeData.forEach(d => {
    d.share = sumFn(d.data as DataPoint) / total;
  });

  return {shapeData};
};
