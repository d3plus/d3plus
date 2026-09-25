/**
    Markup, styling, and measurement for the shared top-left controls panel —
    the top-left mirror of `zoomControlsMarkup.ts`'s top-right zoom-control
    panel. Kept separate from `topLeftControls.ts` (which owns the
    `FeatureModule` + the contributor list) so this module has no dependency
    on `../features/features.js` — `textBlockLayout`/`featuresLegend.ts`
    import only from here, the same way they already import
    `zoomControlsBox`/`zoomControlsInset` from `zoomControlsMarkup.ts` rather
    than from `zoomControls.ts`.

    @module
*/

import type Viz from "../viz/Viz.js";
import {kebab, overlayHost} from "./zoomControlsMarkup.js";

/**
    One control's contribution to the shared panel: its markup, its
    delegated event handlers (keyed by its own CSS selector, so independent
    contributors never collide), and an optional `onUpdate` for listeners
    that can't be delegated (mirrors `HtmlOverlayNode`'s own shape — see
    `zoomControls.ts`'s `buildZoomControlPanel` for the pattern this panel
    generalizes from one feature's four buttons to N independent features).
*/
export interface Contribution {
  key: string;
  html: string;
  events?: Record<string, Partial<Record<string, (e: Event) => void>>>;
  onUpdate?: (host: HTMLElement) => void;
}

/**
    The panel's own layout: a left-aligned flex row, the top-left mirror of
    `ZOOM_PANEL_STYLE`.
*/
export const TOP_LEFT_PANEL_STYLE: Record<string, string> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "4px",
  boxSizing: "border-box",
  paddingTop: "4px",
  paddingLeft: "4px",
};

/** Merges N contributions' markup + delegated events into one `htmlOverlay` panel. */
export function buildTopLeftPanel(
  viz: Viz,
  contributions: Contribution[],
): {
  type: "htmlOverlay";
  key: string;
  x: number;
  y: number;
  width: number;
  style: Record<string, string>;
  className: string;
  html: string;
  events: Record<string, Partial<Record<string, (e: Event) => void>>>;
  onUpdate: (host: HTMLElement) => void;
} {
  const html = contributions.map(c => c.html).join("");
  const events: Record<string, Partial<Record<string, (e: Event) => void>>> = {};
  for (const c of contributions) Object.assign(events, c.events || {});
  return {
    type: "htmlOverlay" as const,
    key: "viz-top-left-controls",
    x: 0,
    y: 0,
    width: viz.schema.width,
    style: TOP_LEFT_PANEL_STYLE,
    className: "d3plus-top-left-controls",
    html,
    events,
    onUpdate: (host: HTMLElement) => {
      for (const c of contributions) c.onUpdate?.(host);
    },
  };
}

/** Panel size before it has been measured. */
const ESTIMATED_BOX = {width: 0, height: 24};

/**
    The shared top-left panel's rendered size (padding included) as it will
    render in the chart's page, so top-positioned content can leave room for
    it — the same measure-a-hidden-probe technique `zoomControlsBox` uses,
    generalized to whichever mix of controls (back / table-view / search)
    is currently contributing. Returns null when nothing is contributing.
*/
export function topLeftControlsBox(
  viz: Viz,
  contributions: Contribution[],
): {width: number; height: number} | null {
  if (!contributions.length) return null;
  const html = contributions.map(c => c.html).join("");
  const cached = viz._topLeftControlsBox;
  if (cached && cached.signature === html) return cached;

  let box = ESTIMATED_BOX;
  const host = overlayHost(viz);
  if (host) {
    const probe = document.createElement("div");
    probe.className = "d3plus-top-left-controls";
    for (const key in TOP_LEFT_PANEL_STYLE) probe.style.setProperty(kebab(key), TOP_LEFT_PANEL_STYLE[key]);
    // Shrink-wrapped and invisible, so it measures without affecting layout.
    probe.style.setProperty("display", "inline-flex");
    probe.style.setProperty("position", "absolute");
    probe.style.setProperty("visibility", "hidden");
    probe.style.setProperty("pointer-events", "none");
    probe.innerHTML = html;
    host.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    host.removeChild(probe);
    if (rect.width && rect.height) box = {width: Math.ceil(rect.width), height: Math.ceil(rect.height)};
  }
  viz._topLeftControlsBox = {...box, signature: html};
  return viz._topLeftControlsBox;
}

/**
    How far content starting `top` px down the chart, whose left edge sits
    `left` px in from the chart's left edge, must pull in its left edge to
    clear the top-left controls panel. Zero when nothing is showing there or
    content starts below the panel's height. Mirrors `zoomControlsInset`,
    measuring/insetting from the left instead of the right.
*/
export function topLeftControlsInset(
  viz: Viz,
  top: number,
  left: number,
  contributions: Contribution[],
): number {
  const box = topLeftControlsBox(viz, contributions);
  if (!box || top >= box.height) return 0;
  return Math.max(0, box.width - left);
}
