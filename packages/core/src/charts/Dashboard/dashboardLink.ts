/**
    Dashboard: the link group its charts share (see `link`).

    @module
*/
import type {DashboardChild} from "./dashboardCharts.js";

/** The link group the dashboard's charts share, or false when they aren't linked. */
export function dashboardLinkGroup(link: unknown): string | false {
  if (typeof link === "string") return link || false;
  if (link && typeof link === "object") {
    const group = (link as {group?: unknown}).group;
    return typeof group === "string" && group ? group : false;
  }
  return false;
}

/** The prefix of the link group a dashboard makes for its charts. */
export const DASHBOARD_LINK_PREFIX = "d3plus-dashboard-";

/** Whether `link` is the group a dashboard made for its charts (not one set by hand). */
export function isDashboardLink(link: unknown): boolean {
  return (
    typeof link === "string" &&
    link.startsWith(DASHBOARD_LINK_PREFIX) &&
    /^\d+$/.test(link.slice(DASHBOARD_LINK_PREFIX.length))
  );
}

/**
    Puts `child` in the dashboard's link group, unless it has a `link` of its
    own (a nested dashboard's own group counts as none, so its charts join the
    outer dashboard's); takes it back out when the dashboard's charts stop being
    linked.
*/
export function linkChild(
  dashboard: {schema: {link?: unknown}},
  child: DashboardChild,
): void {
  const group = dashboardLinkGroup(dashboard.schema.link);
  const chart = child.chart;
  const own = chart.schema.link;
  const nested = "_dashboard" in chart && isDashboardLink(own);
  if (own && own !== child.linked && !nested) return;
  if (group && own !== group) {
    chart.link(group);
    child.linked = group;
  } else if (!group && child.linked) {
    chart.link(false);
    child.linked = undefined;
  }
}
