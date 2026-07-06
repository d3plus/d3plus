import type {Transition} from "d3-transition";

import {coneAt, trailGradient, trailOpacity, trailPartsFromNode, TRAIL_MIN_DISTANCE} from "../animate/trail.js";
import type {TrailParts} from "../animate/trail.js";
import {persistTrailFill, persistTrailPath} from "../animate/trailLog.js";
import type {TrailLog} from "../animate/trailLog.js";
import type {SceneNode} from "../scene.js";
import {SVG_NS} from "./svgNodeAttrs.js";

/**
    Motion-trail rendering for the SVG backend, kept out of SvgRenderer so the
    reconcile method stays under the line limit. Trails are sibling `<path>`s
    inserted just before their mark (so they paint beneath it) and tagged
    `d3plus-trail` — the reconcile join excludes that class, so a stray trail
    can never break the keyed diff.
*/

/**
    Attaches an ephemeral motion-trail cone to a moving trailed mark for the life
    of its transition (parity with the Canvas `interpolateScene` trail). The cone
    `d` and opacity tween from the previous position/size to the current one, and
    it's removed when the transition ends or is interrupted.
*/
export function attachSvgTrail(
  el: Element,
  tsel: Transition<Element, unknown, null, undefined>,
  prev: TrailParts,
  node: SceneNode,
  resolveFill: (f?: string) => string | null,
): void {
  const curr = trailPartsFromNode(node), parent = el.parentNode;
  if (!curr || prev.shape !== curr.shape || !parent) return;
  const color = curr.color ?? prev.color;
  if (
    typeof color !== "string" ||
    Math.hypot(curr.x - prev.x, curr.y - prev.y) < TRAIL_MIN_DISTANCE
  ) return;
  const stale = el.previousElementSibling;
  if (stale && stale.classList.contains("d3plus-trail")) stale.remove();
  const tp = document.createElementNS(SVG_NS, "path");
  tp.setAttribute("class", "d3plus-trail");
  tp.setAttribute("pointer-events", "none");
  tp.setAttribute("fill", resolveFill(trailGradient(curr.x - prev.x, curr.y - prev.y, color)) ?? "none");
  parent.insertBefore(tp, el);
  const A: [number, number] = [prev.x, prev.y], B: [number, number] = [curr.x, curr.y];
  tsel.tween("d3plus-trail", () => (tt: number) => {
    tp.setAttribute("d", coneAt(curr.shape, A, prev.dims, B, curr.dims, curr.rotate, tt).d);
    tp.setAttribute("opacity", String(trailOpacity(tt)));
  });
  tsel.on("end.d3plus-trail interrupt.d3plus-trail", () => tp.remove());
}

/** Removes a mark's persistent-trail paths from a parent (by its data-tkey). */
export function removePersistTrail(parent: Element, key: string | number): void {
  const k = String(key);
  for (const c of Array.from(parent.children)) {
    if (c.classList.contains("d3plus-trail-persist") && c.getAttribute("data-tkey") === k) c.remove();
  }
}

/**
    Renders a mark's persistent motion trail beneath it (SVG parity with Canvas)
    as a SINGLE path — every segment's cone concatenated into one `d`, filled with
    one tail→head gradient — so overlapping segments don't composite twice at
    turns. Each draw clears this mark's prior trail path and rebuilds from the log
    (aged segments drop); the current move tweens the combined `d`. The path
    carries `d3plus-trail` (kept out of the keyed join) plus `d3plus-trail-persist`
    + `data-tkey`.
*/
export function attachPersistTrail(
  el: Element,
  tsel: Transition<Element, unknown, null, undefined> | null,
  log: TrailLog,
  node: SceneNode,
  persist: number | boolean,
  resolveFill: (f?: string) => string | null,
): void {
  const parent = el.parentNode as Element | null;
  if (!parent) return;
  removePersistTrail(parent, node.key);
  const target = persistTrailPath(log, node.key, 1);
  if (!target) return;
  const tp = document.createElementNS(SVG_NS, "path");
  tp.setAttribute("class", "d3plus-trail d3plus-trail-persist");
  tp.setAttribute("data-tkey", String(node.key));
  tp.setAttribute("pointer-events", "none");
  tp.setAttribute("fill", resolveFill(persistTrailFill(target.dx, target.dy, target.color, persist)) ?? "none");
  parent.insertBefore(tp, el);
  if (tsel) {
    const at = (u: number): string => persistTrailPath(log, node.key, u)?.d ?? "";
    tp.setAttribute("d", at(0));
    tsel.tween("d3plus-trail-persist", () => (tt: number) => tp.setAttribute("d", at(tt)));
  } else tp.setAttribute("d", target.d);
}
