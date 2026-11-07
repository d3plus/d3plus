/**
    The "← Back" control's contribution to the shared top-left controls
    panel (`topLeftControls.ts`) — visible only when the chart has
    history to pop (drill-downs and legend clicks). Styled like the
    zoom/search controls: a real `<button>` at the same 20px height, an SVG arrow icon (not a text
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
import {isLegendEntry, restoreLegendEntry} from "../viz/history.js";
import {broadcastLegend} from "../viz/linkGroup.js";
import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {Contribution} from "./topLeftControlsMarkup.js";
import {ICON_ATTRS} from "./zoomControlsMarkup.js";
import {paintControlButton, resolveControlStyle} from "./controlButtonStyle.js";
import {backControlStyleDefault} from "../viz/vizDefaults.js";

/** The resolved base button style — also used as the cheap, non-DOM basis for `backContribution`'s `styleSignature` (see `Contribution.styleSignature`). */
function resolvedBackButtonStyle(viz: Viz) {
  const className = Boolean(viz.schema.backControlClassName);
  return resolveControlStyle(
    viz.schema.backControlStyle,
    backControlStyleDefault,
    className,
  );
}

/** Paints the back button's inline style. There's no active/hover override — unlike zoom/search it's not a toggle, so it relies on the browser's native `:hover`, like their own hover default (`false`) already does. */
export function paintBackButton(viz: Viz, btn: HTMLElement): void {
  paintControlButton(btn, {base: resolvedBackButtonStyle(viz)}, false, false);
}

// A left-pointing arrow: a horizontal shaft + an open chevron head.
const BACK_ICON = `<svg ${ICON_ATTRS}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;

/**
    Pops the Back history and re-renders: a legend entry puts back the
    legend's hide/solo state (mirrored to linked charts), a drill-down entry
    the view (and any legend state the drill cleared) before it. With no
    entry left, steps up a level.
*/
export function goBack(viz: Viz): void {
  const entry = viz._history.pop();
  if (entry && isLegendEntry(entry)) {
    restoreLegendEntry(viz as unknown as VizInstance, entry);
    broadcastLegend(viz as unknown as VizInstance);
    viz.render();
  } else if (entry) {
    // Arms the reappearing parent's reunion lookup (resolveDrillMorph), so
    // the vanishing children shrink into its rect instead of just fading —
    // the mirror of clickShape's forward capture. `body` is the CURRENT
    // (about-to-be-OLD) body rect, captured now because the exiting
    // siblings' own geometry is frozen in THIS frame, not the new one
    // .render() is about to produce.
    if (entry.groupId !== undefined && entry.groupDepth !== undefined)
      viz._pendingExitReunion = {
        groupId: entry.groupId,
        groupDepth: entry.groupDepth,
        body: viz._bodyRect,
      };
    if (entry.legend)
      restoreLegendEntry(viz as unknown as VizInstance, entry.legend);
    // Only the entry's view keys are config; groupId/groupDepth are the
    // reunion lookup's.
    viz.config({depth: entry.depth, filter: entry.filter}).render();
  } else {
    viz
      .depth(viz._drawDepth - 1)
      .filter(false)
      .render();
  }
}

/** The back button's markup: a real `<button>` (icon + visible "Back" text), so host-page button styling applies through the cascade once `backControlClassName` auto-disables the inline default. */
export function backControlsHtml(viz: Viz): string {
  const extraClass = viz.schema.backControlClassName
    ? ` ${viz.schema.backControlClassName}`
    : "";
  const label = viz.schema.translate("Back");
  return `<button type="button" class="back-control${extraClass}">${BACK_ICON}${label}</button>`;
}

/** Whether a chart shows the back button — history to pop, and not under SSR (mirrors `showsZoomControls`/`showsSearchControls`: a static export has no interaction to route a click to). */
function showsBackControl(viz: Viz): boolean {
  return Boolean(viz._history && viz._history.length) && !viz._ssr;
}

export function backContribution(viz: Viz): Contribution | null {
  if (!showsBackControl(viz)) return null;
  return {
    key: "back",
    html: backControlsHtml(viz),
    styleSignature: JSON.stringify(resolvedBackButtonStyle(viz)),
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
