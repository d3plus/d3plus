/**
    The "← Back" control's contribution to the shared top-left controls
    panel (`topLeftControls.ts`) — visible only when the chart has
    drill-down history to pop.

    Previously `backFeature` (removed from `features.ts`) rendered "← Back"
    as an SVG text scene node in its own margin-claiming row, with its click
    routed through `Viz._routeSceneEvent`'s `interactionGroup === "back"`
    special case — the only way to attach a click handler to a plain scene
    text node. As a real `<button>` inside the shared `htmlOverlay` panel,
    its click instead rides the same declarative delegated-events map every
    other top-left/zoom control uses (see `topLeftControlsMarkup.ts`), and
    it claims no margin of its own — like zoom, it floats over whatever's
    there, and content that needs to avoid it insets around the whole panel
    via `topLeftControlsInset`.

    @module
*/
import type Viz from "../viz/Viz.js";
import type {Contribution} from "./topLeftControlsMarkup.js";
import {kebab} from "./zoomControlsMarkup.js";

type StyleObject = Record<string, string | number | undefined | null | false>;

/**
    `backConfig`'s font/padding/color keys, mapped onto the button's inline
    style — so a chart author's existing `.backConfig({...})` keeps doing
    something sensible now that "← Back" is a real button rather than a
    TextBox-configured scene node. Keys with no button-style equivalent
    (e.g. `resize`, `textAnchor`) are simply ignored.
*/
function backButtonStyle(viz: Viz): StyleObject {
  const cfg = (viz.schema.backConfig || {}) as Record<string, unknown>;
  const style: StyleObject = {
    background: "none",
    border: "none",
    cursor: "pointer",
    font: "inherit",
    padding: 0,
  };
  if (typeof cfg.fontSize === "number") style["font-size"] = `${cfg.fontSize}px`;
  if (typeof cfg.fontFamily === "string") style["font-family"] = cfg.fontFamily;
  else if (Array.isArray(cfg.fontFamily)) style["font-family"] = cfg.fontFamily.join(", ");
  if (typeof cfg.fontColor === "string") style.color = cfg.fontColor;
  if (typeof cfg.padding === "number") style.padding = `${cfg.padding}px`;
  return style;
}

function styleAttr(style: StyleObject): string {
  return Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${kebab(k)}:${v}`)
    .join(";");
}

/** Pops the drill-down history (or steps up a level, when there's no history entry left) and re-renders. */
function goBack(viz: Viz): void {
  if (viz._history.length) viz.config(viz._history.pop()).render();
  else viz.depth(viz._drawDepth - 1).filter(false).render();
}

export function backContribution(viz: Viz): Contribution | null {
  if (!viz._history || !viz._history.length) return null;
  const label = `← ${viz.schema.translate("Back")}`;
  const style = styleAttr(backButtonStyle(viz));
  return {
    key: "back",
    html: `<button type="button" class="back-control" style="${style}">${label}</button>`,
    events: {
      ".back-control": {click: () => goBack(viz)},
    },
  };
}
