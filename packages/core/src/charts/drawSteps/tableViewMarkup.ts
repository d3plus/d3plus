/**
    Markup, styling, and state helpers for the table-view toggle button + the
    data-table overlay it swaps in (sorting, CSV export, pagination).

    The button's html (`tableViewButtonHtml`) is consumed two ways: as
    `tableViewContribution`'s piece of the shared top-left controls panel
    (`tableViewControl.ts`) while the chart is showing, and embedded at the
    top of the full-chart data-table overlay (`tableView.ts`) while table
    view is active — so a click there can toggle back. Kept as its own
    module (rather than folded into `zoomControlsMarkup.ts`) because the two
    features are independent chrome a chart can mix and match; sharing
    styling *knobs* (config keys, defaults) between them would couple them
    for no benefit. The button-painting *mechanism* is genuinely
    feature-agnostic, though — `paintControlButton`/`resolveControlStyle`
    come from the shared `controlButtonStyle.ts` (also used by zoom/back/
    search), the same way `zoomControlsInset` and `topLeftControlsInset`
    share the box-measuring pattern without sharing what they measure.
    `overlayHost` is reused from `zoomControlsMarkup.ts`.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {fontFamilyStringify} from "@d3plus/text";

import type Viz from "../viz/Viz.js";
import {overlayHost} from "./zoomControlsMarkup.js";
import {paintControlButton, resolveControlStyle, type StyleObject} from "./controlButtonStyle.js";
import {
  tableViewControlStyleActiveDefault,
  tableViewControlStyleDefault,
  tableViewControlStyleHoverDefault,
} from "../viz/vizDefaults.js";

/** Table-view mode is per-chart state, read/written via `viz._tableView`. */
export function isTableView(viz: Viz): boolean {
  return Boolean(viz._tableView);
}
export function setTableView(viz: Viz, value: boolean): void {
  viz._tableView = value;
}

/** The current page (0-indexed) of the paginated data table. */
export function getTableViewPage(viz: Viz): number {
  return viz._tableViewPage || 0;
}
export function setTableViewPage(viz: Viz, value: number): void {
  viz._tableViewPage = value;
}

export type SortDirection = "asc" | "desc";
export interface TableViewSort {
  column: string;
  direction: SortDirection;
}

/** The data table's current sort column + direction, if any (`viz._tableViewSort`). */
export function getTableViewSort(viz: Viz): TableViewSort | undefined {
  return viz._tableViewSort;
}
export function setTableViewSort(viz: Viz, value: TableViewSort | undefined): void {
  viz._tableViewSort = value;
}

export type TableViewDataSource = "raw" | "aggregate";

/** Which dataset the table currently shows: `viz._data` (raw) or `viz._filteredData` (aggregate, the default — matches the chart's own on-screen behavior). */
export function getTableViewDataSource(viz: Viz): TableViewDataSource {
  return viz._tableViewDataSource === "raw" ? "raw" : "aggregate";
}
export function setTableViewDataSource(viz: Viz, value: TableViewDataSource): void {
  viz._tableViewDataSource = value;
}

/**
    Whether `viz._data` (the chart's raw, untouched input) and
    `viz._filteredData` (what it currently charts — after any filtering
    AND, for many chart types, per-mark aggregation: Treemap/Pie/Donut, or a
    Plot chart with repeated x per series, merge rows that share a
    (groupBy, x) key) actually differ. Row-count comparison is the cheap,
    sufficient signal: aggregation collapses count whenever it applies, and
    when it doesn't, the two are the same array. A deep comparison would be
    exact but costs exactly what virtualization exists to avoid paying on
    every repaint of a huge dataset.
*/
function hasDistinctRawData(viz: Viz): boolean {
  const raw = viz._data as DataPoint[] | undefined;
  const aggregate = (viz._filteredData as DataPoint[] | undefined) || raw;
  if (!raw || !aggregate || raw === aggregate) return false;
  return raw.length !== aggregate.length;
}

/** The resolved base / active / hover button styles for a chart, also the cheap non-DOM basis for `tableViewContribution`'s `styleSignature`. */
function buttonStyles(viz: Viz): {base: StyleObject; active: StyleObject; hover: StyleObject} {
  const className = Boolean(viz.schema.tableViewControlClassName);
  return {
    base: resolveControlStyle(viz.schema.tableViewControlStyle, tableViewControlStyleDefault, className),
    active: resolveControlStyle(viz.schema.tableViewControlStyleActive, tableViewControlStyleActiveDefault, className),
    hover: resolveControlStyle(viz.schema.tableViewControlStyleHover, tableViewControlStyleHoverDefault, className),
  };
}

/** Paints the table-view button's inline style for its current state (base/hover/active) — see `paintControlButton`. */
export function paintTableViewButton(viz: Viz, btn: HTMLElement, hovered = false): void {
  paintControlButton(btn, buttonStyles(viz), hovered, btn.classList.contains("active"));
}

/** The cheap, non-DOM signature capturing the button's resolved style — see `Contribution.styleSignature`. */
export function tableViewButtonStyleSignature(viz: Viz): string {
  return JSON.stringify(buttonStyles(viz));
}

/** Shared icon attributes — see the long comment in `zoomControlsMarkup.ts` for why these exact properties matter. */
const ICON_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:middle;flex-shrink:0"';
// A simple spreadsheet-style grid: outer frame + one horizontal + one vertical divider.
const TABLE_ICON = `<svg ${ICON_ATTRS}><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/></svg>`;
// A downward arrow into a tray — the conventional "download" icon.
const DOWNLOAD_ICON = `<svg ${ICON_ATTRS}><path d="M12 3v12"/><polyline points="7 11 12 16 17 11"/><path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1"/></svg>`;
// Two opposing horizontal arrows — the conventional "swap/exchange" icon.
// One constant icon regardless of state (like TABLE_ICON above): only the
// label/aria-pressed/active-class communicate which of the two datasets is
// currently showing, the same convention `tableViewButtonHtml` uses.
const SWAP_ICON = `<svg ${ICON_ATTRS}><polyline points="14 4 19 9 14 14"/><line x1="4" y1="9" x2="19" y2="9"/><polyline points="10 20 5 15 10 10"/><line x1="20" y1="15" x2="5" y2="15"/></svg>`;

/**
    Sort-direction chevrons for column headers — smaller than the toolbar
    icons above (11px vs. 12px) since they sit inline with header text
    rather than centered in their own button, with a left margin instead of
    a leading space for consistent spacing. Deliberately vector, not the
    Unicode ▲/▼ this replaced: a Unicode triangle glyph comes from the
    browser's font-fallback chain like the toolbar icons' Unicode
    predecessors did (see the icon-choice rationale in
    `zoomControlsMarkup.ts`), and renders inconsistently thick/bold across
    fonts and OSes — a plain stroked chevron matches this feature's own
    icon language and reads the same everywhere.
*/
const SORT_ICON_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:middle;margin-left:4px;flex-shrink:0"';
const SORT_ASC_ICON = `<svg ${SORT_ICON_ATTRS}><polyline points="6 15 12 9 18 15"/></svg>`;
const SORT_DESC_ICON = `<svg ${SORT_ICON_ATTRS}><polyline points="6 9 12 15 18 9"/></svg>`;

/** The toggle button's markup — a real `<button>` so host-page button styling applies once `tableViewControlClassName` disables the inline defaults. */
export function tableViewButtonHtml(viz: Viz): string {
  const active = isTableView(viz);
  const extraClass = viz.schema.tableViewControlClassName ? ` ${viz.schema.tableViewControlClassName}` : "";
  const label = viz.schema.translate(active ? "Show Chart" : "Show Data Table");
  return `<button type="button" class="table-view-control table-view-toggle${active ? " active" : ""}${extraClass}" aria-label="${label}" aria-pressed="${active}">${TABLE_ICON}</button>`;
}

/** The CSV-download button's markup — same structural button styling as the toggle, so the two sit flush in the overlay's toolbar row. */
function downloadButtonHtml(viz: Viz): string {
  const label = viz.schema.translate("Download");
  return `<button type="button" class="table-view-control tableview-download-csv" aria-label="${label}" title="${label} CSV">${DOWNLOAD_ICON}</button>`;
}

/**
    The raw/aggregate data-source toggle's markup — next to the download
    button, and (per `hasDistinctRawData`) only rendered at all when the two
    datasets actually differ. `active`/`aria-pressed` track "currently
    showing raw"; aggregate is the default (unpressed) state, matching what
    the table showed before this toggle existed.
*/
function dataSourceButtonHtml(viz: Viz): string {
  const showingRaw = getTableViewDataSource(viz) === "raw";
  const extraClass = viz.schema.tableViewControlClassName ? ` ${viz.schema.tableViewControlClassName}` : "";
  const label = viz.schema.translate(showingRaw ? "Show Aggregate Data" : "Show Raw Data");
  return `<button type="button" class="table-view-control tableview-source-toggle${showingRaw ? " active" : ""}${extraClass}" aria-label="${label}" title="${label}" aria-pressed="${showingRaw}">${SWAP_ICON}</button>`;
}

/** Escapes a value for safe interpolation into `innerHTML`. */
function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, c => (
    {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c] as string
  ));
}

/** Renders one cell's value for on-screen display: numbers get locale grouping, dates a locale date string, everything else its plain string form. */
function formatCell(value: unknown, locale: string): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString(locale);
  if (typeof value === "number") return value.toLocaleString(locale);
  return String(value);
}

/**
    Renders one cell's value for CSV export: raw and machine-readable rather
    than display-formatted — a plain (ungrouped) number and an ISO date
    string, so the exported file round-trips through a spreadsheet without
    locale-specific grouping/decimal separators getting misread as multiple
    columns or the wrong magnitude.
*/
function csvCellValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/** Quotes a CSV field per RFC 4046 whenever it contains a comma, quote, or line break (`\n` or a lone `\r`); doubles any interior quotes. */
function csvField(value: unknown): string {
  const str = csvCellValue(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** Serializes columns + rows into a CSV string (header row first, `\r\n` line endings per RFC 4046). */
function toCsv(columns: string[], rows: DataPoint[]): string {
  const lines = [columns.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(columns.map(c => csvField((row as Record<string, unknown>)[c])).join(","));
  }
  return lines.join("\r\n");
}

/**
    Compares two cell values for sorting: numeric for two numbers,
    chronological for two dates, else a locale-aware string compare (with
    `numeric: true` so "Q2" sorts before "Q10"). `null`/`undefined` always
    sort last, regardless of direction — a missing value isn't meaningfully
    "low" or "high".
*/
function compareValues(a: unknown, b: unknown, locale: string): number {
  const aNil = a === null || a === undefined;
  const bNil = b === null || b === undefined;
  if (aNil || bNil) return aNil && bNil ? 0 : aNil ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b), locale, {numeric: true});
}

/**
    A stable key for whichever `groupBy` group a row belongs to. Aggregation
    (the `merge()` a chart's rollup runs per group) leaves the groupBy
    field(s) unchanged — that's the definition of "group by X, merge the
    rest" — so a raw row and the aggregate row its group collapsed into
    always compute the same key here. Used only as `defaultRowOrder`'s
    fallback (see below) — it identifies a GROUP, not a specific row, so
    several raw rows legitimately share one key.
*/
function groupByKey(viz: Viz, row: DataPoint, index: number): string {
  const groupBy = viz.schema.groupBy as Array<(d: DataPoint, i: number) => unknown> | undefined;
  if (!groupBy || !groupBy.length) return "";
  return groupBy.map(fn => String(fn(row, index))).join("\u0000");
}

/**
    Two first-occurrence-index lookups built in one pass over the chart's
    raw `.data()` input, both keyed for `defaultRowOrder`:
      - `exact`: by the row's full JSON content — an aggregate row that's
        merely been REORDERED (not actually merged) serializes identically
        to its one originating raw row, so this recovers its true original
        index exactly.
      - `group`: by `groupByKey` — the fallback for a row that WAS actually
        merged (summed/concatenated fields mean its JSON no longer matches
        any single raw row), where "first appearance of this group" is the
        best available notion of original position.
    Cached on `viz` (keyed by the raw array's own reference): both lookups
    are an O(n) scan over potentially the chart's entire dataset, and every
    table-view interaction (a page click, a sort click) calls
    `defaultRowOrder` again — without the cache each one would re-pay that
    scan even though `_data` itself hasn't changed.
*/
function rowOrderLookups(viz: Viz): {exact: Map<string, number>; group: Map<string, number>} {
  const raw = (viz._data as DataPoint[] | undefined) || [];
  const cache = viz._tableViewGroupOrder;
  if (cache && cache.data === raw) return cache;
  const exact = new Map<string, number>();
  const group = new Map<string, number>();
  raw.forEach((d, i) => {
    const sig = JSON.stringify(d);
    if (!exact.has(sig)) exact.set(sig, i);
    const key = groupByKey(viz, d, i);
    if (!group.has(key)) group.set(key, i);
  });
  const lookups = {data: raw, exact, group};
  viz._tableViewGroupOrder = lookups;
  return lookups;
}

/**
    Reorders rows to match the chart's original `.data()` insertion order —
    undoing whatever order a chart's own pipeline left `_filteredData` in.
    This matters for two distinct reasons a chart's pipeline reorders rows:
      - Regrouping without merging: a BarChart given interleaved rows
        (`{id:"B",x:"Q1"}, {id:"A",x:"Q1"}, {id:"B",x:"Q2"}, …`) ends up with
        `_filteredData` ordered "all of B, then all of A" (grouped by series
        for axis/domain computation) — same rows, just resequenced. Restored
        EXACTLY via `rowOrderLookups().exact`.
      - True aggregation: Treemap/Pie/etc. merge every row sharing a groupBy
        key into one summed/concatenated row, which no longer matches any
        single raw row's JSON. Falls back to `rowOrderLookups().group`:
        ordering by when that GROUP first appeared — the best available
        notion of "original position" for a row that never existed on its
        own in the input.
    Only called when there's no explicit column sort active — clicking any
    header fully overrides this default, same as it would override natural
    array order. Skipped (returns `rows` unchanged) when there's no raw
    data to derive an order from.
*/
function defaultRowOrder(viz: Viz, rows: DataPoint[]): DataPoint[] {
  const raw = viz._data as DataPoint[] | undefined;
  if (!raw || !raw.length) return rows;
  const {exact, group} = rowOrderLookups(viz);
  return rows
    .map((row, i) => {
      const exactOrder = exact.get(JSON.stringify(row));
      const order = exactOrder ?? group.get(groupByKey(viz, row, i)) ?? Number.MAX_SAFE_INTEGER;
      return {row, order};
    })
    .sort((a, b) => a.order - b.order)
    .map(x => x.row);
}

/**
    The union of every row's own keys, in first-seen order. A plain
    `Object.keys(rows[0])` would silently drop any column absent from the
    first row but present on a later one — a real risk for data that's been
    filtered/merged upstream and isn't perfectly homogeneous — so this scans
    every row instead. Cheap relative to the sort `sortedTableViewRows`
    already does when a sort is active (one O(n·k) pass vs. O(n log n)).
*/
function allColumns(rows: DataPoint[]): string[] {
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }
  return columns;
}

/**
    The chart's current data-table rows and their columns (the union of
    every row's own keys — see `allColumns`), sorted per
    `viz._tableViewSort` when set. Shared by the on-screen table (which
    further paginates this) and CSV export (which exports it in full,
    unpaginated) — both automatically follow whichever data source
    `dataSourceButtonHtml`'s toggle currently selects.

    Source: `viz._filteredData` (aggregate — what's actually charted) by
    default, or `viz._data` (raw, untouched input) once the toggle picks
    "raw" — guarded by `hasDistinctRawData` so a stale `_tableViewDataSource`
    from a previous, genuinely-different dataset can't silently switch a
    chart whose raw/aggregate happen to now coincide.

    Absent an explicit column sort, the AGGREGATE source is further
    reordered (`defaultRowOrder`) to match the chart's original `.data()`
    insertion order — raw is already in that order by definition, so it's
    skipped there.
*/
export function sortedTableViewRows(viz: Viz): {rows: DataPoint[]; columns: string[]} {
  const useRaw = getTableViewDataSource(viz) === "raw" && hasDistinctRawData(viz);
  const source = (useRaw ? viz._data : viz._filteredData || viz._data) as DataPoint[] | undefined;
  let rows = (source || []).slice();
  const columns = allColumns(rows);
  const sort = getTableViewSort(viz);
  if (sort && columns.includes(sort.column)) {
    const dir = sort.direction === "desc" ? -1 : 1;
    const {column} = sort;
    rows.sort((a, b) => dir * compareValues((a as Record<string, unknown>)[column], (b as Record<string, unknown>)[column], viz.schema.locale));
  } else if (!useRaw) {
    rows = defaultRowOrder(viz, rows);
  }
  return {rows, columns};
}

/** One page of rows, clamped/derived from `tableViewPageSize` + the current `_tableViewPage`. Clamps and writes back the page so it can't drift out of range as data/sort changes. Exported so `setupTableViewVirtualization` can re-derive the identical slice `tableViewOverlayHtml` built. */
export function paginate(
  viz: Viz,
  rows: DataPoint[],
): {slice: DataPoint[]; page: number; totalPages: number; start: number; end: number; total: number} {
  const total = rows.length;
  const pageSize = viz.schema.tableViewPageSize;
  const size = typeof pageSize === "number" && pageSize > 0 ? pageSize : total || 1;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(0, getTableViewPage(viz)), totalPages - 1);
  setTableViewPage(viz, page);
  const start = page * size;
  const end = Math.min(start + size, total);
  return {slice: rows.slice(start, end), page, totalPages, start, end, total};
}

/** Whether a chart shows the table-view toggle button. */
export function showsTableView(viz: Viz): boolean {
  return Boolean(viz.schema.tableView) && !viz._ssr;
}

/** Whether the data table's column headers are clickable to sort. */
function showsTableViewSort(viz: Viz): boolean {
  return viz.schema.tableViewSort !== false;
}

/** Whether the data table shows a "download CSV" button. */
function showsTableViewDownload(viz: Viz): boolean {
  return viz.schema.tableViewDownload !== false;
}

/**
    Fixed per-row height (px), in sync with each `<tr>`'s own inline
    `height`. Virtualization's spacer math (`startIndex * ROW_HEIGHT`)
    depends on every row actually being this tall — the reason every row,
    virtualized or not, gets an explicit height rather than natural sizing.
*/
const ROW_HEIGHT = 30;

/**
    Above this many rows in the currently-rendered page, the table switches
    from "render every row" to scroll-driven virtualization (see
    `setupTableViewVirtualization`). Default pagination (`tableViewPageSize`
    50) never approaches this — it only engages when a chart sets
    `tableViewPageSize(false)` (or an equally large explicit size) on a
    large dataset, the case plain rendering doesn't scale to.
*/
const VIRTUALIZE_THRESHOLD = 300;

/** The initial guessed window a freshly-built (not yet mounted) virtualized table renders, corrected the instant it mounts (see `setupTableViewVirtualization`) — comfortably more than any real viewport shows, so there's no visible gap before the real measurement lands. */
const INITIAL_VIRTUAL_WINDOW = 60;

/** Rows of overscan rendered beyond each edge of the visible window, so a fast scroll doesn't flash empty space before the next frame's re-render catches up. */
const OVERSCAN = 10;

/**
    A per-cell width cap. `max-width`/`text-overflow: ellipsis` on the
    `<td>` ITSELF doesn't reliably constrain anything under this table's
    default (non-virtualized) `table-layout: auto` — browsers largely
    compute auto column widths from cells' unconstrained intrinsic content
    width, so a `max-width` on the cell box often gets overridden by the
    table's own sizing pass. Wrapping the text in a plain block-level `<div>`
    (below) sidesteps that: an ordinary block element's `max-width` is
    respected regardless of what layout algorithm its ancestor table uses.
    Needed because some chart types' aggregated rows can be pathological
    here — Treemap/Pie/etc.'s `merge()` concatenates every distinct value of
    a non-summed field with commas, so one cell can legitimately hold
    hundreds of joined values, which without this cap pushes every other
    column off-screen to make room for it.
*/
const CELL_MAX_WIDTH = "320px";

/** One data row's `<td>` cells. */
function rowCellsHtml(viz: Viz, columns: string[], row: DataPoint): string {
  return columns
    .map(c => `<td style="padding:6px 10px;border-bottom:1px solid #e0e0e0;"><div style="max-width:${CELL_MAX_WIDTH};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(formatCell((row as Record<string, unknown>)[c], viz.schema.locale))}</div></td>`)
    .join("");
}

/** One data row, at the fixed `ROW_HEIGHT` every virtualization calculation assumes. */
function rowHtml(viz: Viz, columns: string[], row: DataPoint): string {
  return `<tr style="height:${ROW_HEIGHT}px;">${rowCellsHtml(viz, columns, row)}</tr>`;
}

/** An invisible, zero-content `<tr>` standing in for rows outside the rendered window — its height is however much scrollable space those rows would occupy, so the scrollbar still reflects the full row count. */
function spacerRowHtml(heightPx: number, colspan: number): string {
  if (!heightPx) return "";
  return `<tr aria-hidden="true" style="height:${heightPx}px;padding:0;border:0;"><td style="padding:0;border:0;" colspan="${colspan}"></td></tr>`;
}

/**
    The `<tbody>` contents for a `[startIndex, endIndex)` window of `rows`:
    a top spacer (for everything before `startIndex`), the window's actual
    `<tr>`s, and a bottom spacer (for everything after `endIndex`). Called
    both when building the overlay's initial html and — with different
    bounds — on every scroll tick once virtualization is active; the two
    call sites' output is otherwise identical, which is what keeps the first
    real frame (post-mount) indistinguishable from the guessed one it replaces.
*/
function tbodyRowsHtml(
  viz: Viz,
  columns: string[],
  rows: DataPoint[],
  startIndex: number,
  endIndex: number,
  total: number,
): string {
  const colspan = Math.max(columns.length, 1);
  return (
    spacerRowHtml(startIndex * ROW_HEIGHT, colspan) +
    rows.slice(startIndex, endIndex).map(row => rowHtml(viz, columns, row)).join("") +
    spacerRowHtml((total - endIndex) * ROW_HEIGHT, colspan)
  );
}

/** One `<th>`: sort affordance (click/keyboard-toggleable, `aria-sort`, chevron indicator) when sortable, plain otherwise. */
function headerCellHtml(viz: Viz, column: string, sort: TableViewSort | undefined): string {
  const label = escapeHtml(column);
  if (!showsTableViewSort(viz)) {
    return `<th style="position:sticky;top:0;background:#fff;text-align:left;padding:6px 10px;border-bottom:2px solid #ccc;white-space:nowrap;">${label}</th>`;
  }
  const active = sort?.column === column;
  const ariaSort = active ? (sort.direction === "desc" ? "descending" : "ascending") : "none";
  const arrow = active ? (sort.direction === "desc" ? SORT_DESC_ICON : SORT_ASC_ICON) : "";
  return `<th class="tableview-sort-header" data-column="${escapeHtml(column)}" role="button" tabindex="0" aria-sort="${ariaSort}" style="position:sticky;top:0;background:#fff;text-align:left;padding:6px 10px;border-bottom:2px solid #ccc;white-space:nowrap;cursor:pointer;user-select:none;">${label}${arrow}</th>`;
}

/**
    The full data-table overlay's markup: a toolbar (the toggle button, —
    unless disabled — a "download CSV" button, and — only when raw and
    aggregate data actually differ — the raw/aggregate source toggle), a
    scrollable table with a sticky, click-to-sort header, and — when the
    data doesn't fit on one page — Prev/Next pagination. Columns come from
    the union of every row's own keys; every value is escaped, since it's
    caller-supplied data landing in `innerHTML`.
*/
export function tableViewOverlayHtml(viz: Viz): string {
  const sort = getTableViewSort(viz);
  const {rows, columns} = sortedTableViewRows(viz);
  const {slice, page, totalPages, start, end, total} = paginate(viz, rows);
  // Only the CURRENT PAGE's row count matters here — with default pagination
  // (small `tableViewPageSize`) `slice.length` never approaches the
  // threshold no matter how huge the underlying dataset is; pagination
  // itself already bounds the DOM in that case. Virtualization is for the
  // "one big page" (`tableViewPageSize(false)`, or an equally large
  // explicit size) case pagination doesn't cover.
  const pageTotal = slice.length;
  const virtualized = pageTotal > VIRTUALIZE_THRESHOLD;

  // `tbodyRowsHtml`'s last argument is "how many rows are in the array
  // being windowed" — that's `pageTotal` (the CURRENT PAGE's row count),
  // never the dataset-wide `total`. They coincide when pagination isn't
  // splitting anything, but differ whenever a big-but-bounded page size
  // (e.g. `tableViewPageSize(500)` on 1000+ rows) makes both pagination
  // and virtualization apply to the same page at once — using `total`
  // there would size the bottom spacer against rows that aren't even in
  // `slice`, well past its actual end.
  const bodyHtml = !total
    ? `<tr><td style="padding:12px;color:#767676;" colspan="${Math.max(columns.length, 1)}">${viz.schema.translate("No Data Available")}</td></tr>`
    : tbodyRowsHtml(viz, columns, slice, 0, virtualized ? Math.min(pageTotal, INITIAL_VIRTUAL_WINDOW) : pageTotal, pageTotal);

  const headHtml = columns.map(c => headerCellHtml(viz, c, sort)).join("");

  const paginationHtml =
    totalPages > 1
      ? `<div class="d3plus-table-view-pagination" style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-top:1px solid #e0e0e0;font-size:12px;flex:0 0 auto;">
          <button type="button" class="tableview-page-prev"${page <= 0 ? " disabled" : ""}>‹ ${viz.schema.translate("Previous")}</button>
          <span>${total ? start + 1 : 0}–${end} / ${total}</span>
          <button type="button" class="tableview-page-next"${page >= totalPages - 1 ? " disabled" : ""}>${viz.schema.translate("Next")} ›</button>
        </div>`
      : "";

  const extraClass = viz.schema.tableViewClassName ? ` ${viz.schema.tableViewClassName}` : "";
  const toolbarHtml =
    tableViewButtonHtml(viz) +
    (showsTableViewDownload(viz) ? downloadButtonHtml(viz) : "") +
    (hasDistinctRawData(viz) ? dataSourceButtonHtml(viz) : "");

  // `table-layout:fixed` only while virtualizing: without it, column widths
  // auto-fit whatever rows currently exist, which for a normal (fully
  // rendered) table looks nicer, but for a virtualized one would jitter
  // column widths every time the rendered window's content changes on
  // scroll. Fixed layout divides width evenly (from the always-fully-
  // rendered header row), trading that visual nicety for stability exactly
  // where scrolling would otherwise disturb it.
  const tableLayout = virtualized ? "table-layout:fixed;" : "";

  return `
    <div style="display:flex;flex-direction:column;width:100%;height:100%;box-sizing:border-box;background:#fff;font:12px/1.4 ${fontFamilyStringify(viz.schema.fontFamily || "sans-serif")};">
      <div style="flex:0 0 auto;display:flex;gap:4px;padding:4px;">${toolbarHtml}</div>
      <div class="d3plus-table-view-scroll"${virtualized ? ' data-tableview-virtual="1"' : ""} style="flex:1 1 auto;min-height:0;overflow:auto;">
        <table class="d3plus-table-view-table${extraClass}" style="border-collapse:collapse;width:100%;${tableLayout}">
          <thead><tr>${headHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
      ${paginationHtml}
    </div>`;
}

/** Builds the CSV and triggers a browser download of the chart's full (sorted, unpaginated) data-table rows. */
export function downloadTableViewCsv(viz: Viz): void {
  const {rows, columns} = sortedTableViewRows(viz);
  const csv = toCsv(columns, rows);
  const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "table-view.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
    Paints every `.table-view-control` button's inline style (base/active,
    plus hover — which can't be delegated like click, since mouseenter/
    mouseleave don't bubble) once per button DOM node, guarded by
    `data-table-view-bound` the same way `buildZoomControlPanel`'s
    `onUpdate` guards its four buttons. Shared by `tableViewContribution`
    (the shared top-left panel's lone toggle button) and `tableView.ts`'s
    full overlay (whose toolbar has both the toggle and the download button).
*/
export function bindTableViewButton(host: HTMLElement, viz: Viz): void {
  host.querySelectorAll<HTMLElement>(".table-view-control").forEach(btn => {
    if (btn.dataset.tableViewBound) return;
    btn.dataset.tableViewBound = "1";
    paintTableViewButton(viz, btn);
    btn.addEventListener("mouseenter", () => paintTableViewButton(viz, btn, true));
    btn.addEventListener("mouseleave", () => paintTableViewButton(viz, btn));
  });
}

/** Renders the `[startIndex, endIndex)` window implied by the wrapper's LIVE scroll position/height into `tbody` — the only DOM write a scroll tick ever does, regardless of total row count. */
function renderVisibleRows(
  viz: Viz,
  wrapper: HTMLElement,
  tbody: HTMLElement,
  rows: DataPoint[],
  columns: string[],
): void {
  const total = rows.length;
  const visibleCount = Math.max(1, Math.ceil(wrapper.clientHeight / ROW_HEIGHT));
  const startIndex = Math.max(0, Math.floor(wrapper.scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(total, startIndex + visibleCount + OVERSCAN * 2);
  tbody.innerHTML = tbodyRowsHtml(viz, columns, rows, startIndex, endIndex, total);
}

/**
    Wires scroll-driven row virtualization for a data table whose current
    page exceeds `VIRTUALIZE_THRESHOLD` rows (marked by
    `tableViewOverlayHtml` via `data-tableview-virtual` on the scroll
    wrapper) — a no-op otherwise, since that marker is only present on a
    virtualized table. Only the visible window (+ `OVERSCAN`) of `<tr>`s is
    ever in the DOM; the two spacer rows `tbodyRowsHtml` emits stand in for
    everything else, resized on every scroll, so the scrollbar still
    reflects the full row count. This is what makes `tableViewPageSize(false)`
    on a huge dataset viable — without it, that setting would put every row
    in the DOM at once.

    Guarded by `data-tableview-virtual-bound`, idempotent across repeated
    `onUpdate` calls (every repaint re-invokes every overlay's `onUpdate`,
    not just table-view's own) — and naturally re-armed on a fresh DOM
    subtree, since a sort/page/toggle rebuilds the overlay's innerHTML
    wholesale, discarding the old wrapper + its scroll listener along with it.

    The scroll handler itself calls `sortedTableViewRows`/`paginate` exactly
    ONCE, at setup — not per scroll tick. `rows`/`columns` are captured in
    the closure and reused for the table's whole mounted lifetime, so a fast
    scroll over a 100k-row table costs one `tbody.innerHTML` write per
    animation frame, never a re-sort.
*/
function setupTableViewVirtualization(host: HTMLElement, viz: Viz): void {
  const wrapper = host.querySelector<HTMLElement>(".d3plus-table-view-scroll[data-tableview-virtual]");
  if (!wrapper || wrapper.dataset.tableviewVirtualBound) return;
  const tbody = wrapper.querySelector<HTMLElement>("tbody");
  if (!tbody) return;
  wrapper.dataset.tableviewVirtualBound = "1";

  const {rows, columns} = sortedTableViewRows(viz);
  const {slice} = paginate(viz, rows);

  let raf = 0;
  const rerender = (): void => {
    raf = 0;
    renderVisibleRows(viz, wrapper, tbody, slice, columns);
  };
  wrapper.addEventListener(
    "scroll",
    () => {
      if (!raf) raf = requestAnimationFrame(rerender);
    },
    {passive: true},
  );
  // The html the overlay mounted with only guessed at the visible window
  // (`INITIAL_VIRTUAL_WINDOW`) — correct it immediately against the real,
  // now-measurable wrapper height, before the browser's next paint.
  rerender();
}

/** Wires both the toolbar buttons and (when applicable) row virtualization for the full data-table overlay. */
export function bindTableViewOverlay(host: HTMLElement, viz: Viz): void {
  bindTableViewButton(host, viz);
  setupTableViewVirtualization(host, viz);
}

/**
    Reflects the current active state onto the shared top-left panel's
    toggle button DOM directly — mirrors `syncBrushButton`. Needed because
    toggling table view deliberately does NOT rebuild the shared panel (see
    `refreshTableViewOverlay` in `tableView.ts`: `tableViewContribution`'s
    html bakes in `isTableView(viz)` at the time THAT panel was last built,
    which only happens on a full `_preDraw`/`_draw` pass). Without this, the
    shared panel's copy of the button can go visibly stale: activate table
    view, let any unrelated full re-render happen while still active (a
    resize, a `.data()` call), then deactivate via the overlay's OWN
    embedded copy of the button — the shared one, now uncovered again,
    would otherwise still read "active" until the next full re-render.
*/
export function syncSharedTableViewButton(viz: Viz): void {
  const btn = overlayHost(viz)?.querySelector<HTMLElement>(".d3plus-top-left-controls-item .table-view-toggle");
  if (!btn) return;
  const active = isTableView(viz);
  btn.classList.toggle("active", active);
  btn.setAttribute("aria-pressed", String(active));
  paintTableViewButton(viz, btn, btn.matches(":hover"));
}
