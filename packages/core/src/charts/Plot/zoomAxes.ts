/**
    Single-axis zoom for the Plot family (`zoomAxes`): which of a plot's
    zoomable axes a zoom rescales, and the domain an axis it leaves alone
    refits to, so it spans the rows in view.

    @module
*/

/** One of a Plot's four axes. */
export type AxisName = "x" | "x2" | "y" | "y2";

/**
    The `zoomAxes` setting: the axes a Plot's zoom rescales, as a list, or
    the shorthand `"x"`, `"y"`, or `"xy"`.
*/
export type ZoomAxesSetting = ("x" | "y")[] | "x" | "y" | "xy";

/** Which screen dimensions a zoom rescales. */
export interface ZoomDims {
  x: boolean;
  y: boolean;
}

/**
    The dimensions a Plot's zoom rescales: those `zoomAxes` lists (or names
    with `"x"`, `"y"`, or `"xy"`), or, when it is unset (or names neither), the time axis alone for a chart
    whose zoom runs along one (`timeAxis`: a range selector or an overview
    chart), or both.
    @param setting The chart's `zoomAxes`.
    @param timeAxis The time axis the zoom runs along by default, if any.
*/
export function zoomDimensions(
  setting: unknown,
  timeAxis?: "x" | "y",
): ZoomDims {
  const list =
    setting === "x" || setting === "y"
      ? [setting]
      : setting === "xy"
        ? ["x", "y"]
        : setting;
  if (Array.isArray(list)) {
    const dims = {x: list.includes("x"), y: list.includes("y")};
    if (dims.x || dims.y) return dims;
  }
  if (timeAxis) return {x: timeAxis === "x", y: timeAxis === "y"};
  return {x: true, y: true};
}

/**
    Splits a plot's zoomable axes into those a zoom rescales and those that
    refit to the rows in view. When `dims` leaves none of them to rescale (a
    `zoomAxes: "x"` bar chart whose x axis is a list of categories), every
    zoomable axis rescales, as without `zoomAxes`.
    @param zoomable The plot's linear and time axes.
    @param dims The dimensions the zoom rescales.
*/
export function splitZoomAxes(
  zoomable: AxisName[],
  dims: ZoomDims,
): {rescale: AxisName[]; refit: AxisName[]} {
  const rescale = zoomable.filter(axis => dims[axis[0] as "x" | "y"]);
  if (!rescale.length) return {rescale: zoomable, refit: []};
  return {rescale, refit: zoomable.filter(axis => !rescale.includes(axis))};
}

/** A formatted Plot row: the axis values, confidence bounds, series id, and shape. */
export type RefitRow = Record<string, unknown>;

/** What `refitDomain` reads. */
export interface RefitInput {
  /** The plot's formatted rows. */
  rows: RefitRow[];
  /** The rescaled axis's row key (`"x"` or `"y"`). */
  along: "x" | "y";
  /** The rescaled axis's visible window, as numbers (a Date as its time). */
  window: [number, number];
  /** The axis to refit: its row key. */
  axis: AxisName;
  /** Whether the rows' `lci`/`hci` bounds belong to this axis. */
  confidence?: boolean;
  /** A stacked plot's d3-stack output, whose bands this axis shows. */
  stack?: number[][][];
  /** The row key of a stacked plot's discrete axis. */
  discrete?: string;
  /** A value the domain always reaches (where bars and areas start). */
  baseline?: number;
}

/** A number or Date as a finite number; undefined for anything else. */
const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : v instanceof Date ? +v : NaN;
  return Number.isFinite(n) ? n : undefined;
};

/**
    Each Line and Area series' nearest rows outside the window, so a line
    that runs off either edge stays in view where it crosses it.
*/
function edgeNeighbors(
  rows: RefitRow[],
  along: string,
  [lo, hi]: [number, number],
): RefitRow[] {
  const before = new Map<unknown, [number, RefitRow]>();
  const after = new Map<unknown, [number, RefitRow]>();
  for (const row of rows) {
    if (row.shape !== "Line" && row.shape !== "Area") continue;
    const at = num(row[along]);
    if (at === undefined) continue;
    if (at < lo) {
      const prev = before.get(row.id);
      if (!prev || at > prev[0]) before.set(row.id, [at, row]);
    } else if (at > hi) {
      const next = after.get(row.id);
      if (!next || at < next[0]) after.set(row.id, [at, row]);
    }
  }
  return [...before.values(), ...after.values()].map(([, row]) => row);
}

/** The values a stacked plot's bands span within the window. */
function stackValues(
  stack: number[][][],
  discrete: string,
  [lo, hi]: [number, number],
): number[] {
  const values: number[] = [];
  for (const series of stack)
    for (const point of series) {
      const group = (point as unknown as {data?: RefitRow[]}).data;
      const at = num(group?.[0]?.[discrete]);
      if (at === undefined || at < lo || at > hi) continue;
      for (const v of [point[0], point[1]])
        if (Number.isFinite(v)) values.push(v);
    }
  return values;
}

/**
    The extent an axis refits to while another axis zooms: the values of the
    rows whose rescaled-axis value lies in the window (and each line's
    nearest rows past either edge), their confidence bounds, a stacked
    plot's bands, and the baseline. A single value widens by a tenth either
    way. Undefined when nothing is in view.
    @param input The rows, the window, and the axis to refit.
*/
export function refitDomain(input: RefitInput): [number, number] | undefined {
  const {rows, along, window, axis, confidence, stack, discrete, baseline} =
    input;
  const [lo, hi] = window[0] <= window[1] ? window : [window[1], window[0]];
  const values: number[] = [];
  if (stack && discrete) values.push(...stackValues(stack, discrete, [lo, hi]));
  else {
    const inView = rows.filter(row => {
      const at = num(row[along]);
      return at !== undefined && at >= lo && at <= hi;
    });
    for (const row of [...inView, ...edgeNeighbors(rows, along, [lo, hi])]) {
      const keys = confidence ? [axis, "lci", "hci"] : [axis];
      for (const key of keys) {
        const v = num(row[key]);
        if (v !== undefined) values.push(v);
      }
    }
  }
  if (!values.length) return undefined;
  if (baseline !== undefined && Number.isFinite(baseline))
    values.push(baseline);
  let min = Infinity,
    max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) {
    const pad = Math.abs(min) / 10 || 1;
    min -= pad;
    max += pad;
  }
  return [min, max];
}

/** The parts of a chart `rangeSelectorAxis` and `defaultZoomAxis` read. */
interface RangeAxisSource {
  schema: {rangeSelector?: unknown; zoom?: unknown; link?: unknown};
  _xTime?: boolean;
  _yTime?: boolean;
}

/**
    The time axis a Plot's range selector windows: x when it is a time axis,
    else y. Undefined when `rangeSelector` is off, zoom is off, or the plot
    has no time axis.
    @param viz The chart.
*/
export function rangeSelectorAxis(viz: RangeAxisSource): "x" | "y" | undefined {
  const {rangeSelector, zoom} = viz.schema ?? {};
  if (!zoom || !rangeSelector) return undefined;
  if (Array.isArray(rangeSelector) && !rangeSelector.length) return undefined;
  return viz._xTime ? "x" : viz._yTime ? "y" : undefined;
}

/**
    Whether a chart's `link` makes it its group's overview: `{zoom:
    "overview"}` (see `drawSteps/overview.ts`).
    @param link The chart's `link`.
*/
export function isOverviewLink(link: unknown): boolean {
  return Boolean(
    link &&
    typeof link === "object" &&
    (link as {zoom?: unknown}).zoom === "overview",
  );
}

/**
    The axis a Plot zooms along alone when `zoomAxes` is unset: the range
    selector's axis, or an overview chart's time axis (x when it has none).
    @param viz The chart.
*/
export function defaultZoomAxis(viz: RangeAxisSource): "x" | "y" | undefined {
  const range = rangeSelectorAxis(viz);
  if (range || !isOverviewLink(viz.schema?.link) || !viz.schema.zoom)
    return range;
  return viz._yTime && !viz._xTime ? "y" : "x";
}

/**
    Whether a chart draws as its link group's overview: a Plot whose `link`
    sets `zoom: "overview"`, with zoom on and not drawn as small multiples.
    @param viz The chart.
*/
export function isOverviewChart(viz: {
  schema?: Record<string, unknown>;
}): boolean {
  const schema = viz.schema ?? {};
  return Boolean(schema.zoom) && !schema.facet && isOverviewLink(schema.link);
}
