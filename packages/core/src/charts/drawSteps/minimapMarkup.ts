/**
    Markup, styling, and formatting for the minimap panel — mirrors
    `zoomControlsMarkup.ts`'s shape for the zoom-control buttons.

    @module
*/

import type Viz from "../viz/Viz.js";
import {
  minimapLabelStyleDefault,
  minimapStyleDefault,
  minimapViewportStyleActiveDefault,
  minimapViewportStyleDefault,
} from "../viz/vizDefaults.js";
import {kebab} from "./zoomControlsMarkup.js";

export type StyleObject = Record<string, string | number | undefined | null | false>;
type MinimapStyleValue = StyleObject | false | null | undefined;

/**
    Resolves a `minimapStyle`/`minimapViewportStyle`/`minimapViewportStyleActive`/
    `minimapLabelStyle` value for painting. Setting `minimapClassName`
    auto-disables whichever of the four is still the untouched built-in
    default (identified by reference — see `minimapStyleDefault` et al. in
    `vizDefaults.ts`) so a host page's own styling can apply through the
    cascade without also requiring `.minimapStyle(false)` etc. An explicit
    custom style object (a different reference) always wins, className or not.
    Mirrors `resolveZoomControlStyle` in `zoomControlsMarkup.ts`.
*/
function resolveMinimapStyle(
  viz: Viz,
  value: MinimapStyleValue,
  defaultValue: MinimapStyleValue,
): StyleObject {
  if (viz.schema.minimapClassName && value === defaultValue) return {};
  return value || {};
}

/** The resolved outer / viewport / viewport-active / label styles for a chart. */
export function minimapStyles(viz: Viz): {
  outer: StyleObject;
  viewport: StyleObject;
  viewportActive: StyleObject;
  label: StyleObject;
} {
  return {
    outer: resolveMinimapStyle(viz, viz.schema.minimapStyle, minimapStyleDefault),
    viewport: resolveMinimapStyle(viz, viz.schema.minimapViewportStyle, minimapViewportStyleDefault),
    viewportActive: resolveMinimapStyle(
      viz,
      viz.schema.minimapViewportStyleActive,
      minimapViewportStyleActiveDefault,
    ),
    label: resolveMinimapStyle(viz, viz.schema.minimapLabelStyle, minimapLabelStyleDefault),
  };
}

/**
    Paints one or more style layers onto an element, clearing the union of
    their keys first so leaving a state (e.g. no longer dragging) fully
    undoes it. Mirrors `paintZoomButton`'s clear-then-apply pattern in
    `zoomControlsMarkup.ts`.
*/
export function paintMinimapStyle(el: HTMLElement, ...layers: StyleObject[]): void {
  const keys = new Set<string>();
  for (const style of layers) for (const key of Object.keys(style)) keys.add(key);
  for (const key of keys) el.style.removeProperty(kebab(key));
  for (const style of layers)
    for (const key in style) {
      const v = style[key];
      if (v !== undefined && v !== null && v !== false) el.style.setProperty(kebab(key), String(v));
    }
}

/** Formats a zoom scale as a short label: `"2x"`, `"4.4x"`. */
export function formatZoomLabel(k: number): string {
  const rounded = Math.round(k * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}x`;
}

/**
    The minimap's static HTML skeleton — no baked-in geometry; `onUpdate`
    positions the viewport box and label live on every repaint (see
    `minimap.ts`), the same reason `zoomControlsHtml` bakes in everything
    that CAN change (locale, className) but nothing here changes per-tick.
    The viewport box is `tabindex="0"` so it's keyboard-focusable — arrow
    keys nudge the pan, matching what the `aria-label` describes. No ARIA
    `role`: a 2D pan target doesn't map onto any single widget role (a
    `slider` is one-dimensional), so a plain focusable, labeled element is
    the more honest choice over one implying unmet role semantics.

    `minimapClassName` (documented as applying to all three elements — the
    outer box, viewport box, and label) is appended to the viewport/label
    classes here; the outer box gets it separately, in `minimap.ts`'s panel
    `className`, since that one isn't part of this inner HTML string.
*/
export function minimapHtml(viz: Viz): string {
  const extraClass = viz.schema.minimapClassName ? ` ${viz.schema.minimapClassName}` : "";
  return (
    `<div class="d3plus-minimap-viewport${extraClass}" tabindex="0" aria-label="${viz.schema.translate("Pan viewport — drag or use arrow keys")}"></div>` +
    `<div class="d3plus-minimap-label${extraClass}"></div>`
  );
}

/** Right inset shared with the zoom-control panel, so the two clusters' right edges line up. */
export const MINIMAP_RIGHT_INSET = 4;
/** Vertical gap between the zoom-control panel and the minimap beneath it. */
export const MINIMAP_GAP = 4;
