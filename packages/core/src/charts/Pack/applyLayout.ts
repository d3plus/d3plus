/**
    `applyPackLayout` — Pack's chart-specific layout stage. Runs the
    d3-hierarchy pack against the rolled-up nested data; stores the
    diameter + centering offsets on `viz.ctx` so the chart transform can
    center the layout.
*/

import {hierarchy} from "d3-hierarchy";
import type {HierarchyCircularNode} from "d3-hierarchy";

import {nestGroups} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../stages.js";

interface PackLeaf extends HierarchyCircularNode<DataPoint> {
  __d3plus__: true;
  i: number;
  id: string | number;
}

export const applyPackLayout: TransformStage = ({viz}) => {
  const data = viz._filteredData as DataPoint[] | undefined;
  if (!data || !data.length) return {shapeData: []};

  const height = viz.schema.height - viz._margin.top - viz._margin.bottom;
  const width = viz.schema.width - viz._margin.left - viz._margin.right;
  const diameter = Math.min(height, width);

  type Branch = {key?: string | number; values?: DataPoint[]} & DataPoint;

  const nestedData = nestGroups(
    data,
    viz._groupBy.slice(0, viz._drawDepth + 1),
  ) as unknown as Branch;

  const packOpacityFn = viz.schema.packOpacity as (d: DataPoint, i: number) => number;

  const built = (viz.ctx.pack as {
    padding: (n: number) => typeof built;
    size: (s: [number, number]) => typeof built;
    (root: ReturnType<typeof hierarchy<Branch>>): HierarchyCircularNode<Branch>;
  })
    .padding(viz.schema.layoutPadding as number)
    .size([diameter, diameter]);

  const packed = built(
    hierarchy<Branch>(
      {key: nestedData.key, values: nestedData} as Branch,
      d => d.values as Branch[] | undefined,
    )
      .sum(viz.schema.sum as (d: DataPoint) => number)
      .sort(viz.schema.sort as (a: HierarchyCircularNode<Branch>, b: HierarchyCircularNode<Branch>) => number),
  )
    .descendants()
    .filter((d, i) => {
      const node = d as unknown as PackLeaf;
      node.__d3plus__ = true;
      node.i = i;
      node.id = node.parent ? (node.parent.data.key as string | number) : "root";
      const data = node.data as DataPoint & {
        __d3plusOpacity__?: number;
        __d3plusTooltip__?: boolean;
      };
      data.__d3plusOpacity__ = node.height ? packOpacityFn(data, i) : 1;
      data.__d3plusTooltip__ = !node.height;
      return !node.children || node.children.length > 1;
    });

  viz.ctx.packDiameter = diameter;
  viz.ctx.packOffsetX = (width - diameter) / 2;
  viz.ctx.packOffsetY = (height - diameter) / 2;

  return {shapeData: packed as unknown as PackLeaf[]};
};

export type {PackLeaf};
