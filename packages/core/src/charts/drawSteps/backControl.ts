/**
    The "← Back" control's contribution to the shared top-left controls
    panel (`topLeftControls.ts`) — visible only when the chart has
    drill-down history to pop. Styled like the zoom/search controls: a real
    `<button>` at the same 20px height, an SVG arrow icon (not a text
    glyph), and no default background/border/color — a plain
    browser-appearance button that lets native/host-page button chrome
    show through, restylable via `.backControlStyle()`/
    `.backControlClassName()` the same way zoom/search are.

    Previously `backFeature` rendered "← Back" as an SVG text scene node in
    its own margin-claiming row, with its click routed through
    `Viz._routeSceneEvent`'s `interactionGroup === "back"` special case —
    the only way to attach a click handler to a plain scene text node. As a
    real button inside the shared `htmlOverlay` panel, its click instead
    rides the same declarative delegated-events map every other top-left/
    zoom control uses, and it claims no margin of its own — like zoom, it
    floats over whatever's there, and content that needs to avoid it insets
    around the whole panel via `topLeftControlsInset`.

    @module
*/
import type Viz from "../viz/Viz.js";
import type {Contribution} from "./topLeftControlsMarkup.js";
import {ICON_ATTRS, kebab} from "./zoomControlsMarkup.js";
import {backControlStyleDefault} from "../viz/vizDefaults.js";

type StyleObject = Record<string, string | number | undefined | null | false>;
type ControlStyleValue = StyleObject | false | null | undefined;

/** Fallbacks for CSS system colors a browser may not support yet (see `zoomControlsMarkup.ts`). */
const SYSTEM_COLOR_FALLBACKS: Record<string, string> = {
  AccentColor: "Highlight",
  AccentColorText: "HighlightText",
};

/** Sets one style property, swapping an unsupported system color for its fallback. */
function setStyle(el: HTMLElement, key: string, value: string): void {
  const prop = kebab(key);
  el.style.setProperty(prop, value);
  const fallback = SYSTEM_COLOR_FALLBACKS[value];
  if (fallback && !el.style.getPropertyValue(prop)) el.style.setProperty(prop, fallback);
}

/**
    Resolves `backControlStyle` for painting. Setting `backControlClassName`
    auto-disables the untouched built-in default (identified by reference),
    the same trick `zoomControlClassName` uses.
*/
function resolveBackControlStyle(viz: Viz, value: ControlStyleValue): StyleObject {
  if (viz.schema.backControlClassName && value === backControlStyleDefault) return {};
  return value || {};
}

/** Paints the back button's inline style. There's no active/hover override — unlike zoom/search it's not a toggle, so it relies on the browser's native `:hover`, like their own hover default (`false`) already does. */
export function paintBackButton(viz: Viz, btn: HTMLElement): void {
  const base = resolveBackControlStyle(viz, viz.schema.backControlStyle);
  for (const key in base) {
    const v = base[key];
    if (v !== undefined && v !== null && v !== false) setStyle(btn, key, String(v));
  }
}

// A left-pointing arrow: a horizontal shaft + an open chevron head.
const BACK_ICON = `<svg ${ICON_ATTRS}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;

/** Pops the drill-down history (or steps up a level, when there's no history entry left) and re-renders. */
function goBack(viz: Viz): void {
  if (viz._history.length) viz.config(viz._history.pop()).render();
  else viz.depth(viz._drawDepth - 1).filter(false).render();
}

/** The back button's markup: a real `<button>` (icon + visible "Back" text), so host-page button styling applies through the cascade once `backControlClassName` auto-disables the inline default. */
export function backControlsHtml(viz: Viz): string {
  const extraClass = viz.schema.backControlClassName ? ` ${viz.schema.backControlClassName}` : "";
  const label = viz.schema.translate("Back");
  return `<button type="button" class="back-control${extraClass}">${BACK_ICON}${label}</button>`;
}

export function backContribution(viz: Viz): Contribution | null {
  if (!viz._history || !viz._history.length) return null;
  return {
    key: "back",
    html: backControlsHtml(viz),
    events: {
      ".back-control": {click: () => goBack(viz)},
    },
    onUpdate: (host: HTMLElement) => {
      const btn = host.querySelector<HTMLElement>(".back-control");
      if (!btn || btn.dataset.backBound) return;
      btn.dataset.backBound = "1";
      paintBackButton(viz, btn);
    },
  };
}
