/**
    HorizonChart's row labels as a series filter: clicking a row's y axis
    label hides or shows its series, and Shift+click solos it, as a legend
    entry would (the band key is the legend, so its entries can't). A hidden
    row keeps its place and its label, dimmed, so it can be clicked back on.
    Each change goes on the chart's Back history.
*/
import type {DataPoint} from "@d3plus/data";
import type {Bounds} from "@d3plus/math";
import type {SceneEvent, SceneNode} from "@d3plus/render";

import {configPrep} from "../../utils/index.js";
import type {ConfigPrepHost} from "../../utils/configPrep.js";
import {prepareTooltip, restoreTooltip} from "../Plot/sharedTooltip.js";
import {legendSnapshot, recordLegendChange} from "../viz/history.js";
import {focusTargets, type TabStopTest} from "../viz/focusTargets.js";
import {broadcastLegend} from "../viz/linkGroup.js";
import {setCursor} from "../viz/setCursor.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {horizonState} from "./state.js";

type Id = string | number;

/** What is hidden and solo'd. */
export interface RowFilter {
  hidden: Id[];
  solo: Id[];
}

/**
    The hidden and solo'd ids after a click on `id`'s row label, by the
    legend's rules: a click hides a shown row and shows a hidden one, and
    Shift+click solos it (with `legendFilterInvert`, a click solos and
    Shift+click hides). Hiding or soloing every row shows them all again.
    Null when the click changes nothing.
    @param current What is hidden and solo'd now.
    @param id The clicked row's id.
    @param shift Whether Shift was held.
    @param count How many rows the chart has.
    @param inverted The chart's `legendFilterInvert`.
*/
export function rowToggle(
  current: RowFilter,
  id: Id,
  shift: boolean,
  count: number,
  inverted = false,
): RowFilter | null {
  let {hidden, solo} = current;
  const hiddenIndex = hidden.indexOf(id);
  const soloIndex = solo.indexOf(id);
  if (inverted) {
    if (shift) {
      if (hiddenIndex < 0 && !solo.length) {
        hidden = hidden.concat(id);
        if (hidden.length === count) hidden = [];
        return {hidden, solo};
      }
      return soloIndex >= 0 ? {hidden: [], solo: []} : null;
    }
    return soloIndex < 0 && hidden.length < count - 1
      ? {hidden: [], solo: [id]}
      : {hidden: [], solo: []};
  }
  if (shift) return soloIndex < 0 ? {hidden: [], solo: [id]} : null;
  if (hiddenIndex >= 0) return {hidden: hidden.filter(h => h !== id), solo};
  if (soloIndex >= 0) return {hidden: [], solo: []};
  if (solo.length) {
    solo = solo.concat(id);
    return {hidden, solo: solo.length === count ? [] : solo};
  }
  hidden = hidden.concat(id);
  return {hidden: hidden.length === count ? [] : hidden, solo};
}

/** The id a series' rows are hidden and solo'd by. */
function filterId(viz: VizInstance, series: string): Id | undefined {
  const row = horizonState(viz).first.get(series);
  return row ? (viz._id(row, 0) as Id) : undefined;
}

/** Whether a series is filtered out of the chart by its row label or the legend. */
export function rowHidden(viz: VizInstance, series: string): boolean {
  const id = filterId(viz, series);
  if (id === undefined) return false;
  return (
    viz._hidden.includes(id) ||
    (viz._solo.length > 0 && !viz._solo.includes(id))
  );
}

/** The series a scene node's tick datum names, if it names one of the chart's. */
function tickSeries(viz: VizInstance, node: SceneNode): string | undefined {
  const tick = (node.datum as {data?: {id?: unknown; tick?: unknown}})?.data;
  if (node.type !== "text" || !tick || !("tick" in tick)) return;
  const series = `${tick.id}`;
  return horizonState(viz).labels.has(series) ? series : undefined;
}

/**
    HorizonChart's keyboard Tab stops (see `TabStopTest`): the y axis's row
    labels, each named for its series and what Enter does to it, such as
    "Oslo, Click to Hide".
*/
export function rowLabelTabStop(viz: VizInstance): TabStopTest {
  return (node, ancestors) => {
    const series = tickSeries(viz, node);
    if (!series || !ancestors.some(a => `${a.key}`.endsWith("plot-y-axis")))
      return undefined;
    const label = horizonState(viz).labels.get(series) ?? series;
    return `${label}, ${rowHints(viz, series, true).split("<br />")[0]}`;
  };
}

/** The painted row label for a picked scene node, with its series and surface box. */
function paintedLabel(
  viz: VizInstance,
  node: SceneNode | undefined,
): {series: string; box: Bounds} | undefined {
  const series = node && tickSeries(viz, node);
  if (!series) return;
  const target = focusTargets(
    viz._paintedScene?.root.children ?? [],
    rowLabelTabStop(viz),
  ).find(t => t.tab && (t.node === node || t.node.key === node.key));
  return target ? {series, box: target.box} : undefined;
}

/**
    The series a picked scene node labels, when it is one of the y axis's
    row labels.
    @param viz The chart.
    @param node The picked node.
*/
export function rowLabelOf(
  viz: VizInstance,
  node: SceneNode | undefined,
): string | undefined {
  return paintedLabel(viz, node)?.series;
}

/**
    A virtual anchor at a label's right edge, which the tooltip opens to the
    right of: just past the end of the label, over the chart.
    @param viz The chart.
    @param box The label's box, in surface pixels.
*/
export function labelAnchor(viz: VizInstance, box: Bounds) {
  const svg = viz._select?.node?.() as Element | undefined;
  const origin = svg?.getBoundingClientRect?.() ?? {left: 0, top: 0};
  const x = origin.left + box.x + box.width,
    top = origin.top + box.y;
  const rect = {
    x,
    y: top,
    left: x,
    right: x,
    top,
    bottom: top + box.height,
    width: 0,
    height: box.height,
  };
  return {getBoundingClientRect: () => rect, placement: "right"};
}

/** A click hint's key, or its Enter version from the keyboard. */
export function hintKey(hint: string, keyboard: boolean): string {
  return keyboard ? hint.replace("Click", "Enter") : hint;
}

/**
    The legend's click hints for a row label, by what a click would do, in
    the keyboard's Enter wording while the label has keyboard focus.
*/
export function rowHints(
  viz: VizInstance,
  series: string,
  keyboard = false,
): string {
  // The keyboard's wording swaps "Click" for "Enter" (see `hintKey`).
  const t = (s: string) => viz.schema.translate(hintKey(s, keyboard)) as string;
  const count = horizonState(viz).first.size;
  const id = filterId(viz, series);
  const hidden = rowHidden(viz, series);
  const solo = id !== undefined && viz._solo.includes(id);
  const all =
    (viz._solo.length === 1 && solo) || viz._hidden.length === count - 1;
  if (viz.schema.legendFilterInvert.bind(viz)(viz))
    return hidden || (viz._solo.length && !solo)
      ? t("Click to Highlight")
      : all
        ? t("Click to Show All")
        : `${t("Click to Highlight")}<br />${t("Shift+Click to Hide")}`;
  return hidden
    ? `${t("Click to Show")}<br />${t("Shift+Click to Highlight")}`
    : all
      ? t("Click to Show All")
      : `${t("Click to Hide")}<br />${t("Shift+Click to Highlight")}`;
}

/**
    What a row label click did to its series: `"hidden"`, `"highlighted"`
    (solo'd), or `"shown"`.
    @param next What is hidden and solo'd after the click.
    @param id The clicked row's id.
*/
export function rowChange(
  next: RowFilter,
  id: Id,
): "hidden" | "highlighted" | "shown" {
  if (next.hidden.includes(id)) return "hidden";
  return next.solo.includes(id) ? "highlighted" : "shown";
}

/** Whether an event is keyboard navigation's replay over the label it has focus on. */
function keyboardFocused(viz: VizInstance, event: SceneEvent): boolean {
  const current = viz._keyboardNav?.current;
  return current !== null && current === `${event.pick?.node?.key}`;
}

/**
    Announces `message` through keyboard navigation's live region, now and
    in place of the focused label's name when the redraw re-enters it.
*/
function announce(viz: VizInstance, message: string): void {
  const state = viz._keyboardNav;
  if (!state) return;
  state.announce = message;
  state.live.textContent = message;
}

/**
    Handles a pointer event over a row label: a hand cursor and a tooltip
    naming the series with the legend's click hints while over one, and the
    hide/show/solo on a click. Returns whether the event was over a row
    label; moving off one clears its cursor and tooltip.
    @param viz The chart.
    @param event The pointer event.
*/
export function handleRowLabel(viz: VizInstance, event: SceneEvent): boolean {
  const state = horizonState(viz);
  const label =
    event.type === "mouseleave"
      ? undefined
      : paintedLabel(viz, event.pick?.node as SceneNode | undefined);
  if (!label) {
    if (state.labelHover !== undefined) {
      state.labelHover = undefined;
      setCursor(viz, "auto");
      if (!viz._sharedHoverActive) {
        viz._tooltipClass!.data([]).render();
        restoreTooltip(viz);
      }
    }
    return false;
  }
  const {series, box} = label;
  if (event.type === "click") {
    const id = filterId(viz, series);
    const native = event.nativeEvent as MouseEvent | undefined;
    const next =
      id === undefined
        ? null
        : rowToggle(
            {hidden: viz._hidden, solo: viz._solo},
            id,
            !!native?.shiftKey,
            state.first.size,
            viz.schema.legendFilterInvert.bind(viz)(viz),
          );
    state.labelHover = undefined;
    viz._tooltipClass!.data([]).render();
    restoreTooltip(viz);
    if (next) {
      const before = legendSnapshot(viz);
      viz._hidden = next.hidden;
      viz._solo = next.solo;
      if (keyboardFocused(viz, event)) {
        const label = state.labels.get(series) ?? series;
        const change = viz.schema.translate(rowChange(next, id!)) as string;
        announce(viz, `${label} ${change}`);
      }
      recordLegendChange(viz, before);
      broadcastLegend(viz);
      viz.render!();
    }
    return true;
  }
  if (event.type !== "mousemove" && event.type !== "mouseenter") return true;
  state.labelHover = series;
  setCursor(viz, "pointer");
  prepareTooltip(viz)
    .data([state.first.get(series) as DataPoint])
    .config(
      configPrep.bind(viz as unknown as ConfigPrepHost)(
        viz.schema.tooltipConfig,
      ),
    )
    .title(() => state.labels.get(series) ?? series)
    .thead([])
    .tbody([])
    .footer(rowHints(viz, series, keyboardFocused(viz, event)))
    .position(labelAnchor(viz, box))
    .render();
  return true;
}
