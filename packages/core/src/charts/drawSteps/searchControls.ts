/**
    @name searchContribution
    The search control's contribution to the shared top-left controls panel
    (`topLeftControls.ts`): a toggle button that expands into a text input,
    whose typed value drives `.highlight()` with a predicate matching each
    mark's resolved label (`viz._drawLabel`) — a persistent, standing
    highlight rather than `.hover()`'s transient one, so it survives the
    user's mouse moving over the chart.

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

    @module
*/
import type Viz from "../viz/Viz.js";
import type {Contribution} from "./topLeftControlsMarkup.js";
import {
  applySearchInputOpenState,
  isSearchOpen,
  paintSearchButton,
  searchControlsHtml,
  searchHighlightPredicate,
  showsSearchControls,
} from "./searchControlsMarkup.js";

/** Closes the search box: restores the saved highlight and resets the button/input DOM. */
function closeSearch(viz: Viz, host: HTMLElement): void {
  viz._searchOpen = false;
  viz._searchTerm = "";
  viz.highlight(viz._searchPrevHighlight ?? false);
  viz._searchPrevHighlight = undefined;

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

function onSearchInput(viz: Viz, e: Event): void {
  const input = e.target as HTMLInputElement;
  viz._searchTerm = input.value;
  viz.highlight(searchHighlightPredicate(viz, input.value));
}

function onSearchKeydown(viz: Viz, e: Event): void {
  if ((e as KeyboardEvent).key !== "Escape") return;
  closeSearch(viz, e.currentTarget as HTMLElement);
}

export function searchContribution(viz: Viz): Contribution | null {
  if (!showsSearchControls(viz)) return null;
  return {
    key: "search",
    html: searchControlsHtml(viz),
    events: {
      ".search-toggle": {click: (e: Event) => onToggleClick(viz, e)},
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
