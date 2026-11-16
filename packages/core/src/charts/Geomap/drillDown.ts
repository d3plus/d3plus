/**
    Geographic drill-down: a `topojson` for each `groupBy` level. The map
    draws the topojson of the level it draws (`topojsonAt`), and once a
    click has drilled into a region (see `events/click.shape.ts`), it draws
    only that region's children (the rows of the level below that name it
    in their own nesting), above the region itself and its neighbors at the
    level above, faded, which a click switches to (see `drillEvents.ts`).

    @module
*/

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import {computeTimeFilter} from "../pipeline/preDrawData.js";
import {GROUP_DEPTH_KEY, GROUP_LABEL_KEY} from "../viz/groupRow.js";
import {isLegendEntry} from "../viz/history.js";
import type {
  DrillDownHistoryEntry,
  HistoryEntry,
  VizInstance,
} from "../viz/vizTypes.js";
import {dotDensitySettings} from "./dotDensityLayout.js";
import {topoFeatures} from "./geoCache.js";
import {regionsReshaped} from "./tileGrid.js";
import {geomapTopojson} from "./topojsonLevels.js";

type Topology = Record<string, unknown>;
type RowFilter = (d: DataPoint, i: number) => boolean;
type GroupKey = (d: DataPoint, i: number) => unknown;

/** Whether a value is a loaded topojson: an object with an `objects` map. */
function isTopology(value: unknown): value is Topology {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as {objects?: unknown}).objects,
  );
}

/**
    The topojson drawn at a `groupBy` level: a list's entry for that level
    (none past its end), or the one topojson at every level. Null when there
    is none, or it hasn't loaded.
    @param topojson The chart's `topojson`.
    @param depth The `groupBy` level.
*/
export function topojsonAt(topojson: unknown, depth: number): Topology | null {
  const t = Array.isArray(topojson) ? topojson[depth] : topojson;
  return isTopology(t) ? t : null;
}

/**
    The object key a level's topojson draws: a list's entry for that level,
    or the one key at every level.
    @param key The chart's `topojsonKey`.
    @param depth The `groupBy` level.
*/
export function topojsonKeyAt(
  key: string | (string | undefined)[] | undefined,
  depth: number,
): string | undefined {
  return Array.isArray(key) ? key[depth] : key;
}

/**
    The topojson the projection fits by default: a list's first loaded
    level, so the map keeps one home view through every drill, or the one
    topojson.
    @param topojson The chart's `topojson`.
*/
export function fitTopojson(topojson: unknown): {
  topo: Topology;
  depth: number;
} | null {
  if (!Array.isArray(topojson))
    return isTopology(topojson) ? {topo: topojson, depth: 0} : null;
  const depth = topojson.findIndex(isTopology);
  return depth < 0 ? null : {topo: topojson[depth] as Topology, depth};
}

/**
    A level's topojson features, after `topojsonFilter`.
    @param viz The Geomap.
    @param depth The `groupBy` level.
*/
export function levelFeatures(
  viz: VizInstance,
  depth: number,
): Record<string, unknown>[] {
  const topo = topojsonAt(geomapTopojson(viz), depth);
  if (!topo) return [];
  const {features} = topoFeatures(
    topo,
    topojsonKeyAt(viz.schema.topojsonKey, depth),
  );
  const filter = viz.schema.topojsonFilter as RowFilter | undefined;
  return filter
    ? features.filter(f => (filter as (f: unknown) => boolean)(f))
    : features;
}

/** The drill-down entries on a Back history, oldest first. */
export function drillEntries(
  history: HistoryEntry[] | undefined,
): DrillDownHistoryEntry[] {
  return (history ?? []).filter(
    (e): e is DrillDownHistoryEntry => !isLegendEntry(e),
  );
}

/** The regions a Geomap has drilled into, at the level above the one it draws. */
export interface GeoDrill {
  /** The `groupBy` level of the regions drilled into. */
  depth: number;
  /** The ids of the regions drilled into. */
  ids: Set<string>;
  /** The drill's Back history entry, which a switch to a neighbor rewrites. */
  entry: DrillDownHistoryEntry;
  /** Whether that level was itself drilled into, so it drew only the regions with data. */
  nested: boolean;
}

/**
    Whether a Geomap draws its drill-downs on the map: a topojson for each
    level, and regions drawn as themselves (not a `cartogram` or `tileGrid`,
    nor `dotDensity`, whose outer `groupBy` levels are dot categories).
    @param viz The Geomap.
*/
export function drillsOnMap(viz: VizInstance): boolean {
  return (
    Array.isArray(geomapTopojson(viz)) &&
    !regionsReshaped(viz) &&
    !dotDensitySettings(viz)
  );
}

/**
    The regions a Geomap draws the children of: the ones the newest
    drill-down clicked, when it clicked a region one level above the one
    drawn and that level has a topojson. Null otherwise.
    @param viz The Geomap.
*/
export function geomapDrill(viz: VizInstance): GeoDrill | null {
  if (!drillsOnMap(viz)) return null;
  const depth = (viz._drawDepth ?? 0) - 1;
  if (depth < 0 || !topojsonAt(geomapTopojson(viz), depth)) return null;
  const entries = drillEntries(viz._history);
  const entry = entries[entries.length - 1];
  if (!entry || entry.groupDepth !== depth || entry.groupId === undefined)
    return null;
  const below = entries[entries.length - 2];
  const ids = (Array.isArray(entry.groupId) ? entry.groupId : [entry.groupId])
    .filter(id => id !== undefined && id !== null)
    .map(id => `${id}`);
  return {
    depth,
    ids: new Set(ids),
    entry,
    nested: below?.groupDepth === depth - 1 && below.groupId !== undefined,
  };
}

/**
    Each region's row at the drilled level, by id: its rows in the view the
    drill left (the timeline's period, and the filter before the drill)
    merged, and stamped as a group row (see `viz/groupRow.ts`) so it labels,
    hovers, and tooltips as that level. Its label is the chart's `label` of
    the merged row, as that level drew it.
    @param viz The Geomap.
    @param drill The drill.
*/
export function drillParentRows(
  viz: VizInstance,
  drill: GeoDrill,
): Map<string, DataPoint> {
  const key = viz.schema.groupBy[drill.depth] as GroupKey;
  const time = (viz.schema.timeFilter ?? computeTimeFilter(viz)) as
    RowFilter | undefined;
  const filter = drill.entry.filter;
  const groups = new Map<string, DataPoint[]>();
  viz._data.forEach((d, i) => {
    if ((time && !time(d, i)) || (filter && !filter(d, i))) return;
    const value = key(d, i);
    for (const id of Array.isArray(value) ? value : [value]) {
      if (id === undefined || id === null) continue;
      const list = groups.get(`${id}`);
      if (list) list.push(d);
      else groups.set(`${id}`, [d]);
    }
  });
  const label = viz.schema.label as
    ((d: DataPoint, i: number) => unknown) | undefined;
  const out = new Map<string, DataPoint>();
  for (const [id, rows] of groups) {
    const row = merge(rows, viz.schema.aggs) as DataPoint;
    row[GROUP_DEPTH_KEY] = drill.depth;
    const text = label ? label(row, 0) : undefined;
    if (typeof text === "string" || typeof text === "number")
      row[GROUP_LABEL_KEY] = `${text}`;
    out.set(id, row);
  }
  return out;
}

/** A region at the drilled level, drawn behind the children. */
export interface DrillRegion {
  id: string;
  feature: Record<string, unknown>;
  /** Its group row, when it has rows. */
  data?: DataPoint;
  /** Whether it is a region drilled into. */
  active: boolean;
}

/**
    The regions at the drilled level, as that level drew them: every
    feature of its topojson, or when it was itself drilled into, those with
    rows (and the regions drilled into).
    @param viz The Geomap.
    @param drill The drill.
    @param rows Each region's group row (see `drillParentRows`).
*/
export function drillParentRegions(
  viz: VizInstance,
  drill: GeoDrill,
  rows: Map<string, DataPoint>,
): DrillRegion[] {
  const out: DrillRegion[] = [];
  for (const feature of levelFeatures(viz, drill.depth)) {
    const id = `${(viz.schema.topojsonId as (f: unknown) => unknown)(feature)}`;
    const data = rows.get(id);
    const active = drill.ids.has(id);
    if (!active && !data && drill.nested) continue;
    out.push({id, feature, data, active});
  }
  return out;
}

/** A box: its top-left and bottom-right corners. */
export type Box = [[number, number], [number, number]];

/**
    The box around the regions drilled into, in projected pixels, or null
    when none of them projects.
    @param regions The regions at the drilled level.
    @param bounds The projected bounds of a feature (d3-geo's `path.bounds`).
*/
export function drillBounds(
  regions: DrillRegion[],
  bounds: (feature: unknown) => Box,
): Box | null {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const region of regions) {
    if (!region.active) continue;
    const [[a, b], [c, d]] = bounds(region.feature);
    if (![a, b, c, d].every(Number.isFinite)) continue;
    x0 = Math.min(x0, a);
    y0 = Math.min(y0, b);
    x1 = Math.max(x1, c);
    y1 = Math.max(y1, d);
  }
  return x1 >= x0 && y1 >= y0
    ? [
        [x0, y0],
        [x1, y1],
      ]
    : null;
}

/** A Geomap's drill, and the regions at its level. */
export interface DrillLayout {
  drill: GeoDrill;
  regions: DrillRegion[];
}

/**
    The drill a Geomap draws (see `geomapDrill`) and the regions at its
    level, or null.
    @param viz The Geomap.
*/
export function geomapDrillLayout(viz: VizInstance): DrillLayout | null {
  const drill = geomapDrill(viz);
  if (!drill) return null;
  return {
    drill,
    regions: drillParentRegions(viz, drill, drillParentRows(viz, drill)),
  };
}

/**
    A key for the view a drill zooms to: its level and regions, and the
    chart's size (a resize zooms again).
    @param layout The drill.
    @param width The chart area's width.
    @param height The chart area's height.
*/
export function drillKey(
  layout: DrillLayout,
  width: number,
  height: number,
): string {
  const ids = [...layout.drill.ids].sort().join("|");
  return `${layout.drill.depth}:${ids}:${width}x${height}`;
}
