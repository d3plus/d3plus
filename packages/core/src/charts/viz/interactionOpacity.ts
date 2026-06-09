/**
    `applyInteractionOpacity` — recomputes node alpha for hover/active state.

    v4 expresses hover/active dimming as `paint.opacity` on the scene node
    (see the `Paint` docs in @d3plus/render), not via DOM surgery. When a
    hover or active predicate is set, this walks the chart-cell nodes and
    returns clones of the non-matching ones with a reduced opacity, leaving
    the originals (and the un-dimmed nodes) untouched. With no predicate set
    it returns the input array unchanged, so normal renders pay nothing.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {VizInstance} from "./vizTypes.js";

type Predicate = (d: DataPoint, i: number) => boolean;

/** z value that floats a hovered node above its (z-less, i.e. 0) siblings. */
const HOVER_RAISE_Z = 1e6;

export function applyInteractionOpacity(
  nodes: SceneNode[],
  viz: VizInstance,
): SceneNode[] {
  const hover = typeof viz._hover === "function" ? (viz._hover as Predicate) : null;
  const active = typeof viz._active === "function" ? (viz._active as Predicate) : null;
  if (!hover && !active) return nodes;

  const sc = (viz.schema.shapeConfig ?? {}) as Record<string, unknown>;
  const hoverOpacity = typeof sc.hoverOpacity === "number" ? sc.hoverOpacity : 0.5;
  const activeOpacity = typeof sc.activeOpacity === "number" ? sc.activeOpacity : 0.25;

  // Hover is the transient interaction and wins while present; active
  // (legend/focus selection) governs once the pointer leaves and `hover`
  // resets to `false`. Picking one avoids ambiguous compounding when both
  // are momentarily set.
  const predicate = hover ?? active;
  const dimOpacity = hover ? hoverOpacity : activeOpacity;

  const walk = (node: SceneNode): SceneNode => {
    let next = node;
    const datum = node.datum as (DataPoint & {data?: DataPoint; i?: number}) | undefined;
    if (datum) {
      // Mirror the renderer→handler bridge's one-level unwrap
      // (`rawDatum.data ?? rawDatum`) so the predicate sees the same row the
      // hover predicate was built from — for shape nodes the datum is already
      // the row; for label nodes it's the layout node whose `.data` is the row.
      const row = (datum.data ?? datum) as DataPoint;
      const i =
        typeof node.index === "number"
          ? node.index
          : typeof (row as {i?: number}).i === "number"
            ? (row as {i: number}).i
            : 0;
      if (!predicate!(row, i)) {
        const base =
          node.paint && typeof node.paint.opacity === "number"
            ? node.paint.opacity
            : 1;
        next = {...node, paint: {...(node.paint ?? {}), opacity: base * dimOpacity}};
      } else if (hover) {
        // Raise the hovered node above its siblings. Both renderers paint by
        // ascending `z`, so a large value floats it to the top; restore is
        // automatic — the next repaint (incl. when hover clears) rebuilds the
        // scene with no `z`.
        next = {...node, z: HOVER_RAISE_Z} as SceneNode;
      }
    }
    const kids = (next as {children?: SceneNode[]}).children;
    if (kids && kids.length) {
      next = {...next, children: kids.map(walk)} as SceneNode;
    }
    return next;
  };

  return nodes.map(walk);
}
