/**
    Dashboard: readying its charts before it draws — reading `charts` into
    chart instances, passing its settings down, linking them, and standing
    one legend in for theirs.

    @module
*/
import {applyChartConfig, syncDashboardCharts} from "./dashboardCharts.js";
import {syncDashboardLegend} from "./dashboardLegend.js";
import type {LegendHost} from "./dashboardLegend.js";
import {linkChild} from "./dashboardLink.js";
import {removeDashboardChart} from "./dashboardRender.js";

/**
    What every chart in a dashboard takes from it, before `chartConfig` and
    its own config: the dashboard's renderer, theme, and locale.
*/
export function inheritedConfig(dashboard: {
  _renderer?: string;
  schema: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    renderer: dashboard._renderer ?? "svg",
    theme: dashboard.schema.theme,
    locale: dashboard.schema.locale,
  };
}

/**
    Readies the dashboard's charts for a render: reads `charts` (tearing
    down the charts no longer listed), applies the dashboard's settings,
    `chartConfig`, and each chart's own config, links the charts, and syncs
    the shared legend.
*/
export function prepareDashboard(dashboard: LegendHost): void {
  const state = dashboard._dashboard;
  const charts = dashboard.schema.charts;
  const {children, removed} = syncDashboardCharts(
    dashboard,
    Array.isArray(charts) ? charts : [],
    state.children,
  );
  removed.forEach(removeDashboardChart);
  state.children = children;
  const inherited = inheritedConfig(dashboard);
  const shared = dashboard.schema.chartConfig as
    Record<string, unknown> | undefined;
  for (const child of children) {
    applyChartConfig(child, inherited, shared);
    linkChild(dashboard, child);
  }
  syncDashboardLegend(dashboard);
}
