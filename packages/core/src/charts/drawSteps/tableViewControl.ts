/**
    The table-view toggle's contribution to the shared top-left controls
    panel (`topLeftControls.ts`) — the button that switches the chart to a
    static, scrollable data table (`tableView.ts` owns the actual overlay).

    Unlike `backContribution` (only shows with drill-down history), this one
    contributes as long as `tableView` is enabled — REGARDLESS of whether
    table view is currently active. While active, `tableView.ts`'s
    chart-sized overlay panel paints on top of the entire chart (including
    this shared panel), so this button becomes invisible and unreachable by
    real pointer hit-testing; the overlay embeds its own copy of the same
    button (see `tableViewOverlayHtml`) for the user to actually click to
    switch back. Keeping this contribution constant means toggling table
    view never has to touch the shared panel's composition — only the
    separate overlay panel appears/disappears.

    @module
*/
import type Viz from "../viz/Viz.js";
import type {Contribution} from "./topLeftControlsMarkup.js";
import {toggleTableView} from "./tableView.js";
import {
  bindTableViewButton,
  showsTableView,
  tableViewButtonHtml,
  tableViewButtonStyleSignature,
} from "./tableViewMarkup.js";

export function tableViewContribution(viz: Viz): Contribution | null {
  if (!showsTableView(viz)) return null;
  return {
    key: "table-view",
    html: tableViewButtonHtml(viz),
    styleSignature: tableViewButtonStyleSignature(viz),
    events: {
      ".table-view-toggle": {click: (): void => toggleTableView(viz)},
    },
    onUpdate: (host: HTMLElement): void => bindTableViewButton(host, viz),
  };
}
