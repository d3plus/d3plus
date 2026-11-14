/**
    ScatterMatrix's data: the observations spread into one row per panel
    (a point in every off-diagonal panel) and binned for the diagonal's
    histograms, and the domain each dimension shares across its row and
    column of panels. Pure data math, no chart state.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import {bin, extent, max, thresholdSturges} from "d3-array";
import {scaleLinear} from "d3-scale";

import {isNumeric} from "../ParallelCoordinates/dimensions.js";

/** The key a panel row keeps its place in the matrix under. */
export const MATRIX_META = "__scatterMatrix";

/**
    The key a panel row keeps its observation's id under (a bin row's own
    id), its `groupBy` level. Text, so rows merged into a legend entry
    list every id they hold.
*/
export const MATRIX_ID = "__scatterMatrixId";

/** A point: one observation in an off-diagonal panel. */
export interface MatrixPoint {
  kind: "point";
  /** The panel's row (its y dimension) and column (its x dimension). */
  i: number;
  j: number;
  /** The observation's index in the data. */
  row: number;
  x: number;
  y: number;
}

/** One group's bar in one bin of a diagonal panel's histogram. */
export interface MatrixBin {
  kind: "bin";
  /** The diagonal panel's dimension. */
  i: number;
  j: number;
  /** The bin's edges: it holds `x0` up to `x1`, and `x1` itself when it's the `last` bin. */
  x0: number;
  x1: number;
  last: boolean;
  /** The group's observations in the bin, and the stack below them. */
  count: number;
  y0: number;
  /** The tallest stack in this panel's histogram. */
  max: number;
  /** The group's key (empty without groups). */
  group: string;
  /** The bin's middle, and the dimension's lowest value (inside the shared domain). */
  x: number;
  y: number;
}

/** Where a panel row sits in the matrix. */
export type MatrixMeta = MatrixPoint | MatrixBin;

/**
    A panel row: an observation's (or a bin's group's first observation's)
    fields, its place (under `MATRIX_META`, see `matrixMeta`), and its id
    (under `MATRIX_ID`).
*/
export type MatrixRow = DataPoint;

/** `meta` as a row field. */
const metaField = (meta: MatrixMeta) => meta as unknown as DataPoint;

/** A row accessor. */
export type RowFn = (d: DataPoint, i: number) => unknown;

/** A panel row's place in the matrix, if it has one. */
export function matrixMeta(d: DataPoint | undefined): MatrixMeta | undefined {
  let row = d;
  while (row && row.__d3plus__ && row.data) row = row.data as DataPoint;
  return row
    ? (row[MATRIX_META] as unknown as MatrixMeta | undefined)
    : undefined;
}

/** A panel's index in the matrix of `n` dimensions: row by row. */
export const cellIndex = (i: number, j: number, n: number): number => i * n + j;

/** A row's value on a dimension, when it's a finite number. */
function valueOf(read: RowFn, d: DataPoint, k: number): number | undefined {
  const v = read(d, k);
  return isNumeric(v) ? v : undefined;
}

/**
    One row per observation for every off-diagonal panel where it has both
    values: its own fields, its place and values there, and its id.
    @param rows The observations.
    @param dims Each dimension's accessor, in matrix order.
    @param idOf An observation's id, from its index in `rows`.
*/
export function matrixPoints(
  rows: DataPoint[],
  dims: RowFn[],
  idOf: (row: number) => string = row => `${row}`,
): MatrixRow[] {
  const out: MatrixRow[] = [];
  rows.forEach((d, row) => {
    const id = idOf(row);
    const values = dims.map(read => valueOf(read, d, row));
    values.forEach((y, i) => {
      if (y === undefined) return;
      values.forEach((x, j) => {
        if (i === j || x === undefined) return;
        out.push({
          ...d,
          [MATRIX_META]: metaField({kind: "point", i, j, row, x, y}),
          [MATRIX_ID]: id,
        });
      });
    });
  });
  return out;
}

/**
    One row per group per bin of each dimension's histogram (the diagonal
    panels), stacked in group order. Each row carries its group's first
    observation's fields, so it colors and groups like that group's
    points. Bin edges are shared by every group and read from every row,
    so they stay put while legend clicks hide groups; only the `visible`
    rows are counted.
    @param rows The observations.
    @param dims Each dimension's accessor, in matrix order.
    @param group Each observation's group key.
    @param thresholds Bin edges: a count, or interior edges, as d3's `bin`.
    @param visible Whether an observation is counted (every one by default).
*/
export function matrixBins(
  rows: DataPoint[],
  dims: RowFn[],
  group: (d: DataPoint, k: number) => string,
  thresholds?: number | number[],
  visible: (d: DataPoint, k: number) => boolean = () => true,
): MatrixRow[] {
  const out: MatrixRow[] = [];
  const groups: string[] = [];
  const first = new Map<string, DataPoint>();
  rows.forEach((d, k) => {
    const g = group(d, k);
    if (!first.has(g)) {
      first.set(g, d);
      groups.push(g);
    }
  });
  dims.forEach((read, i) => {
    const values: {v: number; g: string; shown: boolean}[] = [];
    rows.forEach((d, k) => {
      const v = valueOf(read, d, k);
      if (v !== undefined)
        values.push({v, g: group(d, k), shown: visible(d, k)});
    });
    if (!values.length) return;
    const binner = bin<{v: number; g: string; shown: boolean}, number>().value(
      e => e.v,
    );
    if (Array.isArray(thresholds)) binner.thresholds(thresholds);
    else if (typeof thresholds === "number") binner.thresholds(thresholds);
    else binner.thresholds(thresholdSturges);
    const bins = binner(values).map(b =>
      Object.assign(
        b.filter(e => e.shown),
        {x0: b.x0, x1: b.x1},
      ),
    );
    // A bin sits at its dimension's lowest value, inside the shared domain:
    // its bar is drawn from the panel's floor, whatever its y.
    const floor = Math.min(...values.map(e => e.v));
    const tallest = max(bins, b => b.length) ?? 0;
    bins.forEach((b, k) => {
      if (b.x0 === undefined || b.x1 === undefined || !b.length) return;
      let y0 = 0;
      for (const g of groups) {
        const count = b.filter(e => e.g === g).length;
        if (!count) continue;
        const meta: MatrixBin = {
          kind: "bin",
          i,
          j: i,
          x0: b.x0,
          x1: b.x1,
          last: k === bins.length - 1,
          count,
          y0,
          max: tallest,
          group: g,
          x: (b.x0 + b.x1) / 2,
          y: floor,
        };
        out.push({
          ...first.get(g)!,
          [MATRIX_META]: metaField(meta),
          [MATRIX_ID]: `bin ${i} ${b.x0} ${g}`,
        });
        y0 += count;
      }
    });
  });
  return out;
}

/**
    Each dimension's domain, shared by its row and column of panels: the
    extent of its values, widened by `pad` of its span at each end (or by 1
    either side of a single value), then rounded out to round numbers.
    Undefined for a dimension without a number.
*/
export function matrixDomains(
  rows: DataPoint[],
  dims: RowFn[],
  pad = 0.05,
): ([number, number] | undefined)[] {
  return dims.map(read => {
    const [lo, hi] = extent(
      rows.map((d, k) => valueOf(read, d, k)).filter(isNumeric),
    );
    if (lo === undefined || hi === undefined) return undefined;
    const span = hi - lo;
    const padded = span ? [lo - span * pad, hi + span * pad] : [lo - 1, hi + 1];
    return scaleLinear().domain(padded).nice(5).domain() as [number, number];
  });
}
