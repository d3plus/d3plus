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
import {paintControlButton, resolveControlStyle, type StyleObject} from "./controlButtonStyle.js";
import {
  searchControlStyleActiveDefault,
  searchControlStyleDefault,
  searchControlStyleHoverDefault,
} from "../viz/vizDefaults.js";

/** Search-open state is per-chart, read/written via `viz._searchOpen`. */
export function isSearchOpen(viz: Viz): boolean {
  return Boolean(viz._searchOpen);
}

/** The resolved base / active / hover button styles for a chart — also the cheap, non-DOM basis for `searchContribution`'s `styleSignature` (see `Contribution.styleSignature`). */
export function searchButtonStyles(viz: Viz): {base: StyleObject; active: StyleObject; hover: StyleObject} {
  const className = Boolean(viz.schema.searchControlClassName);
  return {
    base: resolveControlStyle(viz.schema.searchControlStyle, searchControlStyleDefault, className),
    active: resolveControlStyle(viz.schema.searchControlStyleActive, searchControlStyleActiveDefault, className),
    hover: resolveControlStyle(viz.schema.searchControlStyleHover, searchControlStyleHoverDefault, className),
  };
}

/** Paints the search toggle button's inline style for its current state. Mirrors `paintZoomButton`. */
export function paintSearchButton(viz: Viz, btn: HTMLElement, hovered = false): void {
  paintControlButton(btn, searchButtonStyles(viz), hovered, btn.classList.contains("active"));
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
    buttons do. Term/open state is baked in from `viz._searchTerm`/
    `_searchOpen` so a full re-render (e.g. a resize or data change)
    preserves whatever the user was doing — typing itself never regenerates
    this markup (see `searchControls.ts`).

    The count span is left EMPTY here on purpose — its text is written by
    `searchContribution`'s `onUpdate` instead (see there), not baked into
    this string. `onUpdate` runs on every draw regardless of whether this
    html string changed, while the match count itself depends on the
    CHART's data/scene, not on the search box's own state — baking its text
    in here would make this contribution's own html change (and its DOM,
    including the live `<input>`, get torn down and rebuilt) every time the
    chart's data changes for a reason that has nothing to do with search,
    e.g. drilling down while the box is open and focused.
*/
export function searchControlsHtml(viz: Viz): string {
  const extraClass = viz.schema.searchControlClassName ? ` ${viz.schema.searchControlClassName}` : "";
  const label = viz.schema.translate("Search");
  const open = isSearchOpen(viz);
  const term = viz._searchTerm || "";
  const hasTerm = term.trim().length > 0;
  const inputStyle = styleAttr({...SEARCH_INPUT_BASE_STYLE, ...(open ? SEARCH_INPUT_STYLE_OPEN : SEARCH_INPUT_STYLE_CLOSED)});
  const clearStyle = styleAttr(hasTerm ? SEARCH_CLEAR_STYLE_SHOWN : SEARCH_CLEAR_STYLE_HIDDEN);
  const wrapStyle = styleAttr(SEARCH_INPUT_WRAP_STYLE);
  return (
    `<button type="button" class="search-control search-toggle${open ? " active" : ""}${extraClass}" aria-label="${label}" aria-pressed="${open}">${SEARCH_ICON}</button>` +
    `<span class="search-input-wrap" style="${wrapStyle}">` +
    `<input type="text" class="search-control search-input" placeholder="${label}" aria-label="${label}" value="${escapeHtml(term)}" style="${inputStyle}"${open ? "" : " tabindex=\"-1\""}/>` +
    `<button type="button" class="search-control search-clear" aria-label="${viz.schema.translate("Clear")}" style="${clearStyle}"${hasTerm ? "" : " tabindex=\"-1\""}>${CLEAR_ICON}</button>` +
    `<span class="search-count" aria-live="polite"></span>` +
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
        // Mirrors applyInteractionOpacity's own fallback order exactly
        // (interactionOpacity.ts) — node.index, then the row's own `.i`,
        // then 0 — so the index a custom searchAccessor sees here always
        // matches the index the highlight predicate was evaluated with,
        // and Enter/Shift+Enter never jumps to a different mark than the
        // one that's actually highlighted.
        const i =
          typeof node.index === "number"
            ? node.index
            : typeof (row as {i?: number}).i === "number"
              ? (row as {i: number}).i
              : 0;
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
