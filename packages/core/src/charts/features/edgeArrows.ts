/**
    Shared arrowhead geometry for edge charts (Network, Rings, Sankey).

    Arrowheads are drawn as filled-triangle `path` scene nodes rather than SVG
    `marker-end`, because d3plus renders to both SVG and Canvas and Canvas has no
    marker support. Each chart computes the tip point + tangent angle from its own
    edge geometry (edges terminate differently per chart) and calls `arrowNode`.
    The triangle lives in the same content coordinate space as its edge, so it
    pans/zooms and hover-dims in lockstep with the edge.

    Chord doesn't use this module — its ribbons carry arrowheads via d3-chord's
    `ribbonArrow`.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

/** Which end(s) of an edge carry an arrowhead. `true` is equivalent to `"target"`. */
export type ArrowEndValue = boolean | "target" | "source" | "both";

/** The `arrows` config: a fixed value or a per-edge accessor. */
export type ArrowValue =
  | ArrowEndValue
  | ((d: DataPoint, i: number) => ArrowEndValue);

/** Resolved per-edge arrow ends. */
export interface ArrowEnds {
  source: boolean;
  target: boolean;
}

/** Normalize an `arrows` config value for one edge into `{source, target}` flags. */
export function arrowEnds(arrows: ArrowValue, d: DataPoint, i: number): ArrowEnds {
  const v = typeof arrows === "function" ? arrows(d, i) : arrows;
  if (v === true || v === "target") return {source: false, target: true};
  if (v === "source") return {source: true, target: false};
  if (v === "both") return {source: true, target: true};
  return {source: false, target: false};
}

const round = (n: number): number => Math.round(n * 100) / 100;

/**
    SVG path `d` for a filled isosceles triangle whose tip is at `(x, y)`, pointing
    along `angle` (radians), with `size` the tip-to-base length.
*/
export function arrowPathD(
  x: number,
  y: number,
  angle: number,
  size: number,
): string {
  const halfBase = size * 0.6;
  const bx = x - Math.cos(angle) * size;
  const by = y - Math.sin(angle) * size;
  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);
  return `M${round(x)},${round(y)}L${round(bx + nx * halfBase)},${round(by + ny * halfBase)}L${round(bx - nx * halfBase)},${round(by - ny * halfBase)}Z`;
}

/**
    Tip point + direction for a straight-edge arrowhead sitting at the boundary of
    an endpoint node (radius `r`), pointing from `(fromX, fromY)` toward
    `(toX, toY)`. `gap` insets the tip slightly off the node edge. Used by Network
    (center-to-center links) and Rings' straight center-links.
*/
export function straightArrowTip(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  r: number,
  gap = 1,
): {x: number; y: number; angle: number} {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  return {
    x: toX - Math.cos(angle) * (r + gap),
    y: toY - Math.sin(angle) * (r + gap),
    angle,
  };
}

/**
    Resolve the arrowhead size from the `arrowSize` config (a number or per-edge
    accessor), falling back to a size derived from the edge's stroke width.
*/
export function arrowSizeFor(
  arrowSize: unknown,
  d: DataPoint,
  i: number,
  strokeWidth: number,
): number {
  const cfg =
    typeof arrowSize === "function"
      ? (arrowSize as (d: DataPoint, i: number) => unknown)(d, i)
      : arrowSize;
  return typeof cfg === "number" ? cfg : Math.max(6, strokeWidth * 3);
}

/**
    Emit arrowhead nodes for a straight, center-to-center edge between two nodes
    (radii `source.r`/`target.r`), insetting each tip to the node boundary.
    Returns `[]` when `arrows` selects neither end. Used by Network and Rings'
    straight center-links.
*/
export function straightEdgeArrows(opts: {
  arrows: ArrowValue;
  arrowSize: unknown;
  strokeWidth?: number;
  datum: DataPoint;
  i: number;
  keyPrefix: string;
  fill?: string;
  source: {x: number; y: number; r?: number};
  target: {x: number; y: number; r?: number};
}): SceneNode[] {
  const ends = arrowEnds(opts.arrows, opts.datum, opts.i);
  if (!ends.source && !ends.target) return [];
  const size = arrowSizeFor(
    opts.arrowSize,
    opts.datum,
    opts.i,
    typeof opts.strokeWidth === "number" ? opts.strokeWidth : 1,
  );
  const {source: s, target: t, datum, fill, keyPrefix} = opts;
  const out: SceneNode[] = [];
  if (ends.target) {
    const tip = straightArrowTip(s.x, s.y, t.x, t.y, t.r ?? 0, 1);
    out.push(arrowNode({key: `${keyPrefix}-t`, datum, x: tip.x, y: tip.y, angle: tip.angle, size, fill}));
  }
  if (ends.source) {
    const tip = straightArrowTip(t.x, t.y, s.x, s.y, s.r ?? 0, 1);
    out.push(arrowNode({key: `${keyPrefix}-s`, datum, x: tip.x, y: tip.y, angle: tip.angle, size, fill}));
  }
  return out;
}

/** Inputs for a single arrowhead scene node. */
export interface ArrowNodeOpts {
  key: string | number;
  datum: DataPoint;
  x: number;
  y: number;
  /** Direction the arrow points, in radians. */
  angle: number;
  size: number;
  fill?: string;
  opacity?: number;
}

/**
    Build one arrowhead scene node. `interactive: false` so the edge path owns
    hit-testing, and the same `datum` as its edge so the hover-dim pass keeps the
    arrow paired with its edge.
*/
export function arrowNode(opts: ArrowNodeOpts): SceneNode {
  return {
    type: "path",
    key: opts.key,
    d: arrowPathD(opts.x, opts.y, opts.angle, opts.size),
    datum: opts.datum,
    interactive: false,
    paint: {
      fill: opts.fill,
      ...(opts.opacity !== undefined ? {opacity: opts.opacity} : {}),
    },
  } as SceneNode;
}
