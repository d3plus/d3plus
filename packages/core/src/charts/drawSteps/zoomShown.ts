/**
    The zoom transform each chart is currently drawn at, so a d3-zoom event
    that doesn't move the view (a drag at 1×, or a pan held against the
    translate extent) skips the repaint instead of cutting short a running
    transition with an instant redraw.

    @module
*/

/** A zoom transform's scale and translation. */
export interface ShownTransform {
  k: number;
  x: number;
  y: number;
}

const shown = new WeakMap<object, ShownTransform>();

/**
    Records the transform a chart was just drawn at.
    @param viz The chart.
    @param t The transform applied.
*/
export function recordTransform(viz: object, t: ShownTransform): void {
  shown.set(viz, {k: t.k, x: t.x, y: t.y});
}

/**
    Forgets a chart's recorded transform: it is drawn at its natural scale.
    @param viz The chart.
*/
export function forgetTransform(viz: object): void {
  shown.delete(viz);
}

/**
    Whether a chart is already drawn at a transform. A chart with nothing
    recorded is drawn at the identity transform.
    @param viz The chart.
    @param transform The transform a zoom event carries.
*/
export function showsTransform(viz: object, transform: unknown): boolean {
  const t = transform as Partial<ShownTransform> | null | undefined;
  if (!t || typeof t !== "object" || typeof t.k !== "number") return false;
  const cur = shown.get(viz) ?? {k: 1, x: 0, y: 0};
  return t.k === cur.k && (t.x ?? 0) === cur.x && (t.y ?? 0) === cur.y;
}
