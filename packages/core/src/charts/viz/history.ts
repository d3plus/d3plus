/**
    The chart's Back history (`viz._history`): one stack holding drill-downs
    and legend hide/solo clicks in the order they happened, so Back undoes
    them in reverse.
*/

import type {
  DrillDownHistoryEntry,
  HistoryEntry,
  LegendHistoryEntry,
  LegendState,
  VizInstance,
} from "./vizTypes.js";

/** Whether a Back history entry records a legend click. */
export function isLegendEntry(
  entry: HistoryEntry,
): entry is LegendHistoryEntry {
  return entry.kind === "legend";
}

/** The newest drill-down entry on a Back history, skipping legend entries. */
export function latestDrillEntry(
  history: HistoryEntry[] | undefined,
): DrillDownHistoryEntry | undefined {
  if (!history) return undefined;
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (!isLegendEntry(entry)) return entry;
  }
  return undefined;
}

/** Removes and returns the newest drill-down entry, leaving the legend entries around it in place. */
export function removeLatestDrillEntry(
  history: HistoryEntry[] | undefined,
): DrillDownHistoryEntry | undefined {
  const entry = latestDrillEntry(history);
  if (entry) history!.splice(history!.lastIndexOf(entry), 1);
  return entry;
}

/** Whether two legend id lists hold the same ids, in any order. */
export function sameLegendIds(
  a: (string | number)[],
  b: (string | number)[],
): boolean {
  return a.length === b.length && a.every(id => b.includes(id));
}

/** The chart's current legend hide/solo state, as a Back history entry. */
export function legendSnapshot(viz: VizInstance): LegendHistoryEntry {
  return {kind: "legend", hidden: [...viz._hidden], solo: [...viz._solo]};
}

/**
    Records a legend click on the Back history: pushes `before` (the state
    the click started from) when the click changed what is hidden or solo'd
    and `legendHistory` is on. Returns whether it pushed.
*/
export function recordLegendChange(
  viz: VizInstance,
  before: LegendHistoryEntry,
): boolean {
  if (!viz.schema.legendHistory) return false;
  if (
    sameLegendIds(before.hidden, viz._hidden) &&
    sameLegendIds(before.solo, viz._solo)
  )
    return false;
  (viz._history ??= []).push(before);
  return true;
}

/** Puts back the legend state a history entry recorded. */
export function restoreLegendEntry(viz: VizInstance, entry: LegendState): void {
  viz._hidden = [...entry.hidden];
  viz._solo = [...entry.solo];
}

/**
    Clears the legend's hide/solo state for a drill to a deeper level, whose
    legend lists other groups, and returns the state it cleared for the
    drill's history entry (undefined when nothing was hidden or solo'd).
*/
export function takeLegendState(viz: VizInstance): LegendState | undefined {
  if (!viz._hidden.length && !viz._solo.length) return undefined;
  const state = {hidden: viz._hidden, solo: viz._solo};
  viz._hidden = [];
  viz._solo = [];
  return state;
}

/**
    Drops the legend's steps from the Back history: every legend entry, and
    the legend state drill-down entries would put back. The drill-downs stay.
*/
export function dropLegendHistory(viz: VizInstance): void {
  if (!viz._history) return;
  viz._history = viz._history.filter(e => !isLegendEntry(e));
  for (const entry of viz._history as DrillDownHistoryEntry[])
    delete entry.legend;
}
