/**
    Reference lines, bands, and quadrant centers count toward the axis
    domains they sit on, so a target above the data (or a band below it)
    widens its continuous or time axis into view. A domain end the user set
    stays put.
*/
import {date} from "@d3plus/dom";

import {
  REFERENCE_BAND,
  REFERENCE_LINE,
  referenceAxis,
} from "../features/referenceAnnotations.js";
import {plotAnnotationList} from "../features/plotAnnotationList.js";
import {QUADRANTS} from "../features/referenceQuadrants.js";
import type {Annotation} from "../features/annotationTypes.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {DomainValue} from "./pipelineScales.js";
import {plotAxisUtc} from "./plotRangeBreaks.js";

/** The viz a Plot pipeline stage reads. */
type PlotViz = Parameters<TransformStage>[0]["viz"];

/** The four Plot axes. */
type AxisKey = "x" | "y" | "x2" | "y2";

/** The four Plot axes, in order. */
const AXES: AxisKey[] = ["x", "y", "x2", "y2"];

/**
    The data-unit values reference lines, bands, and quadrant centers place
    on each axis, from a list of annotations (`"plot"`-fraction entries and
    other kinds left out): a line's value and its `from`/`to` on the other
    axis, each end of a band's spans, and a quadrant center's `x` and `y`.
    @param annotations The chart's annotations, with `referenceLines`, `referenceBands`, and `quadrants` expanded.
*/
export function referenceDomainValues(
  annotations: Annotation[],
): Record<AxisKey, unknown[]> {
  const out: Record<AxisKey, unknown[]> = {x: [], y: [], x2: [], y2: []};
  annotations.forEach(a => {
    if (a.ref === "plot") return;
    if (a.shape === QUADRANTS) {
      out.x.push(a.x);
      out.y.push(a.y);
    } else if (a.shape === REFERENCE_BAND) {
      AXES.forEach(axis => {
        const value = a[axis];
        if (Array.isArray(value)) out[axis].push(value[0], value[1]);
      });
    } else if (a.shape === REFERENCE_LINE) {
      const axis = referenceAxis(a);
      if (!axis) return;
      out[axis].push(a[axis]);
      const other = axis[0] === "y" ? "x" : "y";
      [a.from, a.to].forEach(v => {
        if (v !== undefined && v !== null && v !== "") out[other].push(v);
      });
    }
  });
  return out;
}

/** A value as a number on a continuous or time axis, or NaN. */
function numeric(value: unknown, time: boolean, utc = false): number {
  if (value === undefined || value === null || value === "") return NaN;
  if (time) {
    const d =
      value instanceof Date ? value : date(value as string | number, {utc});
    return d instanceof Date ? +d : NaN;
  }
  return typeof value === "number" || typeof value === "string"
    ? Number(value)
    : NaN;
}

/**
    A continuous or time domain stretched to take in `values`, keeping its
    orientation. Only the ends marked `open` move (an end the user set stays
    put), and a log axis ignores values at or below zero. Returns the domain
    itself when nothing changes.
    @param domain The axis's `[start, end]` domain.
    @param values The values to take in.
    @param options Whether the axis is a time (read in UTC, with `utc`) or log axis, and which ends may move.
*/
export function widenToValues(
  domain: DomainValue[],
  values: unknown[],
  options: {
    time?: boolean;
    utc?: boolean;
    log?: boolean;
    open?: [boolean, boolean];
  } = {},
): DomainValue[] {
  const {time = false, utc = false, log = false, open = [true, true]} = options;
  if (!domain || domain.length !== 2 || !values.length) return domain;
  const ends = domain.map(d => numeric(d, time, utc));
  if (!ends.every(Number.isFinite)) return domain;
  const nums = values
    .map(v => numeric(v, time, utc))
    .filter(n => Number.isFinite(n) && (!log || n > 0));
  if (!nums.length) return domain;
  const ascending = ends[0] <= ends[1];
  const [loAt, hiAt] = ascending ? [0, 1] : [1, 0];
  const lo = Math.min(...nums),
    hi = Math.max(...nums);
  const out = domain.slice();
  let changed = false;
  if (open[loAt] && lo < ends[loAt]) {
    out[loAt] = time ? new Date(lo) : lo;
    changed = true;
  }
  if (open[hiAt] && hi > ends[hiAt]) {
    out[hiAt] = time ? new Date(hi) : hi;
    changed = true;
  }
  return changed ? out : domain;
}

/**
    Which ends of an axis's domain may widen: those the user's domain leaves
    unset (both, without one; the end, for a one-value `[start]`).
    @param user The user's domain for the axis, if any.
*/
export function openDomainEnds(user: unknown): [boolean, boolean] {
  if (!Array.isArray(user)) return [true, true];
  const unset = (v: unknown) => v === undefined || v === null;
  return [unset(user[0]), user.length < 2 || unset(user[1])];
}

/** Scale types whose domain is a continuous extent. */
const CONTINUOUS = new Set(["Linear", "Time"]);

/**
    Widens a Plot's auto domains to take in its reference lines, bands, and
    quadrant center (from `referenceLines`, `referenceBands`, `quadrants`,
    and `"ReferenceLine"`/`"ReferenceBand"` annotations), on continuous and
    time axes only. An
    end set by the user's domain (`xDomain`, `xConfig.domain`, …) stays put.
    @param viz The chart.
    @param autoDomains Each axis's domain before the baseline is applied.
    @param scales Each axis's scale type (`"Linear"`, `"Time"`, `"Point"`, …) and configured scale (`"log"`, …).
    @param user The user's x and y domains, as `computePlotScales` reads them.
*/
export function widenReferenceDomains(
  viz: PlotViz,
  autoDomains: Record<AxisKey, DomainValue[] | undefined>,
  scales: Record<AxisKey, {type: string; config: string}>,
  user: Record<string, DomainValue[] | undefined>,
): Record<AxisKey, DomainValue[] | undefined> {
  const values = referenceDomainValues(plotAnnotationList(viz));
  const out = {...autoDomains};
  AXES.forEach(axis => {
    const domain = autoDomains[axis];
    if (!domain || !values[axis].length) return;
    if (!CONTINUOUS.has(scales[axis].type)) return;
    const config = (viz[`_${axis}Config`] as {domain?: unknown} | undefined)
      ?.domain;
    const given =
      axis.length === 1
        ? (user[axis] ?? config)
        : (viz.schema[`${axis}Domain`] ?? config);
    out[axis] = widenToValues(domain, values[axis], {
      time: scales[axis].type === "Time",
      utc: plotAxisUtc(viz, axis),
      log: scales[axis].config === "log",
      open: openDomainEnds(given),
    });
  });
  return out;
}
