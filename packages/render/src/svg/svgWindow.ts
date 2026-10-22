/**
    The SVG side of `NodeBase.enterWindow`: an entering element whose tweens
    run over one share of the draw's eased progress instead of the whole. It
    keeps the draw's own transition (and so its duration, easing, and
    stale-clock correction) and remaps the progress each tween sees, the same
    remapping the Canvas backend applies in `interpolateScene`.
*/

import {interpolate} from "d3-interpolate";

import {enterWindowProgress} from "../animate/interpolate.js";
import type {EnterWindow, SceneNode} from "../scene.js";
import type {SvgTransition} from "./svgNodeAttrs.js";

type Tween = (t: number) => void;
type AttrTween = (t: number) => string;

/**
    A stand-in for `tsel` that runs every attribute and tween it is given over
    `window` of the transition's eased progress: before the window starts each
    holds its start value, after it ends each holds its target. Supports the
    calls the node writers make (`attr`, `attrTween`, `tween`, `each`, `node`).
    @param tsel The element's transition.
    @param window The share of eased progress to animate over.
*/
export function windowTransition(
  tsel: SvgTransition,
  window: EnterWindow,
): SvgTransition {
  const progress = (t: number) => enterWindowProgress(t, window);
  const proxy = {
    attr(name: string, value: null | string | number | boolean) {
      if (value === null) tsel.attr(name, null);
      else
        tsel.attrTween(name, function (this: Element) {
          const end = String(value);
          const start = this.getAttribute(name);
          if (start === null || start === end) return () => end;
          const i = interpolate(start, end);
          return (t: number) => {
            const k = progress(t);
            return k >= 1 ? end : String(i(k));
          };
        });
      return proxy;
    },
    attrTween(name: string, factory: (this: Element) => AttrTween | null) {
      tsel.attrTween(name, function (this: Element) {
        const tween = factory.call(this);
        return tween ? (t: number) => tween(progress(t)) : (null as never);
      });
      return proxy;
    },
    tween(name: string, factory: (this: Element) => Tween) {
      tsel.tween(name, function (this: Element) {
        const tween = factory.call(this);
        return (t: number) => tween(progress(t));
      });
      return proxy;
    },
    each(callback: (this: Element) => void) {
      tsel.each(callback);
      return proxy;
    },
    node: () => tsel.node(),
  };
  return proxy as unknown as SvgTransition;
}

/** An element the reconcile pass appended this draw, still to animate in. */
type Entering = Element & {__d3plusEntering__?: boolean};

/** Marks a freshly appended element as entering, when its node has an `enterWindow`. */
export function markEntering(el: Element, node: SceneNode): void {
  if (node.enterWindow) (el as Entering).__d3plusEntering__ = true;
}

/**
    What the reconcile pass wraps an element's transition in: the node's
    `enterWindow` (see {@link windowTransition}) when the element entered this
    draw, else the transition unchanged. Clears the element's entering mark,
    so a later draw that updates it animates over the whole transition.
    @param el The element.
    @param node The node it draws.
*/
export function enterWindowed(el: Element, node: SceneNode): <T>(tsel: T) => T {
  const entering = (el as Entering).__d3plusEntering__;
  (el as Entering).__d3plusEntering__ = undefined;
  const window = entering ? node.enterWindow : undefined;
  return <T>(tsel: T): T =>
    window
      ? (windowTransition(tsel as unknown as SvgTransition, window) as T)
      : tsel;
}
