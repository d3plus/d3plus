/**
    Tree's `orient: "radial"`: the tree laid out around a circle, the root
    at the center (or an unseen root there, when the top level holds
    several nodes) and the leaves around the edge. A node's angle comes
    from d3's tidy tree, its distance from the center from its depth or its
    `nodeHeight` (see `rootDistances`). Links curve radially, as
    `d3.linkRadial` draws them, and labels run along their spokes: a leaf's
    outward past the circle, a branch's inward toward its parent over a
    halo, and the center node's level beneath it.
*/

import type {DataPoint} from "@d3plus/data";

import {measureLabel} from "../features/circleLabels.js";
import {
  resolveAccessor,
  shapeConfigFor,
  userLabelConfig,
} from "../features/emitHelpers.js";
import {
  boxReach,
  fitSpokeFont,
  polarPoint,
  radialFit,
  SPOKE_LABEL_PADDING,
  spokeLines,
  spokePlacement,
} from "../features/spokeLabels.js";
import type {SpokePlacement} from "../features/spokeLabels.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A Tree node, as far as the radial layout reads and writes it. */
export interface RadialTreeNode {
  data?: DataPoint;
  i?: number;
  depth?: number;
  x?: number;
  y?: number;
  parent?: RadialTreeNode | null;
  children?: RadialTreeNode[];
  /** Its angle, in radians clockwise from 12 o'clock. */
  theta?: number;
  /** Its distance from the center, in pixels. */
  rho?: number;
}

/** A polar point: an angle clockwise from 12 o'clock, and a distance. */
export interface Polar {
  theta: number;
  rho: number;
}

/** The space between a node and its label, in pixels. */
export const RADIAL_LABEL_PADDING = SPOKE_LABEL_PADDING;

/** The label font size when the shape's labelConfig sets none. */
export const RADIAL_LABEL_FONT_SIZE = 10;

/**
    A radial link's path from `child` to `parent`, in coordinates relative
    to the child's position around `center`: it leaves the child `reach.child`
    pixels toward the center and arrives `reach.parent` pixels out from the
    parent, both along their spokes, curving between them through the
    middle distance as `d3.linkRadial` does. A parent at the center is
    left along the child's spoke, so its links run straight out.
*/
export function radialLinkD(
  center: [number, number],
  child: Polar,
  parent: Polar,
  reach: {child: number; parent: number},
): string {
  const [cx, cy] = center;
  const [ox, oy] = polarPoint(cx, cy, child.theta, child.rho);
  const pTheta = parent.rho > 0 ? parent.theta : child.theta;
  const mid = (child.rho + parent.rho) / 2;
  const at = (theta: number, rho: number) => {
    const [x, y] = polarPoint(cx, cy, theta, rho);
    return `${x - ox},${y - oy}`;
  };
  return (
    `M${at(child.theta, child.rho - reach.child)}` +
    `C${at(child.theta, mid)} ${at(pTheta, mid)} ` +
    `${at(pTheta, parent.rho + reach.parent)}`
  );
}

/** A node's label: along its spoke, or level beneath it at the center. */
export type RadialLabel =
  | ({kind: "spoke"; inward: boolean} & SpokePlacement)
  | {
      kind: "center";
      x: number;
      y: number;
      box: {x: number; y: number; width: number; height: number};
    };

/**
    Each node's angular gap (radians) to its nearest neighbor at the same
    depth, around the full turn; a full turn for a node alone at its depth.
*/
export function ringGaps<T extends {depth?: number; theta?: number}>(
  nodes: readonly T[],
): Map<T, number> {
  const out = new Map<T, number>();
  const byDepth = new Map<number, T[]>();
  for (const n of nodes) {
    const depth = n.depth ?? 0;
    if (!byDepth.has(depth)) byDepth.set(depth, []);
    byDepth.get(depth)!.push(n);
  }
  const turn = 2 * Math.PI;
  for (const ring of byDepth.values()) {
    const sorted = [...ring].sort((a, b) => (a.theta ?? 0) - (b.theta ?? 0));
    sorted.forEach((n, k) => {
      if (sorted.length < 2) return out.set(n, turn);
      const prev = sorted[(k - 1 + sorted.length) % sorted.length];
      const next = sorted[(k + 1) % sorted.length];
      const delta = (a: T, b: T) =>
        ((((b.theta ?? 0) - (a.theta ?? 0)) % turn) + turn) % turn;
      out.set(n, Math.min(delta(prev, n), delta(n, next)));
    });
  }
  return out;
}

/**
    Where a node's label goes. A node at the center takes a level label
    beneath it, `width` wide. A leaf's label runs outward from just past its
    outline (`reach` from its center) to `outer` from the center. A branch's
    runs inward, from just inside its outline to just clear of its parent
    (`parentRho` out, `parentReach` across); it gets no label when that
    leaves no room. A spoke label wraps onto as many lines as fit across
    its node's `gap` to its neighbors (see `spokeLines`), measured where the
    label comes nearest the center. A spoke label gets none when it has less
    room to run along than two lines' height, or than its own `width`
    when that is shorter.
*/
export function radialLabelPlacement(
  center: [number, number],
  node: Polar & {leaf: boolean; reach: number},
  opts: {
    outer: number;
    parentRho: number;
    parentReach: number;
    lineHeight: number;
    width: number;
    gap?: number;
    pad?: number;
  },
): RadialLabel | null {
  const pad = opts.pad ?? RADIAL_LABEL_PADDING;
  const gap = opts.gap ?? 0;
  const shortest = opts.lineHeight * 2;
  const [cx, cy] = center;
  if (node.rho <= 0)
    return {
      kind: "center",
      x: cx,
      y: cy,
      box: {
        x: -opts.width / 2,
        y: node.reach + pad,
        width: opts.width,
        height: opts.lineHeight,
      },
    };
  if (node.leaf) {
    const from = node.rho + node.reach + pad;
    const width = opts.outer - from;
    if (width <= 0 || width < Math.min(shortest, opts.width)) return null;
    const height = spokeLines(gap, from, opts.lineHeight) * opts.lineHeight;
    return {
      kind: "spoke",
      inward: false,
      ...spokePlacement(cx, cy, node.theta, from, width, height),
    };
  }
  const from = node.rho - node.reach - pad;
  const width = from - (opts.parentRho + opts.parentReach + pad);
  if (width <= 0 || width < Math.min(shortest, opts.width)) return null;
  const height =
    spokeLines(gap, from - width, opts.lineHeight) * opts.lineHeight;
  return {
    kind: "spoke",
    inward: true,
    ...spokePlacement(cx, cy, node.theta, from, width, height, true),
  };
}

/**
    How far a node's outline lies from its center along the spoke at
    `theta`: a circle's radius, or where the spoke leaves a Rect's box.
*/
export function radialNodeReach(
  viz: VizInstance,
  n: RadialTreeNode,
  theta: number,
): number {
  const row = (n.data ?? n) as DataPoint;
  const shapeAccessor = viz.schema.shape as (d: DataPoint) => string;
  const shape = shapeAccessor(row);
  const cfg = shapeConfigFor(viz, shape);
  const num = (key: string) =>
    Number(resolveAccessor<number>(cfg[key], row, n.i) ?? 0) || 0;
  if (shape === "Rect") return boxReach(num("width"), num("height"), theta);
  return num("r");
}

/** The label font for a node's shape: its labelConfig's size (else `RADIAL_LABEL_FONT_SIZE`), family, and weight. */
export function radialLabelFont(
  viz: VizInstance,
  n: RadialTreeNode,
): {size: number; family?: string | string[]; weight?: string | number} {
  const row = (n.data ?? n) as DataPoint;
  const shapeAccessor = viz.schema.shape as (d: DataPoint) => string;
  const cfg = userLabelConfig(viz, shapeAccessor(row));
  const size = resolveAccessor<number>(cfg.fontSize, row, n.i);
  return {
    size: typeof size === "number" && size > 0 ? size : RADIAL_LABEL_FONT_SIZE,
    family: resolveAccessor<string | string[]>(cfg.fontFamily, row, n.i),
    weight: resolveAccessor<string | number>(cfg.fontWeight, row, n.i),
  };
}

/**
    Lays the drawn nodes out around a circle in a `width` × `height` chart:
    each node's `theta` is its tidy-tree `x` (laid out across a full turn),
    its `rho` its share of the way out (`distances`) times the radius, and
    `x`/`y` the point they make. Returns the center, the radius, and each
    node's label.
    @param viz The chart.
    @param nodes The drawn nodes, laid out by d3's tree across `[2π, …]`.
    @param distances Each node's share of the way from the root to the leaves.
    @param isLeaf Whether a node is drawn without children.
    @param text A node's label text, or anything else for none.
*/
export function layoutRadialTree<T extends RadialTreeNode>(
  viz: VizInstance,
  nodes: readonly T[],
  distances: Map<T, number>,
  isLeaf: (n: T) => boolean,
  text: (n: T) => unknown,
  width: number,
  height: number,
): {
  center: [number, number];
  radius: number;
  labels: Map<T, {text: string; font: {size: number}; place: RadialLabel}>;
} {
  const center: [number, number] = [width / 2, height / 2];
  const reach = new Map(nodes.map(n => [n, radialNodeReach(viz, n, n.x ?? 0)]));
  const texts = new Map<T, string>();
  for (const n of nodes) {
    const t = text(n);
    if (t !== false && t !== undefined && t !== null && `${t}` !== "")
      texts.set(n, `${t}`);
  }
  const fonts = new Map(nodes.map(n => [n, radialLabelFont(viz, n)]));
  // Only the labels of the nodes farthest out run past the circle.
  const outermost = nodes.filter(n => (distances.get(n) ?? 0) >= 1 - 1e-9);
  const widest = Math.max(
    0,
    ...outermost
      .filter(n => isLeaf(n) && texts.has(n))
      .map(n => measureLabel(texts.get(n)!, fonts.get(n)!).width),
  );
  const largest = Math.max(0, ...reach.values());
  const fit = radialFit(Math.min(width, height) / 2, widest, largest);
  const outer = fit.radius + largest + RADIAL_LABEL_PADDING + fit.labelWidth;

  for (const n of nodes) {
    n.theta = n.x ?? 0;
    n.rho = (distances.get(n) ?? 0) * fit.radius;
    const [x, y] = polarPoint(center[0], center[1], n.theta, n.rho);
    n.x = x;
    n.y = y;
  }

  const gaps = ringGaps(nodes);
  const labels = new Map<
    T,
    {text: string; font: {size: number}; place: RadialLabel}
  >();
  for (const n of nodes) {
    const label = texts.get(n);
    if (!label) continue;
    const font = fonts.get(n)!;
    const lineHeight = Math.ceil(font.size * 1.2) + 1;
    const parent = n.parent && distances.has(n.parent as T) ? n.parent : null;
    const place = radialLabelPlacement(
      center,
      {
        theta: n.theta ?? 0,
        rho: n.rho ?? 0,
        leaf: isLeaf(n),
        reach: reach.get(n) ?? 0,
      },
      {
        outer,
        parentRho: parent?.rho ?? 0,
        parentReach: parent ? (reach.get(parent as T) ?? 0) : 0,
        lineHeight,
        gap: gaps.get(n) ?? 0,
        width: Math.min(
          measureLabel(label, font).width,
          Math.max(fit.radius, 1),
        ),
      },
    );
    if (!place) continue;
    const size = fitSpokeFont(label, font, place.box.width, place.box.height);
    if (size === null) continue;
    labels.set(n, {text: label, font: {...font, size}, place});
  }
  return {center, radius: fit.radius, labels};
}
