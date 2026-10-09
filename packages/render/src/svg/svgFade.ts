/**
    The SVG side of `TextNode.fadeSwap`: a label that fades out in place,
    takes its new layout while hidden, and fades back in, instead of gliding
    to its new place. Driven by one tween on the draw's own transition, so it
    shares its timing (and its stale-clock correction) with every other node.
*/

import {select} from "d3-selection";
import type {SvgSelection} from "./svgNodeAttrs.js";

import {fadeSwapOpacity, sameTextLayout} from "../animate/interpolate.js";
import type {FadeSwap, SceneNode, TextNode} from "../scene.js";

/** The part of a d3 transition a fade-swap drives. */
interface Tweenable {
  tween(name: string, factory: (this: Element) => (t: number) => void): unknown;
  each(callback: (this: Element) => void): unknown;
}

/** A node's painted opacity, or undefined when it paints none of its own. */
const paintOpacity = (n: SceneNode): number | undefined => n.paint?.opacity;

/** Sets (or, at full opacity with none of its own, clears) an element's opacity. */
function setOpacity(
  el: Element,
  opacity: number,
  own: number | undefined,
  end: boolean,
): void {
  if (end && own === undefined) el.removeAttribute("opacity");
  else el.setAttribute("opacity", String(opacity));
}

/**
    Whether an updating text element should swap instead of glide: the new
    node asks for it and its layout changed since the element's last draw.
*/
export function swapsText(
  prev: SceneNode | undefined,
  next: SceneNode,
): next is TextNode {
  return (
    next.type === "text" &&
    Boolean((next as TextNode).fadeSwap) &&
    prev?.type === "text" &&
    !sameTextLayout(prev as TextNode, next as TextNode)
  );
}

/**
    Drives a fade-swap on `tsel`. Updating, the element keeps its old layout
    until it is hidden, then `apply` draws the new one; entering or exiting, it
    only fades.
    @param tsel The element's transition.
    @param swap The fade-out and fade-in windows.
    @param phase Whether the element is updating, entering, or exiting.
    @param from The node it was drawn as (its opacity fades out from here).
    @param to The node it ends as.
    @param apply Draws `to`'s layout onto the element (updates only).
*/
export function fadeSwapTween(
  tsel: Tweenable,
  swap: FadeSwap,
  phase: "update" | "enter" | "exit",
  from: SceneNode,
  to: SceneNode,
  apply?: (el: SvgSelection) => void,
): void {
  const start = paintOpacity(from) ?? 1;
  const own = paintOpacity(to);
  // An entering label stays hidden until its fade-in, from this frame on.
  if (phase === "enter")
    tsel.each(function (this: Element) {
      this.setAttribute("opacity", "0");
    });
  tsel.tween("d3plus-fade-swap", function (this: Element) {
    const el = this;
    let applied = phase !== "update";
    return (t: number) => {
      const {opacity, swapped} = fadeSwapOpacity(
        t,
        swap,
        start,
        own ?? 1,
        phase,
      );
      if (swapped && !applied) {
        applied = true;
        if (apply) apply(select(el) as SvgSelection);
      }
      setOpacity(
        el,
        opacity,
        phase === "exit" ? 0 : own,
        t >= 1 && phase !== "exit",
      );
    };
  });
}

/**
    Starts a text node's fade-swap on its element, when it has one this draw:
    an update whose layout changed keeps the old layout until hidden, and an
    entering label waits, hidden, for its fade-in. Returns false (doing
    nothing) for any other node.
    @param s The element.
    @param d The node it draws.
    @param prev The node it drew last time, when it is updating.
    @param transition Creates the element's transition.
    @param draw Draws a node's layout onto the element without animating.
*/
export function fadeSwapText(
  s: SvgSelection,
  d: SceneNode,
  prev: TextNode | undefined,
  transition: () => Tweenable,
  draw: (el: SvgSelection) => void,
): boolean {
  const swap = d.type === "text" ? (d as TextNode).fadeSwap : undefined;
  if (!swap || (prev && !swapsText(prev, d))) return false;
  const tsel = transition();
  if (prev) fadeSwapTween(tsel, swap, "update", prev, d, draw);
  else {
    draw(s);
    fadeSwapTween(tsel, swap, "enter", d, d);
  }
  return true;
}
