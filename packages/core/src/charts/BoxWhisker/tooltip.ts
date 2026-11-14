/**
    BoxWhisker's tooltip rows: a box lists its whisker ends, quartiles, and
    median, largest first, with its mean, notch, and count when drawn. A precomputed box reads them from its summary row;
    a box computed from observations recomputes them in data units from the
    observations it drew.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import {boxStats, whiskerPair} from "../../shapes/boxStats.js";
import type {WhiskerMode} from "../../shapes/boxStats.js";
import {notchInterval} from "../../shapes/boxExtras.js";
import {hasBoxStats, readBoxSummary} from "../../shapes/boxSummary.js";
import {rangeText} from "../Plot/confidenceTooltip.js";
import {axisName, axisValue} from "../Plot/sharedTooltip.js";
import {observedExtras, observedValues} from "./extras.js";
import {boxValueAxis} from "./outliers.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** Each drawn box record, by the source row its tooltip receives. */
const drawnBoxes = new WeakMap<object, DataPoint>();

/** A datum's source row and its index, through Plot's and Box's wrappers. */
export function sourceRow(d: DataPoint, i: number): [DataPoint, number] {
  while (d.__d3plus__ && d.data) {
    i = d.i as number;
    d = d.data as DataPoint;
  }
  return [d, i];
}

/**
    Notes the box record behind each Box part in `nodes`, keyed by the source
    row a tooltip on that box receives, and returns `nodes`.
*/
export function noteDrawnBoxes(nodes: SceneNode[]): SceneNode[] {
  const walk = (list: SceneNode[]) => {
    for (const node of list) {
      if (node.type === "group") walk(node.children);
      for (const owner of node.owners || [])
        if (owner.shapeType === "Box" && owner.datum)
          drawnBoxes.set(sourceRow(owner.datum, owner.index)[0], owner.datum);
    }
  };
  walk(nodes);
  return nodes;
}

/** The `whiskerMode` BoxWhisker's boxes draw with. */
export function chartWhiskerMode(viz: VizInstance): WhiskerMode {
  const config = (viz.schema.shapeConfig || {}) as Record<string, unknown>;
  const box = (config.Box || {}) as Record<string, unknown>;
  const mode = box.whiskerMode ?? config.whiskerMode;
  return mode === undefined ? ["tukey", "tukey"] : whiskerPair(mode);
}

/** A row accessor, such as the chart's `_x` or `_y`. */
type RowAccessor = (d: DataPoint, i: number) => unknown;

/** One table row per statistic, largest first. */
type Rows = [string, string][];

/**
    A drawn box's statistics in data units, from the observations it
    summarizes; null when `row` isn't a drawn box.
*/
export function drawnBoxStats(viz: VizInstance, row: DataPoint) {
  const box = drawnBoxes.get(row);
  if (!box) return null;
  const values = observedValues(
    box.values as unknown as Record<string, unknown>[],
    box.orient === "vertical" ? "y" : "x",
  );
  return values.length
    ? {...boxStats(values, chartWhiskerMode(viz)), ...observedExtras(values)}
    : null;
}

/**
    Whether `d` (or the source row it wraps) is one observation of a computed
    box, as a `boxPoints` point or an outlier is, rather than a box.
*/
export function isObservation(viz: VizInstance, d: DataPoint): boolean {
  if (!d || hasBoxStats(viz.schema)) return false;
  return !drawnBoxes.has(sourceRow(d, 0)[0]);
}

/** A finite number, else undefined. */
const finiteOr = (v: unknown): number | undefined => {
  const n = typeof v === "number" || v instanceof Date ? +v : NaN;
  return Number.isFinite(n) ? n : undefined;
};

/**
    The tooltip rows of one observation drawn beside its box (a `boxPoints`
    point or an outlier of a computed box): its value, read through the
    value axis's accessor and named for that axis. None for anything else.
*/
export function observationRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): Rows {
  if (!isObservation(viz, d)) return [];
  const [row, index] = sourceRow(d, i);
  const axis = boxValueAxis(viz);
  const accessor = viz[`_${axis}`] as RowAccessor | undefined;
  const raw = accessor ? accessor(row, index) : undefined;
  if (finiteOr(raw) === undefined) return [];
  return [[axisName(viz, axis), axisValue(viz, axis, raw)]];
}

/**
    The extra rows a box lists for the extras the chart draws: its mean
    (placed among the statistics by value), its notch, and its count.
*/
function extraRows(
  viz: VizInstance,
  rows: [string, number | undefined][],
  extras: {mean?: number; notch?: number[] | null; count?: number},
  fmt: (n: number | undefined) => string,
): Rows {
  const t = (str: string) => viz.schema.translate(str) as string;
  const {boxMean, boxNotch, boxWidthByCount} = viz.schema;
  const listed = rows.filter(([, v]) => v !== undefined) as [string, number][];
  if (boxMean && extras.mean !== undefined) {
    const at = listed.findIndex(([, v]) => v < extras.mean!);
    listed.splice(at < 0 ? listed.length : at, 0, ["Mean", extras.mean]);
  }
  const out: Rows = listed.map(([label, v]) => [t(label), fmt(v)]);
  if (boxNotch && extras.notch) {
    const median = out.findIndex(([label]) => label === t("Median"));
    const range = rangeText(extras.notch[0], extras.notch[1], v => fmt(v));
    out.splice(median + 1, 0, [t("Notch"), range]);
  }
  if (boxWidthByCount && extras.count !== undefined)
    out.push([t("Observations"), fmt(extras.count)]);
  return out;
}

/**
    The tooltip rows of a box. A precomputed box lists its given statistics.
    A computed box lists its whisker ends as Maximum and Minimum when its
    `whiskerMode` reaches the extreme values (`"extent"`), and as Upper and
    Lower Whisker otherwise, since a Tukey or quantile whisker can stop short
    of (or past) the data's extremes. Either kind adds the extras the chart
    draws: its Mean (among the statistics by value), its Notch, and, with
    `boxWidthByCount`, its Observations. An observation drawn beside a
    computed box (a point or an outlier) lists its value.
*/
export function boxTooltipRows(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): Rows {
  if (!d) return [];
  const fmt = (n: number | undefined) =>
    n === undefined ? "" : formatAbbreviate(n, viz.schema.locale);
  const [row, index] = sourceRow(d, i);
  if (hasBoxStats(viz.schema)) {
    const s = readBoxSummary(viz.schema, row, index);
    if (!s) return [];
    const read = (key: string) => {
      const fn = viz.schema[key];
      return typeof fn === "function" ? finiteOr(fn(row, index)) : undefined;
    };
    const count = read("boxCount");
    return extraRows(
      viz,
      [
        ["Maximum", s.max],
        ["Upper Quartile", s.q3],
        ["Median", s.median],
        ["Lower Quartile", s.q1],
        ["Minimum", s.min],
      ],
      {
        mean: read("boxMean"),
        notch:
          count === undefined
            ? null
            : notchInterval(s.median, s.q1, s.q3, count),
        count,
      },
      fmt,
    );
  }
  const s = drawnBoxStats(viz, row);
  if (!s) return observationRows(viz, d, i);
  const mode = chartWhiskerMode(viz);
  return extraRows(
    viz,
    [
      [mode[1] === "extent" ? "Maximum" : "Upper Whisker", s.upperLimit],
      ["Upper Quartile", s.third],
      ["Median", s.median],
      ["Lower Quartile", s.first],
      [mode[0] === "extent" ? "Minimum" : "Lower Whisker", s.lowerLimit],
    ],
    s,
    fmt,
  );
}
