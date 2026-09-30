/**
    `resolveDrillMorph(viz)` — resolves the one-shot drill-down morph state
    armed by `clickShape`'s forward capture or a Back click's reunion lookup
    (see `events/click.shape.ts`, `viz/vizDefaults.ts`, `viz/Viz.ts`) into the
    `_resolvedEnterFrom`/`_resolvedExitTo` boxes `_drawSceneToTarget` passes to
    `drawScene`, using the *current* draw's `_bodyRect`/`_chartScene` — the
    ones the layout/paint step just produced.

    Chart-family-agnostic: every emitted rect/circle node already carries
    `.datum`/`.index` (Treemap/Pack hand-built, or Plot's Shape-based), so the
    Back-click reunion lookup needs no per-chart code — beyond unwrapping the
    datum the same way every other interaction handler does (see
    `unwrapDatum` below). Call once per draw, after `_draw()`/post-draw
    features and before `_drawSceneToTarget()` (`runVizPipeline`) — by then
    `_bodyRect`/`_chartScene` reflect the new frame, and both pending fields
    are cleared unconditionally so a later, unrelated repaint (hover, resize,
    legend toggle) never inherits a stale morph.
*/

import {pathBounds} from "@d3plus/math";
import {areaPath, isFlipEligible} from "@d3plus/render";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode, TransitionRect} from "@d3plus/render";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/**
    A flip-eligible node's geometry as a plain bounding box — every type
    `isFlipEligible` (render package) approves: rect, circle, the `AreaNode`
    type, and a `path` node stamped `shapeType: "Area"` (StackedArea/
    AreaPlot's actual band representation). Shared with `click.shape.ts`'s
    forward capture, which needs the identical conversion for the clicked node.
*/
export function nodeRect(node: SceneNode): TransitionRect | null {
  if (!isFlipEligible(node)) return null;
  if (node.type === "rect") return {x: node.x, y: node.y, width: node.width, height: node.height};
  if (node.type === "circle")
    return {x: node.cx - node.r, y: node.cy - node.r, width: node.r * 2, height: node.r * 2};
  if (node.type === "area") return pathBounds(areaPath(node));
  // Only reached for shapeType === "Area" — isFlipEligible excludes every
  // other path (a plain path, or a Sankey Link) above.
  if (node.type === "path") return pathBounds(node.d);
  return null;
}

/**
    Unwraps a node's raw `.datum` to the source row `groupBy` accessors
    expect — mirroring `Viz._interactionDatum`'s exact rule, since that's
    what originally produced `reunion.groupId` (via clickShape's `filterId`).
    Treemap/Pack stamp `.datum` with the plain merged row directly; a Plot
    shape's `.datum` is the wrapped record `{data, i, …internal fields}` —
    unwrapping only on a truthy `.data` avoids misreading a plain row that
    happens to have its own unrelated `data` field.
*/
function unwrapDatum(datum: unknown): DataPoint | undefined {
  const raw = datum as {data?: DataPoint} | undefined;
  return raw && raw.data ? raw.data : (raw as DataPoint | undefined);
}

/** The index paired with an unwrapped datum — `_interactionDatum`'s same precedence: the wrapper's own `.i` first, else the node's `.index`. */
function unwrappedIndex(datum: unknown, nodeIndex: number | undefined): number {
  const raw = datum as {i?: number} | undefined;
  return raw && typeof raw.i === "number" ? raw.i : (nodeIndex ?? 0);
}

/**
    Finds the first rect/circle node satisfying `matches`, searching group
    children recursively — needed because `_chartScene` isn't always a flat
    list: Treemap/Pack emit cells directly at the top level, but the
    paint-driven Plot family nests its bars/points inside a `plot-zoom-content`
    group alongside sibling axis groups.
*/
function findReunionNode(nodes: SceneNode[], matches: (n: SceneNode) => boolean): SceneNode | undefined {
  for (const n of nodes) {
    if (isFlipEligible(n) && matches(n)) return n;
    if (n.type === "group" && n.children.length) {
      const found = findReunionNode(n.children, matches);
      if (found) return found;
    }
  }
  return undefined;
}

export function resolveDrillMorph(viz: Viz): void {
  const origin = viz._pendingEnterOrigin;
  viz._pendingEnterOrigin = undefined;
  if (origin && viz._bodyRect) {
    const b = viz._bodyRect;
    viz._resolvedEnterFrom = {
      x: b.x + origin.fx * b.width,
      y: b.y + origin.fy * b.height,
      width: origin.fw * b.width,
      height: origin.fh * b.height,
    };
    // The entering nodes' own (fresh, just-laid-out) geometry is already
    // expressed within this SAME frame — collapseTo's proportional remap
    // (Treemap cells, Pack circles, Pie wedges) reads each one's position
    // within it, not just the target box itself.
    viz._resolvedEnterFromBody = b;
    // The clicked node itself is now excluded by the new filter, so it's in
    // this draw's exit set — remove it instantly rather than letting it
    // animate its own collapse on top of the children replacing it.
    viz._resolvedInstantExitKey = origin.key;
  } else {
    viz._resolvedEnterFrom = undefined;
    viz._resolvedEnterFromBody = undefined;
    viz._resolvedInstantExitKey = undefined;
  }

  const reunion = viz._pendingExitReunion;
  viz._pendingExitReunion = undefined;
  if (reunion && viz._chartScene) {
    const accessor = viz.schema.groupBy?.[reunion.groupDepth];
    const match = accessor
      ? findReunionNode(viz._chartScene, n => {
          const d = unwrapDatum(n.datum);
          return d !== undefined && accessor(d, unwrappedIndex(n.datum, n.index)) === reunion.groupId;
        })
      : undefined;
    // Not found (thresholded away, filtered out, etc.) degrades to a plain
    // fade — never throws.
    viz._resolvedExitTo = match ? (nodeRect(match) ?? undefined) : undefined;
    // The exiting nodes' own geometry is frozen from the OLD (pre-click)
    // draw, captured at the moment Back was clicked — passed through as-is,
    // no cross-frame math needed (unlike _resolvedEnterFrom's fractions,
    // this was never normalized against a different frame to begin with).
    viz._resolvedExitToBody = reunion.body;
    // A match means the reappearing parent stands in for its whole former
    // child set: it starts at the FULL size those children currently occupy
    // (reunion.body — the old, pre-Back body rect) and animates down to its
    // own real target (reunionEnterKey/reunionEnterFrom), while the vanishing
    // children drop immediately (instantExitAll) instead of a cross-fade —
    // the mirror of the forward click's entering children starting confined
    // within the clicked parent's box (instantExitKey handles that
    // direction's parent). No match (degraded fade above) keeps the plain
    // animated exit too — there's no specific node to swap in for.
    viz._resolvedReunionEnterKey = match?.key;
    viz._resolvedReunionEnterFrom = match ? reunion.body : undefined;
    viz._resolvedInstantExitAll = Boolean(match);
  } else {
    viz._resolvedExitTo = undefined;
    viz._resolvedExitToBody = undefined;
    viz._resolvedReunionEnterKey = undefined;
    viz._resolvedReunionEnterFrom = undefined;
    viz._resolvedInstantExitAll = undefined;
  }
}
