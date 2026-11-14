/**
    ArcDiagram's node boxes: how far each node reaches along its line and out
    across it (a circle's radius, or half a Rect node's box), and the node
    positions that keep differently sized boxes apart.
*/

import {shapeConfigFor} from "../features/emitHelpers.js";
import type {NodeOutline} from "../features/nodeOutline.js";
import {rectNodeSize} from "../features/rectNodeSize.js";
import type {RectSizeConfig} from "../features/rectNodeSize.js";
import type {GraphNode} from "../Network/graph.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {slotPositions} from "./arcGeometry.js";
import type {ArcOrient} from "./arcGeometry.js";

/** A node's size on the line: a circle of `r`, or a Rect node's box. */
export type ArcNodeBox = Pick<NodeOutline, "shape" | "width" | "height"> & {
  r: number;
};

/** A Rect node's width or height, else its circle's diameter. */
const side = (n: ArcNodeBox, value: number | undefined): number =>
  n.shape === "Rect" && Number.isFinite(value) ? Math.max(0, value!) : n.r * 2;

/** Half a node's extent along a line running `orient`. */
export function alongReach(n: ArcNodeBox, orient: ArcOrient): number {
  return side(n, orient === "horizontal" ? n.width : n.height) / 2;
}

/** How far a node reaches out from a line running `orient`, on either side. */
export function crossReach(n: ArcNodeBox, orient: ArcOrient): number {
  return side(n, orient === "horizontal" ? n.height : n.width) / 2;
}

/**
    Positions along a line of `length` pixels starting at `start` for nodes
    `extents` pixels long: the room their boxes leave split evenly between
    them, a half share before the first and after the last, so the space
    between each pair of neighbors is the same. Boxes too long to fit
    shrink in proportion, so the nodes keep inside the line. Equal extents
    sit as `slotPositions` places them.
*/
export function boxSlotPositions(
  extents: readonly number[],
  start: number,
  length: number,
): number[] {
  const count = extents.length;
  if (!count) return [];
  const sizes = extents.map(e => (Number.isFinite(e) ? Math.max(0, e) : 0));
  const total = sizes.reduce((a, b) => a + b, 0);
  const shrink = total > length && total > 0 ? Math.max(0, length) / total : 1;
  const gap = Math.max(0, length - total * shrink) / count;
  let at = start + gap / 2;
  return sizes.map(e => {
    const p = at + (e * shrink) / 2;
    at += e * shrink + gap;
    return p;
  });
}

/** A box about its center. */
export interface CenteredBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
    The part of a polyline from where it leaves `first` (a box about its
    start) to where it enters `last` (one about its end), each end left as
    is without a box. Empty when the boxes cover it.
*/
export function clearOfBoxes(
  points: [number, number][],
  first?: CenteredBox,
  last?: CenteredBox,
): [number, number][] {
  const inside = (b: CenteredBox | undefined, [x, y]: [number, number]) =>
    !!b &&
    Math.abs(x - b.x) <= b.width / 2 &&
    Math.abs(y - b.y) <= b.height / 2;
  let from = 0;
  while (from < points.length && inside(first, points[from])) from++;
  let to = points.length - 1;
  while (to >= from && inside(last, points[to])) to--;
  return points.slice(from, to + 1);
}

/**
    Each node's size (its radius on `r`, and a Rect node's box from `shapeConfig`'s
    Rect `width` and `height`; see `rectNodeSize`), where it sits along the
    line (in equal slots, or, with Rect nodes, spaced so the gaps between
    their boxes match; see `boxSlotPositions`), and how far it reaches out
    from the line.
    @param v The chart.
    @param nodes The nodes, in their order along the line.
    @param r The node radius scale, of a node's `r`.
    @param line Where the line starts, its length, and the way it runs.
*/
export function placeNodeBoxes(
  v: VizInstance,
  nodes: GraphNode[],
  r: (value: number) => number,
  line: {start: number; length: number; orient: ArcOrient},
): {
  radii: number[];
  boxes: ArcNodeBox[];
  positions: number[];
  reaches: number[];
} {
  const {start, length, orient} = line;
  const radii = nodes.map(n => r(n.r) || 1);
  let config: RectSizeConfig | undefined;
  const boxes: ArcNodeBox[] = nodes.map((n, i) => {
    const radius = radii[i];
    const square = {shape: n.shape, r: radius};
    if (n.shape !== "Rect")
      return {...square, width: radius * 2, height: radius * 2};
    config ??= shapeConfigFor(v, "Rect") as RectSizeConfig;
    const [width, height] = rectNodeSize(config, n, radius, i);
    return {...square, width, height};
  });
  const positions = boxes.some(b => b.shape === "Rect")
    ? boxSlotPositions(
        boxes.map(b => alongReach(b, orient) * 2),
        start,
        length,
      )
    : slotPositions(boxes.length, start, length);
  const reaches = boxes.map(b => crossReach(b, orient));
  return {radii, boxes, positions, reaches};
}
