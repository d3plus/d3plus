/**
    `applyRadialLineLayout` — the layout stage RadialLine and RadialArea
    share. Lays each `x` value around the circle (see `angles.ts`), fits the
    radius to the values on a linear scale with value rings, sizes the
    circle to the `x` labels around it, and builds each series' path (see
    `paths.ts`). Lays the chrome (rings, spokes, `x` labels, ring labels)
    into `viz._chartScene`, beneath the marks, and stores the frame on
    `viz.ctx.radial`.
*/

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import {dateFormatter, formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import {chartBounds} from "../features/chartGeometry.js";
import type {TransformStage} from "../pipeline/stages.js";
import {
  polarCategoryLayout,
  polarCategoryNodes,
  polarLevelNodes,
} from "../polar/chrome.js";
import type {PolarCategory} from "../polar/chrome.js";
import {polarInnerRadius, polarLevels, polarRadius} from "../polar/geometry.js";
import type {PolarDomainInput} from "../polar/geometry.js";
import {polarSharedExtent} from "../polar/polarFacet.js";
import type {PolarDomainValues} from "../polar/polarFacet.js";
import type {PolarLabelPlacement} from "../polar/labels.js";
import {POLAR_STROKE_BUFFER} from "../polar/wedgeLayout.js";
import type {RadarAxisConfig} from "../Radar/axisDecorations.js";
import type {RadarLevels} from "../Radar/levels.js";
import {radarRingStyle} from "../Radar/rings.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {radialAngleScale, radialKey} from "./angles.js";
import type {RadialAngleScale, RadialTick} from "./angles.js";
import {polarXY, radialAreaPath, radialLinePath} from "./paths.js";
import {registerRadialPoint} from "./points.js";
import type {RadialDot} from "./points.js";
import {radialDomainValues, radialSeries} from "./series.js";
import type {RadialSeries} from "./series.js";
import {radialTextBoxes} from "./seriesLabels.js";
import {radialSpokeNodes} from "./spokes.js";
import {AGGREGATE_INDEX, rowIndex} from "../features/rowIndex.js";

type Accessor<T> = (d: DataPoint, i: number) => T;

const TAU = Math.PI * 2;

/** One series laid out: its path, and the dots along it. */
export interface RadialSeriesDatum {
  __d3plus__: true;
  /** The series' rows merged into one, the datum its line or area carries. */
  data: DataPoint;
  /** Its row's index when it draws one row, else -1 (see `rowIndex`). */
  i: number;
  id: string;
  /** Its path, and the same path collapsed onto the baseline it grows from. */
  d: string;
  enterD: string;
  /** The `x` keys it has a point at. */
  keys: string[];
  /** Each point's angle and the radii its band spans, in pixels. */
  points: {angle: number; r0: number; r1: number}[];
  dots: RadialDot[];
}

/** The circle every series is laid out in, stored on `viz.ctx.radial`. */
export interface RadialFrame {
  inner: number;
  outer: number;
  levels: RadarLevels;
  scale: RadialAngleScale;
  area: boolean;
  stacked: boolean;
  /** The ring value labels drawn above the marks (an area's), else none. */
  levelLabels: SceneNode[];
  /** Where the ring value labels sit, for the series labels to stay clear of. */
  levelBoxes: PolarLabelPlacement[];
}

/** Resolves the `startAngle` setting (degrees) to radians. */
export const radialStart = (viz: VizInstance): number =>
  ((Number(viz.schema.startAngle) || 0) * Math.PI) / 180;

/** Whether `x` values advance clockwise: any `direction` but `"counterclockwise"`. */
export const radialClockwise = (viz: VizInstance): boolean =>
  viz.schema.direction !== "counterclockwise";

/** Whether the chart draws areas (RadialArea) rather than lines. */
export const radialIsArea = (viz: VizInstance): boolean =>
  viz.ctx.radialMark === "area";

/** Whether series stack: a RadialArea with `stacked` set. */
export const radialIsStacked = (viz: VizInstance): boolean =>
  radialIsArea(viz) && Boolean(viz.schema.stacked);

/**
    The text an `x` value is labeled with: `xFormat` when set, else
    numbers abbreviated in the locale, dates by `formatDate` across every
    date on the axis, and anything else as is.
*/
export function radialXFormatter(
  viz: VizInstance,
  values: unknown[],
): (value: unknown) => string {
  const user = viz.schema.xFormat as ((d: unknown) => unknown) | undefined;
  if (typeof user === "function") return v => `${user(v)}`;
  const dates = values.filter((v): v is Date => v instanceof Date);
  const dateText = dates.length ? dateFormatter(dates) : undefined;
  return v =>
    typeof v === "number"
      ? formatAbbreviate(v, viz.schema.locale as string)
      : v instanceof Date && dateText
        ? dateText(v)
        : `${v}`;
}

/** The curve a series draws with: `shapeConfig.Line.curve` (or `Area.curve`), a name or a function of the series' row. */
export function radialCurveName(
  setting: unknown,
  d: DataPoint,
  i: number,
): string {
  const name =
    typeof setting === "function"
      ? (setting as Accessor<unknown>)(d, i)
      : setting;
  return typeof name === "string" && name ? name : "linear";
}

/** The angular axis for `rows`, from the chart's settings. */
function angleScale(viz: VizInstance, rows: DataPoint[]): RadialAngleScale {
  const x = viz.schema.x as Accessor<unknown>;
  return radialAngleScale(
    rows.map((d, i) => x(d, i)),
    {
      start: radialStart(viz),
      clockwise: radialClockwise(viz),
      domain: viz.schema.xDomain as unknown[] | undefined,
    },
  );
}

/** The series for `rows`, from the chart's settings. */
function seriesOf(
  viz: VizInstance,
  rows: DataPoint[],
  scale: RadialAngleScale,
): RadialSeries[] {
  return radialSeries(rows, {
    id: viz._id as Accessor<unknown>,
    x: viz.schema.x as Accessor<unknown>,
    y: viz.schema.y as Accessor<unknown>,
    scale,
    stacked: radialIsStacked(viz),
    start: radialStart(viz),
    clockwise: radialClockwise(viz),
  });
}

/** The values RadialLine fits its radius to: every point's value (each stack's top, stacked). */
export const radialDomainOf: PolarDomainValues = (viz, rows) =>
  radialDomainValues(seriesOf(viz, rows, angleScale(viz, rows)));

/** The `y` domain setting, as the `[min, max]` the radius spans. */
const yDomainOf = (viz: VizInstance): PolarDomainInput => {
  const d = viz.schema.yDomain as unknown[] | undefined;
  if (!Array.isArray(d)) return undefined;
  const end = (v: unknown) => (typeof v === "number" ? v : undefined);
  return [end(d[0]), end(d[1])];
};

/** The category labels: one per tick, standing on a row at its `x` when there is one. */
function tickCategories(
  ticks: RadialTick[],
  rowsAt: Map<string, DataPoint>,
  format: (v: unknown) => string,
): PolarCategory[] {
  const span = ticks.length ? TAU / ticks.length : TAU;
  return ticks.map(t => ({
    key: t.key,
    text: format(t.value),
    angle: t.angle,
    span,
    data: rowsAt.get(t.key) ?? ({} as DataPoint),
  }));
}

/**
    Lays out the chrome beneath the marks, keyed with `key`, and returns the
    ring value labels (left off the scene when `labelsAbove` keeps them for
    above the marks).
*/
function pushChrome(
  viz: VizInstance,
  key: string,
  parts: {
    levels: RadarLevels;
    ticks: RadialTick[];
    inner: number;
    outer: number;
    toRadius: (v: number) => number;
    labels: SceneNode[];
    labelsAbove: boolean;
  },
): SceneNode[] {
  const {levels, ticks, inner, outer, toRadius, labels, labelsAbove} = parts;
  const chrome = polarLevelNodes(viz, levels, outer, toRadius, key);
  const axisConfig = viz.schema.axisConfig as RadarAxisConfig;
  const spokes = radialSpokeNodes(
    ticks,
    inner,
    outer,
    radarRingStyle({}, axisConfig.gridConfig),
    key,
  );
  const scene = (
    Array.isArray(viz._chartScene) ? viz._chartScene : (viz._chartScene = [])
  ) as SceneNode[];
  scene.push(...chrome.rings, ...spokes, ...labels);
  if (!labelsAbove) scene.push(...chrome.labels);
  return chrome.labels;
}

/** What `seriesDatum` lays a series out with. */
interface SeriesGeometry {
  aggs: Parameters<typeof merge>[1];
  /** The chart's drawn data, which a series' index points into. */
  rows: DataPoint[];
  area: boolean;
  stacked: boolean;
  closed: boolean;
  toRadius: (v: number) => number;
  /** The radius an unstacked band starts from. */
  base: number;
  curveSetting: unknown;
  format: (v: unknown) => string;
}

/** Lays out one series: its path, the path it grows from, and its dots (each registered for its tooltip). */
function seriesDatum(s: RadialSeries, g: SeriesGeometry): RadialSeriesDatum {
  const single = s.rows.length === 1;
  const data = (single ? s.rows[0] : merge(s.rows, g.aggs)) as DataPoint;
  // A series of several rows stands for no one row.
  const si = single ? rowIndex(g.rows, data) : AGGREGATE_INDEX;
  const curve = radialCurveName(g.curveSetting, data, si);
  const points = s.points.map(p => ({
    angle: p.angle,
    r0: g.stacked ? g.toRadius(p.y0) : g.base,
    r1: g.toRadius(p.y1),
  }));
  const path = (pts: typeof points) =>
    g.area
      ? radialAreaPath(pts, curve, g.closed)
      : radialLinePath(
          pts.map(p => ({angle: p.angle, r: p.r1})),
          curve,
          g.closed,
        );
  const dots: RadialDot[] = [];
  s.points.forEach((p, k) => {
    if (!p.row) return;
    const info = {key: p.key, label: g.format(p.x), value: p.value};
    registerRadialPoint(p.row, info);
    const [px, py] = polarXY(p.angle, points[k].r1);
    dots.push({row: p.row, i: p.i, x: px, y: py, info});
  });
  return {
    __d3plus__: true,
    data,
    i: si,
    id: s.id,
    d: path(points),
    // Collapsed onto where it starts, with the same commands.
    enterD: path(points.map(p => ({angle: p.angle, r0: p.r0, r1: p.r0}))),
    keys: s.points.filter(p => p.row).map(p => p.key),
    points,
    dots,
  };
}

export const applyRadialLineLayout: TransformStage = ({viz}) => {
  const key = "radial";
  const {width, height} = chartBounds(viz);
  const rows = (viz._filteredData ?? []) as DataPoint[];
  const aggs = viz.schema.aggs as Parameters<typeof merge>[1];
  const x = viz.schema.x as Accessor<unknown>;
  const area = radialIsArea(viz);
  const stacked = radialIsStacked(viz);
  const closed = viz.schema.closed !== false;

  const scale = angleScale(viz, rows);
  const series = seriesOf(viz, rows, scale);
  // Small multiples sharing one domain also fit it to every panel's values.
  const levels = polarLevels(
    radialDomainValues(series).concat(polarSharedExtent(viz)),
    viz.schema.levels as number | number[],
    yDomainOf(viz),
  );

  const rowsAt = new Map<string, DataPoint>();
  rows.forEach((d, i) => {
    const k = radialKey(x(d, i));
    if (!rowsAt.has(k)) rowsAt.set(k, d);
  });
  const format = radialXFormatter(
    viz,
    scale.continuous ? [] : scale.categories,
  );
  const buffer = POLAR_STROKE_BUFFER * 2;
  const layout = polarCategoryLayout(
    viz,
    tickCategories(scale.ticks, rowsAt, format),
    Math.max(0, width - buffer),
    Math.max(0, height - buffer),
  );
  const outer = Math.max(0, layout.radius);
  const inner = polarInnerRadius(viz.schema.innerRadius, outer);
  const toRadius = (v: number) =>
    polarRadius(v, levels.domain, inner, outer, "linear");

  // Areas would cover the ring labels, so those go above them.
  const levelLabels = pushChrome(viz, key, {
    levels,
    ticks: scale.ticks,
    inner,
    outer,
    toRadius,
    labels: polarCategoryNodes(viz, layout, key),
    labelsAbove: area,
  });

  // Unstacked bands start at 0, or the nearest end of the domain.
  const base = toRadius(0);
  const curveSetting = (viz.schema.shapeConfig[area ? "Area" : "Line"] ?? {})
    .curve as unknown;
  const shapeData = series
    .filter(s => s.points.length)
    .map(s =>
      seriesDatum(s, {
        aggs,
        rows: viz._filteredData,
        area,
        stacked,
        closed,
        toRadius,
        base,
        curveSetting,
        format,
      }),
    );

  const frame: RadialFrame = {
    inner,
    outer,
    levels,
    scale,
    area,
    stacked,
    levelLabels: area ? levelLabels : [],
    levelBoxes: radialTextBoxes(levelLabels),
  };
  viz.ctx.radial = frame;
  return {shapeData: shapeData as unknown as DataPoint[]};
};
