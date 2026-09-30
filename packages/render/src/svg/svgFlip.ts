import {type BaseType, select, type Selection} from "d3-selection";
import type {Transition} from "d3-transition";

import {collapse, collapseTo, isFlipEligible} from "../animate/interpolate.js";
import type {FlipTransition} from "../animate/diff.js";
import type {SceneNode} from "../scene.js";
import {applyGeometry} from "./svgNodeAttrs.js";

/** The transition `_reconcile` threads through the reconcile recursion. */
type RenderTransition = Transition<BaseType, unknown, null, undefined>;

/**
    The start geometry for an entering node: collapsed to `flip.reunionEnterFrom`
    when it's the drill-up morph's reunion node (`flip.reunionEnterKey` — see
    `DrawOptions.reunionEnterKey`), so it starts at the full size its former
    children currently occupy and animates down to its own target; the
    drill-morph override (collapsed to `flip.enterFrom`) when the node is
    {@link isFlipEligible} and a drill-down morph is active for this draw;
    otherwise the node's own degenerate center — same choices for both
    renderer backends.
    @param node The entering node.
    @param flip The drill-morph override for this draw, if any.
*/
export function enterStart(node: SceneNode, flip: FlipTransition | undefined): SceneNode {
  if (flip?.reunionEnterKey !== undefined && node.key === flip.reunionEnterKey)
    return collapseTo(node, flip.reunionEnterFrom!, undefined, true);
  return flip?.enterFrom && isFlipEligible(node)
    ? collapseTo(node, flip.enterFrom, flip.enterFromBody, true)
    : collapse(node);
}

/**
    Animates the exit selection out: every exiting node collapses toward its
    own degenerate center (a rect shrinks to 0×0, a circle's radius to 0, …
    — see {@link collapse}) while fading, the same self-collapse an entering
    node with no active morph starts from (`enterStart`) — or, when a
    drill-up morph is active for this draw, a flip-eligible exit shrinks into
    `flip.exitTo` instead (see {@link collapseTo}); everything else in that
    same exit selection keeps the plain self-collapse. Matches the Canvas
    backend's identical enter/exit choice in `interpolateChildren`.
    @param exit The exit selection (bound to the outgoing nodes' data).
    @param duration The draw's transition duration; 0 removes immediately.
    @param t The shared transition driving this reconcile pass.
    @param flip The drill-morph override for this draw, if any.
    @param resolveFill Resolves a scene fill token to an SVG paint value.
*/
export function reconcileExit(
  exit: Selection<Element, SceneNode, BaseType, unknown>,
  duration: number,
  t: RenderTransition,
  flip: FlipTransition | undefined,
  resolveFill: (f?: string) => string | null,
): void {
  // The clicked node's own exit is removed immediately regardless of
  // duration — it never gets an animated collapse, since the entering
  // children already fill its exact box. See `DrawOptions.instantExitKey`.
  if (flip?.instantExitKey !== undefined) {
    exit.filter((d: SceneNode) => d.key === flip.instantExitKey).remove();
    exit = exit.filter((d: SceneNode) => d.key !== flip.instantExitKey);
  }
  // The drill-up morph's whole former-child set disappears together, the
  // mirror of instantExitKey for the case where there's no single key to
  // name. See `DrawOptions.instantExitAll`.
  if (flip?.instantExitAll) {
    exit.remove();
    return;
  }
  if (!duration) {
    exit.remove();
    return;
  }
  const exitTo = flip?.exitTo;
  const exitToBody = flip?.exitToBody;
  exit.each(function (this: Element, d: SceneNode) {
    const tsel = select(this).transition(t);
    const end = exitTo && isFlipEligible(d) ? collapseTo(d, exitTo, exitToBody) : collapse(d);
    applyGeometry(tsel, end, true, resolveFill);
    tsel.remove();
  });
}
