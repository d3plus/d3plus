/**
    Where a chart's `className` goes: the element its pixels are drawn on, the
    root `<svg class="d3plus-viz">` or, with the Canvas renderer, its
    `<canvas>`. (With Canvas the root svg stays in place above the canvas for
    the zoom brush, so it takes no classes: a background on it would hide the
    chart.)
*/

import {
  RENDERER_CLASSES,
  rendererSurfaces,
  type ElementsSource,
} from "../../utils/className.js";

/** A chart's fixed root class. */
export const ROOT_CLASS = "d3plus-viz";

/**
    The elements a chart's `className` applies to, each with the fixed
    classes it keeps. Before the first render the chart's `select` is still the
    page's own container, which never takes the classes.
    @param root The chart's `select` node.
    @param renderer The chart's scene renderer, once it has rendered.
    @param kind The chart's renderer setting.
    @private
*/
export function vizClassNameTargets(
  root: unknown,
  renderer: ElementsSource | undefined,
  kind: "svg" | "canvas",
): {el: Element; keep?: string[]}[] {
  if (kind === "canvas")
    return rendererSurfaces(renderer)
      .filter(el => el.localName === "canvas")
      .map(el => ({el, keep: RENDERER_CLASSES}));
  const svg =
    typeof Element !== "undefined" &&
    root instanceof Element &&
    root.classList.contains(ROOT_CLASS)
      ? root
      : undefined;
  return svg ? [{el: svg, keep: [ROOT_CLASS]}] : [];
}
