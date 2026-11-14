/**
    Keeps a laid-out network's nodes inside its chart: a Rect node's box
    keeps its set size however far the layout's radius scale shrinks, so the
    fit that sizes the nodes can still leave a box (and its loops) past an
    edge. These move the nodes in, never resizing them.

    @module
*/

/** How far a node, with its loops, reaches from its center on each side. */
export interface NodeReach {
  x: number;
  y: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** A uniform scale of the nodes' positions, then a shift: `x' = x * scale + dx`. */
export interface Containment {
  scale: number;
  dx: number;
  dy: number;
}

/**
    The shifts (lowest and highest) that keep every node within `0`–`size`
    along one axis, with its positions scaled by `scale`; lo > hi when none
    does.
*/
function shiftRange(
  items: {at: number; before: number; after: number}[],
  size: number,
  scale: number,
): [number, number] {
  let lo = -Infinity,
    hi = Infinity;
  for (const {at, before, after} of items) {
    lo = Math.max(lo, before - at * scale);
    hi = Math.min(hi, size - after - at * scale);
  }
  return [lo, hi];
}

/** The shift in `[lo, hi]` closest to `want`. */
const clamp = (want: number, [lo, hi]: [number, number]): number =>
  lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, want));

/**
    How to move the nodes so each reaches no further than `pad` inside a
    `width` × `height` chart: unchanged when they already fit, else shifted,
    and pulled toward the chart's center (one scale for both axes, keeping
    the layout's shape) only as far as the boxes need. When nothing fits
    even at one point, every node goes to the center.
    @param nodes Each node's position and reach.
    @param width The chart's width.
    @param height The chart's height.
    @param pad Room to keep between a node and the edge.
*/
export function containNodes(
  nodes: NodeReach[],
  width: number,
  height: number,
  pad = 0,
): Containment {
  const xs = nodes.map(n => ({
    at: n.x,
    before: n.left + pad,
    after: n.right + pad,
  }));
  const ys = nodes.map(n => ({
    at: n.y,
    before: n.top + pad,
    after: n.bottom + pad,
  }));
  const fits = (scale: number) => {
    const [xl, xh] = shiftRange(xs, width, scale);
    const [yl, yh] = shiftRange(ys, height, scale);
    return xl <= xh && yl <= yh;
  };
  const inside = (range: [number, number]) => range[0] <= 0 && range[1] >= 0;
  if (
    !nodes.length ||
    (inside(shiftRange(xs, width, 1)) && inside(shiftRange(ys, height, 1)))
  )
    return {scale: 1, dx: 0, dy: 0};
  let scale = 1;
  if (!fits(1)) {
    let lo = 0,
      hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid;
      else hi = mid;
    }
    scale = lo;
  }
  // Scaled about the chart's center, then moved in only as far as needed.
  return {
    scale,
    dx: clamp((width / 2) * (1 - scale), shiftRange(xs, width, scale)),
    dy: clamp((height / 2) * (1 - scale), shiftRange(ys, height, scale)),
  };
}
