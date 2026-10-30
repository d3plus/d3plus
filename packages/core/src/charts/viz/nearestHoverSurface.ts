/**
    Nearest-point hover over the empty space of an SVG chart. A nested `<svg>`
    only receives pointer events over what it paints, so moves and clicks over
    the space between marks land on the chart's outer `<svg>` (or the zoom
    surface, map tiles, or Network background inside it) and never reach the
    SVG renderer. This routes them to the chart as pointer events over
    nothing, which `routePointerEvent` resolves to the nearest point. The
    Canvas renderer's surface covers the whole chart and needs none of it.

    @module
*/

import {hoverReach, nearestPick, routePointerEvent} from "./nearestHover.js";
import {surfaceOrigin} from "./pointTooltipAnchor.js";
import type {VizInstance} from "./vizTypes.js";

/** Chart DOM that keeps its own pointer handling (the timeline and brushes). */
const OWN_POINTER =
  "g.d3plus-viz-timeline, g.d3plus-viz-brush, g.d3plus-zoom-brush";

/** The SVG renderer's own `<svg>`, if it is mounted. */
function sceneSvg(viz: VizInstance): Element | undefined {
  const elements: Element[] = viz._sceneRenderer?.elements?.() ?? [];
  return elements.find(el => el.localName === "svg");
}

/**
    Routes pointer events from the empty space around an SVG chart's scene
    (see the module comment) while `hoverDistance` applies, binding to the
    chart's outer `<svg>` once and rebinding when it changes. A click there
    that resolves to a point is that point's alone: it stops before reaching
    the chart DOM under the pointer (a Network's background, which clears
    its focus). Removes the listeners on the Canvas renderer.
*/
export function nearestHoverSurface(viz: VizInstance, unbind = false): void {
  const state = (viz._nearestHover ??= {key: null});
  const outer = viz._select?.node?.() as Element | null | undefined;
  const svg = viz._renderer === "canvas" || unbind ? undefined : outer;
  if (state.surface && state.surface.el === svg) return;
  state.surface?.unbind();
  state.surface = undefined;
  if (!svg || typeof svg.addEventListener !== "function") return;

  const aroundScene = (el: EventTarget | null): boolean => {
    const node = el as Element | null;
    const scene = sceneSvg(viz);
    return (
      !!node &&
      typeof node.closest === "function" &&
      svg.contains(node) &&
      !(scene && scene.contains(node)) &&
      !node.closest(OWN_POINTER)
    );
  };
  const local = (e: MouseEvent): [number, number] => {
    const origin = surfaceOrigin(viz);
    return [e.clientX - origin.left, e.clientY - origin.top];
  };
  const applies = (e: Event): boolean =>
    aroundScene(e.target) && hoverReach(viz) > 0;

  const move = (e: Event): void => {
    if (!applies(e)) return;
    const point = local(e as MouseEvent);
    routePointerEvent(viz, {
      type: "mousemove",
      point,
      pick: null,
      nativeEvent: e,
    });
  };
  const click = (e: Event): void => {
    if (!applies(e)) return;
    const point = local(e as MouseEvent);
    if (!nearestPick(viz, null, point)) return;
    e.stopPropagation();
    routePointerEvent(viz, {type: "click", point, pick: null, nativeEvent: e});
  };
  const leave = (e: Event): void => {
    if (state.key === null) return;
    const point = local(e as MouseEvent);
    routePointerEvent(viz, {
      type: "mouseleave",
      point,
      pick: null,
      nativeEvent: e,
    });
  };
  svg.addEventListener("mousemove", move);
  svg.addEventListener("click", click, true);
  svg.addEventListener("mouseleave", leave);
  state.surface = {
    el: svg,
    aroundScene,
    unbind: () => {
      svg.removeEventListener("mousemove", move);
      svg.removeEventListener("click", click, true);
      svg.removeEventListener("mouseleave", leave);
    },
  };
}
