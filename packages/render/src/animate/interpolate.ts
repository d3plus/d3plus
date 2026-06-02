import {interpolateNumber, interpolateRgb} from "d3-interpolate";
import {interpolatePath} from "d3-interpolate-path";

import type {
  AreaNode,
  CircleNode,
  GroupNode,
  LineNode,
  Paint,
  PathNode,
  RectNode,
  SceneNode,
  Transform,
} from "../scene.js";

/**
    @type Interp
    A function mapping normalized time [0,1] to an interpolated value.
*/
export type Interp<T> = (t: number) => T;

/**
    The default easing curve, identical to d3-transition's default (cubic in-out),
    so Canvas frame interpolation matches SVG transition motion.
    @param t Normalized time in [0,1].
*/
export function cubicInOut(t: number): number {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

/** Interpolates a numeric field, snapping when either endpoint is absent or equal. */
function lerpNum(a: number | undefined, b: number): Interp<number> {
  if (a === undefined || a === b) return () => b;
  const i = interpolateNumber(a, b);
  return t => i(t);
}

/** Interpolates a color field, snapping when either endpoint is absent or equal. */
function lerpColor(
  a: string | undefined,
  b: string | undefined,
): Interp<string | undefined> {
  if (b === undefined || a === undefined || a === b) return () => b;
  const i = interpolateRgb(a, b);
  return t => i(t);
}

/** Interpolates point arrays of equal length; snaps to the target when lengths differ. */
function lerpPoints(
  a: [number, number][],
  b: [number, number][],
): Interp<[number, number][]> {
  if (a.length !== b.length) return () => b;
  const xs = b.map((p, i) => interpolateNumber(a[i][0], p[0]));
  const ys = b.map((p, i) => interpolateNumber(a[i][1], p[1]));
  return t => b.map((_, i) => [xs[i](t), ys[i](t)]);
}

/** Builds an interpolator for the shared Paint fields. Snap-only fields follow the target. */
function interpPaint(a: Paint = {}, b: Paint = {}): Interp<Paint> {
  const fill = lerpColor(a.fill, b.fill);
  const stroke = lerpColor(a.stroke, b.stroke);
  const fillOpacity = b.fillOpacity === undefined ? null : lerpNum(a.fillOpacity, b.fillOpacity);
  const strokeOpacity = b.strokeOpacity === undefined ? null : lerpNum(a.strokeOpacity, b.strokeOpacity);
  const strokeWidth = b.strokeWidth === undefined ? null : lerpNum(a.strokeWidth, b.strokeWidth);
  // Opacity defaults to 1 (the SVG default) when either endpoint sets it, so that
  // collapse()'s opacity:0 fades a node fully in on enter and fully out on exit.
  const opacity =
    a.opacity === undefined && b.opacity === undefined
      ? null
      : lerpNum(a.opacity ?? 1, b.opacity ?? 1);
  return t => ({
    ...b,
    fill: fill(t),
    stroke: stroke(t),
    ...(fillOpacity ? {fillOpacity: fillOpacity(t)} : {}),
    ...(strokeOpacity ? {strokeOpacity: strokeOpacity(t)} : {}),
    ...(strokeWidth ? {strokeWidth: strokeWidth(t)} : {}),
    ...(opacity ? {opacity: opacity(t)} : {}),
  });
}

/** Builds an interpolator for the affine Transform fields. */
function interpTransform(a: Transform = {}, b: Transform = {}): Interp<Transform> {
  const x = lerpNum(a.x ?? 0, b.x ?? 0);
  const y = lerpNum(a.y ?? 0, b.y ?? 0);
  const scale = lerpNum(a.scale ?? 1, b.scale ?? 1);
  const rotate = lerpNum(a.rotate ?? 0, b.rotate ?? 0);
  return t => ({...b, x: x(t), y: y(t), scale: scale(t), rotate: rotate(t)});
}

/**
    Builds an interpolator between two nodes of the same type. When the types differ
    (a rare key reuse across shape kinds) it snaps to the target. Group children are
    not recursed here — interpolateScene handles nested groups.
    @param from The starting node.
    @param to The target node.
*/
export function interpolateNode(from: SceneNode, to: SceneNode): Interp<SceneNode> {
  if (from.type !== to.type) return () => to;

  const paint = interpPaint(from.paint, to.paint);
  const hasTransform = Boolean(from.transform || to.transform);
  const transform = hasTransform ? interpTransform(from.transform, to.transform) : null;

  const base = (t: number): SceneNode =>
    ({...to, paint: paint(t), ...(transform ? {transform: transform(t)} : {})}) as SceneNode;

  switch (to.type) {
    case "rect": {
      const f = from as RectNode;
      const x = lerpNum(f.x, to.x), y = lerpNum(f.y, to.y);
      const w = lerpNum(f.width, to.width), h = lerpNum(f.height, to.height);
      return t => ({...(base(t) as RectNode), x: x(t), y: y(t), width: w(t), height: h(t)});
    }
    case "circle": {
      const f = from as CircleNode;
      const cx = lerpNum(f.cx, to.cx), cy = lerpNum(f.cy, to.cy), r = lerpNum(f.r, to.r);
      return t => ({...(base(t) as CircleNode), cx: cx(t), cy: cy(t), r: r(t)});
    }
    case "line": {
      const f = from as LineNode;
      const pts = lerpPoints(f.points, to.points);
      return t => ({...(base(t) as LineNode), points: pts(t)});
    }
    case "area": {
      const f = from as AreaNode;
      const top = lerpPoints(f.topline, to.topline);
      const bot = lerpPoints(f.baseline, to.baseline);
      return t => ({...(base(t) as AreaNode), topline: top(t), baseline: bot(t)});
    }
    case "path": {
      const f = from as PathNode;
      const d = interpolatePath(f.d, to.d);
      return t => ({...(base(t) as PathNode), d: d(t)});
    }
    default:
      // image, text, group: snap geometry, animate paint/transform only.
      return base;
  }
}

/**
    Produces the degenerate "zero" form of a node used as the start of an enter
    animation and the end of an exit animation: opacity fades to 0, and geometric
    shapes collapse (rect shrinks toward its center, circle radius → 0), mirroring
    the enter/exit conventions of the SVG Shape classes.
    @param node The node to collapse.
*/
export function collapse(node: SceneNode): SceneNode {
  const paint: Paint = {...node.paint, opacity: 0};
  switch (node.type) {
    case "rect": {
      // A bar's measure-axis edge is anchored at local 0 (its baseline), so it
      // grows in from that edge rather than from its center: a vertical bar has
      // a horizontal edge at y=0, a horizontal bar a vertical edge at x=0.
      // Collapse only the measure dimension and keep the bar's full breadth.
      // Plain rects (Treemap cells, etc.) collapse toward their center.
      if (node.shapeType === "Bar") {
        if (node.y === 0 || node.y + node.height === 0)
          return {...node, paint, y: 0, height: 0};
        if (node.x === 0 || node.x + node.width === 0)
          return {...node, paint, x: 0, width: 0};
      }
      return {
        ...node,
        paint,
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
        width: 0,
        height: 0,
      };
    }
    case "circle":
      return {...node, paint, r: 0};
    case "path":
      // A Sankey link encodes its flow magnitude as stroke-width, so it grows
      // that thickness in on enter (and drains it on exit) from 0, keeping its
      // own opacity — rather than the default opacity fade other paths use.
      if (node.shapeType === "Link")
        return {...node, paint: {...node.paint, strokeWidth: 0}};
      return {...node, paint} as SceneNode;
    case "group":
      return {...(node as GroupNode), paint};
    default:
      return {...node, paint} as SceneNode;
  }
}
