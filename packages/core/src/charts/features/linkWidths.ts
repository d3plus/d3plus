/**
    The stroke widths the node-link charts size their links between when
    `linkSize` values differ.
*/

/**
    The share of the smallest node's radius the heaviest link is drawn at
    by default: a quarter of the node's width, so links read as weighted
    lines beside their nodes rather than bands as wide as them, and a
    heavy link's arrowhead (1.5× its stroke) stays narrower than the node.
*/
export const LINK_SIZE_SHARE = 0.5;

/** A finite, non-negative number, or `undefined`. */
const width = (value: unknown): number | undefined => {
  const n = typeof value === "number" ? value : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/**
    The thinnest and widest link, in pixels, for links whose `linkSize`
    values differ. The thinnest is `sizeMin` (1 when unset). The widest is
    `sizeMax` when set, which also caps the thinnest; otherwise it is half
    the smallest node's radius (`rMin`), and never thinner than the
    thinnest.
*/
export function linkWidthRange(
  sizeMin: unknown,
  sizeMax: unknown,
  rMin: number,
): [number, number] {
  const lo = width(sizeMin) ?? 1;
  const hi = width(sizeMax);
  if (hi !== undefined) return [Math.min(lo, hi), hi];
  const share = Number.isFinite(rMin) ? Math.max(0, rMin) * LINK_SIZE_SHARE : 0;
  return [lo, Math.max(lo, share)];
}
