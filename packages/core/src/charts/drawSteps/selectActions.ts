/**
    Setting and clearing a chart's box or lasso selection: storing it,
    repainting, announcing it to screen readers, and firing the chart's
    `select` event.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneEvent, SceneNode} from "@d3plus/render";

import {reportHandlerError} from "../viz/reportHandlerError.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  combineRows,
  rowMatcher,
  selectedRows,
  seriesRows,
} from "./selectState.js";
import type {SelectPredicate} from "./selectState.js";

/** What a chart's selection can be set to: rows, a predicate, or nothing. */
export type SelectionValue = DataPoint[] | SelectPredicate | false | null;

/** The chart a viewer last selected in, which Escape clears. */
let lastSelected: WeakRef<VizInstance> | null = null;

/** Whether `viz` is the chart a viewer last selected in. */
export function lastSelectedChart(viz: VizInstance): boolean {
  return lastSelected?.deref() === viz;
}

/** The rows a chart's selection holds among its marks (see `selectedRows`). */
export function currentSelection(viz: VizInstance): DataPoint[] {
  const predicate = viz._selection;
  return typeof predicate === "function"
    ? selectedRows(viz._chartScene ?? [], predicate)
    : [];
}

/** Whether a chart has a selection. */
export function hasSelection(viz: VizInstance): boolean {
  return typeof viz._selection === "function";
}

/**
    Stores a chart's selection and repaints: a predicate as given, rows as
    a predicate matching them (and the series they belong to, see
    `seriesRows`), or nothing for an empty array, `false`, or `null`.
    @param viz The chart.
    @param value The selection.
*/
export function setSelection(viz: VizInstance, value: SelectionValue): void {
  if (typeof value === "function") viz._selection = value;
  else if (Array.isArray(value) && value.length) {
    const scene: SceneNode[] = viz._chartScene ?? [];
    viz._selection = rowMatcher([...value, ...seriesRows(scene, value)]);
  } else viz._selection = false;
  viz._scheduleSceneRepaint?.();
}

/** Announces a selection's size through keyboard navigation's live region. */
function announce(viz: VizInstance, count: number): void {
  const live = viz._keyboardNav?.live;
  if (!live) return;
  const t = viz.schema.translate;
  live.textContent = count
    ? t("{0} selected", undefined, count)
    : t("Selection cleared");
}

/** Runs the chart's `select` handler with the selected rows. */
function fire(viz: VizInstance, rows: DataPoint[], event?: Event | null): void {
  const handler = viz.schema.on?.select;
  if (typeof handler !== "function") return;
  try {
    handler.call(viz, rows, event ?? undefined);
  } catch (error) {
    reportHandlerError(error);
  }
}

/**
    A viewer's selection: combines `rows` with the current selection (see
    `combineRows`), stores it, announces it, and fires the `select` event.
    Returns the rows selected.
    @param viz The chart.
    @param rows The rows the gesture picked.
    @param mode Replace the selection, add to it, or toggle the rows in it.
    @param event The pointer or keyboard event behind the gesture.
*/
export function selectRows(
  viz: VizInstance,
  rows: DataPoint[],
  mode: "replace" | "add" | "toggle",
  event?: Event | null,
): DataPoint[] {
  const next = combineRows(currentSelection(viz), rows, mode);
  setSelection(viz, next);
  lastSelected = next.length ? new WeakRef(viz) : null;
  announce(viz, next.length);
  fire(viz, next, event);
  return next;
}

/**
    A viewer clears the selection (Escape, or a click on no mark): clears
    it, announces it, and fires the `select` event with no rows. Returns
    false when there was nothing to clear.
    @param viz The chart.
    @param event The event behind it.
*/
export function clearSelection(
  viz: VizInstance,
  event?: Event | null,
): boolean {
  if (!hasSelection(viz)) return false;
  setSelection(viz, false);
  if (lastSelectedChart(viz)) lastSelected = null;
  announce(viz, 0);
  fire(viz, [], event);
  return true;
}

/**
    A click on a chart mark while a select tool is on (or a keyboard Enter
    on a focused mark) selects that mark's row, or with Shift toggles it in
    the selection. Returns true for a click on a chart mark while a tool is
    on, so the click goes no further (the chart's own click action, such as
    drilling down, is skipped); a click on a mark the selection can't pick
    then counts as a click on no mark, which clears the selection.
    @param viz The chart.
    @param event The routed pointer event.
    @param row The row the clicked mark stands for.
    @param legend Whether the mark is a legend entry (left to the legend).
*/
export function selectClick(
  viz: VizInstance,
  event: SceneEvent,
  row: unknown,
  legend: boolean,
): boolean {
  const node = event.pick?.node;
  if (!viz._selectTool || event.type !== "click" || legend || !node)
    return false;
  // A mark the selection can't pick (a Network's link) counts as no mark.
  if (!row || typeof row !== "object" || viz._selectMark?.(node) === false)
    return true;
  if (viz._selectSurface?.press) viz._selectSurface.press.clicked = true;
  const native = event.nativeEvent as MouseEvent | undefined;
  const mode = native?.shiftKey ? "toggle" : "replace";
  selectRows(viz, [row as DataPoint], mode, native);
  return true;
}
