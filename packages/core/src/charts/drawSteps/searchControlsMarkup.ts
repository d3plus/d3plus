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
import type {SceneNode} from "@d3plus/render";

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
// An X: two crossed diagonals, for the clear button.
const CLEAR_ICON = `<svg ${ICON_ATTRS}><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`;

/**
    The input's inline style at rest (closed) vs. open — set directly by the
    toggle click handler, never regenerated mid-typing. Open's right padding
    reserves room for the clear button, which sits absolutely-positioned
    INSIDE the input's own box (see `SEARCH_CLEAR_STYLE_SHOWN`) rather than
    beside it, so typed text wraps short of it instead of running underneath.
*/
export const SEARCH_INPUT_STYLE_CLOSED: Record<string, string> = {
  width: "0",
  padding: "0",
  border: "none",
  opacity: "0",
  "pointer-events": "none",
};
export const SEARCH_INPUT_STYLE_OPEN: Record<string, string> = {
  width: "120px",
  padding: "0 22px 0 6px",
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

/**
    The wrapper `.search-input-wrap` is the positioning context for both the
    clear button (absolute, inside the input's own box) and the match-count
    feedback (absolute, below it) — an `inline-block` with no explicit width
    of its own, so it always shrink-wraps to the input's CURRENT width
    (0 closed, 120px open) and the count box (`width: 100%`) automatically
    matches it.
*/
export const SEARCH_INPUT_WRAP_STYLE: Record<string, string> = {
  position: "relative",
  display: "inline-block",
};

// The clear button and match-count feedback only ever show once there's a
// term — both are toggled by the same `hasTerm` condition, at generation
// time (`searchControlsHtml`) and imperatively while typing (`searchControls.ts`).
// The hidden state uses `visibility: hidden`, not `display: none`, for the
// clear button: it keeps its layout space reserved (matching the input's
// permanent right padding) even while empty. The count box doesn't need
// that — it's absolutely positioned below the input, so it never affects
// the panel's own width/height either way.
const SEARCH_CLEAR_STYLE_SHOWN: Record<string, string> = {
  position: "absolute",
  top: "50%",
  right: "2px",
  transform: "translateY(-50%)",
  display: "inline-flex",
  "align-items": "center",
  "justify-content": "center",
  visibility: "visible",
  width: "16px",
  height: "16px",
  padding: "0",
  border: "none",
  background: "none",
  cursor: "pointer",
};
const SEARCH_CLEAR_STYLE_HIDDEN: Record<string, string> = {...SEARCH_CLEAR_STYLE_SHOWN, visibility: "hidden", cursor: "default"};

/**
    The match-count feedback sits directly below the input, at its same
    width, styled like the attribution box (`vizDefaults.ts`'s
    `attributionStyle` default) — a translucent white pill overlaying
    whatever chart content is beneath it. `pointer-events: none` so it never
    intercepts a click meant for the chart.
*/
const SEARCH_COUNT_STYLE_SHOWN: Record<string, string> = {
  position: "absolute",
  top: "100%",
  left: "0",
  "margin-top": "4px",
  width: "100%",
  "box-sizing": "border-box",
  display: "block",
  visibility: "visible",
  background: "rgba(255, 255, 255, 0.75)",
  border: "1px solid rgba(0, 0, 0, 0.25)",
  color: "rgba(0, 0, 0, 0.75)",
  "font-size": "11px",
  "text-align": "center",
  padding: "2px 4px",
  "white-space": "nowrap",
  overflow: "hidden",
  "text-overflow": "ellipsis",
  "pointer-events": "none",
};
const SEARCH_COUNT_STYLE_HIDDEN: Record<string, string> = {...SEARCH_COUNT_STYLE_SHOWN, visibility: "hidden"};

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

/** Shows/hides the clear button, directly on the DOM node — same no-rebuild pattern as the input's open state. */
export function applySearchClearVisible(btn: HTMLElement, visible: boolean): void {
  const style = visible ? SEARCH_CLEAR_STYLE_SHOWN : SEARCH_CLEAR_STYLE_HIDDEN;
  for (const key in style) btn.style.setProperty(kebab(key), style[key]);
  btn.tabIndex = visible ? 0 : -1;
}

/** Writes the match-count feedback's text/visibility directly onto the DOM node — visible whenever there's a term, regardless of whether it matched anything ("No Matches" is itself useful feedback). */
export function applySearchCount(viz: Viz, el: HTMLElement, hasTerm: boolean, index: number | undefined, total: number): void {
  const style = hasTerm ? SEARCH_COUNT_STYLE_SHOWN : SEARCH_COUNT_STYLE_HIDDEN;
  for (const key in style) el.style.setProperty(kebab(key), style[key]);
  const {text, label} = formatMatchCount(viz, index, total);
  el.textContent = hasTerm ? text : "";
  el.setAttribute("aria-label", label);
}

/** Escapes a value for safe interpolation into `innerHTML`. */
function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, c => (
    {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c] as string
  ));
}

/**
    The search control's markup: a toggle `<button>`, an `<input>`, a clear
    (×) button, and a match-count span — all real elements so host-page
    button/input styling applies through the cascade the same way zoom's
    buttons do. Value/open/match-count state is baked in from
    `viz._searchTerm`/`_searchOpen`/`_searchMatchIndex` so a full re-render
    (e.g. a resize or data change) preserves whatever the user was doing —
    typing itself never regenerates this markup (see `searchControls.ts`).
*/
export function searchControlsHtml(viz: Viz): string {
  const extraClass = viz.schema.searchControlClassName ? ` ${viz.schema.searchControlClassName}` : "";
  const label = viz.schema.translate("Search");
  const open = isSearchOpen(viz);
  const term = viz._searchTerm || "";
  const hasTerm = term.trim().length > 0;
  const inputStyle = styleAttr({...SEARCH_INPUT_BASE_STYLE, ...(open ? SEARCH_INPUT_STYLE_OPEN : SEARCH_INPUT_STYLE_CLOSED)});
  const clearStyle = styleAttr(hasTerm ? SEARCH_CLEAR_STYLE_SHOWN : SEARCH_CLEAR_STYLE_HIDDEN);
  const countStyle = styleAttr(hasTerm ? SEARCH_COUNT_STYLE_SHOWN : SEARCH_COUNT_STYLE_HIDDEN);
  const total = hasTerm ? searchMatches(viz, term).length : 0;
  const {text: countText, label: countLabel} = formatMatchCount(viz, viz._searchMatchIndex, total);
  const wrapStyle = styleAttr(SEARCH_INPUT_WRAP_STYLE);
  return (
    `<button type="button" class="search-control search-toggle${open ? " active" : ""}${extraClass}" aria-label="${label}" aria-pressed="${open}">${SEARCH_ICON}</button>` +
    `<span class="search-input-wrap" style="${wrapStyle}">` +
    `<input type="text" class="search-control search-input" placeholder="${label}" aria-label="${label}" value="${escapeHtml(term)}" style="${inputStyle}"${open ? "" : " tabindex=\"-1\""}/>` +
    `<button type="button" class="search-control search-clear" aria-label="${viz.schema.translate("Clear")}" style="${clearStyle}"${hasTerm ? "" : " tabindex=\"-1\""}>${CLEAR_ICON}</button>` +
    `<span class="search-count" aria-live="polite" aria-label="${countLabel}" style="${countStyle}">${hasTerm ? countText : ""}</span>` +
    `</span>`
  );
}

/**
    Builds the predicate `.highlight()` drives from the current search term:
    a case-insensitive substring match against `viz.schema.searchAccessor`'s
    resolved string for each mark — the mark's on-screen label
    (`viz._drawLabel`) by default, so this works unchanged across every
    chart type, but overridable via `.searchAccessor()` for charts that want
    to match against something else (e.g. a data field not shown as the
    label). Empty term restores whatever `.highlight()` predicate (if any)
    was active before the search box opened.
*/
export function searchHighlightPredicate(
  viz: Viz,
  term: string,
): ((d: DataPoint, i: number) => boolean) | false {
  const needle = term.trim().toLowerCase();
  if (!needle) return viz._searchPrevHighlight ?? false;
  // This predicate also runs against the legend's own (merged-aggregate)
  // rows via the shared interaction-opacity pass, whose shape can differ
  // from a chart mark's row — a custom `.searchAccessor()` isn't guaranteed
  // to return a string for those, so guard rather than let a non-string
  // (commonly `undefined`) throw on `.toLowerCase()`.
  return (d: DataPoint, i: number) => {
    const value = viz.schema.searchAccessor(d, i);
    return typeof value === "string" && value.toLowerCase().includes(needle);
  };
}

/** Scene mark types a match is searched against — mirrors `interactionOpacity.ts`'s own `MARK_TYPES`. */
const MARK_TYPES = new Set(["rect", "circle", "line", "area", "path"]);

/** One matching mark: its scene node (for `.key`/geometry), the unwrapped source row, and its index. */
export interface SearchMatch {
  node: SceneNode;
  row: DataPoint;
  index: number;
}

/**
    Every currently-rendered mark matching the given term, in scene order.
    Walks `viz._chartScene` (the actual painted scene, post-layout) rather
    than the raw data array, unwrapping each node's datum the same way
    `applyInteractionOpacity` does, so a grouped/aggregated chart matches by
    rendered mark, not by raw input row — and de-dupes by datum reference so
    a mark's separate label node doesn't double-count it. An empty term
    matches nothing (there's no "everything" state to jump through).
*/
export function searchMatches(viz: Viz, term: string): SearchMatch[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  const nodes = viz._chartScene || [];
  const seen = new Set<unknown>();
  const results: SearchMatch[] = [];
  const walk = (node: SceneNode): void => {
    if (MARK_TYPES.has(node.type) && node.datum !== undefined) {
      const raw = node.datum as (DataPoint & {data?: DataPoint}) | undefined;
      const row = (raw && raw.data ? raw.data : raw) as DataPoint;
      if (row !== undefined && !seen.has(row)) {
        seen.add(row);
        const i = typeof node.index === "number" ? node.index : 0;
        const value = viz.schema.searchAccessor(row, i);
        if (typeof value === "string" && value.toLowerCase().includes(needle)) results.push({node, row, index: i});
      }
    }
    const kids = (node as {children?: SceneNode[]}).children;
    if (kids) kids.forEach(walk);
  };
  nodes.forEach(walk);
  return results;
}

/**
    Formats the match-count feedback as a readable, localized phrase:
    "No Matches" with nothing found, "6 Matches"/"1 Match" once there's a
    count but the user hasn't stepped to one yet (Enter/Shift+Enter), and
    "Match 2/6" once they have — the translated noun for context, plus a
    compact numeric position rather than a translated "of" connector, since
    a fixed English word order ("Match 2 of 6") wouldn't read naturally in
    every locale, while a number pair after a noun does. `index` is 0-based
    (`viz._searchMatchIndex`); `total` is `searchMatches(...).length`. Text
    and label are the same string — both visible and accessible.
*/
export function formatMatchCount(viz: Viz, index: number | undefined, total: number): {text: string; label: string} {
  let text: string;
  if (total === 0) text = viz.schema.translate("No Matches");
  else if (typeof index !== "number") text = `${total} ${viz.schema.translate(total === 1 ? "Match" : "Matches")}`;
  else text = `${viz.schema.translate("Match")} ${index + 1}/${total}`;
  return {text, label: text};
}

/** Whether a chart shows the search control. */
export function showsSearchControls(viz: Viz): boolean {
  return Boolean(viz.schema.search) && !viz._ssr;
}
