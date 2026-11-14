/**
    Network's `linkBundle`: each link between two distinct nodes takes a
    bundled path (`points`, from its source's center to its target's), and
    these helpers draw it: the visible stroke ending at its arrowheads,
    the heads aimed along the curve where it leaves each node, the label
    anchor, and the box a click focus zooms to.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {chordArrowNodes, polylineArrowEdge} from "../features/curvedArrows.js";
import {edgeArrowTrims} from "../features/edgeArrows.js";
import type {ArrowValue, EdgeArrowTrims} from "../features/edgeArrows.js";
import {bundleLinkPaths} from "../features/linkBundle.js";
import type {LinkAnchor} from "../features/linkLabelGeometry.js";
import {
  polylineMidpoint,
  polylineReach,
  trimPolyline,
} from "../features/polyline.js";
import type {Point} from "../features/polyline.js";
import {outlineReach} from "../features/nodeOutline.js";
import type {NodeOutline} from "../features/nodeOutline.js";
import {isSelfLoop} from "../features/selfLoops.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A bundled link's node: its id, center, and outline. */
type BundledNode = NodeOutline & {id?: unknown; x?: number; y?: number};

/** What the bundling reads and writes on a laid-out link. */
export interface BundledLink {
  source?: BundledNode | null;
  target?: BundledNode | null;
  loop?: unknown;
  points?: Point[];
}

/**
    Gives each link between two distinct, placed nodes its bundled path
    when `linkBundle` is on. Loops keep their own shape.
*/
export function bundleNetworkLinks(
  viz: VizInstance,
  links: BundledLink[],
): void {
  if (!viz.schema.linkBundle) return;
  const bundled = links.filter(
    l =>
      l.source &&
      l.target &&
      !l.loop &&
      !isSelfLoop(l) &&
      Number.isFinite(l.source.x) &&
      Number.isFinite(l.source.y) &&
      Number.isFinite(l.target.x) &&
      Number.isFinite(l.target.y),
  );
  if (!bundled.length) return;
  const paths = bundleLinkPaths(
    viz,
    bundled.map(l => [
      [l.source!.x!, l.source!.y!],
      [l.target!.x!, l.target!.y!],
    ]),
  );
  bundled.forEach((l, k) => {
    l.points = paths[k];
  });
}

/**
    How far along a bundled path each end's arrow tip sits: where the path
    leaves a circle a pixel wider than the node at that end.
*/
export function bundledTipBack(
  points: Point[],
  rSource = 0,
  rTarget = 0,
): {source: number; target: number} {
  return {
    source: polylineReach(points, rSource + 1),
    target: polylineReach([...points].reverse(), rTarget + 1),
  };
}

/**
    How far along a bundled path each end leaves its node's outline, for a
    stroke `strokeWidth` wide (see `outlineReach`), taken the way the path
    first heads out from the node, and `gap` pixels further out.
*/
export function bundledOutlineBack(
  points: Point[],
  source: NodeOutline | null | undefined,
  target: NodeOutline | null | undefined,
  strokeWidth = 0,
  gap = 0,
): {source: number; target: number} {
  const back = (line: Point[], node: NodeOutline | null | undefined) => {
    if (!node || line.length < 2) return 0;
    const [[x0, y0], [x1, y1]] = line;
    const angle = Math.atan2(y1 - y0, x1 - x0);
    return polylineReach(line, outlineReach(node, angle, strokeWidth) + gap);
  };
  return {
    source: back(points, source),
    target: back([...points].reverse(), target),
  };
}

/** A bundled link's arrowhead ends, size, and stroke trims. */
function bundledTrims(
  viz: VizInstance,
  datum: DataPoint,
  i: number,
  strokeWidth: unknown,
  arrowSize: unknown,
): EdgeArrowTrims {
  return edgeArrowTrims({
    arrows: viz.schema.arrows as ArrowValue,
    arrowSize,
    strokeWidth: typeof strokeWidth === "number" ? strokeWidth : undefined,
    datum,
    i,
  });
}

/**
    A bundled link's visible stroke and arrowheads: the stroke follows the
    path and ends at each head's base, or at the outline of a node with no
    head, and each head's tip sits a pixel off its node, aimed along the
    path (see `polylineArrowEdge`). `arrowSize` defaults to the chart's.
*/
export function bundledLinkEdge(
  viz: VizInstance,
  link: BundledLink & {points: Point[]},
  opts: {
    datum: DataPoint;
    i: number;
    strokeWidth: unknown;
    arrowSize?: unknown;
    keyPrefix: string;
    fill?: string;
  },
): {d: string; arrows: SceneNode[]} {
  const trims = bundledTrims(
    viz,
    opts.datum,
    opts.i,
    opts.strokeWidth,
    "arrowSize" in opts ? opts.arrowSize : viz.schema.arrowSize,
  );
  const tipBack = bundledOutlineBack(
    link.points,
    link.source,
    link.target,
    0,
    1,
  );
  const bare = bundledOutlineBack(
    link.points,
    link.source,
    link.target,
    trims.strokeWidth,
  );
  const {d, source, target} = polylineArrowEdge(
    link.points,
    trims,
    tipBack,
    bare,
  );
  return {
    d,
    arrows: chordArrowNodes({
      ends: {source, target},
      size: trims.size,
      datum: opts.datum,
      keyPrefix: opts.keyPrefix,
      fill: opts.fill,
    }),
  };
}

/** A bundled link's run between the edges of its two nodes. */
export function bundledLinkPath(
  link: BundledLink & {points: Point[]},
): Point[] {
  const {source, target} = bundledTipBack(
    link.points,
    (link.source?.r ?? 0) - 1,
    (link.target?.r ?? 0) - 1,
  );
  return trimPolyline(link.points, source, target);
}

/** The middle of a bundled link's run between the edges of its two nodes. */
export function bundledLinkAnchor(
  link: BundledLink & {points: Point[]},
): LinkAnchor {
  return polylineMidpoint(bundledLinkPath(link));
}
