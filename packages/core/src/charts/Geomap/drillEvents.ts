/**
    How a Geomap's drill-down moves: clicking a neighbor of the regions
    drilled into switches the drill to it, and each drill (or Back) zooms
    the map to the regions drilled into, or back to the view the first
    drill left (see `drillDown.ts`).

    @module
*/

import type {DataPoint} from "@d3plus/data";

import {canZoom} from "../drawSteps/zoomActions.js";
import {zoomTo} from "../drawSteps/zoomControls.js";
import {fitBounds} from "../drawSteps/zoomFit.js";
import {groupDepthOf} from "../viz/groupRow.js";
import {wrapClick} from "../viz/userClick.js";
import type Viz from "../viz/Viz.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {drillZooms} from "./applyLayout.js";
import {geomapDrill} from "./drillDown.js";
import type {Box} from "./drillDown.js";

type Handler = (d: DataPoint, i: number, x: unknown, event: Event) => unknown;
type GroupKey = (d: DataPoint, i: number) => unknown;

/** The source row a datum wraps. */
function unwrap(d: DataPoint): DataPoint {
  let row = d;
  while (row && row.__d3plus__ && row.data) row = row.data as DataPoint;
  return row;
}

/**
    What clicking a region does on a drilled map: a neighbor of the regions
    drilled into (a group row at their level) takes their place, rewriting
    the drill's Back history entry so Back still goes up a level. Returns
    whether the click was a neighbor's.
    @param viz The Geomap.
    @param d The clicked row.
*/
export function switchDrill(viz: VizInstance, d: DataPoint): boolean {
  const drill = geomapDrill(viz);
  if (!drill || groupDepthOf(d) !== drill.depth) return false;
  const key = viz.schema.groupBy[drill.depth] as GroupKey;
  const id = key(unwrap(d), 0);
  if (id === undefined || id === null) return false;
  if (!drill.ids.has(`${id}`)) {
    const v = viz as unknown as Viz;
    v.hover(false);
    if (viz._tooltipClass) viz._tooltipClass.data([]).render();
    const before = drill.entry.filter;
    drill.entry.groupId = id;
    v.config({
      filter: (f: DataPoint, x: number) =>
        (!before || before(f, x)) && key(f, x) === id,
    }).render();
  }
  return true;
}

/**
    Installs the neighbor click (see `switchDrill`) in front of the chart's
    shape click, still the chart's own when that was (see `wrapClick`), so
    drillable regions keep their pointer and "Click to Expand" note.
    @param viz The Geomap.
*/
export function installDrillEvents(viz: VizInstance): void {
  const click = (viz.schema.on as Record<string, Handler | undefined>)[
    "click.shape"
  ];
  const handler: Handler = (d, i, x, event) => {
    if (switchDrill(viz, d)) {
      event?.stopPropagation?.();
      return;
    }
    return click?.(d, i, x, event);
  };
  wrapClick(viz, "click.shape", handler);
}

/** What a draw knows about the view its drill zooms to. */
interface DrillView {
  bounds: Box | null;
  key: string;
}

/** The zoom a map shows: its transform, as d3-zoom's `k`, `x`, `y`. */
interface Zoom {
  k: number;
  x: number;
  y: number;
}

/**
    Zooms the map so `bounds` (projected pixels, inside the chart area)
    fill it, less `zoomPadding`.
*/
function zoomToBox(viz: VizInstance, bounds: Box): void {
  const v = viz as unknown as Viz;
  const ct = viz._chartTransform ?? {};
  const ox = ct.x ?? 0,
    oy = ct.y ?? 0;
  const [[x0, y0], [x1, y1]] = bounds;
  const fit = fitBounds(v, [
    [x0 + ox, y0 + oy],
    [x1 + ox, y1 + oy],
  ]);
  zoomTo(v, fit.k, fit.x, fit.y);
}

/**
    Once a draw has painted, zooms the map to the view its drill shows,
    when that changed: the regions drilled into, or with no drill left,
    the view the first drill started from. Runs after each draw.
    @param viz The Geomap.
*/
export function syncDrillZoom(viz: VizInstance): void {
  const view = (viz.ctx.geomapCtx as {drill?: DrillView | null} | undefined)
    ?.drill;
  const key = view?.key ?? "";
  const last = (viz.ctx.drillZoomKey as string | undefined) ?? "";
  if (key === last) return;
  if (!drillZooms(viz) || !canZoom(viz as unknown as Viz)) return;
  viz.ctx.drillZoomKey = key;
  // The view a first drill leaves is where its last Back returns.
  if (!last) {
    const t = viz._zoomTransform;
    viz.ctx.drillHome = t ? {k: t.scale ?? 1, x: t.x ?? 0, y: t.y ?? 0} : null;
  }
  const home = viz.ctx.drillHome as Zoom | null | undefined;
  queueMicrotask(() => {
    if (((viz.ctx.drillZoomKey as string | undefined) ?? "") !== key) return;
    if (view?.bounds) zoomToBox(viz, view.bounds);
    else if (!view)
      zoomTo(viz as unknown as Viz, home?.k ?? 1, home?.x ?? 0, home?.y ?? 0);
  });
}
