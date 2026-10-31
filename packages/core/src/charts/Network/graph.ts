/**
    Node and link resolution shared by the node-link charts (Network,
    ArcDiagram): merges `data` onto `nodes` by id, and resolves each link's
    `source`/`target` (an index into `nodes`, a node object, or an id string)
    to its node record.
*/

import {min} from "d3-array";
import type {SimulationNodeDatum} from "d3-force";
import {zoomTransform} from "d3-zoom";

import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

/** One resolved node: its merged row, its `nodes` entry, and its sizing inputs. */
export interface GraphNode extends SimulationNodeDatum {
  __d3plus__: true;
  /** The `data` row for this node, or its `nodes` entry when no row matches. */
  data: DataPoint;
  i: number;
  id: string;
  fx: number;
  fy: number;
  /** The node's entry in `nodes`. */
  node: DataPoint;
  /** The node's raw `size` value (or `sizeMin` when unsized), before scaling. */
  r: number;
  shape: string;
  width?: number;
  height?: number;
}

/** One resolved link: its endpoints' node records and its raw `linkSize` value. */
export interface GraphLink {
  source: GraphNode;
  target: GraphNode;
  size: number;
}

type RawLink = {
  source: string | number | DataPoint;
  target: string | number | DataPoint;
};

/** A node row's id: its `groupBy` id, else its `nodeGroupBy` id at the drawn depth. */
export function graphNodeId(
  viz: VizInstance,
  d: Record<string, unknown>,
  i: number,
): string {
  return `${viz._id(d as DataPoint, i) || viz.schema.nodeGroupBy[min([viz._drawDepth, viz.schema.nodeGroupBy.length - 1]) as number](d, i)}`;
}

/**
    Resolves the filtered data and `nodes` into node records, in the order the
    ids first appear (data rows, then nodes). Only ids present in `nodes`
    become nodes; a matching data row supplies a node's values. `fx`/`fy` read
    the chart's `x`/`y` accessors when it has them.
*/
export function resolveGraphNodes(v: VizInstance): GraphNode[] {
  const data = (v._filteredData as DataPoint[]).reduce(
    (obj: Record<string, DataPoint>, d, i) => {
      obj[v._id(d, i) as string] = d;
      return obj;
    },
    {},
  );

  const rawNodes: Record<string, DataPoint> = (
    v.schema.nodes as DataPoint[]
  ).reduce((obj: Record<string, DataPoint>, d, i) => {
    obj[graphNodeId(v, d as Record<string, unknown>, i)] = d;
    return obj;
  }, {});

  const position = (
    acc: VizInstance["_x"],
  ): ((x: DataPoint) => number) | undefined =>
    typeof acc === "function"
      ? (acc as unknown as (x: DataPoint) => number)
      : undefined;
  const xAcc = position(v._x);
  const yAcc = position(v._y);

  return Array.from(new Set(Object.keys(data).concat(Object.keys(rawNodes))))
    .map((id, i) => {
      const d = data[id];
      const n = rawNodes[id];
      if (n === undefined) return false;
      const pickFrom = <T>(
        accessor: (x: DataPoint) => T,
        validate: (x: T) => boolean = vv => vv !== undefined,
      ): T =>
        d !== undefined && validate(accessor(d)) ? accessor(d) : accessor(n);
      const valid = (val: number) => !isNaN(val);
      return {
        __d3plus__: true,
        data: (d || n) as DataPoint,
        i,
        id,
        fx: xAcc ? pickFrom(xAcc, valid) : undefined,
        fy: yAcc ? pickFrom(yAcc, valid) : undefined,
        node: n,
        r: v._size
          ? pickFrom(v._size as (x: DataPoint) => number)
          : (v.schema.sizeMin as number),
        shape: pickFrom(v.schema.shape) as string,
      } as GraphNode;
    })
    .filter((n): n is GraphNode => !!n);
}

/**
    Resolves `links` against `nodes`, index-aligned with `links`: an endpoint
    that matches no node is undefined. Stashes the id → node lookup on
    `v.ctx.nodeLookup` and the id → neighbor nodes lookup on
    `v.ctx.linkLookup`.
*/
export function resolveGraphLinks(
  v: VizInstance,
  nodes: GraphNode[],
): GraphLink[] {
  const nodeLookup: Record<string, GraphNode> = nodes.reduce(
    (obj: Record<string, GraphNode>, d) => {
      obj[d.id] = d;
      return obj;
    },
    {},
  );
  v.ctx.nodeLookup = nodeLookup;

  const nodeByOriginal = new Map<DataPoint, GraphNode>();
  for (const n of nodes) nodeByOriginal.set(n.node, n);
  const endpoint = (ref: RawLink["source"], referenceType: string): GraphNode =>
    (referenceType === "number"
      ? nodeByOriginal.get((v.schema.nodes as DataPoint[])[ref as number])
      : referenceType === "string"
        ? nodeLookup[ref as string]
        : nodeLookup[(ref as DataPoint).id as string]) as GraphNode;
  const links: GraphLink[] = (v.schema.links as RawLink[]).map(l => {
    const referenceType = typeof l.source;
    return {
      size: v.schema.linkSize(l) as number,
      source: endpoint(l.source, referenceType),
      target: endpoint(l.target, referenceType),
    };
  });

  v.ctx.linkLookup = links.reduce((obj: Record<string, GraphNode[]>, d) => {
    if (!d.source || !d.target) return obj;
    if (!obj[d.source.id]) obj[d.source.id] = [];
    obj[d.source.id].push(d.target);
    if (!obj[d.target.id]) obj[d.target.id] = [];
    obj[d.target.id].push(d.source);
    return obj;
  }, {});

  return links;
}

/**
    Zooms to a node-space extent. Node coordinates sit under the chart's
    margin-origin transform and the current zoom, so they're mapped to their
    on-screen position first — the space `_zoomToBounds` expects.
*/
export function zoomToNodeBounds(
  viz: VizInstance,
  xDomain: number[],
  yDomain: number[],
) {
  const t = zoomTransform((viz._zoomEventTarget || viz._container)!.node());
  const {x: cx = 0, y: cy = 0} = viz._chartTransform || {};
  viz._zoomToBounds!([
    [(xDomain[0] + cx) * t.k + t.x, (yDomain[0] + cy) * t.k + t.y],
    [(xDomain[1] + cx) * t.k + t.x, (yDomain[1] + cy) * t.k + t.y],
  ]);
}
