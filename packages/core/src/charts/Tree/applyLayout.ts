/**
    `applyTreeLayout` — Tree's chart-specific layout stage.

    Runs d3-hierarchy tree against the rolled-up nested data, flattens
    branch aggregations, measures label height + per-depth label widths,
    rescales y coordinates, then builds link descriptors + per-shape
    groupings. Stashes `linksData`/`linkD`/`shapeGroups`/`shapeConfig` and
    `labelHeight`/`labelWidths`/`previousShapes` on `viz.ctx`.
*/
import {extent, max, min} from "d3-array";
import {cluster, hierarchy} from "d3-hierarchy";
import {scaleLinear} from "d3-scale";

import {assign} from "@d3plus/dom";
import {merge, nest} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {stampDepth} from "../features/depthKey.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {nameLevel, noKey, nodeId} from "./keys.js";
import {nodeHeights, rootDistances} from "./nodeHeight.js";
import type {NodeHeightInfo} from "./nodeHeight.js";
import {nodeLabel} from "./nodeLabel.js";
import {
  layoutRadialTree,
  radialLinkD,
  radialNodeReach,
} from "./radialLayout.js";

type TreeNode = DataPoint & {
  __d3plus__?: true;
  depth?: number;
  i?: number;
  x?: number;
  y?: number;
  theta?: number;
  rho?: number;
  parent?: TreeNode;
  children?: TreeNode[];
};

type Branch = {
  key?: string | number | boolean | null;
  values?: Branch[] | DataPoint[];
} & Record<string, unknown>;

/**
    Whether a nest entry is a group rather than a data row: it has a key, `0`
    or `false` included, and a list of values. `undefined`, `null` and `""`
    are no key.
*/
export function isBranch(d: Branch): boolean {
  return !noKey(d.key) && Array.isArray(d.values);
}

/**
    The first level of a Tree's nest, with each entry that has no key (one
    `nest` groups the rows without a first-level key under) replaced by the
    rows under it, so each of those rows is a leaf under the root.
    @param entries The first level of the nest.
    @param levels The number of key levels the nest has.
*/
export function rootEntries(entries: Branch[], levels: number): Branch[] {
  return entries.flatMap(e =>
    noKey(e.key) && Array.isArray(e.values) ? rowsUnder(e, levels - 1) : [e],
  );
}

/** Every row under a nest entry with `levels` entry levels inside it. */
function rowsUnder(entry: Branch, levels: number): Branch[] {
  const values = entry.values as Branch[];
  return levels < 1 ? values : values.flatMap(e => rowsUnder(e, levels - 1));
}

/** Merge a branch's leaf values (recursively) through the schema aggs. */
function flattenBranchData(viz: VizInstance, branch: Branch): DataPoint {
  return merge(
    (branch.values as Branch[]).map(l =>
      isBranch(l) ? flattenBranchData(viz, l) : (l as DataPoint),
    ),
    viz.schema.aggs as Parameters<typeof merge>[1],
  ) as DataPoint;
}

/** Run the d3-hierarchy tree layout, flatten branch aggregations, and tag nodes. */
function buildTreeData(
  viz: VizInstance,
  width: number,
  height: number,
): TreeNode[] {
  // With `nodeHeight`, the leaves line up at one edge, so they are spaced
  // evenly in their order (d3's cluster layout), each parent centered over
  // its children.
  const treeLayout = (viz.schema.nodeHeight ? cluster() : viz.ctx.tree) as {
    separation: (fn: (a: unknown, b: unknown) => number) => typeof treeLayout;
    size: (s: [number, number]) => typeof treeLayout;
    (
      root: ReturnType<typeof hierarchy<Branch>>,
    ): ReturnType<typeof hierarchy<Branch>>;
  };

  const root = treeLayout
    .separation(viz.schema.separation as (a: unknown, b: unknown) => number)
    .size([width, height])(
    hierarchy<Branch>(
      {
        key: "root",
        values: rootEntries(
          nest(
            viz._filteredData as DataPoint[],
            viz.schema.groupBy.slice(0, viz._drawDepth + 1),
          ) as unknown as Branch[],
          viz._drawDepth + 1,
        ),
      } as Branch,
      d => (isBranch(d) ? (d.values as Branch[]) : null),
    ).sort(viz.schema.sort as (a: unknown, b: unknown) => number),
  );

  const treeData = (root as unknown as {descendants: () => TreeNode[]})
    .descendants()
    .filter(
      d => (d.depth ?? 0) <= viz._drawDepth + 1 && !!d.parent,
    ) as TreeNode[];

  treeData.forEach((d, i) => {
    const dd = d.data as Branch;
    // Each node gets a row of its own: a branch's merged leaves, or a copy of
    // the row it wraps, so the rows the legend and `data()` hold are never
    // written to.
    const row: DataPoint = isBranch(dd)
      ? flattenBranchData(viz, dd)
      : {...(dd as DataPoint)};
    d.data = row;
    d.__d3plus__ = true;
    d.i = i;
    // The tooltip binds the unwrapped row, so the per-node hierarchy depth
    // (needed to label the node at its own level) must live on the row.
    stampDepth(row, d.depth ?? 1);
  });

  return treeData;
}

/**
    Measure label height + per-depth label widths, then rescale y coordinates.
    Stashes `labelHeight`/`labelWidths` on `viz.ctx`.
*/
function measureTreeLabels(
  viz: VizInstance,
  treeData: TreeNode[],
  isVertical: boolean,
  isHorizontal: boolean,
  width: number,
  height: number,
): {labelHeight: number; labelWidths: number[]} {
  const sc = viz.schema.shapeConfig as Record<string, unknown>;
  let r = sc.r as ((d: DataPoint, i: number) => number) | number;
  if (typeof r !== "function") {
    const rv = r as number;
    r = () => rv;
  }
  const rBufferRoot = max(treeData, d =>
    d.depth === 1
      ? (r as (d: DataPoint, i: number) => number)(d.data as DataPoint, d.i!)
      : 0,
  ) as number;
  const rBufferEnd = max(treeData, d =>
    d.children
      ? 0
      : (r as (d: DataPoint, i: number) => number)(d.data as DataPoint, d.i!),
  ) as number;

  const yExtent = extent(treeData, d => d.y) as [number, number];
  const labelHeight = min([
    isVertical ? 50 : 100,
    (yExtent[1] - rBufferRoot - rBufferEnd) / (viz._drawDepth + 2),
  ]) as number;
  viz.ctx.labelHeight = labelHeight;

  const labelWidths = nest(
    treeData as DataPoint[],
    ((d: DataPoint) => d.depth) as (d: DataPoint) => string | number | boolean,
  ).map(d => {
    const vals = (d as {values: DataPoint[]}).values;
    return vals.reduce((num: number, vv: DataPoint, i: number) => {
      // Positions run from the chart area's edge, 0, to `width`.
      const next = i < vals.length - 1 ? (vals[i + 1].x as number) : width;
      const prev = i ? (vals[i - 1].x as number) : 0;
      return min([
        num,
        next - (vv.x as number),
        (vv.x as number) - prev,
      ]) as number;
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

  return {labelHeight, labelWidths};
}

/** Build the per-shape config object consumed by the Tree's shape emit. */
function buildTreeShapeConfig(
  viz: VizInstance,
  labelHeight: number,
  labelWidths: number[],
  isVertical: boolean,
  isHorizontal: boolean,
) {
  const labelFn = viz.schema.label as
    ((d: DataPoint, i: number) => unknown) | undefined;

  return {
    id: (d: TreeNode, i: number) => nodeId(viz, d, i),
    label: (d: TreeNode, i: number) => {
      if (labelFn) return labelFn(d.data as DataPoint, i);
      const level = (d.depth ?? 1) - 1;
      if (nameLevel(viz, d.data as DataPoint, i, level) !== level)
        return nodeLabel(viz, d.data as DataPoint, i);
      const ids = viz._ids(d.data as DataPoint, i).slice(0, d.depth ?? 1);
      return ids[ids.length - 1];
    },
    labelConfig: {
      fontResize: false,
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
    hitArea: (
      d: TreeNode,
      _i: number,
      s: {r?: number; height: number; width: number},
    ) => {
      const h = labelHeight;
      const offset = s.r ?? (isVertical ? s.height / 2 : s.width / 2);
      const w = labelWidths[(d.depth ?? 1) - 1];
      return {
        width: isVertical ? w : offset * 2 + w,
        height: isHorizontal ? h : offset * 2 + h,
        x: isVertical
          ? -w / 2
          : d.children && d.depth !== viz._drawDepth + 1
            ? -(offset + w)
            : -offset,
        y: isHorizontal
          ? -h / 2
          : d.children && d.depth !== viz._drawDepth + 1
            ? -(offset + labelHeight)
            : -offset,
      };
    },
    labelBounds: (
      d: TreeNode,
      _i: number,
      s: {r?: number; height: number; width: number},
    ) => {
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
          d.children && d.depth !== viz._drawDepth + 1 ? -(offset + h) : offset,
      };
    },
  };
}

/**
    Build link descriptors + per-shape groupings and stash
    `linksData`/`linkD`/`shapeGroups`/`shapeConfig`/`previousShapes` on `viz.ctx`.
*/
function publishTreeCtx(
  viz: VizInstance,
  treeData: TreeNode[],
  labelHeight: number,
  labelWidths: number[],
  isVertical: boolean,
  isHorizontal: boolean,
): void {
  const sc = viz.schema.shapeConfig as Record<string, unknown>;

  // Link descriptors. `linkD` is invoked at emit time.
  const linksData = treeData
    .filter(d => (d.depth ?? 0) > 1)
    .map(d => assign({}, d) as TreeNode);
  const linkD = (d: TreeNode): string => {
    let rr = sc.r as ((d: DataPoint, i: number) => number) | number;
    if (typeof rr === "function") rr = rr(d.data as DataPoint, d.i!);
    const px =
      (d.parent!.x ?? 0) - (d.x ?? 0) + (isVertical ? 0 : (rr as number));
    const py =
      (d.parent!.y ?? 0) - (d.y ?? 0) + (isVertical ? (rr as number) : 0);
    const xx = isVertical ? 0 : -(rr as number);
    const yy = isVertical ? -(rr as number) : 0;
    return isVertical
      ? `M${xx},${yy}C${xx},${(yy + py) / 2} ${px},${(yy + py) / 2} ${px},${py}`
      : `M${xx},${yy}C${(xx + px) / 2},${yy} ${(xx + px) / 2},${py} ${px},${py}`;
  };

  const shapeConfig = buildTreeShapeConfig(
    viz,
    labelHeight,
    labelWidths,
    isVertical,
    isHorizontal,
  );

  viz.ctx.linksData = linksData;
  viz.ctx.linkD = linkD;
  publishShapeGroups(viz, treeData, shapeConfig);
}

/**
    Groups the nodes by shape kind (keeping an empty group for each kind the
    last draw had and this one doesn't, so its nodes exit) and stashes
    `shapeGroups`/`shapeConfig`/`previousShapes` on `viz.ctx`.
*/
function publishShapeGroups(
  viz: VizInstance,
  treeData: TreeNode[],
  shapeConfig: ReturnType<typeof buildTreeShapeConfig>,
): void {
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

  viz.ctx.shapeGroups = shapeGroups;
  viz.ctx.shapeConfig = shapeConfig;
  viz.ctx.previousShapes = dataShapes;
}

/** Whether a node is drawn without children: it has none, or sits at the deepest drawn level. */
const isLeafOf = (viz: VizInstance) => (d: TreeNode) =>
  !d.children || d.depth === viz._drawDepth + 1;

/**
    Each node's height from `nodeHeight` (see `nodeHeights`), or undefined
    when it isn't set.
*/
function treeHeights(
  viz: VizInstance,
  treeData: TreeNode[],
): Map<TreeNode, number> | undefined {
  const accessor = viz.schema.nodeHeight as
    ((d: DataPoint, i: number, node: NodeHeightInfo) => unknown) | undefined;
  if (typeof accessor !== "function") return undefined;
  const leaf = isLeafOf(viz);
  return nodeHeights(treeData, d =>
    accessor(d.data as DataPoint, d.i ?? 0, {
      id: nodeId(viz, d, d.i ?? 0),
      level: (d.depth ?? 1) - 1,
      leaf: leaf(d),
    }),
  );
}

/**
    Tree's radial layout (see `radialLayout.ts`): the tree around a circle
    centered in the chart area, with links curving radially and labels along
    their spokes, stashed on `viz.ctx` as `radialLabels`.
*/
function applyRadialTreeLayout(viz: VizInstance): TreeNode[] {
  const width = viz.schema.width - viz._margin.left - viz._margin.right;
  const height = viz.schema.height - viz._margin.top - viz._margin.bottom;
  const treeData = buildTreeData(viz, 2 * Math.PI, 1);
  const distances = rootDistances(treeData, treeHeights(viz, treeData));
  const shapeConfig = buildTreeShapeConfig(viz, 0, [], false, false);
  const {center, labels} = layoutRadialTree(
    viz,
    treeData,
    distances,
    isLeafOf(viz),
    d => shapeConfig.label(d, d.i ?? 0),
    width,
    height,
  );

  const linksData = treeData
    .filter(d => (d.depth ?? 0) > 1)
    .map(d => assign({}, d) as TreeNode);
  const polar = (d: TreeNode) => ({theta: d.theta ?? 0, rho: d.rho ?? 0});
  const linkD = (
    d: TreeNode,
    reach?: {child: number; parent: number},
  ): string => {
    const parent = d.parent!;
    // A link leaves its parent along the parent's spoke, or along the
    // child's when the parent sits at the center.
    const out = (parent.rho ?? 0) > 0 ? (parent.theta ?? 0) : (d.theta ?? 0);
    return radialLinkD(
      center,
      polar(d),
      polar(parent),
      reach ?? {
        child: radialNodeReach(viz, d, d.theta ?? 0),
        parent: radialNodeReach(viz, parent, out),
      },
    );
  };

  viz.ctx.labelHeight = 0;
  viz.ctx.labelWidths = [];
  viz.ctx.linksData = linksData;
  viz.ctx.linkD = linkD;
  viz.ctx.radialLabels = labels;
  publishShapeGroups(viz, treeData, shapeConfig);
  return treeData;
}

/**
    Moves each node to its distance from the root by `nodeHeight` (see
    `rootDistances`) along the tree's depth axis, `height` pixels long, when
    `nodeHeight` is set.
*/
function applyNodeHeights(
  viz: VizInstance,
  treeData: TreeNode[],
  height: number,
): void {
  const heights = treeHeights(viz, treeData);
  if (!heights) return;
  const distances = rootDistances(treeData, heights);
  for (const d of treeData) d.y = (distances.get(d) ?? 0) * height;
}

export const applyTreeLayout: TransformStage = ({viz}) => {
  const orient = viz.schema.orient as string;
  if (orient === "radial")
    return {shapeData: applyRadialTreeLayout(viz) as DataPoint[]};
  viz.ctx.radialLabels = undefined;
  const isVertical = orient === "vertical";
  const isHorizontal = orient === "horizontal";

  const height = isVertical
    ? viz.schema.height - viz._margin.top - viz._margin.bottom
    : viz.schema.width - viz._margin.left - viz._margin.right;
  const width = isHorizontal
    ? viz.schema.height - viz._margin.top - viz._margin.bottom
    : viz.schema.width - viz._margin.left - viz._margin.right;

  const treeData = buildTreeData(viz, width, height);
  applyNodeHeights(viz, treeData, height);

  const {labelHeight, labelWidths} = measureTreeLabels(
    viz,
    treeData,
    isVertical,
    isHorizontal,
    width,
    height,
  );

  publishTreeCtx(
    viz,
    treeData,
    labelHeight,
    labelWidths,
    isVertical,
    isHorizontal,
  );

  return {shapeData: treeData as DataPoint[]};
};
