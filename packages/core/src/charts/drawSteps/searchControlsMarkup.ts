/**
    Markup, styling, and event handlers for the search control (a toggle
    button + an expanding text input) — the top-left counterpart to the
    zoom-controls panel's buttons, contributed into the shared top-left
    controls panel (`topLeftControls.ts`) alongside the back button. Kept as
    its own module rather than folded into `zoomControlsMarkup.ts`/
    `topLeftControlsMarkup.ts`: search is independent chrome a chart can mix
    and match with zoom/back, so its styling knobs stay uncoupled from
    theirs (matching the convention `zoomControlsMarkup.ts` itself notes for
    why zoom and table-view don't share styling code).

    @module
*/
import type {DataPoint} from "@d3plus/data";

import type Viz from "../viz/Viz.js";
import {ICON_ATTRS, kebab} from "./zoomControlsMarkup.js";
import {
  searchControlStyleActiveDefault,
  searchControlStyleDefault,
  searchControlStyleHoverDefault,
} from "../viz/vizDefaults.js";

/** Search-open state is per-chart, read/written via `viz._searchOpen`. */
export function isSearchOpen(viz: Viz): boolean {
  return Boolean(viz._searchOpen);
}

type StyleObject = Record<string, string | number | undefined | null | false>;
type ControlStyleValue = StyleObject | false | null | undefined;

/**
    Fallbacks for CSS system colors a browser may not support yet (see the
    identical table in `zoomControlsMarkup.ts`).
*/
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
    Resolves a `searchControlStyle`/`Active`/`Hover` value for painting.
    Setting `searchControlClassName` auto-disables whichever of the three is
    still the untouched built-in default (identified by reference), the same
    trick `zoomControlClassName` uses.
*/
function resolveSearchControlStyle(
  viz: Viz,
  value: ControlStyleValue,
  defaultValue: ControlStyleValue,
): StyleObject {
  if (viz.schema.searchControlClassName && value === defaultValue) return {};
  return value || {};
}

/** The resolved base / active / hover button styles for a chart. */
function buttonStyles(viz: Viz): {base: StyleObject; active: StyleObject; hover: StyleObject} {
  return {
    base: resolveSearchControlStyle(viz, viz.schema.searchControlStyle, searchControlStyleDefault),
    active: resolveSearchControlStyle(viz, viz.schema.searchControlStyleActive, searchControlStyleActiveDefault),
    hover: resolveSearchControlStyle(viz, viz.schema.searchControlStyleHover, searchControlStyleHoverDefault),
  };
}

/** Paints the search toggle button's inline style for its current state. Mirrors `paintZoomButton`. */
export function paintSearchButton(viz: Viz, btn: HTMLElement, hovered = false): void {
  const {base, active, hover} = buttonStyles(viz);
  const isActive = btn.classList.contains("active");
  for (const key of new Set([...Object.keys(base), ...Object.keys(active), ...Object.keys(hover)]))
    btn.style.removeProperty(kebab(key));
  for (const style of [base, hovered ? hover : {}, isActive ? active : {}])
    for (const key in style) {
      const v = style[key];
      if (v !== undefined && v !== null && v !== false) setStyle(btn, key, String(v));
    }
}

// A magnifying glass: a circle + a short diagonal handle.
const SEARCH_ICON = `<svg ${ICON_ATTRS}><circle cx="10" cy="10" r="7"/><line x1="21" y1="21" x2="15" y2="15"/></svg>`;

/** The input's inline style at rest (closed) vs. open — set directly by the toggle click handler, never regenerated mid-typing. */
export const SEARCH_INPUT_STYLE_CLOSED: Record<string, string> = {
  width: "0",
  padding: "0",
  border: "none",
  opacity: "0",
  "pointer-events": "none",
};
export const SEARCH_INPUT_STYLE_OPEN: Record<string, string> = {
  width: "120px",
  padding: "0 6px",
  border: "1px solid #ccc",
  "border-radius": "3px",
  opacity: "1",
  "pointer-events": "auto",
};

const SEARCH_INPUT_BASE_STYLE: Record<string, string> = {
  height: "20px",
  "box-sizing": "border-box",
  font: "inherit",
  transition: "width 0.15s ease, opacity 0.15s ease",
};

function styleAttr(style: Record<string, string>): string {
  return Object.entries(style)
    .map(([k, v]) => `${kebab(k)}:${v}`)
    .join(";");
}

/** Applies the open/closed inline style directly to the input DOM node — no panel rebuild, so focus/cursor survive. */
export function applySearchInputOpenState(input: HTMLInputElement, open: boolean): void {
  const style = open ? SEARCH_INPUT_STYLE_OPEN : SEARCH_INPUT_STYLE_CLOSED;
  for (const key in style) input.style.setProperty(kebab(key), style[key]);
}

/** Escapes a value for safe interpolation into `innerHTML`. */
function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, c => (
    {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c] as string
  ));
}

/**
    The search control's markup: a toggle `<button>` + an `<input>`, both
    real elements so host-page button/input styling applies through the
    cascade the same way zoom's buttons do. The input's value/open state are
    baked in from `viz._searchTerm`/`_searchOpen` so a full re-render (e.g. a
    resize or data change) preserves whatever the user was doing — typing
    itself never regenerates this markup (see `searchControls.ts`).
*/
export function searchControlsHtml(viz: Viz): string {
  const extraClass = viz.schema.searchControlClassName ? ` ${viz.schema.searchControlClassName}` : "";
  const label = viz.schema.translate("Search");
  const open = isSearchOpen(viz);
  const term = viz._searchTerm || "";
  const inputStyle = styleAttr({...SEARCH_INPUT_BASE_STYLE, ...(open ? SEARCH_INPUT_STYLE_OPEN : SEARCH_INPUT_STYLE_CLOSED)});
  return (
    `<button type="button" class="search-control search-toggle${open ? " active" : ""}${extraClass}" aria-label="${label}" aria-pressed="${open}">${SEARCH_ICON}</button>` +
    `<input type="text" class="search-control search-input" placeholder="${label}" aria-label="${label}" value="${escapeHtml(term)}" style="${inputStyle}"${open ? "" : " tabindex=\"-1\""}/>`
  );
}

/**
    Builds the predicate `.highlight()` drives from the current search term:
    a case-insensitive substring match against each mark's resolved,
    on-screen label (`viz._drawLabel`) — the same string the user reads on
    the chart, so this works unchanged across every chart type. Empty term
    restores whatever `.highlight()` predicate (if any) was active before
    the search box opened.
*/
export function searchHighlightPredicate(
  viz: Viz,
  term: string,
): ((d: DataPoint, i: number) => boolean) | false {
  const needle = term.trim().toLowerCase();
  if (!needle) return viz._searchPrevHighlight ?? false;
  return (d: DataPoint, i: number) => viz._drawLabel(d, i).toLowerCase().includes(needle);
}

/** Whether a chart shows the search control. */
export function showsSearchControls(viz: Viz): boolean {
  return Boolean(viz.schema.search) && !viz._ssr;
}
