/**
    Rings' node graph: the laid-out node and edge types, and the pass that
    builds the node set and link descriptors from data and `nodes`/`links`.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

/**
    Single laid-out node — accreted across the layout's passes. Each
    field is filled in by one of the steps below; collected here so a
    single type captures the union of accreted state.
*/
export interface RingsNode {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  id: string;
  node: DataPoint;
  shape: string;
  // Set by the placement pass.
  x?: number;
  y?: number;
  r?: number;
  ring?: 1 | 2;
  radians?: number;
  // Set by the per-link traversal.
  edges?: RingsEdge[] | Record<string, {angle: number; radius: number}>;
  edge?: RingsEdge;
  size?: number;
  // Set by the label-bounds pass.
  labelBounds?: {x: number; y: number; width: number; height: number};
  rotate?: number;
  textAnchor?: string;
  /** The center node only: whether its label fits inside the circle (else it sits below). */
  labelInside?: boolean;
}

/**
    Resolved bezier link. Source/target get rewritten in-place during
    the placement pass; the bezier-control fields (`sourceX`, etc.) and
    the `spline` flag are added by the same pass.
*/
export interface RingsEdge {
  source: RingsNode;
  target: RingsNode;
  size: number;
  spline?: boolean;
  sourceX?: number;
  sourceY?: number;
  sourceBisectX?: number;
  sourceBisectY?: number;
  targetX?: number;
  targetY?: number;
  targetBisectX?: number;
  targetBisectY?: number;
}

type RawLink = {
  source: string | number | DataPoint;
  target: string | number | DataPoint;
};

/**
    Resolve one link endpoint to its node: a node object by its id, else a
    node id (raw or coerced), else a number as an index into `schema.nodes`.
    Undefined when nothing matches.
*/
function resolveRingsLinkEnd(
  v: VizInstance,
  nodeLookup: Record<string, RingsNode>,
  ref: RawLink["source"],
): RingsNode {
  if (typeof ref === "object")
    return nodeLookup[(ref as DataPoint).id as string];
  // Match the ref against node ids first. Data loading coerces leading-zero
  // ids like "010101" into numbers — but only on nodes' own flat id field; a
  // link endpoint can keep its string form, so try both the raw and coerced
  // key. Only when no node carries that id do we treat a number as an index
  // into the nodes array.
  const byId = nodeLookup[ref as unknown as string];
  if (byId) return byId;
  if (!isNaN(ref as unknown as number)) {
    const coerced = nodeLookup[parseFloat(ref as unknown as string)];
    if (coerced) return coerced;
  }
  if (typeof ref === "number") {
    const original = v.schema.nodes && (v.schema.nodes as DataPoint[])[ref];
    if (original == null) return undefined as unknown as RingsNode;
    return (
      typeof original === "object"
        ? nodeLookup[(original as DataPoint).id as string] ||
          nodeLookup[original as unknown as string]
        : nodeLookup[original as unknown as string]
    ) as RingsNode;
  }
  return undefined as unknown as RingsNode;
}

/**
    Build the Rings node set + link descriptors from filtered data and schema
    nodes/links. Stashes `nodeLookup` on `viz.ctx` and returns the working
    `nodes`, `nodeLookup`, `links`, and per-node `linkMap`.
*/
export function buildRingsGraph(
  v: VizInstance,
  data: Record<string, DataPoint>,
): {
  nodes: RingsNode[];
  nodeLookup: Record<string, RingsNode>;
  links: RingsEdge[];
  linkMap: Record<string, RingsEdge[]>;
} {
  let rawNodes: DataPoint[] = v.schema.nodes as DataPoint[];
  if (!rawNodes.length && (v.schema.links as RawLink[]).length) {
    const nodeIds = Array.from(
      new Set(
        (v.schema.links as RawLink[]).reduce(
          (ids: unknown[], link) => ids.concat([link.source, link.target]),
          [],
        ),
      ),
    );
    rawNodes = nodeIds.map(node =>
      typeof node === "object"
        ? (node as DataPoint)
        : ({id: node} as unknown as DataPoint),
    );
  }

  const nodesById: Record<string, DataPoint> = rawNodes.reduce(
    (obj: Record<string, DataPoint>, d, i) => {
      const key = (
        v.schema.nodeGroupBy
          ? v.schema.nodeGroupBy[v._drawDepth](d, i)
          : v._id(d, i)
      ) as string;
      obj[key] = d;
      return obj;
    },
    {},
  );

  const nodes: RingsNode[] = Array.from(
    new Set(Object.keys(data).concat(Object.keys(nodesById))),
  )
    .map((id, i) => {
      const d = data[id];
      const n = nodesById[id];
      if (n === undefined) return false as const;
      return {
        __d3plus__: true,
        data: (d || n) as DataPoint,
        i,
        id,
        node: n,
        shape: (d !== undefined && v.schema.shape(d) !== undefined
          ? v.schema.shape(d)
          : v.schema.shape(n)) as string,
      } satisfies RingsNode;
    })
    .filter((n): n is RingsNode => !!n);

  const nodeLookup: Record<string, RingsNode> = nodes.reduce(
    (obj: Record<string, RingsNode>, d) => {
      obj[d.id] = d;
      return obj;
    },
    {},
  );
  v.ctx.nodeLookup = nodeLookup;

  const links: RingsEdge[] = (v.schema.links as RawLink[])
    .map(link => ({
      source: resolveRingsLinkEnd(v, nodeLookup, link.source),
      target: resolveRingsLinkEnd(v, nodeLookup, link.target),
      size: v.schema.linkSize(link) as number,
    }))
    // A link can name a node id that isn't in the nodes set; that endpoint
    // resolves to undefined and can't be placed, so drop the whole link.
    .filter(link => link.source && link.target);

  const linkMap: Record<string, RingsEdge[]> = links.reduce(
    (map: Record<string, RingsEdge[]>, link) => {
      if (!map[link.source.id]) map[link.source.id] = [];
      map[link.source.id].push(link);
      if (!map[link.target.id]) map[link.target.id] = [];
      map[link.target.id].push(link);
      return map;
    },
    {},
  );

  return {nodes, nodeLookup, links, linkMap};
}
