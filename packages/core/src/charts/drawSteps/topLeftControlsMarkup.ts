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

import type {SceneNode} from "@d3plus/render";

import type Viz from "../viz/Viz.js";
import {overlayHost} from "./zoomControlsMarkup.js";

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
  /**
      A cheap, non-DOM string capturing anything besides `html` that can
      change this contribution's rendered size — its resolved button style
      object, typically (`JSON.stringify(...)`, mirroring how
      `zoomControlsBox` folds its own resolved style into its signature).
      Without this, a style-only change (e.g. `.searchControlStyle({width:
      '60px'})`) wouldn't invalidate the measurement cache below, since the
      *markup* (`html`) wouldn't have changed. Optional: a contribution
      whose rendered size never varies with config can omit it.
  */
  styleSignature?: string;
  events?: Record<string, Partial<Record<string, (e: Event) => void>>>;
  onUpdate?: (host: HTMLElement) => void;
}

/** Vertical inset from the chart's top edge, and the gap between contributions — the top-left mirror of `ZOOM_PANEL_STYLE`'s padding/gap. */
const PANEL_PADDING = 4;
const PANEL_GAP = 4;

/** Per-contribution size/position, measured once and reused for both the real render and the inset math — see `measureContributions`. */
interface MeasuredContribution extends Contribution {
  x: number;
}

interface Measurement {
  items: MeasuredContribution[];
  width: number;
  height: number;
}

/** A single item's size before it's been measured (a small icon button, roughly). */
const ESTIMATED_ITEM_WIDTH = 28;
const ESTIMATED_ITEM_HEIGHT = 20;

/**
    Measures every contribution's rendered box in one pass: mounts a hidden
    probe with each contribution wrapped in its own `<span>`, and calls each
    contribution's OWN `onUpdate` on it first — the same hook `backControl.ts`/
    `searchControls.ts` use to paint resolved button styles on a real render —
    so the measured size reflects the actual current styling (a custom
    `.searchControlStyle({width: '60px'})`, say), not the untouched default.
    Falls back to a stacked estimate when there's no ancestor `HTMLElement`
    to mount a probe in at all.
*/
function measureContributions(viz: Viz, contributions: Contribution[]): Measurement {
  const host = overlayHost(viz);
  if (!host) {
    let x = 0;
    const items = contributions.map(c => {
      const item = {...c, x};
      x += ESTIMATED_ITEM_WIDTH + PANEL_GAP;
      return item;
    });
    return {items, width: Math.max(0, x - PANEL_GAP), height: ESTIMATED_ITEM_HEIGHT};
  }

  const probe = document.createElement("div");
  probe.className = "d3plus-top-left-controls";
  probe.style.setProperty("display", "inline-flex");
  probe.style.setProperty("align-items", "center");
  probe.style.setProperty("gap", `${PANEL_GAP}px`);
  // Shrink-wrapped and invisible, so it measures without affecting layout.
  probe.style.setProperty("position", "absolute");
  probe.style.setProperty("visibility", "hidden");
  probe.style.setProperty("pointer-events", "none");
  probe.innerHTML = contributions
    .map(c => `<span class="tlc-item" data-tlc-key="${c.key}" style="display:inline-flex;align-items:center;">${c.html}</span>`)
    .join("");
  for (const c of contributions) c.onUpdate?.(probe);

  host.appendChild(probe);
  const probeRect = probe.getBoundingClientRect();
  const itemEls = Array.from(probe.querySelectorAll<HTMLElement>(":scope > .tlc-item"));
  const items = contributions.map((c, i) => {
    const r = itemEls[i]?.getBoundingClientRect();
    return {...c, x: r ? Math.round(r.left - probeRect.left) : 0};
  });
  host.removeChild(probe);

  return {
    items,
    width: probeRect.width ? Math.ceil(probeRect.width) : 0,
    height: probeRect.height ? Math.ceil(probeRect.height) : 0,
  };
}

/**
    Measures (or reuses the cached measurement for) the current
    contributions. The cache key is each contribution's own `html` +
    `styleSignature` — cheap to compute, so the expensive DOM probe in
    `measureContributions` only runs when something that could actually
    change the rendered size has changed (mirrors `zoomControlsBox`'s own
    `html|JSON.stringify(base)` signature).
*/
function getMeasurement(viz: Viz, contributions: Contribution[]): Measurement | null {
  if (!contributions.length) return null;
  const signature = contributions.map(c => `${c.key}:${c.html}|${c.styleSignature ?? ""}`).join("||");
  const cached = viz._topLeftControlsBox;
  if (cached && cached.signature === signature) return cached.measurement as Measurement;
  const measurement = measureContributions(viz, contributions);
  viz._topLeftControlsBox = {width: measurement.width, height: measurement.height, signature, measurement};
  return measurement;
}

/**
    Builds the shared panel as a GROUP of independent `htmlOverlay` nodes,
    one per contribution, rather than one node holding every contribution's
    markup concatenated together. `@d3plus/render`'s overlay diff replaces
    an `htmlOverlay` node's ENTIRE `innerHTML` whenever its `html` string
    changes — with one shared node, back appearing (its own html changing)
    would rewrite the whole panel's DOM, destroying and recreating search's
    `<input>` along with it and silently dropping its focus/cursor position
    mid-type. Separate nodes mean each contribution's DOM subtree is only
    ever touched by ITS OWN html changing.
*/
export function buildTopLeftPanel(viz: Viz, contributions: Contribution[]): SceneNode | null {
  const measurement = getMeasurement(viz, contributions);
  if (!measurement) return null;
  return {
    type: "group",
    key: "viz-top-left-controls",
    children: measurement.items.map(item => ({
      type: "htmlOverlay" as const,
      key: `viz-top-left-controls-${item.key}`,
      x: PANEL_PADDING + item.x,
      y: PANEL_PADDING,
      className: "d3plus-top-left-controls-item",
      html: item.html,
      events: item.events,
      onUpdate: item.onUpdate,
    })),
  };
}

/**
    The shared top-left panel's rendered size (padding included) as it will
    render in the chart's page, so top-positioned content can leave room for
    it — the same measure-a-hidden-probe technique `zoomControlsBox` uses,
    generalized to whichever mix of controls (back / table-view / search)
    is currently contributing, and to each contribution's OWN resolved
    button styling (not just its markup). Returns null when nothing is
    contributing.
*/
export function topLeftControlsBox(
  viz: Viz,
  contributions: Contribution[],
): {width: number; height: number} | null {
  const measurement = getMeasurement(viz, contributions);
  if (!measurement) return null;
  return {
    width: measurement.width ? measurement.width + PANEL_PADDING : 0,
    height: measurement.height ? measurement.height + PANEL_PADDING : 0,
  };
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
