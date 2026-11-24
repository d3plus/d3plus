/**
    Dashboard: one legend for every chart. The dashboard draws the legend of
    one of its charts (`legendChart`, or the first whose legend is on), from
    that chart's data, grouping, and colors, and hides the charts' own. It
    joins the charts' link group, so clicking or hovering its entries hides,
    solos, or highlights them in every chart, and their colors match.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import {constantValue} from "../../utils/constant.js";
import {registerLink, unregisterLink} from "../viz/linkGroup.js";
import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {DashboardChild} from "./dashboardCharts.js";
import {dashboardLinkGroup} from "./dashboardLink.js";

/** A legend rule: whether the legend shows, given its entries. */
type LegendRule = (config: unknown, arr: DataPoint[]) => unknown;

/** What the shared legend keeps between renders. */
export interface DashboardLegendState {
  /** The chart whose legend the dashboard draws. */
  source?: DashboardChild;
  /** The source's own legend rule, when it isn't the chart default. */
  rule?: LegendRule;
  /** The data and grouping last taken from the source. */
  data?: unknown;
  groupBy?: unknown;
  /** Set on a dashboard inside another that draws one legend for both: its charts' legends stay hidden, and it draws none. */
  collected?: boolean;
}

/** The dashboard, as the shared legend reads and writes it. */
export type LegendHost = Viz & {
  _dashboard: {children: DashboardChild[]; legend: DashboardLegendState};
};

/** The config keys the dashboard takes from its legend's chart when that chart sets them. */
export const ADOPTED_KEYS = [
  "color",
  "depth",
  "label",
  "legendFilterInvert",
  "legendSort",
  "threshold",
  "thresholdKey",
  "thresholdName",
];

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
    The index of the chart whose legend the dashboard draws: `pick` when it
    names a chart that isn't itself a dashboard, else the first chart whose
    legend the dashboard may take (`eligible`) and whose own legend is on.
    -1 for none.
*/
export function legendSourceIndex(
  owns: {legend: unknown; eligible: boolean; dashboard: boolean}[],
  pick: unknown,
): number {
  if (
    typeof pick === "number" &&
    Number.isInteger(pick) &&
    owns[pick] &&
    !owns[pick].dashboard
  )
    return pick;
  return owns.findIndex(
    o => o.eligible && !o.dashboard && !legendOff(o.legend),
  );
}

/** A chart's own `legend`, whether or not the dashboard is standing in for it. */
function ownLegend(child: DashboardChild): unknown {
  return child.ownLegend ? child.ownLegend.value : child.chart.schema.legend;
}

/**
    Takes the source chart's data, grouping, and the config it sets of
    `ADOPTED_KEYS`, so the dashboard's legend rolls up and colors the same
    entries; keys the source leaves at their default go back to the
    dashboard's.
*/
function adoptSource(dashboard: LegendHost, source: Viz): void {
  const state = dashboard._dashboard.legend;
  const own = source._defaultConfig() as Record<string, unknown>;
  const mine = dashboard._defaultConfig() as Record<string, unknown>;
  const schema = dashboard.schema as Record<string, unknown>;
  for (const key of ADOPTED_KEYS) {
    if (!(key in source.schema)) continue;
    const value = source.schema[key];
    schema[key] = value === own[key] ? mine[key] : value;
  }
  schema.aggs = {...(source.schema.aggs as object)};
  schema.dataFormat = source.schema.dataFormat;
  const groupBy = (source as {_groupByRaw?: unknown})._groupByRaw;
  if (groupBy !== state.groupBy) {
    state.groupBy = groupBy;
    dashboard.groupBy((groupBy ?? mine.groupBy) as never);
  }
  const data = (source as {_userData?: unknown})._userData ?? [];
  if (data !== state.data) {
    state.data = data;
    dashboard.data(data as DataPoint[]);
  }
}

/**
    Readies the shared legend for a render: hides the charts' own legends
    (unless their own config or `chartConfig` sets `legend`, or the
    dashboard's `legend` is off), picks the chart whose legend it draws,
    takes that chart's data and grouping, and joins the charts' link group.
*/
export function syncDashboardLegend(dashboard: LegendHost): void {
  const state = dashboard._dashboard.legend;
  const on = !legendOff(dashboard.schema.legend);
  const hide = on || !!state.collected;
  const shared = dashboard.schema.chartConfig;
  const children = dashboard._dashboard.children;
  const owns = children.map(child => {
    const pinned = setsLegend(child.config) || setsLegend(shared);
    const nested = isDashboard(child.chart);
    if (nested)
      (child.chart as unknown as LegendHost)._dashboard.legend.collected = hide;
    if (hide && !pinned && !child.ownLegend) {
      child.ownLegend = {value: child.chart.schema.legend};
      child.chart.legend(false);
    } else if ((!hide || pinned) && child.ownLegend) {
      child.chart.legend(child.ownLegend.value as never);
      child.ownLegend = undefined;
    }
    return {legend: ownLegend(child), eligible: !pinned, dashboard: nested};
  });
  const index = on ? legendSourceIndex(owns, dashboard.schema.legendChart) : -1;
  const source = children[index];
  state.source = source;
  if (!source) {
    state.rule = undefined;
    if (state.data !== undefined && (state.data as unknown[]).length !== 0) {
      state.data = [];
      dashboard.data([]);
    }
    unregisterLink(dashboard as unknown as VizInstance);
    return;
  }
  // A chart's default rule reads the chart as it last drew, so only a rule
  // of the user's own carries over (not one turning the legend off, when
  // `legendChart` names the chart outright).
  const rule = owns[index].legend;
  const chartDefault = (source.chart._defaultConfig() as {legend?: unknown})
    .legend;
  state.rule =
    typeof rule === "function" &&
    !legendOff(rule) &&
    rule !== chartDefault &&
    rule !== source.chart._defaultLegend
      ? (rule as LegendRule)
      : undefined;
  adoptSource(dashboard, source.chart);
  const group = dashboardLinkGroup(dashboard.schema.link);
  if (group && dashboard._linkGroup !== group)
    registerLink(dashboard as unknown as VizInstance);
  else if (!group) unregisterLink(dashboard as unknown as VizInstance);
}

/**
    The dashboard's `legend` rule: the rule the user gave the legend's chart,
    if any, else the default rule, which shows a legend of two or more
    entries (a chart's own default rule reads that chart's draw, so the
    dashboard doesn't borrow it).
*/
export function dashboardLegendRule(viz: VizInstance): LegendRule {
  return function (config: unknown, arr: DataPoint[]) {
    const state = (viz as unknown as Partial<LegendHost>)._dashboard?.legend;
    const rule = state?.rule;
    const fallback = viz._defaultLegend as LegendRule | undefined;
    if (rule) return rule.call(viz, config, arr);
    return fallback ? fallback.call(viz, config, arr) : arr.length > 1;
  };
}
