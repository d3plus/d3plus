/**
    HorizonChart's per-instance state and the row keys its parts share.
*/
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import type {VizInstance} from "../viz/vizTypes.js";
import type {HorizonPalette} from "./horizonColors.js";

/** A row accessor. */
export type RowFn = (d: DataPoint, i: number) => unknown;

/** The key a band's scene datum and band key rows keep their band under. */
export const HORIZON_BAND = "__d3plusHorizonBand";

/** What a band carries under `HORIZON_BAND`. */
export interface HorizonBandMeta {
  band: number;
  sign: 1 | -1;
  /** The value range the band spans, low to high. */
  range: [number, number];
  color: string;
}

/** Per-instance state kept on `viz.ctx.horizon`. */
export interface HorizonState {
  /** The user's `y` accessor: each row's value. */
  value: RowFn;
  /** The data key behind a string `y`, which titles the tooltip. */
  valueKey?: string;
  /** The value range each band spans in this draw. */
  size: number;
  /** The band colors for this draw. */
  palette: HorizonPalette;
  /** Whether this draw has positive or negative values. */
  signs: {positive: boolean; negative: boolean};
  /** Each series' position in data order, by id. */
  order: Map<string, number>;
  /** Each series' label, by id. */
  labels: Map<string, string>;
  /** The row order `ySort` last set automatically, so a user's is left alone. */
  sort?: (a: DataPoint, b: DataPoint) => number;
  /** The axis config values last set automatically, so a user's are left alone. */
  tickFormat?: (d: unknown) => string;
}

/** The chart's state. */
export function horizonState(viz: VizInstance): HorizonState {
  return viz.ctx.horizon as HorizonState;
}

/** The id of the series (and row) a data row belongs to. */
export function seriesId(viz: VizInstance, d: DataPoint, i: number): string {
  if (typeof viz._ids !== "function") return "";
  return viz
    ._ids(d, i)
    .slice(0, (viz._drawDepth ?? 0) + 1)
    .join("_");
}

/** Walks Plot's `__d3plus__` wrappers down to the user-level row. */
export function userRow(d: DataPoint): DataPoint {
  while (d && d.__d3plus__ && d.data) d = d.data as DataPoint;
  return d;
}

/** A row's value, as a number (NaN when missing). */
export function rowValue(viz: VizInstance, d: DataPoint, i: number): number {
  const v = horizonState(viz).value(userRow(d), i);
  return v === null || v === undefined || v === "" ? NaN : Number(v);
}

/** The band a scene datum or band key row stands for, if any. */
export function bandMeta(d: unknown): HorizonBandMeta | undefined {
  const row = d ? userRow(d as DataPoint) : undefined;
  return row
    ? (row[HORIZON_BAND] as unknown as HorizonBandMeta | undefined)
    : undefined;
}

/** A band's color for a value: the band the value reaches, in its sign's colors. */
export function valueColor(
  state: Pick<HorizonState, "palette" | "size">,
  value: number,
): string | undefined {
  if (!Number.isFinite(value) || value === 0 || !(state.size > 0))
    return undefined;
  const colors = value > 0 ? state.palette.positive : state.palette.negative;
  const band = Math.min(
    colors.length - 1,
    Math.ceil(Math.abs(value) / state.size) - 1,
  );
  return colors[Math.max(0, band)];
}

/**
    The band key's rows: one per band of each sign drawn, negative bands
    first from the most negative, so the key reads low to high.
*/
export function bandKeyRows(state: HorizonState, bands: number): DataPoint[] {
  const count = Math.max(1, Math.floor(bands));
  const rows: DataPoint[] = [];
  const add = (sign: 1 | -1, band: number) => {
    const near = band * state.size,
      far = (band + 1) * state.size;
    const meta: HorizonBandMeta = {
      band,
      sign,
      range: sign > 0 ? [near, far] : [-far, -near],
      color: (sign > 0 ? state.palette.positive : state.palette.negative)[band],
    };
    rows.push({[HORIZON_BAND]: meta as never});
  };
  if (!(state.size > 0)) return rows;
  if (state.signs.negative)
    for (let band = count - 1; band >= 0; band--) add(-1, band);
  if (state.signs.positive)
    for (let band = 0; band < count; band++) add(1, band);
  return rows;
}

/** A band's range as legend text, such as "10 – 20". */
export function bandLabel(
  meta: HorizonBandMeta,
  format: (n: number) => string,
): string {
  return `${format(meta.range[0])} – ${format(meta.range[1])}`;
}

/** The chart's value format: abbreviated numbers in the chart's locale. */
export function valueFormat(viz: VizInstance): (n: number) => string {
  return (n: number) => formatAbbreviate(n, viz.schema.locale);
}
