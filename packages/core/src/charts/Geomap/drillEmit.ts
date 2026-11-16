/**
    The regions behind a Geomap's drill-down: the regions drilled into,
    under their children, and their neighbors at the same level, faded,
    each drawn in the fill of a region without data, outlined a shade
    darker (lighter over a dark basemap) (see `drillDown.ts`).

    @module
*/

import {color} from "d3-color";

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";
import type {DrillRegion} from "./drillDown.js";

/** What a Geomap draw knows about its drill-down. */
export interface GeoDrillScene {
  /** The regions at the drilled level. */
  regions: DrillRegion[];
  /** The ids of the regions drawn at the level below, which keep their keys. */
  childIds: Set<string>;
}

/** The default opacity of a drilled map's neighboring regions. */
export const DRILL_NEIGHBOR_OPACITY = 0.5;

/**
    The scene key of a region at the drilled level: the key it was drawn
    with at that level, so it animates into place, unless a child shares
    its id.
    @param id The region's id.
    @param childIds The ids of the regions drawn at the level below.
*/
export function drillRegionKey(id: string, childIds: Set<string>): string {
  return childIds.has(id) ? `geomap-drill-${id}` : `geomap-path-${id}`;
}

/**
    The paths of the regions at the drilled level, to draw before the
    children: a neighbor with rows is a group row (it labels, hovers, and
    switches the drill when clicked), and the rest are context only.
    @param viz The Geomap.
    @param drill The drill's regions.
    @param pathD Each region's projected path data.
*/
export function emitDrillRegions(
  viz: VizInstance,
  drill: GeoDrillScene,
  pathD: (region: DrillRegion) => string | null,
): SceneNode[] {
  const out: SceneNode[] = [];
  const opacity = Number(viz.schema.topojsonNeighborOpacity);
  const fade =
    Number.isFinite(opacity) && opacity >= 0
      ? Math.min(1, opacity)
      : DRILL_NEIGHBOR_OPACITY;
  const strokeWidth = (
    viz.schema.shapeConfig.Path as {strokeWidth?: unknown} | undefined
  )?.strokeWidth;
  drill.regions.forEach((region, i) => {
    const d = pathD(region);
    if (!d) return;
    const bare = {__d3plus__: true, feature: region.feature, id: region.id};
    const datum = (region.active ? undefined : region.data) ?? bare;
    const fill = `${(viz.schema.topojsonFill as (d: unknown, i: number) => unknown)(bare, i)}`;
    const c = color(fill);
    const stroke =
      (viz._basemapDark ? c?.brighter() : c?.darker())?.toString() ?? fill;
    const label = region.data
      ? viz._drawLabel(region.data as DataPoint, i)
      : region.id;
    out.push({
      type: "path",
      key: drillRegionKey(region.id, drill.childIds),
      d,
      morph: true,
      datum,
      interactive: !region.active && Boolean(region.data),
      paint: {
        fill,
        stroke,
        strokeWidth: typeof strokeWidth === "number" ? strokeWidth : 1,
        opacity: region.active ? 1 : fade,
        vectorEffect: "non-scaling-stroke",
      },
      aria: {label: `${label}.`},
    } as SceneNode);
  });
  return out;
}
