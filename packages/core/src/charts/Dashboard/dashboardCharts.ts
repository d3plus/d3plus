/**
    Dashboard: turning its `charts` config into chart instances, reusing the
    instances it made for the same entries on an earlier render.

    @module
*/
import {isPlainObject} from "../../fluent.js";
import {warnConfigOnce} from "../../utils/configWarnings.js";
import {chartClass} from "../definition/chartRegistry.js";
import type Viz from "../viz/Viz.js";
import {NO_SIDES} from "./dashboardAlign.js";
import type {DashboardSides} from "./dashboardAlign.js";
import type {DashboardCell} from "./dashboardGrid.js";
import type {AxisReading, ChartShare, ShareAxis} from "./dashboardShare.js";
import type {DashboardPlacement} from "./dashboardTypes.js";

/** One of a Dashboard's `charts`, read: where its chart comes from, its config, and its place. */
export interface DashboardEntry {
  /** The instance, class, or class name the chart comes from. */
  source: unknown;
  config?: Record<string, unknown>;
  placement: DashboardPlacement;
}

/** A chart the dashboard draws, and what it keeps between renders. */
export interface DashboardChild {
  /** What the chart was made from (see `DashboardEntry.source`). */
  source: unknown;
  chart: Viz;
  /** Whether the dashboard made the chart (from a class or name) rather than being handed it. */
  owned: boolean;
  placement: DashboardPlacement;
  /** The entry's config. */
  config?: Record<string, unknown>;
  /** The settings passed down, `chartConfig`, and entry config last applied, so they are applied again only once one changes. */
  applied?: {
    inherited: Record<string, unknown>;
    config?: Record<string, unknown>;
    shared?: Record<string, unknown>;
  };
  /** The link group the dashboard put the chart in, if it did. */
  linked?: string;
  /** The chart's cell, once laid out. */
  cell?: DashboardCell;
  /** How far the chart's box is shrunk inside its cell, to line up plot areas. */
  inset: DashboardSides;
  /** The element the chart draws into. */
  node?: HTMLDivElement;
  /** Whether the chart has drawn since the dashboard last rendered it. */
  drawn: boolean;
  /** How many times it has been redrawn to line up, since the dashboard last laid out. */
  aligned: number;
  /** How many times it has been redrawn to share axes, since the dashboard last laid out. */
  shared: number;
  /** Its own domains, read from a draw that didn't share them. */
  readings: Partial<Record<ShareAxis, AxisReading>>;
  /** The axes it shares with other charts, and which of their labels it hides. */
  share?: ChartShare;
  /** Its axis configs from before the dashboard hid their labels. */
  axisConfig: Partial<Record<ShareAxis, Record<string, unknown> | undefined>>;
  /** Its own `legend`, while the dashboard's legend stands in for it. */
  ownLegend?: {value: unknown};
}

/** Whether `value` is a chart instance a dashboard can draw. */
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
export function dashboardEntry(value: unknown): DashboardEntry | undefined {
  if (isChartInstance(value)) return {source: value, placement: {}};
  if (!isPlainObject(value) || !("chart" in value)) return undefined;
  const placement: DashboardPlacement = {};
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
    dashboard made from the same class.
*/
export function reuses(child: DashboardChild, entry: DashboardEntry): boolean {
  if (isChartInstance(entry.source)) return child.chart === entry.source;
  const Chart = sourceClass(entry.source);
  return (
    child.owned &&
    !!Chart &&
    Object.getPrototypeOf(child.chart) === Chart.prototype
  );
}

/** A new chart for `entry`, or undefined (with a warning) when it names no chart. */
function makeChild(
  owner: object,
  entry: DashboardEntry,
): DashboardChild | undefined {
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
      `dashboardChart:${String(entry.source)}`,
      `Dashboard: ${typeof entry.source === "string" ? `"${entry.source}" is not a d3plus chart` : "a chart in `charts` is not a d3plus chart instance, class, or class name"}; it is left out.`,
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
    shared: 0,
    readings: {},
    axisConfig: {},
  };
}

/**
    The dashboard's charts for `values` (its `charts` config), reusing what it
    can of `previous`: the same instance wherever it was, or a chart made
    from the same class at the same index. Returns the charts, and those of
    `previous` left out (for the caller to tear down).
*/
export function syncDashboardCharts(
  owner: object,
  values: unknown[],
  previous: DashboardChild[],
): {children: DashboardChild[]; removed: DashboardChild[]} {
  const free = new Set(previous);
  const children: DashboardChild[] = [];
  values.forEach((value, i) => {
    const entry = dashboardEntry(value);
    if (!entry) {
      warnConfigOnce(
        owner,
        `dashboardEntry:${i}`,
        `Dashboard: charts[${i}] is not a chart or a {chart, config} object; it is left out.`,
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

/** Whether two flat objects hold the same values under the same keys. */
export function sameValues(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length && keys.every(k => a[k] === b[k])
  );
}

/**
    Applies to `child`'s chart what the dashboard passes down (`inherited`:
    its renderer, theme, and locale), then `shared` (the dashboard's
    `chartConfig`), then the chart's own config, when any of them has
    changed since they were last applied: the later ones win where they set
    the same key.
*/
export function applyChartConfig(
  child: DashboardChild,
  inherited: Record<string, unknown>,
  shared: Record<string, unknown> | undefined,
): void {
  const last = child.applied;
  if (
    last &&
    last.shared === shared &&
    last.config === child.config &&
    sameValues(last.inherited, inherited)
  )
    return;
  const base = {...inherited, ...shared};
  if (Object.keys(base).length) child.chart.config(base);
  if (child.config) child.chart.config(child.config);
  child.applied = {inherited, config: child.config, shared};
}
