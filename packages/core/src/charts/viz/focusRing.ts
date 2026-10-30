/**
    The ring drawn around the mark keyboard focus rests on.

    @module
*/

import type {GroupNode, Paint, SceneNode, Transform} from "@d3plus/render";

import type {FocusTarget} from "./focusTargets.js";

/** How the focus ring is drawn, resolved to plain values. */
export interface FocusRingStyle {
  /** The ring's color. */
  stroke: string;
  /** The ring's width, in pixels. */
  strokeWidth: number;
  /** Space between the mark and a rectangular or circular ring, in pixels. */
  padding: number;
  /** A wider band drawn beneath the ring (the chart's background color), so the ring reads over any mark color. */
  halo: string;
}

/** The radius of the ring around a series point, before padding. */
const POINT_RADIUS = 5;

/** A ring outline drawn as `type`, as a halo underneath a stroke. */
function strokes(
  geom: Record<string, unknown>,
  style: FocusRingStyle,
  type: string,
): SceneNode[] {
  const base = {fill: "none", vectorEffect: "non-scaling-stroke"} as Paint;
  return [
    {
      ...geom,
      key: `viz-focus-halo-${type}`,
      paint: {...base, stroke: style.halo, strokeWidth: style.strokeWidth + 2},
    },
    {
      ...geom,
      key: `viz-focus-ring-${type}`,
      paint: {...base, stroke: style.stroke, strokeWidth: style.strokeWidth},
    },
  ].map(n => ({...n, interactive: false, aria: {hidden: true}}) as SceneNode);
}

/** Whether a node paints a visible fill. */
function filled(node: SceneNode): boolean {
  const fill = node.paint?.fill;
  return !!fill && fill !== "none" && fill !== "transparent";
}

/** Nests `children` in one group per transform, outermost first. */
function nest(chain: Transform[], children: SceneNode[]): SceneNode[] {
  return chain.reduceRight<SceneNode[]>(
    (inner, transform, i) => [
      {
        type: "group",
        key: `viz-focus-t${i}`,
        transform,
        children: inner,
        interactive: false,
      },
    ],
    children,
  );
}

/** The ring's own geometry, in surface coordinates unless it follows a path. */
function ringChildren(target: FocusTarget, style: FocusRingStyle): SceneNode[] {
  const {node, box, center, chain} = target;
  const pad = style.padding;
  if (target.pointIndex !== undefined)
    return strokes(
      {type: "circle", cx: center[0], cy: center[1], r: POINT_RADIUS + pad},
      style,
      "circle",
    );
  if (node.type === "circle")
    return strokes(
      {type: "circle", cx: center[0], cy: center[1], r: box.width / 2 + pad},
      style,
      "circle",
    );
  // A filled path's own outline (a pie wedge, a map region), through the
  // same transforms that place the mark. A stroke-only path (a network link)
  // is boxed instead, since tracing it would only redraw the line.
  if (node.type === "path" && filled(node)) {
    const full = node.transform ? [...chain, node.transform] : chain;
    return nest(full, strokes({type: "path", d: node.d}, style, "path"));
  }
  return strokes(
    {
      type: "rect",
      x: box.x - pad,
      y: box.y - pad,
      width: box.width + pad * 2,
      height: box.height + pad * 2,
    },
    style,
    "rect",
  );
}

/**
    The `viz-focus` scene group outlining `target`: a padded rectangle around
    a rect-like mark or a stroke-only path, a circle around a circle or series
    point, and the mark's own outline for a filled path. Inert and hidden from
    assistive tech.
*/
export function focusRingNode(
  target: FocusTarget,
  style: FocusRingStyle,
): GroupNode {
  return {
    type: "group",
    key: "viz-focus",
    interactive: false,
    aria: {hidden: true},
    children: ringChildren(target, style),
  };
}
