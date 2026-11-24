/**
    Figure: turning its `charts` config into chart instances, reusing the
    instances it made for the same entries on an earlier render.

    @module
*/
import {isPlainObject} from "../../fluent.js";
import {warnConfigOnce} from "../../utils/configWarnings.js";
import {chartClass} from "../definition/chartRegistry.js";
import type Viz from "../viz/Viz.js";
import {NO_SIDES} from "./figureAlign.js";
import type {FigureSides} from "./figureAlign.js";
import type {FigureCell} from "./figureGrid.js";
import type {FigurePlacement} from "./figureTypes.js";

/** One of a Figure's `charts`, read: where its chart comes from, its config, and its place. */
export interface FigureEntry {
  /** The instance, class, or class name the chart comes from. */
  source: unknown;
  config?: Record<string, unknown>;
  placement: FigurePlacement;
}

/** A chart the figure draws, and what it keeps between renders. */
export interface FigureChild {
  /** What the chart was made from (see `FigureEntry.source`). */
  source: unknown;
  chart: Viz;
  /** Whether the figure made the chart (from a class or name) rather than being handed it. */
  owned: boolean;
  placement: FigurePlacement;
  /** The entry's config. */
  config?: Record<string, unknown>;
  /** The entry config and `chartConfig` last applied, so they are applied again only once one changes. */
  applied?: {
    config?: Record<string, unknown>;
    shared?: Record<string, unknown>;
  };
  /** The link group the figure put the chart in, if it did. */
  linked?: string;
  /** The chart's cell, once laid out. */
  cell?: FigureCell;
  /** How far the chart's box is shrunk inside its cell, to line up plot areas. */
  inset: FigureSides;
  /** The element the chart draws into. */
  node?: HTMLDivElement;
  /** Whether the chart has drawn since the figure last rendered it. */
  drawn: boolean;
  /** How many times it has been redrawn to line up, since the figure last laid out. */
  aligned: number;
}

/** Whether `value` is a chart instance a figure can draw. */
export function isChartInstance(value: unknown): value is Viz {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.render === "function" &&
    typeof v.select === "function" &&
    typeof v.config === "function" &&
    typeof v.destroy === "function"
  );
}

const PLACEMENT_KEYS = ["column", "row", "columnSpan", "rowSpan"] as const;

/**
    Reads one of the `charts` values: a chart instance, or an object with a
    `chart` (instance, class, or class name) and optional `config` and
    placement. Undefined for anything else.
*/
export function figureEntry(value: unknown): FigureEntry | undefined {
  if (isChartInstance(value)) return {source: value, placement: {}};
  if (!isPlainObject(value) || !("chart" in value)) return undefined;
  const placement: FigurePlacement = {};
  for (const key of PLACEMENT_KEYS) {
    const v = value[key];
    if (typeof v === "number" && Number.isFinite(v)) placement[key] = v;
  }
  const config = isPlainObject(value.config) ? value.config : undefined;
  return {source: value.chart, config, placement};
}

/** The class a source names (a class, or a registered class name), if any. */
export function sourceClass(source: unknown): (new () => Viz) | undefined {
  if (typeof source === "function") return source as new () => Viz;
  if (typeof source === "string")
    return chartClass(source) as (new () => Viz) | undefined;
  return undefined;
}

/**
    Whether `child` can stand for `entry`: the same instance, or a chart the
    figure made from the same class.
*/
export function reuses(child: FigureChild, entry: FigureEntry): boolean {
  if (isChartInstance(entry.source)) return child.chart === entry.source;
  const Chart = sourceClass(entry.source);
  return (
    child.owned &&
    !!Chart &&
    Object.getPrototypeOf(child.chart) === Chart.prototype
  );
}

/** A new chart for `entry`, or undefined (with a warning) when it names no chart. */
function makeChild(owner: object, entry: FigureEntry): FigureChild | undefined {
  let chart: Viz | undefined;
  let owned = false;
  if (isChartInstance(entry.source)) chart = entry.source;
  else {
    const Chart = sourceClass(entry.source);
    if (Chart) {
      chart = new Chart();
      owned = true;
    }
  }
  if (!chart || !isChartInstance(chart)) {
    warnConfigOnce(
      owner,
      `figureChart:${String(entry.source)}`,
      `Figure: ${typeof entry.source === "string" ? `"${entry.source}" is not a d3plus chart` : "a chart in `charts` is not a d3plus chart instance, class, or class name"}; it is left out.`,
    );
    return undefined;
  }
  return {
    source: entry.source,
    chart,
    owned,
    placement: entry.placement,
    inset: {...NO_SIDES},
    drawn: false,
    aligned: 0,
  };
}

/**
    The figure's charts for `values` (its `charts` config), reusing what it
    can of `previous`: the same instance wherever it was, or a chart made
    from the same class at the same index. Returns the charts, and those of
    `previous` left out (for the caller to tear down).
*/
export function syncFigureCharts(
  owner: object,
  values: unknown[],
  previous: FigureChild[],
): {children: FigureChild[]; removed: FigureChild[]} {
  const free = new Set(previous);
  const children: FigureChild[] = [];
  values.forEach((value, i) => {
    const entry = figureEntry(value);
    if (!entry) {
      warnConfigOnce(
        owner,
        `figureEntry:${i}`,
        `Figure: charts[${i}] is not a chart or a {chart, config} object; it is left out.`,
      );
      return;
    }
    const match = isChartInstance(entry.source)
      ? previous.find(c => free.has(c) && reuses(c, entry))
      : previous[i] && free.has(previous[i]) && reuses(previous[i], entry)
        ? previous[i]
        : undefined;
    const child = match ?? makeChild(owner, entry);
    if (!child) return;
    free.delete(child);
    child.source = entry.source;
    child.placement = entry.placement;
    child.config = entry.config;
    children.push(child);
  });
  return {children, removed: Array.from(free)};
}

/**
    Applies `shared` (the figure's `chartConfig`) and then the chart's own
    config to its chart, when either has changed since they were last
    applied: its own config wins where the two set the same key.
*/
export function applyChartConfig(
  child: FigureChild,
  shared: Record<string, unknown> | undefined,
): void {
  const last = child.applied;
  if (last && last.shared === shared && last.config === child.config) return;
  if (shared && Object.keys(shared).length) child.chart.config(shared);
  if (child.config) child.chart.config(child.config);
  child.applied = {config: child.config, shared};
}
