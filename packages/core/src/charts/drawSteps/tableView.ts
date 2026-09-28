/**
    @name tableViewFeature
    The full-chart data-table overlay that replaces the chart while table
    view is active. The toggle button itself lives in the shared top-left
    controls panel (`tableViewContribution`, in `tableViewControl.ts`) — this
    feature only contributes the big overlay, and only while active.

    Runs as a post-draw `FeatureModule` (see `runVizPipeline`), registered
    AFTER `topLeftControlsFeature`/`zoomFeature`/`attributionFeature` so its
    panel — a chart-sized `htmlOverlay` (the embedded toggle button, a
    scrollable sticky-header `<table>`, and pagination) — stacks above all
    three in the overlay host (siblings paint in scene order), covering them
    while showing. Claims zero margin; contributes nothing while inactive.
    On a large "one big page" (`tableViewPageSize(false)`, or an equally
    large explicit size), `bindTableViewOverlay` switches the table into
    scroll-driven row virtualization (`tableViewMarkup.ts`) instead of
    rendering every row at once.

    Toggling doesn't go through a full `_preDraw`/`_draw` re-run (unnecessary
    — nothing about the chart itself changes): `toggleTableView`/
    `changeTableViewPage` rebuild just this one panel, splice it into
    `viz._featurePanels` in place (or drop it, going inactive), and repaint
    immediately — like `zoomMath`'s click-driven `zoomTo` → `zoomed`, not the
    rAF-coalesced `_scheduleSceneRepaint` timeline playback uses. A single
    deliberate click doesn't need coalescing, and painting synchronously
    means a click handler that reads the DOM right after the click sees the
    new panel with no one-frame lag. Both `tableViewContribution`'s button
    and this overlay's embedded copy call these same two functions.
*/
import type {SceneNode} from "@d3plus/render";

import type {FeatureModule} from "../features/features.js";
import type Viz from "../viz/Viz.js";
import {
  bindTableViewOverlay,
  downloadTableViewCsv,
  getTableViewDataSource,
  getTableViewPage,
  getTableViewSort,
  isTableView,
  setTableView,
  setTableViewDataSource,
  setTableViewPage,
  setTableViewSort,
  syncSharedTableViewButton,
  tableViewOverlayHtml,
} from "./tableViewMarkup.js";

const PANEL_KEY = "viz-table-view-overlay";

/** Resolves the `<th data-column="...">` a sort click/keypress landed on, or null outside one. */
function sortColumnFromEvent(e: Event): string | undefined {
  const th = (e.target as Element).closest(".tableview-sort-header") as HTMLElement | null;
  return th?.dataset.column;
}

/** Builds the full-chart overlay panel (toolbar + table + pagination). */
function buildOverlayPanel(viz: Viz): SceneNode {
  return {
    type: "htmlOverlay" as const,
    key: PANEL_KEY,
    x: 0,
    y: 0,
    width: viz.schema.width,
    height: viz.schema.height,
    className: "d3plus-table-view",
    html: tableViewOverlayHtml(viz),
    events: {
      ".table-view-toggle": {click: (): void => toggleTableView(viz)},
      ".tableview-page-prev": {click: (): void => changeTableViewPage(viz, -1)},
      ".tableview-page-next": {click: (): void => changeTableViewPage(viz, 1)},
      ".tableview-download-csv": {click: (): void => downloadTableViewCsv(viz)},
      ".tableview-source-toggle": {click: (): void => toggleTableViewDataSource(viz)},
      ".tableview-sort-header": {
        click: (e: Event): void => {
          const column = sortColumnFromEvent(e);
          if (column) changeTableViewSort(viz, column);
        },
        // `<th>` isn't natively keyboard-activatable like a <button>; Enter/Space
        // mirrors the click so the sort headers (role="button", tabindex="0")
        // are actually operable from the keyboard, not just visually affording it.
        keydown: (e: Event): void => {
          const key = (e as KeyboardEvent).key;
          if (key !== "Enter" && key !== " ") return;
          const column = sortColumnFromEvent(e);
          if (!column) return;
          e.preventDefault();
          changeTableViewSort(viz, column);
        },
      },
    },
    onUpdate: (host: HTMLElement): void => bindTableViewOverlay(host, viz),
  };
}

/**
    Adds/replaces/removes this panel in `viz._featurePanels` to match the
    chart's current table-view state, then repaints. The shared top-left
    panel's COMPOSITION needs no equivalent refresh — `tableViewContribution`
    always contributes a button there regardless of active state, so
    toggling never adds/removes it — but that button's own active/pressed
    DOM state can still go stale relative to a state change made here (its
    html was baked in whenever the shared panel itself was last rebuilt,
    which doesn't happen on every table-view toggle), so `syncSharedTableViewButton`
    patches it directly rather than waiting for the next full re-render.
*/
function refreshTableViewOverlay(viz: Viz): void {
  const panels: SceneNode[] = (viz._featurePanels || []).slice();
  const idx = panels.findIndex((p: SceneNode) => p.key === PANEL_KEY);
  if (isTableView(viz)) {
    const panel = buildOverlayPanel(viz);
    if (idx >= 0) panels[idx] = panel;
    else panels.push(panel);
  } else if (idx >= 0) {
    panels.splice(idx, 1);
  }
  viz._featurePanels = panels;
  syncSharedTableViewButton(viz);
  if (viz._drawSceneToTarget && viz._sceneRenderer) viz._drawSceneToTarget(0);
}

export function toggleTableView(viz: Viz): void {
  setTableView(viz, !isTableView(viz));
  setTableViewPage(viz, 0);
  refreshTableViewOverlay(viz);
}

export function changeTableViewPage(viz: Viz, dir: number): void {
  setTableViewPage(viz, Math.max(0, getTableViewPage(viz) + dir));
  refreshTableViewOverlay(viz);
}

/**
    Clicking a column header: the same column toggles asc ↔ desc; a
    different column starts at asc. Resets to page 0 — re-sorting while deep
    in the pagination would otherwise strand the user on a page whose
    contents just changed out from under them.
*/
export function changeTableViewSort(viz: Viz, column: string): void {
  const current = getTableViewSort(viz);
  const direction = current?.column === column && current.direction === "asc" ? "desc" : "asc";
  setTableViewSort(viz, {column, direction});
  setTableViewPage(viz, 0);
  refreshTableViewOverlay(viz);
}

/**
    Clicking the raw/aggregate toggle (`dataSourceButtonHtml` — only
    rendered when the two actually differ). Resets to page 0, same reasoning
    as `changeTableViewSort`: the row count itself changes underneath
    whatever page was showing. Sort state is left alone — raw and aggregate
    can have different column sets (an aggregate merge may add a computed
    field the raw rows don't have, e.g. Pie's "share"), and
    `sortedTableViewRows` already no-ops a sort whose column isn't among the
    new source's columns, so there's nothing to actively reconcile.
*/
export function toggleTableViewDataSource(viz: Viz): void {
  setTableViewDataSource(viz, getTableViewDataSource(viz) === "raw" ? "aggregate" : "raw");
  setTableViewPage(viz, 0);
  refreshTableViewOverlay(viz);
}

export const tableViewFeature: FeatureModule = {
  name: "tableView",
  layout: ({viz}) => {
    if (!isTableView(viz)) return {panel: null, margin: {}};
    return {panel: buildOverlayPanel(viz), margin: {}};
  },
};
