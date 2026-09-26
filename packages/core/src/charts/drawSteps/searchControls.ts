/**
    @name searchContribution
    The search control's contribution to the shared top-left controls panel
    (`topLeftControls.ts`): a toggle button that expands into a text input,
    whose typed value drives `.highlight()` with a predicate matching each
    mark's resolved label (`viz._drawLabel`, or `.searchAccessor()`'s
    override) — a persistent, standing highlight rather than `.hover()`'s
    transient one, so it survives the user's mouse moving over the chart.

    While the box is open it owns `viz._highlight` exclusively: opening
    saves whatever predicate was already set (a chart author's own
    `.highlight()` call, if any) into `viz._searchPrevHighlight`; typing
    drives the search predicate; closing restores the saved predicate and
    clears the saved slot.

    Toggling and typing both mutate DOM/instance state directly and call
    `viz.highlight()` (which self-schedules its own lightweight repaint)
    rather than `.render()` — like the zoom-brush toggle, neither changes
    layout, so neither needs a layout pass. Crucially, this also means
    typing never regenerates this panel's `html` string (only a full
    `runVizPipeline()` pass does that), so the real `<input>` DOM node is
    left alone by the renderer's overlay diffing and keeps focus/cursor
    position naturally — a future edit that bakes the live term into the
    generated html on every keystroke (instead of leaving the DOM node's
    value alone) would break that.

    Enter/Shift+Enter step through the matches (wrapping), updating the
    `N/total` feedback and, on the SVG renderer, panning/zooming the
    matched mark into view via the existing `_zoomToBounds` — computed from
    the matched element's real `getBoundingClientRect()` rather than any
    per-chart-type geometry, so it works for any mark shape (rect/circle/
    path) without special-casing chart types. Canvas has no per-mark DOM to
    measure, so there the step still updates the count/current-match state,
    it just can't pan/zoom to it.

    @module
*/
import type Viz from "../viz/Viz.js";
import type {Contribution} from "./topLeftControlsMarkup.js";
import {
  applySearchClearVisible,
  applySearchCount,
  applySearchInputOpenState,
  isSearchOpen,
  paintSearchButton,
  searchControlsHtml,
  searchHighlightPredicate,
  searchMatches,
  showsSearchControls,
} from "./searchControlsMarkup.js";

/** Resets the clear-button/count feedback after the match set changes (typing, clearing) — no "current" position yet. */
function refreshFeedback(viz: Viz, host: HTMLElement, term: string): void {
  const hasTerm = term.trim().length > 0;
  viz._searchMatchIndex = undefined;
  const clearBtn = host.querySelector<HTMLElement>(".search-clear");
  if (clearBtn) applySearchClearVisible(clearBtn, hasTerm);
  const countEl = host.querySelector<HTMLElement>(".search-count");
  if (countEl) applySearchCount(countEl, hasTerm, undefined, hasTerm ? searchMatches(viz, term).length : 0);
}

/** Closes the search box: restores the saved highlight and resets the button/input DOM. */
function closeSearch(viz: Viz, host: HTMLElement): void {
  viz._searchOpen = false;
  viz._searchTerm = "";
  viz.highlight(viz._searchPrevHighlight ?? false);
  viz._searchPrevHighlight = undefined;
  refreshFeedback(viz, host, "");

  const btn = host.querySelector<HTMLElement>(".search-toggle");
  if (btn) {
    btn.classList.remove("active");
    btn.setAttribute("aria-pressed", "false");
    paintSearchButton(viz, btn, btn.matches(":hover"));
  }
  const input = host.querySelector<HTMLInputElement>(".search-input");
  if (input) {
    input.value = "";
    input.setAttribute("tabindex", "-1");
    applySearchInputOpenState(input, false);
  }
}

/** Opens the search box: saves the current highlight (if any) and focuses the input. */
function openSearch(viz: Viz, host: HTMLElement): void {
  viz._searchOpen = true;
  viz._searchPrevHighlight = viz._highlight;

  const btn = host.querySelector<HTMLElement>(".search-toggle");
  if (btn) {
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    paintSearchButton(viz, btn, btn.matches(":hover"));
  }
  const input = host.querySelector<HTMLInputElement>(".search-input");
  if (input) {
    input.removeAttribute("tabindex");
    applySearchInputOpenState(input, true);
    input.focus();
  }
}

function onToggleClick(viz: Viz, e: Event): void {
  const host = e.currentTarget as HTMLElement;
  if (isSearchOpen(viz)) closeSearch(viz, host);
  else openSearch(viz, host);
}

function applyTerm(viz: Viz, host: HTMLElement, term: string): void {
  viz._searchTerm = term;
  viz.highlight(searchHighlightPredicate(viz, term));
  refreshFeedback(viz, host, term);
}

function onSearchInput(viz: Viz, e: Event): void {
  const input = e.target as HTMLInputElement;
  applyTerm(viz, e.currentTarget as HTMLElement, input.value);
}

function onClearClick(viz: Viz, e: Event): void {
  const host = e.currentTarget as HTMLElement;
  const input = host.querySelector<HTMLInputElement>(".search-input");
  if (input) input.value = "";
  applyTerm(viz, host, "");
  input?.focus();
}

/**
    Finds the real DOM element the SVG renderer painted for a matched scene
    node, via its stable `data-key` (`svgNodeAttrs.ts` stamps one on every
    mark, keyed off the row's own id — not array position, so it's the same
    element across repaints/re-sorts). Scans rather than building a CSS
    attribute-selector string, so an id containing quotes can't break (or
    inject into) the query.
*/
function findMarkElement(container: Element, key: unknown): HTMLElement | null {
  const candidates = container.querySelectorAll<HTMLElement>("[data-key]");
  for (const el of candidates) if (el.getAttribute("data-key") === String(key)) return el;
  return null;
}

/**
    Pans/zooms the matched mark into view using its real rendered bounding
    box — `getBoundingClientRect()` already resolves every ancestor
    transform (group nesting, the chart's own positioning transform, the
    current zoom/pan), so this needs no per-chart-type geometry, unlike
    computing bounds from the scene node's own x/y/width/height would.
    SVG-only: Canvas paints no per-mark DOM to measure (see the module doc).
*/
function panToMatch(viz: Viz, host: HTMLElement, key: unknown): void {
  if (viz._renderer === "canvas" || typeof viz._zoomToBounds !== "function") return;
  // `host` is one overlay panel inside the shared `.d3plus-render-overlays`
  // host div (@d3plus/render's `createOverlayHost`), which is itself a
  // SIBLING of the rendered `<svg>` — not its parent. The chart's actual
  // marks (and the svg to measure against) live two levels up, under the
  // element the user originally `.select()`ed.
  const container = host.parentElement?.parentElement;
  const svg = container?.querySelector("svg");
  if (!container || !svg) return;
  const markEl = findMarkElement(container, key);
  if (!markEl) return;
  const elRect = markEl.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  if (!elRect.width && !elRect.height) return;
  viz._zoomToBounds(
    [
      [elRect.left - svgRect.left, elRect.top - svgRect.top],
      [elRect.right - svgRect.left, elRect.bottom - svgRect.top],
    ],
    viz.schema.duration,
  );
}

/** Steps to the next (`direction: 1`) or previous (`-1`) match, wrapping, and updates the count feedback + (SVG) pans to it. */
function jumpToMatch(viz: Viz, host: HTMLElement, direction: 1 | -1): void {
  const term = viz._searchTerm || "";
  if (!term.trim()) return;
  const matches = searchMatches(viz, term);
  if (!matches.length) return;
  const count = matches.length;
  const prev = viz._searchMatchIndex;
  const next = ((typeof prev === "number" ? prev : direction === 1 ? -1 : 0) + direction + count) % count;
  viz._searchMatchIndex = next;

  const countEl = host.querySelector<HTMLElement>(".search-count");
  if (countEl) applySearchCount(countEl, true, next, count);

  panToMatch(viz, host, matches[next].node.key);
}

function onSearchKeydown(viz: Viz, e: Event): void {
  const ke = e as KeyboardEvent;
  const host = e.currentTarget as HTMLElement;
  if (ke.key === "Escape") {
    closeSearch(viz, host);
  } else if (ke.key === "Enter") {
    ke.preventDefault();
    jumpToMatch(viz, host, ke.shiftKey ? -1 : 1);
  }
}

export function searchContribution(viz: Viz): Contribution | null {
  if (!showsSearchControls(viz)) return null;
  return {
    key: "search",
    html: searchControlsHtml(viz),
    events: {
      ".search-toggle": {click: (e: Event) => onToggleClick(viz, e)},
      ".search-clear": {click: (e: Event) => onClearClick(viz, e)},
      ".search-input": {
        input: (e: Event) => onSearchInput(viz, e),
        keydown: (e: Event) => onSearchKeydown(viz, e),
      },
    },
    // Hover can't be delegated (mouseenter/mouseleave don't bubble), so bind
    // it here, guarded so it only binds once per DOM node — mirrors
    // zoomControls.ts's `data-zoom-bound` pattern exactly.
    onUpdate: (host: HTMLElement) => {
      const btn = host.querySelector<HTMLElement>(".search-toggle");
      if (!btn || btn.dataset.searchBound) return;
      btn.dataset.searchBound = "1";
      paintSearchButton(viz, btn);
      btn.addEventListener("mouseenter", () => paintSearchButton(viz, btn, true));
      btn.addEventListener("mouseleave", () => paintSearchButton(viz, btn));
    },
  };
}
