import {select} from "d3-selection";

import {trailPartsFromNode} from "../animate/trail.js";
import type {TrailParts} from "../animate/trail.js";
import {isPersistTrail} from "../animate/trailLog.js";
import type {TrailLog} from "../animate/trailLog.js";
import type {SceneNode, TextNode} from "../scene.js";
import {trackTransition} from "./svgClock.js";
import type {RenderTransition} from "./svgClock.js";
import {fadeSwapText} from "./svgFade.js";
import {
  type SvgSelection,
  applyGeometry,
  applyStatic,
  textFontTween,
} from "./svgNodeAttrs.js";
import {attachPersistTrail, attachSvgTrail} from "./svgTrail.js";
import type {TrailGradients} from "./svgTrail.js";
import {enterWindowed} from "./svgWindow.js";

/** The per-draw state {@link updateNode} reads from the renderer. */
export interface UpdateContext {
  duration: number;
  t: RenderTransition;
  resolveFill: (f?: string) => string | null;
  trailLog: TrailLog;
  trailActive: boolean;
  trailGrads: TrailGradients;
}

/**
    The SVG-drawn children of a group, in paint order: HtmlOverlay nodes
    removed, then sorted by `z` when any node sets one.
*/
export function svgChildOrder(children: SceneNode[]): SceneNode[] {
  // HtmlOverlay nodes live outside the SVG; they're reconciled separately
  // by `_reconcileOverlays` against the sibling overlay host. Skip the
  // filter+slice allocations when no overlays are present (the common
  // case for deeply-nested chart groups). Skip the sort when no node
  // has `z` set — matches the CanvasRenderer fast path.
  let svgChildren: SceneNode[] = children;
  let hasOverlay = false;
  for (let i = 0; i < children.length; i++) {
    if (children[i].type === "htmlOverlay") {
      hasOverlay = true;
      break;
    }
  }
  if (hasOverlay) svgChildren = children.filter(c => c.type !== "htmlOverlay");
  let needsSort = false;
  for (let i = 0; i < svgChildren.length; i++) {
    if (svgChildren[i].z !== undefined) {
      needsSort = true;
      break;
    }
  }
  return needsSort
    ? [...svgChildren].sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
    : svgChildren;
}

/**
    Draws one joined node onto its element: its attributes and geometry
    (animated when the draw has a duration), a font-size or fade-swap label
    tween, and its motion trail. Group children are left to the caller.
    @param el The node's element.
    @param d The node it draws.
    @param ctx The draw's transition, fill resolver, and trail state.
*/
export function updateNode(
  el: Element,
  d: SceneNode,
  ctx: UpdateContext,
): void {
  const s = select(el);
  // A text label whose font-size changed eases into its new size/place
  // instead of snapping. `__d3plusTextPrev__` is the node this element drew
  // last time; comparing font sizes detects a resize. (The layout/tspans
  // are already at the new size — the tween scales the painted glyphs.)
  // `__d3plusTrailPrev__` similarly remembers a trailed point's last
  // position so its motion trail can sweep from there on the next move.
  const stash = el as Element & {
    __d3plusTextPrev__?: TextNode;
    __d3plusTrailPrev__?: TrailParts;
  };
  const windowed = enterWindowed(el, d);
  const canTrail = d.trail && (d.type === "circle" || d.type === "rect");
  const persistTrail = canTrail && isPersistTrail(d) && ctx.trailActive;
  const prevText =
    ctx.duration && d.type === "text" ? stash.__d3plusTextPrev__ : undefined;
  const trailPrev =
    ctx.duration && canTrail && !persistTrail
      ? stash.__d3plusTrailPrev__
      : undefined;
  const draw = (sel: SvgSelection) => {
    applyStatic(sel, d);
    applyGeometry(sel, d, false, ctx.resolveFill);
  };
  // A fade-swap label (TextNode.fadeSwap) fades instead of gliding.
  if (
    ctx.duration &&
    fadeSwapText(
      s,
      d,
      prevText,
      () => windowed(trackTransition(s.transition(ctx.t), ctx.t)),
      draw,
    )
  ) {
    // Its tween does the rest.
  } else if (ctx.duration) {
    applyStatic(s, d);
    const tsel = trackTransition(s.transition(ctx.t), ctx.t);
    applyGeometry(windowed(tsel), d, true, ctx.resolveFill);
    const font = d.type === "text" ? (d as TextNode).font : undefined;
    if (prevText?.font && font && prevText.font.size !== font.size) {
      // Override the transform tween: glide position/rotation and ease the
      // scale (old/new → 1) about the box center.
      tsel.attrTween("transform", textFontTween(prevText, d as TextNode));
    }
    // Sweep a motion-trail cone from the mark's previous position to its
    // current one, beneath the mark (parity with the Canvas backend). A
    // persistent trail draws its whole history from the log instead.
    if (persistTrail)
      attachPersistTrail(el, tsel, ctx.trailLog, d, f =>
        ctx.trailGrads.apply(d.key, f),
      );
    else if (trailPrev) attachSvgTrail(el, tsel, trailPrev, d, ctx.resolveFill);
  } else {
    draw(s);
    // Redraw the persistent trail on non-animated repaints (e.g. hover) so
    // it doesn't vanish; static geometry, no tween.
    if (persistTrail)
      attachPersistTrail(el, null, ctx.trailLog, d, f =>
        ctx.trailGrads.apply(d.key, f),
      );
  }
  if (d.type === "text") stash.__d3plusTextPrev__ = d;
  if (canTrail && !persistTrail) {
    const parts = trailPartsFromNode(d);
    if (parts) stash.__d3plusTrailPrev__ = parts;
  }
}
