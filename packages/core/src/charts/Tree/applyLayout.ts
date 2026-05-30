/**
    `applyTreeLayout` — Tree's chart-specific layout stage.

    Runs d3-hierarchy tree against the rolled-up nested data, flattens
    branch aggregations, measures label height + per-depth label widths,
    rescales y coordinates, then builds link descriptors + per-shape
    groupings. Stashes `linksData`/`linkD`/`shapeGroups`/`shapeConfig` and
    `labelHeight`/`labelWidths`/`previousShapes` on `viz.ctx`.
*/

import {extent, max, min} from "d3-array";
import {hierarchy} from "d3-hierarchy";
import {scaleLinear} from "d3-scale";

import {assign} from "@d3plus/dom";
import {merge, nest} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../stages.js";

type TreeNode = DataPoint & {
  __d3plus__?: true;
  depth?: number;
  i?: number;
  x?: number;
  y?: number;
  parent?: TreeNode;
  children?: TreeNode[];
};

export const applyTreeLayout: TransformStage = ({viz}) => {
  const orient = viz.schema.orient as string;
  const isVertical = orient === "vertical";
  const isHorizontal = orient === "horizontal";

  const height = isVertical
    ? viz.schema.height - viz._margin.top - viz._margin.bottom
    : viz.schema.width - viz._margin.left - viz._margin.right;
  const width = isHorizontal
    ? viz.schema.height - viz._margin.top - viz._margin.bottom
    : viz.schema.width - viz._margin.left - viz._margin.right;
  const left: "left" | "top" = isVertical ? "left" : "top";

  type Branch = {key?: string | number; values?: Branch[] | DataPoint[]} & Record<string, unknown>;
  const treeLayout = viz.ctx.tree as {
    separation: (fn: (a: unknown, b: unknown) => number) => typeof treeLayout;
    size: (s: [number, number]) => typeof treeLayout;
    (root: ReturnType<typeof hierarchy<Branch>>): ReturnType<typeof hierarchy<Branch>>;
  };

  const root = treeLayout
    .separation(viz.schema.separation as (a: unknown, b: unknown) => number)
    .size([width, height])(
    hierarchy<Branch>(
      {
        key: "root",
        values: nest(
          viz._filteredData as DataPoint[],
          viz.schema.groupBy.slice(0, viz._drawDepth + 1),
        ) as unknown as Branch[],
      } as Branch,
      d => (d.key && d.values ? (d.values as Branch[]) : null),
    ).sort(viz.schema.sort as (a: unknown, b: unknown) => number),
  );

  const treeData = (root as unknown as {descendants: () => TreeNode[]})
    .descendants()
    .filter(d => (d.depth ?? 0) <= viz.schema.groupBy.length && !!d.parent) as TreeNode[];

  function flattenBranchData(branch: Branch): DataPoint {
    return merge(
      (branch.values as Branch[]).map(l =>
        l.key && l.values ? flattenBranchData(l) : (l as DataPoint),
      ),
      viz.schema.aggs as Parameters<typeof merge>[1],
    ) as DataPoint;
  }

  treeData.forEach((d, i) => {
    const dd = d.data as Branch;
    if (dd.key && dd.values) {
      (d as TreeNode).data = flattenBranchData(dd);
    }
    d.__d3plus__ = true;
    d.i = i;
  });

  const sc = viz.schema.shapeConfig as Record<string, unknown>;
  let r = sc.r as ((d: DataPoint, i: number) => number) | number;
  if (typeof r !== "function") {
    const rv = r as number;
    r = () => rv;
  }
  const rBufferRoot = max(treeData, d =>
    d.depth === 1 ? (r as (d: DataPoint, i: number) => number)(d.data as DataPoint, d.i!) : 0,
  ) as number;
  const rBufferEnd = max(treeData, d =>
    d.children ? 0 : (r as (d: DataPoint, i: number) => number)(d.data as DataPoint, d.i!),
  ) as number;

  const yExtent = extent(treeData, d => d.y) as [number, number];
  const labelHeight = min([
    isVertical ? 50 : 100,
    (yExtent[1] - rBufferRoot - rBufferEnd) / (viz.schema.groupBy.length + 1),
  ]) as number;
  viz.ctx.labelHeight = labelHeight;

  const labelWidths = nest(
    treeData as DataPoint[],
    ((d: DataPoint) => d.depth) as (d: DataPoint) => string | number | boolean,
  ).map(d => {
    const vals = (d as {values: DataPoint[]}).values;
    return vals.reduce((num: number, vv: DataPoint, i: number) => {
      const next =
        i < vals.length - 1 ? (vals[i + 1].x as number) : width + viz._margin[left];
      const prev = i ? (vals[i - 1].x as number) : viz._margin[left];
      return min([num, next - (vv.x as number), (vv.x as number) - prev]) as number;
    }, width);
  });
  viz.ctx.labelWidths = labelWidths;

  const yScale = scaleLinear()
    .domain(yExtent)
    .range([rBufferRoot + labelHeight, height - rBufferEnd - labelHeight]);

  treeData.forEach(d => {
    const val = yScale(d.y!);
    if (isHorizontal) {
      d.y = d.x;
      d.x = val;
    } else d.y = val;
  });

  // Link descriptors. `linkD` is invoked at emit time.
  const linksData = treeData
    .filter(d => (d.depth ?? 0) > 1)
    .map(d => assign({}, d) as TreeNode);
  const linkD = (d: TreeNode): string => {
    let rr = sc.r as ((d: DataPoint, i: number) => number) | number;
    if (typeof rr === "function") rr = rr(d.data as DataPoint, d.i!);
    const px = (d.parent!.x ?? 0) - (d.x ?? 0) + (isVertical ? 0 : (rr as number));
    const py = (d.parent!.y ?? 0) - (d.y ?? 0) + (isVertical ? (rr as number) : 0);
    const xx = isVertical ? 0 : -(rr as number);
    const yy = isVertical ? -(rr as number) : 0;
    return isVertical
      ? `M${xx},${yy}C${xx},${(yy + py) / 2} ${px},${(yy + py) / 2} ${px},${py}`
      : `M${xx},${yy}C${(xx + px) / 2},${yy} ${(xx + px) / 2},${py} ${px},${py}`;
  };

  const labelFn = viz.schema.label as ((d: DataPoint, i: number) => unknown) | undefined;

  const shapeConfig = {
    id: (d: TreeNode, i: number) => (viz._ids(d.data as DataPoint, i) as string[])[(d.depth ?? 1) - 1],
    label: (d: TreeNode, i: number) => {
      if (labelFn) return labelFn(d.data as DataPoint, i);
      const ids = viz._ids(d.data as DataPoint, i).slice(0, d.depth ?? 1);
      return ids[ids.length - 1];
    },
    labelConfig: {
      textAnchor: (d: {data?: TreeNode}) => {
        const x = (d.data ?? d) as TreeNode;
        return isVertical
          ? "middle"
          : x.children && x.depth !== viz._drawDepth + 1
            ? "end"
            : "start";
      },
      verticalAlign: (d: {data?: TreeNode}) => {
        const x = (d.data ?? d) as TreeNode;
        return isVertical ? (x.depth === 1 ? "bottom" : "top") : "middle";
      },
    },
    hitArea: (d: TreeNode, _i: number, s: {r?: number; height: number; width: number}) => {
      const h = labelHeight;
      const offset = s.r ?? (isVertical ? s.height / 2 : s.width / 2);
      const w = labelWidths[(d.depth ?? 1) - 1];
      return {
        width: isVertical ? w : offset * 2 + w,
        height: isHorizontal ? h : offset * 2 + h,
        x: isVertical
          ? -w / 2
          : d.children && d.depth !== viz.schema.groupBy.length
            ? -(offset + w)
            : -offset,
        y: isHorizontal
          ? -h / 2
          : d.children && d.depth !== viz.schema.groupBy.length
            ? -(offset + labelHeight)
            : -offset,
      };
    },
    labelBounds: (d: TreeNode, _i: number, s: {r?: number; height: number; width: number}) => {
      const h = labelHeight;
      const heightKey = isVertical ? "height" : "width";
      const offset = s.r ?? (isVertical ? s.height / 2 : s.width / 2);
      const w = labelWidths[(d.depth ?? 1) - 1];
      const widthKey = isVertical ? "width" : "height";
      const xKey = isVertical ? "x" : "y";
      const yKey = isVertical ? "y" : "x";
      return {
        [widthKey]: w,
        [heightKey]: h,
        [xKey]: -w / 2,
        [yKey]:
          d.children && d.depth !== viz.schema.groupBy.length
            ? -(offset + h)
            : offset,
      };
    },
  };

  const shapeAccessor = viz.schema.shape as (d: DataPoint) => string;
  const shapeData = nest(treeData as DataPoint[], (d: DataPoint) =>
    shapeAccessor((d as TreeNode).data as DataPoint),
  ) as {key: string; values: DataPoint[]}[];

  const dataShapes = shapeData.map(d => d.key);
  const previous = (viz.ctx.previousShapes as string[] | undefined) ?? [];
  const exitShapes = previous.filter(d => !dataShapes.includes(d));
  const shapeGroups = shapeData.concat(
    exitShapes.map(key => ({key, values: []})),
  );

  viz.ctx.linksData = linksData;
  viz.ctx.linkD = linkD;
  viz.ctx.shapeGroups = shapeGroups;
  viz.ctx.shapeConfig = shapeConfig;
  viz.ctx.previousShapes = dataShapes;

  return {shapeData: treeData as DataPoint[]};
};
