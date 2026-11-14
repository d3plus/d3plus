/**
    BoxWhisker's box extras — `boxMean`, `boxNotch`, `boxPoints`,
    `boxWidthByCount`, `boxCount`, and `jitter` — handed to its Box shape.
    The mean and the notch are computed in data units and placed in pixels,
    so they stay true on a log or otherwise nonlinear value axis.
*/

import {groups, quantile} from "d3-array";

import type {DataPoint} from "@d3plus/data";

import {meanOf, notchInterval} from "../../shapes/boxExtras.js";
import {readBoxSummary} from "../../shapes/boxSummary.js";
import type {PlotAxisFn} from "../features/plotPaint.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {boxValueAxis} from "./outliers.js";

type Row = Record<string, unknown>;
type RowFn = (d: DataPoint, i: number) => unknown;

/** A value as a number: numbers and Dates convert, anything else is NaN. */
const toNumber = (v: unknown): number =>
  typeof v === "number" || v instanceof Date ? +v : NaN;

/** One computed box's observations along the value axis, ascending. */
export function observedValues(rows: Row[], axis: "x" | "y"): number[] {
  return rows
    .map(d => toNumber(d[`${axis}2`] ?? d[axis]))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

/**
    The mean, notch, and count of one box's ascending observations, in data
    units.
    @param values The box's observations, ascending.
*/
export function observedExtras(values: number[]): {
  mean?: number;
  notch: [number, number] | null;
  count: number;
} {
  const median = quantile(values, 0.5);
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  return {
    mean: meanOf(values),
    notch:
      median === undefined || q1 === undefined || q3 === undefined
        ? null
        : notchInterval(median, q1, q3, values.length),
    count: values.length,
  };
}

/**
    The Box settings for boxes BoxWhisker computes from observations. Each
    box's mean and notch come from its category's rows (`rows`, grouped by
    their `discrete` key, which the box's merged datum shares) and are read
    through `scale` into pixels.
    @param viz The chart.
    @param rows The plotted Box rows.
    @param scale The value axis, data units to pixels.
*/
export function computedBoxExtras(
  viz: VizInstance,
  rows: Row[],
  scale: PlotAxisFn,
): Row {
  const axis = boxValueAxis(viz);
  const extras = new Map(
    groups(rows, d => `${d.discrete}`).map(([key, members]) => [
      key,
      observedExtras(observedValues(members, axis)),
    ]),
  );
  const of = (d: DataPoint) => extras.get(`${(d as Row).discrete}`);
  const px = (v: number | undefined) => (v === undefined ? NaN : scale(v));
  return {
    ...shared(viz),
    boxMean: viz.schema.boxMean ? (d: DataPoint) => px(of(d)?.mean) : false,
    boxNotch: viz.schema.boxNotch
      ? (d: DataPoint) => of(d)?.notch?.map(v => px(v))
      : false,
  };
}

/**
    The Box settings for precomputed boxes: a `boxMean` key or accessor is
    read through `scale`, and a notch is a `boxNotch` accessor's
    `[lower, upper]` or else comes from each row's quartiles, median, and
    `boxCount`. Precomputed rows have no observations to draw.
    @param viz The chart.
    @param scale The value axis, data units to pixels.
*/
export function precomputedBoxExtras(viz: VizInstance, scale: PlotAxisFn): Row {
  const {boxMean, boxCount, boxNotch} = viz.schema;
  const px = (v: unknown) => {
    const n = toNumber(v);
    return Number.isFinite(n) ? scale(v) : NaN;
  };
  return {
    ...shared(viz),
    boxPoints: false,
    boxMean:
      typeof boxMean === "function"
        ? (d: DataPoint) => {
            const row = d as Row;
            return px(
              (boxMean as RowFn)(row.data as DataPoint, row.i as number),
            );
          }
        : false,
    boxNotch: boxNotch
      ? (d: DataPoint) => {
          const row = d as Row;
          const source = row.data as DataPoint,
            i = row.i as number;
          if (typeof boxNotch === "function") {
            const given = (boxNotch as RowFn)(source, i);
            return Array.isArray(given) ? given.map(px) : undefined;
          }
          const s = readBoxSummary(viz.schema, source, i);
          const n =
            typeof boxCount === "function"
              ? toNumber((boxCount as RowFn)(source, i))
              : NaN;
          const notch = s ? notchInterval(s.median, s.q1, s.q3, n) : null;
          return notch?.map(px);
        }
      : false,
  };
}

/** The settings both kinds of box take as given. */
function shared(viz: VizInstance): Row {
  const {boxCount, boxPoints, boxWidthByCount, jitter} = viz.schema;
  return {
    boxCount:
      typeof boxCount === "function"
        ? (d: DataPoint) => {
            const row = d as Row;
            return (boxCount as RowFn)(row.data as DataPoint, row.i as number);
          }
        : undefined,
    boxPoints: !!boxPoints,
    boxWidthByCount: !!boxWidthByCount,
    jitter,
  };
}
