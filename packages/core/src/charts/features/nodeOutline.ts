/**
    Where a link meets a node it connects: at the node's outline, a circle
    or a Rect node's box, rather than its center, so the link doesn't run
    on under a node drawn translucent (as hover dims the nodes it isn't
    about).
    @module
*/

/** A drawn node's outline about its center. */
export interface NodeOutline {
  /** A circle node's radius, and half a Rect node's side when it has no `width` or `height`. */
  r?: number;
  /** The node's shape kind: `"Rect"` draws a box, anything else a circle. */
  shape?: string;
  /** A Rect node's width and height. */
  width?: number;
  height?: number;
}

const size = (n: unknown): number =>
  typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0;

/**
    How far from a node's center a straight stroke `strokeWidth` wide,
    leaving the node along `angle` (radians), ends so its square end sits
    on the node's outline: both of the end's corners on or inside it, so no
    gap shows between the stroke and the node. 0 when the stroke is too
    wide to fit inside the node at all.
*/
export function outlineReach(
  node: NodeOutline,
  angle: number,
  strokeWidth = 0,
): number {
  const half = size(strokeWidth) / 2;
  const r = size(node.r);
  if (node.shape !== "Rect")
    return half < r ? Math.sqrt(r * r - half * half) : 0;
  const hw = (node.width === undefined ? r * 2 : size(node.width)) / 2;
  const hh = (node.height === undefined ? r * 2 : size(node.height)) / 2;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  // Where the line along one of the stroke's edges, `offset` to its side, leaves the box.
  const exit = (offset: number): number => {
    const px = -uy * offset;
    const py = ux * offset;
    if (Math.abs(px) > hw || Math.abs(py) > hh) return 0;
    const tx = Math.abs(ux) > 1e-12 ? (Math.sign(ux) * hw - px) / ux : Infinity;
    const ty = Math.abs(uy) > 1e-12 ? (Math.sign(uy) * hh - py) / uy : Infinity;
    return Math.min(tx, ty);
  };
  return Math.max(0, Math.min(exit(half), exit(-half)));
}
