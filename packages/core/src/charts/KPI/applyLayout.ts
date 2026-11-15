/**
    `applyKpiLayout` — KPI's chart-specific layout stage. Reads each tile's
    value and previous value (from `previous`, else from the period before
    the current one when `time` is set), lays the tiles out in a grid, and
    returns one `KpiTile` per row of `viz._filteredData`. Stores the tiles by
    row on `viz.ctx.kpi` for tooltips.
*/

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import {computeTimeFilter, dataFilter} from "../pipeline/preDrawData.js";
import {chartBounds} from "../features/chartGeometry.js";
import {facetActive} from "../facet/facetConfig.js";
import type {FacetAccessor} from "../facet/facetConfig.js";
import {facetKey, toFacetValue} from "../facet/facetData.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {deltaTone, goodDirection, kpiDelta} from "./delta.js";
import type {KpiDelta, KpiTone} from "./delta.js";
import {kpiPeriods, kpiSeries} from "./series.js";
import type {IndexedRow, KpiPoint} from "./series.js";
import {kpiGrid, TILE_ASPECT, TILE_PADDING} from "./tileLayout.js";
import type {Box} from "./tileLayout.js";

type RowFn = (d: DataPoint, i: number) => unknown;

/** One tile: its row, numbers, history, and box in the chart area. */
export interface KpiTile {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  /** The tile's key, from its ids. */
  key: string;
  value: number;
  previous: number;
  delta?: KpiDelta;
  tone: KpiTone;
  /** The sparkline's points, in time order (empty without `time`). */
  points: KpiPoint[];
  /** The time values of the periods the tile is compared with. */
  previousTimes: unknown[];
  box: Box;
}

/** What `viz.ctx.kpi` holds after layout. */
export interface KpiShared {
  /** Each drawn row's tile, for tooltips. */
  tiles: Map<DataPoint, KpiTile>;
}

/** `tileConfig`: how the tiles fill the chart area and how they look. */
export interface KpiTileConfig {
  /** The tile width/height ratio the grid aims for (1.75 by default). */
  aspect?: number;
  /** A fixed column count. */
  columns?: number;
  /** A fixed row count. */
  rows?: number;
  /** The space between tiles, in pixels (12 by default). */
  padding?: number;
  /** The tile's background. Defaults to a faint step off the chart's background. */
  fill?: string;
  /** The tile's outline. Defaults to a light step off the chart's background. */
  stroke?: string;
  /** The outline's width (1 by default). */
  strokeWidth?: number;
  /** The corner radius (6 by default). */
  rx?: number;
}

/** A number from an accessor, or `NaN`. */
export function rowNumber(fn: unknown, d: DataPoint, i: number): number {
  if (typeof fn !== "function") return NaN;
  const v = (fn as RowFn)(d, i);
  return v === null || v === undefined || v === "" ? NaN : Number(v);
}

/** A row's tile key: its ids at the drawn depth, plus its facet value with small multiples. */
export function kpiKey(viz: VizInstance, d: DataPoint, i: number): string {
  const ids = viz._ids(d, i).join("-");
  if (!facetActive(viz)) return ids;
  const facet = viz.schema.facet as FacetAccessor;
  return `${ids}|${facetKey(toFacetValue(facet(d, i)))}`;
}

/** The chart's rows that pass its `filter`, grouped by tile key. */
function rowsByTile(viz: VizInstance): Map<string, IndexedRow[]> {
  const filter = dataFilter(viz);
  const out = new Map<string, IndexedRow[]>();
  viz._data.forEach((row, i) => {
    if (filter && !filter(row, i)) return;
    const key = kpiKey(viz, row, i);
    const list = out.get(key);
    if (list) list.push({row, i});
    else out.set(key, [{row, i}]);
  });
  return out;
}

/** The tiles' settings, with defaults filled in. */
export function tileSettings(viz: VizInstance): KpiTileConfig & {
  aspect: number;
  padding: number;
} {
  const config = (viz.schema.tileConfig ?? {}) as KpiTileConfig;
  const aspect = Number(config.aspect);
  const padding = Number(config.padding);
  return {
    ...config,
    aspect: aspect > 0 ? aspect : TILE_ASPECT,
    padding: padding >= 0 ? padding : TILE_PADDING,
  };
}

export const applyKpiLayout: TransformStage = ({viz}) => {
  const {width, height} = chartBounds(viz);
  const data = (viz._filteredData ?? []) as DataPoint[];
  const time = viz.schema.time as RowFn | undefined;
  const settings = tileSettings(viz);
  const boxes = kpiGrid(
    data.length,
    {x: 0, y: 0, width: Math.max(0, width), height: Math.max(0, height)},
    {
      columns: settings.columns,
      rows: settings.rows,
      padding: settings.padding,
      aspect: settings.aspect,
    },
  );

  const byTile = time ? rowsByTile(viz) : undefined;
  const timeFilter = time
    ? ((viz.schema.timeFilter || computeTimeFilter(viz)) as RowFn | undefined)
    : undefined;
  const valueOf = (rows: IndexedRow[]) => {
    if (!rows.length) return NaN;
    const merged =
      rows.length === 1
        ? rows[0].row
        : (merge(
            rows.map(r => r.row),
            viz.schema.aggs,
          ) as DataPoint);
    return rowNumber(viz.schema.value, merged, rows[0].i);
  };

  const tiles = new Map<DataPoint, KpiTile>();
  const out: KpiTile[] = data.map((d, i) => {
    const key = kpiKey(viz, d, i);
    const value = rowNumber(viz.schema.value, d, i);
    let previous = rowNumber(viz.schema.previous, d, i);
    let points: KpiPoint[] = [];
    let previousTimes: unknown[] = [];
    const rows = byTile?.get(key);
    if (time && rows) {
      const series = kpiSeries(
        kpiPeriods(rows, time),
        p =>
          timeFilter ? p.rows.some(r => Boolean(timeFilter(r.row, r.i))) : true,
        valueOf,
      );
      points = series.points;
      if (!Number.isFinite(previous)) {
        previous = series.previous;
        previousTimes = series.previousTimes;
      }
    }
    const delta = kpiDelta(value, previous);
    const good = goodDirection(
      typeof viz.schema.deltaDirection === "function"
        ? (viz.schema.deltaDirection as RowFn)(d, i)
        : viz.schema.deltaDirection,
    );
    const tile: KpiTile = {
      __d3plus__: true,
      data: d,
      i,
      key,
      value,
      previous,
      delta,
      tone: delta ? deltaTone(delta.direction, good) : "neutral",
      points,
      previousTimes,
      box: boxes[i],
    };
    tiles.set(d, tile);
    return tile;
  });

  viz.ctx.kpi = {tiles} satisfies KpiShared;
  return {shapeData: out as unknown as DataPoint[]};
};
