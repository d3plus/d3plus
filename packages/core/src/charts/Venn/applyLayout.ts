/**
    `applyVennLayout` — Venn's layout stage. Reads each drawn row as a
    region (its sets and size), lays the sets out as circles (area
    proportional, or the classic equal circles) or, classically with four
    or five sets, as the textbook ellipses, fits them to the chart
    area, and returns one `VennRegion` per row whose sets share any area:
    its outline, its label spot, and the count that falls only in it.
    Regions come back with single sets first, then pairs, and so on, so
    each intersection draws over the circles it lies in.
*/

import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {circlePath, intersectionPath} from "./circles.js";
import {rowSets, rowSize} from "./vennData.js";
import {
  classicEllipses,
  ellipsePolygon,
  fitPolygons,
  polygonIntersection,
  polygonLabelSpot,
  polygonPath,
} from "./vennEllipses.js";
import type {VennEllipse, VennPoint} from "./vennEllipses.js";
import {fitCircles, normalizeCircles} from "./vennFit.js";
import {areaKey, classicLayout, proportionalLayout} from "./vennLayout.js";
import type {VennArea, VennCircles} from "./vennLayout.js";
import {
  exclusiveSizes,
  outsideCircles,
  sameAreaGroups,
  vennLabelSpot,
} from "./vennRegions.js";
import type {VennLabelSpot} from "./vennRegions.js";

/** One laid-out region. */
export interface VennRegion {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  /** The region's sets, as its row names them. */
  sets: string[];
  /** The same key for the same sets in any order. */
  key: string;
  /** The region's outline (a circle for one set). */
  d: string;
  /** The row's size: the count in every one of its sets. */
  value: number;
  /** The count in the region and none of the smaller regions inside it. */
  exclusive: number;
  /** Where the region's label goes, in chart-area coordinates. */
  label: VennLabelSpot;
  /** Whether a region with more sets covers the same area, and so takes its label. */
  covered: boolean;
  /** The set this region's label names, when it covers that set's circle (a set inside another). */
  named?: {data: DataPoint; i: number};
}

/** Room kept around the circles for the hovered stroke emphasis. */
export const VENN_PADDING = 4;

/** A row's region data before layout. */
export interface RowArea extends VennArea {
  row: DataPoint;
  i: number;
}

/**
    The sets in the order the rows name them: single-set rows first, in
    data order, then any set only an intersection names.
*/
export function setOrder(areas: VennArea[]): string[] {
  const names: string[] = [];
  const add = (s: string) => {
    if (!names.includes(s)) names.push(s);
  };
  for (const a of areas) if (a.sets.length === 1) add(a.sets[0]);
  for (const a of areas) a.sets.forEach(add);
  return names;
}

/**
    The circles for `areas` in a `width` × `height` box: area proportional
    when `proportional` is set and any set has a size, else the classic
    equal circles. A proportional layout is remembered on `viz.ctx` for the
    same areas, since the search is the costly part.
*/
export function vennCircles(
  viz: VizInstance,
  areas: VennArea[],
  proportional: boolean,
  {width, height}: {width: number; height: number},
): VennCircles {
  const sized = areas.some(
    a => a.sets.length === 1 && Number.isFinite(a.size) && a.size > 0,
  );
  let circles: VennCircles;
  if (proportional && sized) {
    const key = JSON.stringify(areas.map(a => [a.sets, a.size]));
    const cache = viz.ctx.vennCache as
      {key: string; circles: VennCircles} | undefined;
    if (cache && cache.key === key) circles = cache.circles;
    else {
      circles = normalizeCircles(proportionalLayout(areas));
      viz.ctx.vennCache = {key, circles};
    }
  } else circles = classicLayout(setOrder(areas));
  return fitCircles(circles, width, height, VENN_PADDING);
}

/** The laid-out regions, and the circles or ellipse outlines they come from. */
export interface VennLayoutResult {
  regions: VennRegion[];
  circles: VennCircles;
  /** Each set's ellipse as a polygon, for the classic four- and five-set layouts. */
  polygons?: Record<string, VennPoint[]>;
}

/** A region of the classic ellipse layouts, before its exclusive count. */
function ellipseRegion(
  a: RowArea,
  polygons: Record<string, VennPoint[]>,
): Omit<VennRegion, "exclusive"> | undefined {
  const own = a.sets.map(s => polygons[s]);
  const shared = own.length === 1 ? own[0] : polygonIntersection(own);
  if (!shared.length) return undefined;
  const outside = Object.entries(polygons)
    .filter(([s]) => !a.sets.includes(s))
    .map(([, p]) => p);
  return {
    __d3plus__: true,
    data: a.row,
    i: a.i,
    sets: a.sets,
    key: areaKey(a.sets),
    d: polygonPath(shared),
    value: a.size,
    label: polygonLabelSpot(own, outside),
    covered: false,
  };
}

/**
    The regions of `areas` on the classic ellipses (four or five sets),
    fitted to a `width` × `height` box.
*/
export function ellipseRegions(
  areas: RowArea[],
  ellipses: Record<string, VennEllipse>,
  {width, height}: {width: number; height: number},
): VennLayoutResult {
  const polygons = fitPolygons(
    Object.fromEntries(
      Object.entries(ellipses).map(([s, e]) => [s, ellipsePolygon(e)]),
    ),
    width,
    height,
    VENN_PADDING,
  );
  const drawn = areas.filter(a => a.sets.every(s => polygons[s]));
  const exclusive = exclusiveSizes(drawn);
  const regions: VennRegion[] = [];
  for (const a of drawn) {
    const region = ellipseRegion(a, polygons);
    if (!region) continue;
    regions.push({
      ...region,
      exclusive: Number.isFinite(a.size)
        ? (exclusive.get(region.key) ?? 0)
        : NaN,
    });
  }
  regions.sort((a, b) => a.sets.length - b.sets.length);
  return {regions, circles: {}, polygons};
}

/** The regions of `rows`, laid out in a `width` × `height` box. */
export function vennRegions(
  viz: VizInstance,
  rows: DataPoint[],
  bounds: {width: number; height: number},
): VennLayoutResult {
  const seen = new Set<string>();
  const areas: RowArea[] = [];
  rows.forEach((row, i) => {
    const sets = rowSets(viz, row, i);
    const key = areaKey(sets);
    if (!sets.length || seen.has(key)) return;
    seen.add(key);
    areas.push({sets, size: rowSize(viz, row, i), row, i});
  });
  const ellipses =
    viz.schema.proportional === false
      ? classicEllipses(setOrder(areas))
      : undefined;
  if (ellipses) return ellipseRegions(areas, ellipses, bounds);
  const circles = vennCircles(
    viz,
    areas,
    viz.schema.proportional !== false,
    bounds,
  );
  const drawn = areas.filter(a => a.sets.every(s => circles[s]));
  const exclusive = exclusiveSizes(drawn);
  const regions: VennRegion[] = [];
  for (const a of drawn) {
    const own = a.sets.map(s => circles[s]);
    const d = own.length === 1 ? circlePath(own[0]) : intersectionPath(own);
    if (!d) continue;
    const key = areaKey(a.sets);
    regions.push({
      __d3plus__: true,
      data: a.row,
      i: a.i,
      sets: a.sets,
      key,
      d,
      value: a.size,
      exclusive: Number.isFinite(a.size) ? (exclusive.get(key) ?? 0) : NaN,
      label: vennLabelSpot(own, outsideCircles(a.sets, circles)),
      covered: false,
    });
  }
  regions.sort((a, b) => a.sets.length - b.sets.length);
  for (const group of sameAreaGroups(regions, circles)) {
    const top = group[group.length - 1];
    const single = group.find(r => r.sets.length === 1);
    for (const r of group) r.covered = r !== top;
    if (single && single !== top) top.named = {data: single.data, i: single.i};
  }
  return {regions, circles};
}

/**
    Each drawn row's exclusive count, for the tooltip. Kept on the chart
    rather than written onto the user's rows.
*/
export function exclusiveCounts(viz: VizInstance): WeakMap<DataPoint, number> {
  return (viz.ctx.vennExclusive ??= new WeakMap<
    DataPoint,
    number
  >()) as WeakMap<DataPoint, number>;
}

export const applyVennLayout: TransformStage = ({viz}) => {
  const rows = (viz._filteredData ?? []) as DataPoint[];
  const {regions, circles, polygons} = vennRegions(viz, rows, chartBounds(viz));
  viz.ctx.vennCircles = circles;
  viz.ctx.vennPolygons = polygons;
  viz.ctx.vennRegions = regions;
  const counts = exclusiveCounts(viz);
  for (const r of regions) counts.set(r.data, r.exclusive);
  return {shapeData: regions as unknown as DataPoint[]};
};
