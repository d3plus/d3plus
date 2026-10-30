/**
    Where a hovered point mark's tooltip points: the mark's painted box, in
    client coordinates, so the tooltip's arrow meets the middle of its top
    edge (its bottom edge when the tooltip flips below) and holds still
    while the pointer moves within reach of the same point.

    @module
*/

import type {VirtualElement} from "@floating-ui/dom";
import type {Bounds} from "@d3plus/math";
import type {SceneNode} from "@d3plus/render";

import {pointTarget} from "./nearestHover.js";
import type {VizInstance} from "./vizTypes.js";

/** A client-space position. */
export interface ClientOrigin {
  left: number;
  top: number;
}

/**
    The client position of the drawing surface's origin: the scene `<svg>`'s
    user-space origin (read off its screen CTM: a nested svg's bounding rect
    is the box of its painted content), or the `<canvas>`'s corner. Falls
    back to the chart's own element, then to the viewport origin.
*/
export function surfaceOrigin(viz: VizInstance): ClientOrigin {
  const elements: Element[] = viz._sceneRenderer?.elements?.() ?? [];
  const surface =
    elements.find(el => el.localName === "svg" || el.localName === "canvas") ??
    (viz._select?.node?.() as Element | null | undefined);
  if (!surface) return {left: 0, top: 0};
  const ctm =
    surface.localName === "svg" &&
    typeof (surface as SVGGraphicsElement).getScreenCTM === "function"
      ? (surface as SVGGraphicsElement).getScreenCTM()
      : null;
  if (ctm) return {left: ctm.e, top: ctm.f};
  const rect = surface.getBoundingClientRect();
  return {left: rect.left, top: rect.top};
}

/**
    A tooltip anchor (a Floating UI virtual element) for a box in surface
    coordinates, moved to client coordinates by `origin`.
*/
export function clientAnchor(
  box: Bounds,
  origin: ClientOrigin,
): VirtualElement {
  const x = origin.left + box.x,
    y = origin.top + box.y;
  const rect = {
    x,
    y,
    left: x,
    top: y,
    right: x + box.width,
    bottom: y + box.height,
    width: box.width,
    height: box.height,
  };
  return {getBoundingClientRect: () => rect};
}

/**
    The tooltip anchor for a hovered node: its point mark's painted box when
    nearest-point hover applies to it (see `pointTarget`), whether the
    pointer is on the mark or only near it. Undefined otherwise, for the
    tooltip to follow the pointer.
*/
export function pointTooltipAnchor(
  viz: VizInstance,
  node: SceneNode | null | undefined,
): VirtualElement | undefined {
  const target = pointTarget(viz, node);
  return target ? clientAnchor(target.box, surfaceOrigin(viz)) : undefined;
}
