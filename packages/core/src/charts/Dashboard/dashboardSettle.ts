/**
    Dashboard: once every chart has drawn, sharing axes between them (see
    `dashboardShare.ts`) and then lining up their plot areas (see
    `dashboardAlign.ts`), redrawing the charts either changes.

    @module
*/
import type {VizInstance} from "../viz/vizTypes.js";
import {alignCells, plotInsets, sidesChanged} from "./dashboardAlign.js";
import type {DashboardChild} from "./dashboardCharts.js";
import {resolveDashboardLayout} from "./dashboardGrid.js";
import {
  hiddenAxisConfig,
  planShares,
  readAxis,
  sameShare,
  SHARE_AXES,
  shareScales,
} from "./dashboardShare.js";
import type {ChartShare, ShareAxis} from "./dashboardShare.js";

/** How many times a chart may redraw to share axes, and to line up, after one layout. */
const PASSES = 2;

/** What settling reads from the dashboard. */
export interface SettleHost {
  _dashboard: {children: DashboardChild[]};
  schema: {layoutConfig?: unknown};
}

/** A chart as settling reads and writes it. */
type Chart = VizInstance & {
  _xConfig?: Record<string, unknown>;
  _yConfig?: Record<string, unknown>;
};

/** An axis's config slot on a chart. */
function axisConfig(chart: Chart, axis: ShareAxis) {
  return axis === "x" ? chart._xConfig : chart._yConfig;
}

/** Sets an axis's config slot on a chart. */
function setAxisConfig(
  chart: Chart,
  axis: ShareAxis,
  config: Record<string, unknown> | undefined,
): void {
  if (axis === "x") chart._xConfig = config;
  else chart._yConfig = config;
}

/**
    Gives `child`'s chart `share` (or takes its share away): the shared
    domains, and its labels and title hidden on the axes it leaves to
    another chart, keeping the axis config it had to put back.
*/
export function applyShare(
  child: DashboardChild,
  share: ChartShare | undefined,
): void {
  const chart = child.chart as unknown as Chart;
  for (const axis of SHARE_AXES) {
    const was = !!child.share?.hidden[axis],
      hide = !!share?.hidden[axis];
    if (hide && !was) {
      child.axisConfig[axis] = axisConfig(chart, axis);
      setAxisConfig(
        chart,
        axis,
        hiddenAxisConfig(axisConfig(chart, axis), true),
      );
    } else if (!hide && was) {
      const saved = child.axisConfig[axis];
      setAxisConfig(chart, axis, saved);
      // The axis keeps its config between draws, so undo the hiding on it too.
      chart[`_${axis}Axis`]?.config({
        labels: saved?.labels,
        title: saved?.title,
      } as never);
      delete child.axisConfig[axis];
    }
  }
  chart._plotFacetScales = share ? shareScales(share) : undefined;
  child.share = share;
}

/**
    Records the domains `child`'s chart drew with on the axes it doesn't
    share yet: its own, which sharing merges.
*/
export function recordReadings(child: DashboardChild): void {
  const chart = child.chart as unknown as VizInstance;
  for (const axis of SHARE_AXES) {
    if (child.share?.domains[axis]) continue;
    const reading = readAxis(chart, axis);
    if (reading) child.readings[axis] = reading;
    else delete child.readings[axis];
  }
}

/**
    Takes the shares away from charts whose data has changed since their
    own domains were read, so they draw with their own and are read again.
*/
export function dropStaleShares(children: DashboardChild[]): void {
  for (const child of children) {
    const stale = SHARE_AXES.some(
      axis =>
        child.readings[axis] &&
        child.readings[axis]!.data !== child.chart._userData,
    );
    if (!stale) continue;
    applyShare(child, undefined);
    child.readings = {};
  }
}

/**
    Settles the charts once every one has drawn: first their shared axes,
    then (once those have redrawn) their plot areas lined up. `redraw` draws
    a chart again at its cell less its inset.
*/
export function settleDashboardCharts(
  dashboard: SettleHost,
  redraw: (child: DashboardChild) => void,
): void {
  const children = dashboard._dashboard.children.filter(c => c.cell);
  if (children.some(c => !c.drawn)) return;
  const layout = resolveDashboardLayout(dashboard.schema.layoutConfig);
  const shares = planShares(
    children.map(c => c.cell!),
    children.map(c => c.readings),
    {x: layout.shareX, y: layout.shareY},
  );
  let shared = false;
  children.forEach((child, i) => {
    if (sameShare(child.share, shares[i]) || child.shared >= PASSES) return;
    child.shared++;
    applyShare(child, shares[i]);
    redraw(child);
    shared = true;
  });
  if (shared || !layout.align) return;
  const next = alignCells(
    children.map(c => c.cell!),
    children.map(c => plotInsets(c.chart)),
  );
  children.forEach((child, i) => {
    if (!sidesChanged(next[i], child.inset) || child.aligned >= PASSES) return;
    child.aligned++;
    child.inset = next[i];
    redraw(child);
  });
}
