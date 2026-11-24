/**
    Dashboard: drawing its charts. Each chart draws into an element of its own,
    placed over its cell of the dashboard, so it keeps everything it does on
    its own (tooltips, zoom, timeline, keyboard navigation, data loading);
    the dashboard sizes them, lines up their plot areas, and tracks when they
    have all drawn.

    @module
*/
import type Viz from "../viz/Viz.js";
import {NO_SIDES} from "./dashboardAlign.js";
import type {DashboardSides} from "./dashboardAlign.js";
import type {DashboardChild} from "./dashboardCharts.js";
import type {DashboardLegendState} from "./dashboardLegend.js";
import {resolveDashboardLayout} from "./dashboardGrid.js";
import type {DashboardArea, DashboardCell} from "./dashboardGrid.js";
import {
  dropStaleShares,
  recordReadings,
  settleDashboardCharts,
} from "./dashboardSettle.js";

/** The class on the element holding a dashboard's charts. */
export const DASHBOARD_CHARTS_CLASS = "d3plus-dashboard-charts";

/** The class on each chart's element. */
export const DASHBOARD_CHART_CLASS = "d3plus-dashboard-chart";

/** What a dashboard keeps between renders. */
export interface DashboardState {
  children: DashboardChild[];
  /** The shared legend (see `dashboardLegend.ts`). */
  legend: DashboardLegendState;
  /** The element holding the charts' elements. */
  host?: HTMLDivElement;
  /** Whether drawing the charts is queued. */
  queued: boolean;
  /** Whether settling the charts (shared axes, lined-up plot areas) is queued. */
  settling: boolean;
  /** Chart renders whose callback hasn't run yet. */
  pending: number;
  /** Called once no chart render is pending. */
  waiters: (() => void)[];
}

/** The dashboard, as the functions here read it. */
export interface DashboardHost {
  _dashboard: DashboardState;
  _select?: Viz["_select"];
  _renderer?: "svg" | "canvas";
  schema: Viz["schema"];
}

/** A new, empty dashboard state. */
export function dashboardState(): DashboardState {
  return {
    children: [],
    legend: {},
    queued: false,
    settling: false,
    pending: 0,
    waiters: [],
  };
}

/** `cell` shrunk by `inset` on each side. */
export function insetBox(
  cell: DashboardArea,
  inset: DashboardSides,
): DashboardArea {
  return {
    x: cell.x + inset.left,
    y: cell.y + inset.top,
    width: Math.max(0, cell.width - inset.left - inset.right),
    height: Math.max(0, cell.height - inset.top - inset.bottom),
  };
}

/** Positions an absolutely placed element over `box`. */
function place(node: HTMLElement, box: DashboardArea): void {
  node.style.left = `${box.x}px`;
  node.style.top = `${box.y}px`;
  node.style.width = `${box.width}px`;
  node.style.height = `${box.height}px`;
}

/**
    The element holding the charts: placed over the dashboard's own surface,
    after it in the page so the charts draw above the dashboard's background
    (and are tabbed to after its controls), and letting the pointer through
    everywhere but the charts.
*/
function ensureHost(dashboard: DashboardHost): HTMLDivElement | undefined {
  const svg = dashboard._select?.node?.() as SVGElement | undefined;
  const parent = svg?.parentNode as HTMLElement | null | undefined;
  if (!svg || !parent) return undefined;
  let host = dashboard._dashboard.host;
  if (!host || host.parentNode !== parent) {
    host?.remove();
    host = parent.ownerDocument.createElement("div");
    host.className = DASHBOARD_CHARTS_CLASS;
    host.style.position = "absolute";
    host.style.pointerEvents = "none";
    dashboard._dashboard.host = host;
  }
  host.style.top = svg.style.top || "0px";
  host.style.left = svg.style.left || "0px";
  if (host !== parent.lastElementChild) parent.appendChild(host);
  return host;
}

/** Runs the dashboard's waiters once no chart render is pending. */
function settle(state: DashboardState): void {
  if (state.pending > 0) return;
  const waiters = state.waiters.splice(0);
  for (const fn of waiters) fn();
}

/**
    Resolves once every chart render the dashboard started has run its
    callback (straight away when none is pending).
*/
export function dashboardSettled(state: DashboardState): Promise<void> {
  return new Promise(resolve => {
    state.waiters.push(resolve);
    settle(state);
  });
}

/** Sizes `child`'s element and chart to its cell (less its inset), and renders it. */
function drawChild(dashboard: DashboardHost, child: DashboardChild): void {
  const state = dashboard._dashboard;
  if (!child.cell || !child.node) return;
  const box = insetBox(child.cell, child.inset);
  place(child.node, box);
  const chart = child.chart;
  chart.width(box.width).height(box.height);
  child.drawn = false;
  state.pending++;
  let done = false;
  chart.render(() => {
    if (done) return;
    done = true;
    state.pending--;
    settle(state);
  });
}

/**
    Readies `child`'s element (in `host`, in reading order) and points its
    chart at it. A chart in a dashboard draws when the dashboard does and at
    the size the dashboard gives it, so it neither waits to scroll into view
    nor watches its own size.
*/
function prepareChild(
  dashboard: DashboardHost,
  child: DashboardChild,
  host: HTMLDivElement,
): void {
  if (!child.node) {
    const node = host.ownerDocument.createElement("div");
    node.className = DASHBOARD_CHART_CLASS;
    node.style.position = "absolute";
    node.style.pointerEvents = "auto";
    child.node = node;
  }
  host.appendChild(child.node);
  const chart = child.chart;
  const current = chart._select?.node?.() as Element | undefined;
  if (!current || (current !== child.node && current.parentNode !== child.node))
    chart.select(child.node);
  if (chart.schema.detectVisible) chart.detectVisible(false);
  if (chart.schema.detectResize) chart.detectResize(false);
  chart._onDrawn = () => {
    child.drawn = true;
    recordReadings(child);
    queueSettle(dashboard);
  };
}

/**
    Draws every chart in its cell. Called once the dashboard has laid out
    (queued, so the dashboard's own draw has painted first).
*/
export function drawDashboardCharts(
  dashboard: DashboardHost,
  cells: DashboardCell[],
): void {
  const state = dashboard._dashboard;
  const host = ensureHost(dashboard);
  if (!host) return;
  const width = dashboard.schema.width as number,
    height = dashboard.schema.height as number;
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  // A chart keeps its inset and shared axes through a new layout, so it
  // doesn't jump before settling again.
  const {align} = resolveDashboardLayout(dashboard.schema.layoutConfig);
  dropStaleShares(state.children);
  state.children.forEach((child, i) => {
    child.cell = cells[i];
    child.aligned = 0;
    child.shared = 0;
    if (!align) child.inset = {...NO_SIDES};
    prepareChild(dashboard, child, host);
  });
  for (const child of state.children) drawChild(dashboard, child);
}

/** Queues `drawDashboardCharts` after the current draw, once however often it is asked for. */
export function queueDashboardCharts(
  dashboard: DashboardHost,
  cells: () => DashboardCell[],
): void {
  const state = dashboard._dashboard;
  if (state.queued) return;
  state.queued = true;
  queueMicrotask(() => {
    state.queued = false;
    drawDashboardCharts(dashboard, cells());
  });
}

/** Queues settling the charts, once however many finish drawing together. */
function queueSettle(dashboard: DashboardHost): void {
  const state = dashboard._dashboard;
  if (state.settling) return;
  state.settling = true;
  queueMicrotask(() => {
    state.settling = false;
    settleDashboardCharts(dashboard, child => drawChild(dashboard, child));
  });
}

/** Tears down `child`: its chart (if the dashboard made or owns it) and its element. */
export function removeDashboardChart(child: DashboardChild): void {
  child.chart._onDrawn = undefined;
  child.chart.destroy();
  child.node?.remove();
  child.node = undefined;
}
