/**
    Pure Sunburst layout: nests rows into one branch per `groupBy` key path,
    sizes every branch by its summed value with d3-hierarchy's `partition`,
    and places each branch in polar coordinates — angle from the partition,
    radius from its ring.
*/

import {hierarchy, partition} from "d3-hierarchy";
import type {HierarchyNode} from "d3-hierarchy";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {SHARE_KEY} from "../features/shareKey.js";

/** A `groupBy` accessor. */
export type SunburstKey = (d: DataPoint, i: number) => unknown;

/** One nesting branch: every row that shares a key path. */
export interface SunburstBranch {
  /** This level's key. */
  key: unknown;
  /** Every key from the top `groupBy` level down to this one. */
  path: unknown[];
  /** The `groupBy` index this branch's key was read at (-1 for the whole). */
  level: number;
  /** Every row under the branch. */
  rows: DataPoint[];
  /** The rows that end here — they have no key at the next level. */
  own: DataPoint[];
  children?: SunburstBranch[];
}

/** Hierarchy-node comparator used to order siblings. */
export type SunburstSort = (
  a: HierarchyNode<SunburstBranch>,
  b: HierarchyNode<SunburstBranch>,
) => number;

/** One laid-out arc (or the center disc). */
export interface SunburstNode {
  /** Stable identity across draws and drill-downs: the serialized key path. */
  id: string;
  path: unknown[];
  /** The `groupBy` index of the node's key (-1 for the unfocused whole). */
  level: number;
  /** Ring index from the center: 0 is the center slot. */
  depth: number;
  /** The row this node represents: the source row for a single-row leaf, else the merged rows. */
  datum: DataPoint;
  /** Index of `datum` in the source data, when it is a source row. */
  i: number | undefined;
  value: number;
  /** Share of the drawn whole. */
  share: number;
  /** Share of the parent node. */
  parentShare: number;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  /** Whether the node has a ring of children drawn around it. */
  hasChildren: boolean;
  parent?: SunburstNode;
}

/**
    Nests `rows` by `keys`, one level per key. A row whose key is missing at a
    level ends at its parent (it adds to the parent's value without a child arc
    of its own), so ragged hierarchies leave a gap rather than an "undefined"
    arc.
    @param rows The rows to nest.
    @param keys One accessor per nesting level.
    @param options `level` (groupBy index of `keys[0]`), the key `path` above
        it, and the `index` of a row in the source data.
*/
export function nestSunburst(
  rows: DataPoint[],
  keys: SunburstKey[],
  options: {
    level?: number;
    path?: unknown[];
    index?: (d: DataPoint) => number;
  } = {},
): {children: SunburstBranch[]; own: DataPoint[]} {
  const {level = 0, path = [], index = () => 0} = options;
  if (!keys.length) return {children: [], own: rows};
  const [key, ...rest] = keys;
  const own: DataPoint[] = [];
  const groups = new Map<unknown, DataPoint[]>();
  for (const d of rows) {
    const k = key(d, index(d));
    if (k === undefined || k === null) {
      own.push(d);
      continue;
    }
    const group = groups.get(k);
    if (group) group.push(d);
    else groups.set(k, [d]);
  }
  const children = [...groups].map(([k, values]): SunburstBranch => {
    const branchPath = [...path, k];
    if (!rest.length)
      return {key: k, path: branchPath, level, rows: values, own: values};
    const nested = nestSunburst(values, rest, {
      level: level + 1,
      path: branchPath,
      index,
    });
    return {
      key: k,
      path: branchPath,
      level,
      rows: values,
      own: nested.own,
      children: nested.children.length ? nested.children : undefined,
    };
  });
  return {children, own};
}

/** Whether a hierarchy node is a threshold "Values" bucket. */
export function isAggregatedBranch(
  node: HierarchyNode<SunburstBranch>,
): boolean {
  const {children, rows} = node.data;
  return !children && rows.length === 1 && rows[0]._isAggregation === true;
}

/** Default sibling order: largest first, with the threshold bucket always last. */
export function sunburstSort(base: SunburstSort): SunburstSort {
  return (a, b) => {
    const aggA = isAggregatedBranch(a);
    const aggB = isAggregatedBranch(b);
    return aggA && !aggB ? 1 : !aggA && aggB ? -1 : base(a, b);
  };
}

export interface SunburstLayoutInputs {
  /** The rows to lay out. */
  data: DataPoint[];
  /** The `groupBy` accessors drawn as rings, innermost first. */
  keys: SunburstKey[];
  /** The `groupBy` index of `keys[0]`. */
  firstLevel: number;
  /** The focused node's key path, drawn as the center disc; empty when unfocused. */
  focusPath: unknown[];
  sum: (d: DataPoint) => number;
  sort?: SunburstSort;
  aggs?: Parameters<typeof merge>[1];
  /** [inner, outer] radius per depth (0 = center), as `sunburstRadii` returns. */
  radii: [number, number][];
}

const TAU = Math.PI * 2;

/**
    A row without the share d3plus stamped on it (see shareKey.ts), so merging
    rows never folds an earlier draw's shares into a parent; a data field named
    `share` is kept.
*/
function withoutStampedShare(row: DataPoint): DataPoint {
  if (!(SHARE_KEY in row)) return row;
  const copy = {...row};
  if (copy.share === copy[SHARE_KEY]) delete copy.share;
  delete copy[SHARE_KEY];
  return copy;
}

/**
    Merges the rows under a branch into the one row its arc represents. A
    branch that holds a threshold bucket is not a bucket itself — even when the
    bucket is its only row — so the bucket markers don't carry up into it.
*/
export function mergeBranch(
  rows: DataPoint[],
  aggs?: Parameters<typeof merge>[1],
): DataPoint {
  const merged = merge(rows.map(withoutStampedShare), aggs) as DataPoint;
  delete merged._isAggregation;
  delete merged._threshold;
  return merged;
}

/**
    Lays out the Sunburst. Returns every drawn node, parents before children:
    the focused node first (as the center disc) when there is one, then each
    ring from the center out. Zero-value branches are left out.
*/
export function sunburstLayout(inputs: SunburstLayoutInputs): SunburstNode[] {
  const {data, keys, firstLevel, focusPath, sum, sort, aggs, radii} = inputs;
  if (!data.length) return [];
  const index = (d: DataPoint): number => data.indexOf(d);
  const nested = nestSunburst(data, keys, {
    level: firstLevel,
    path: focusPath,
    index,
  });
  const rootBranch: SunburstBranch = {
    key: focusPath[focusPath.length - 1],
    path: focusPath,
    level: firstLevel - 1,
    rows: data,
    own: nested.own,
    children: nested.children,
  };
  const ownValue = (b: SunburstBranch): number =>
    b.own.reduce((acc, d) => acc + (Number(sum(d)) || 0), 0);
  let root = hierarchy(rootBranch, b => b.children).sum(ownValue);
  if (sort) root = root.sort(sort);
  const laid = partition<SunburstBranch>().size([TAU, keys.length + 1])(root);
  const total = laid.value ?? 0;

  const nodes: SunburstNode[] = [];
  const byBranch = new Map<SunburstBranch, SunburstNode>();
  for (const n of laid.descendants()) {
    if (n.depth === 0 && !focusPath.length) continue;
    const value = n.value ?? 0;
    if (!(value > 0) || n.x1 - n.x0 <= 0) continue;
    const branch = n.data;
    const single = !branch.children && branch.rows.length === 1;
    const datum = single ? branch.rows[0] : mergeBranch(branch.rows, aggs);
    const parentValue = n.parent ? (n.parent.value ?? 0) : value;
    const [innerRadius, outerRadius] = radii[n.depth] ?? [0, 0];
    const node: SunburstNode = {
      id: JSON.stringify(branch.path),
      path: branch.path,
      level: branch.level,
      depth: n.depth,
      datum,
      i: single ? index(datum) : undefined,
      value,
      share: total ? value / total : 0,
      parentShare: parentValue ? value / parentValue : 0,
      startAngle: n.x0,
      endAngle: n.x1,
      innerRadius,
      outerRadius,
      hasChildren: Boolean(n.children && n.children.length),
      parent: n.parent ? byBranch.get(n.parent.data) : undefined,
    };
    byBranch.set(branch, node);
    nodes.push(node);
  }
  return nodes;
}

/** The node followed by each of its drawn ancestors, outermost first. */
export function sunburstLineage(node: SunburstNode): SunburstNode[] {
  const out: SunburstNode[] = [];
  for (let n: SunburstNode | undefined = node; n; n = n.parent) out.push(n);
  return out;
}
