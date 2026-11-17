/**
    The tooltip of a hover on a selected mark: while a box or lasso
    selection holds several of a chart's marks, but not all of them, the
    hovered mark's tooltip stands for the whole selection, its rows merged
    into one (as a legend entry's are) under how many are selected.

    @module
*/

import type {VirtualElement} from "@floating-ui/dom";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {configPrep} from "../../utils/index.js";
import type {ConfigPrepHost} from "../../utils/configPrep.js";
import {ownTbody} from "../features/tooltipRows.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {currentSelection} from "./selectActions.js";
import {selectedRows} from "./selectState.js";

/** Whether the selection holds `datum` or any row it wraps. */
function holds(viz: VizInstance, datum: DataPoint): boolean {
  const selection = viz._selection;
  if (typeof selection !== "function") return false;
  let d = datum as (DataPoint & {data?: DataPoint}) | undefined;
  while (d && typeof d === "object") {
    if (selection(d)) return true;
    d = d.data as typeof d;
  }
  return false;
}

/**
    The selected rows a hover on `datum` shows together: every row the
    selection holds, when it holds `datum` and more than one but fewer than
    all of the chart's rows; otherwise null.
    @param viz The chart.
    @param datum The hovered mark's row.
*/
export function selectionTooltipRows(
  viz: VizInstance,
  datum: DataPoint | undefined,
): DataPoint[] | null {
  if (!datum || !holds(viz, datum)) return null;
  const rows = currentSelection(viz);
  if (rows.length < 2) return null;
  const all = selectedRows(viz._chartScene ?? [], () => true);
  return rows.length < all.length ? rows : null;
}

/**
    Shows the selection's tooltip: `rows` merged with the chart's `aggs`
    under "N selected", after `tooltipConfig`.
    @param viz The chart.
    @param rows The selected rows (see `selectionTooltipRows`).
    @param position Where the tooltip points: a client point, or an anchor.
*/
export function renderSelectionTooltip(
  viz: VizInstance,
  rows: DataPoint[],
  position: number[] | VirtualElement,
): void {
  const tip = viz._tooltipClass!;
  const merged = viz._mergeRows
    ? viz._mergeRows(rows)
    : (merge(rows, viz.schema.aggs) as DataPoint);
  const title = viz.schema.translate("{0} selected", undefined, rows.length);
  tip
    .data([merged])
    .tbody(ownTbody(tip.tbody()))
    .footer(false)
    .position(position)
    .config(
      configPrep.bind(viz as unknown as ConfigPrepHost)(
        viz.schema.tooltipConfig,
      ),
    )
    .title(() => title)
    .titleSwatch(false)
    .render();
}
