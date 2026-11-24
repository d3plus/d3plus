/**
    Dashboard: one legend for every chart. The dashboard gathers the rows of
    its charts (all of them, or those `legendChart` names) and draws one
    legend of their entries: each row's entry is the value it is colored by
    (its `color`, else its top `groupBy` level), so an entry two charts share
    shows once. It hides the charts' own legends, and joins their link
    group, so clicking or hovering an entry hides, solos, or highlights it in
    every chart, and its colors match theirs.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import {isPlainObject, mergeConfig} from "../../fluent.js";
import {constantValue} from "../../utils/constant.js";
import {registerLink, unregisterLink} from "../viz/linkGroup.js";
import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {DashboardChild} from "./dashboardCharts.js";
import {dashboardLinkGroup} from "./dashboardLink.js";

/** The field holding each gathered row's legend entry. */
export const ENTRY_KEY = "__d3plusLegendEntry";

/** The field holding each gathered row's id in its own chart. */
export const ID_KEY = "__d3plusLegendId";

/** The style keys the dashboard takes from its charts when they set them. */
export const STYLE_KEYS = [
  "legendConfig",
  "legendTooltip",
  "shape",
  "shapeConfig",
] as const;

type RowFn = (d: DataPoint, i: number) => unknown;

/** What the shared legend keeps between renders. */
export interface DashboardLegendState {
  /** The charts whose entries the legend holds. */
  sources: DashboardChild[];
  /** What the gathered rows were made from, so they are made again only once it changes. */
  signature: unknown[];
  /** The style values the dashboard last wrote, to tell them from the user's own. */
  written: Record<string, unknown>;
  /** The user's own style values on the dashboard. */
  own: Record<string, unknown>;
}

/** The dashboard, as the shared legend reads and writes it. */
export type LegendHost = Viz & {
  _dashboard: {children: DashboardChild[]; legend: DashboardLegendState};
  _linkBy?: RowFn;
};

/** A new, empty shared legend state. */
export function legendState(): DashboardLegendState {
  return {sources: [], signature: [], written: {}, own: {}};
}

/** Whether a `legend` value never shows a legend (`false`, or a constant false). */
export function legendOff(value: unknown): boolean {
  if (value === false) return true;
  const constant = constantValue(value);
  return !!constant && !constant.value;
}

/** Whether a config object sets `legend`. */
function setsLegend(config: unknown): boolean {
  return !!config && typeof config === "object" && "legend" in config;
}

/** Whether a chart is itself a dashboard. */
function isDashboard(chart: unknown): boolean {
  return !!chart && typeof chart === "object" && "_dashboard" in chart;
}

/**
    The parts of `value` that differ from `base`: plain objects compared key
    by key at every depth, anything else by identity. Undefined when nothing
    differs.
*/
export function userSet(value: unknown, base: unknown): unknown {
  if (isPlainObject(value) && isPlainObject(base)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const diff = userSet(value[key], base[key]);
      if (diff !== undefined) out[key] = diff;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return value === base ? undefined : value;
}

/**
    One style value from what each chart set (`sets`, in reading order) over
    the dashboard's default: an object merges key by key with the earlier
    chart winning where two set the same key; anything else is the first
    chart's. The dashboard's own (`own`) wins over every chart's.
*/
export function combineStyle(
  base: unknown,
  sets: unknown[],
  own: unknown,
): unknown {
  const given = sets.filter(v => v !== undefined);
  if (isPlainObject(base)) {
    let out = mergeConfig(base, {});
    for (const v of given.slice().reverse())
      if (isPlainObject(v)) out = mergeConfig(out, v);
    return isPlainObject(own) ? mergeConfig(out, own) : out;
  }
  return own !== undefined ? own : given.length ? given[0] : base;
}

/**
    The value each of a chart's rows is a legend entry for: the chart's
    `color` when it sets one (and colors by category, not a colorScale),
    else its top `groupBy` level.
*/
export function entryAccessor(chart: {schema: Record<string, unknown>}): RowFn {
  const {color, groupBy} = chart.schema;
  if (typeof color === "function") return color as RowFn;
  const levels = Array.isArray(groupBy) ? (groupBy as RowFn[]) : [];
  return levels[0] ?? ((d: DataPoint) => d.id);
}

/** A chart's id for each of its rows: its deepest `groupBy` level. */
export function idAccessor(chart: {schema: Record<string, unknown>}): RowFn {
  const levels = Array.isArray(chart.schema.groupBy)
    ? (chart.schema.groupBy as RowFn[])
    : [];
  return levels[levels.length - 1] ?? ((d: DataPoint) => d.id);
}

/** The rows a chart draws from: its data as given, or as loaded when it was given a URL. */
export function chartRows(chart: {_userData?: unknown; _data?: unknown}) {
  if (Array.isArray(chart._userData)) return chart._userData as DataPoint[];
  return Array.isArray(chart._data) ? (chart._data as DataPoint[]) : [];
}

/**
    Every chart's rows, each with its legend entry (`ENTRY_KEY`) and its id
    in its own chart (`ID_KEY`). Rows without an entry are left out.
*/
export function gatherRows(
  charts: {
    schema: Record<string, unknown>;
    _userData?: unknown;
    _data?: unknown;
  }[],
): DataPoint[] {
  const out: DataPoint[] = [];
  for (const chart of charts) {
    const entry = entryAccessor(chart),
      id = idAccessor(chart);
    chartRows(chart).forEach((d, i) => {
      const value = entry(d, i);
      if (value === undefined || value === null) return;
      out.push({
        ...d,
        [ENTRY_KEY]: value,
        [ID_KEY]: id(d, i),
      } as unknown as DataPoint);
    });
  }
  return out;
}

/**
    The charts whose entries the legend holds: those `pick` names (an index
    or a list of indices into `charts`), else every chart whose own legend
    is on. A chart that is itself a dashboard draws its own legend, and a
    chart colored by a `colorScale` is keyed by its colorScale, so neither
    is ever one.
*/
export function legendSources(
  owns: {
    legend: unknown;
    eligible: boolean;
    dashboard: boolean;
    scaled?: boolean;
  }[],
  pick: unknown,
): number[] {
  const picked = (Array.isArray(pick) ? pick : [pick]).filter(
    (i): i is number => typeof i === "number" && !!owns[i],
  );
  const all = owns.map((_, i) => i);
  const chosen = picked.length
    ? picked
    : all.filter(i => owns[i].eligible && !legendOff(owns[i].legend));
  return chosen.filter(i => !owns[i].dashboard && !owns[i].scaled);
}

/** A chart's own `legend`, whether or not the dashboard is standing in for it. */
function ownLegend(child: DashboardChild): unknown {
  return child.ownLegend ? child.ownLegend.value : child.chart.schema.legend;
}

/**
    Takes the style the source charts set (`STYLE_KEYS`) onto the dashboard,
    under any the user set on the dashboard itself.
*/
function adoptStyle(dashboard: LegendHost, sources: Viz[]): void {
  const state = dashboard._dashboard.legend;
  const schema = dashboard.schema as Record<string, unknown>;
  const mine = dashboard._defaultConfig() as Record<string, unknown>;
  for (const key of STYLE_KEYS) {
    if (key in state.written && schema[key] !== state.written[key])
      state.own[key] = schema[key];
    else if (!(key in state.written)) state.own[key] = schema[key];
    const own = userSet(state.own[key], mine[key]);
    const sets = sources.map(chart =>
      userSet(
        chart.schema[key],
        (chart._defaultConfig() as Record<string, unknown>)[key],
      ),
    );
    const value = combineStyle(mine[key], sets, own);
    schema[key] = value;
    state.written[key] = schema[key];
  }
}

/** Gives the dashboard `rows` when what they are made from has changed. */
function adoptRows(dashboard: LegendHost, sources: Viz[]): void {
  const state = dashboard._dashboard.legend;
  const signature = sources.flatMap(chart => [
    chartRows(chart as never),
    entryAccessor(chart),
    idAccessor(chart),
  ]);
  const same =
    signature.length === state.signature.length &&
    signature.every((v, i) => v === state.signature[i]);
  if (same) return;
  state.signature = signature;
  dashboard.data(gatherRows(sources));
}

/**
    Readies the shared legend for a render: hides the charts' own legends
    (unless their own config or `chartConfig` sets `legend`, or the
    dashboard's `legend` is off), gathers the source charts' rows and the
    style they set, and joins the charts' link group, matching rows on their
    entry and on their chart's id.
*/
export function syncDashboardLegend(dashboard: LegendHost): void {
  const state = dashboard._dashboard.legend;
  const on = !legendOff(dashboard.schema.legend);
  const shared = dashboard.schema.chartConfig;
  const children = dashboard._dashboard.children;
  const owns = children.map(child => {
    const pinned = setsLegend(child.config) || setsLegend(shared);
    const nested = isDashboard(child.chart);
    const hide = on && !pinned && !nested;
    if (hide && !child.ownLegend) {
      child.ownLegend = {value: child.chart.schema.legend};
      child.chart.legend(false);
      child.dirty = true;
    } else if (!hide && child.ownLegend) {
      child.chart.legend(child.ownLegend.value as never);
      child.ownLegend = undefined;
      child.dirty = true;
    }
    return {
      legend: ownLegend(child),
      eligible: !pinned,
      dashboard: nested,
      scaled: Boolean(child.chart.schema.colorScale),
    };
  });
  const sources = on
    ? legendSources(owns, dashboard.schema.legendChart).map(i => children[i])
    : [];
  state.sources = sources;
  const charts = sources.map(c => c.chart);
  adoptRows(dashboard, charts);
  adoptStyle(dashboard, charts);
  dashboard._linkBy = (d: DataPoint) => [d[ENTRY_KEY], d[ID_KEY]];
  const group = dashboardLinkGroup(dashboard.schema.link);
  if (group && sources.length && dashboard._linkGroup !== group)
    registerLink(dashboard as unknown as VizInstance);
  else if (!group || !sources.length)
    unregisterLink(dashboard as unknown as VizInstance);
}

/**
    Sets up the dashboard to draw its gathered rows as legend entries:
    grouped by entry, then by each chart's id, and colored by entry.
*/
export function legendGrouping(dashboard: {
  groupBy(_: string[]): unknown;
  color(_: string): unknown;
}): void {
  dashboard.groupBy([ENTRY_KEY, ID_KEY]);
  dashboard.color(ENTRY_KEY);
}
