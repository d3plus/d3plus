/**
    `applyBulletLayout` — Bullet's chart-specific layout stage. Resolves each
    row's measure, target, forecast, bands, and value domain, places one
    bullet per row of `viz._filteredData`, and fits each bullet's ticks to its
    length. Stores the shared settings on `viz.ctx.bullet` and returns one
    `BulletDatum` per row.
*/

import type {DataPoint} from "@d3plus/data";
import {textWidth} from "@d3plus/dom";

import type {Orient} from "../../shapes/shapeConfig.js";
import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";
import {hasName} from "../Gauge/applyLayout.js";
import {gaugeTicks, resolveBands} from "../Gauge/gaugeGeometry.js";
import type {
  GaugeBand,
  GaugeDomainInput,
  ResolvedBand,
} from "../Gauge/gaugeGeometry.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  bulletDomain,
  bulletExtent,
  fitAxis,
  mergeExtents,
  normalizeBands,
} from "./bulletGeometry.js";
import type {
  BulletExtent,
  BulletRect,
  BulletTrack,
} from "./bulletGeometry.js";
import {bulletStack} from "./bulletLayout.js";
import type {BulletLabelBox} from "./bulletLayout.js";
import {bulletStyle, shadeBands} from "./bulletStyle.js";
import type {BulletStyle} from "./bulletStyle.js";

/** A row accessor, or `false` when the option is off. */
type RowAccessor = ((d: DataPoint, i: number) => unknown) | false | undefined;

/** One row's bullet, laid out. */
export interface BulletDatum {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  key: string;
  value: number;
  target: number;
  forecast: number;
  name: string;
  subLabel: string;
  track: BulletTrack;
  bands: ResolvedBand[];
  ticks: number[];
  /** Whether this bullet draws its value axis. */
  axis: boolean;
  label: BulletLabelBox;
  hit: BulletRect;
}

/** Settings every bullet shares, stored on `viz.ctx.bullet`. */
export interface BulletShared {
  orient: Orient;
  style: BulletStyle;
  nameFontSize: number;
  subFontSize: number;
}

/** The name label's font size, in pixels. */
export const NAME_FONT_SIZE = 13;
/** The sub-label's font size, in pixels. */
export const SUB_FONT_SIZE = 11;
/** The gap between the name and the sub-label. */
export const LABEL_LINE_GAP = 2;

/** Reads a number from a row, or NaN when the accessor is off or the value is missing. */
export function rowNumber(acc: RowAccessor, d: DataPoint, i: number): number {
  if (typeof acc !== "function") return NaN;
  const v = acc(d, i);
  return v === null || v === undefined || v === "" ? NaN : Number(v);
}

/** The key rows are matched by when sharing domains: the row's `groupBy` ids. */
export function bulletKey(viz: VizInstance, d: DataPoint, i: number): string {
  return viz._ids(d, i).join("-");
}

/** A row's `bands`: the option's array, or what its accessor returns for the row. */
export function rowBands(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): GaugeBand[] {
  const input = viz.schema.bands;
  return normalizeBands(typeof input === "function" ? input(d, i) : input);
}

function rowDomainInput(
  viz: VizInstance,
  d: DataPoint,
  i: number,
): GaugeDomainInput {
  const input = viz.schema.domain;
  const value = typeof input === "function" ? input(d, i) : input;
  return Array.isArray(value) ? (value as GaugeDomainInput) : undefined;
}

/** Every value a row's bullet shows: its measure, target, and forecast. */
export function rowValues(viz: VizInstance, d: DataPoint, i: number): number[] {
  return [
    rowNumber(viz.schema.value as RowAccessor, d, i),
    rowNumber(viz.schema.target as RowAccessor, d, i),
    rowNumber(viz.schema.forecast as RowAccessor, d, i),
  ];
}

/**
    The extent each bullet's domain is built from, keyed by `bulletKey`: rows
    with the same key share one domain. With `sharedDomain`, every row shares
    one domain, stored under `"*"`.
*/
export function bulletExtents(
  viz: VizInstance,
  data: DataPoint[],
): Map<string, BulletExtent> {
  const shared = !!viz.schema.sharedDomain;
  const out = new Map<string, BulletExtent>();
  data.forEach((d, i) => {
    const key = shared ? "*" : bulletKey(viz, d, i);
    const e = bulletExtent(
      rowValues(viz, d, i),
      rowBands(viz, d, i),
      rowDomainInput(viz, d, i),
    );
    const prev = out.get(key);
    out.set(key, prev ? mergeExtents(prev, e) : e);
  });
  return out;
}

const measure = (text: string, family: string, size: number, weight = 400) =>
  text
    ? textWidth(text, {
        "font-family": family,
        "font-size": size,
        "font-weight": weight,
      })
    : 0;

/** The extent a row reads against: a facet-shared one, else its own. */
function extentOf(
  viz: VizInstance,
  extents: Map<string, BulletExtent>,
  d: DataPoint,
  i: number,
): BulletExtent {
  const facet = viz.ctx.bulletFacet as Map<string, BulletExtent> | undefined;
  const key = viz.schema.sharedDomain ? "*" : bulletKey(viz, d, i);
  return facet?.get(key) ?? extents.get(key) ?? {extent: [], input: undefined};
}

/** One row before placement. */
interface BulletRow {
  d: DataPoint;
  i: number;
  value: number;
  target: number;
  forecast: number;
  name: string;
  subLabel: string;
  extent: BulletExtent;
}

function bulletRows(viz: VizInstance, data: DataPoint[]): BulletRow[] {
  const subAcc = viz.schema.subLabel as RowAccessor;
  const extents = bulletExtents(viz, data);
  return data.map((d, i) => {
    const sub = typeof subAcc === "function" ? subAcc(d, i) : undefined;
    const [value, target, forecast] = rowValues(viz, d, i);
    return {
      d,
      i,
      value,
      target,
      forecast,
      name: hasName(viz, d, i) ? `${viz._drawLabel(d, i) ?? ""}` : "",
      subLabel: sub === null || sub === undefined ? "" : `${sub}`,
      extent: extentOf(viz, extents, d, i),
    };
  });
}

/** The widest label and the label block's height. */
function labelMetrics(
  rows: BulletRow[],
  family: string,
): {labelWidth: number; labelHeight: number} {
  const named = rows.some(r => r.name);
  const subbed = rows.some(r => r.subLabel);
  return {
    labelWidth: Math.max(
      0,
      ...rows.map(r => measure(r.name, family, NAME_FONT_SIZE, 600)),
      ...rows.map(r => measure(r.subLabel, family, SUB_FONT_SIZE)),
    ),
    labelHeight:
      (named ? NAME_FONT_SIZE : 0) +
      (subbed ? SUB_FONT_SIZE + (named ? LABEL_LINE_GAP : 0) : 0),
  };
}

export const applyBulletLayout: TransformStage = ({viz}) => {
  const {width, height} = chartBounds(viz);
  const data = (viz._filteredData ?? []) as DataPoint[];
  const orient: Orient =
    viz.schema.orient === "vertical" ? "vertical" : "horizontal";
  const style = bulletStyle(viz, data[0] ?? {}, 0);
  const family = style.fontFamily;
  const rows = bulletRows(viz, data);

  const tickInput = viz.schema.ticks as number | number[] | false | undefined;
  const tickSize = (v: number) =>
    measure(style.tickFormat(v), family, style.tickFontSize);
  // Tick labels are measured at a dense, nice domain before the bullets are
  // placed, since the final ticks depend on each bullet's length.
  const probe = rows.map(r => bulletDomain(r.extent, 10));
  const slots = bulletStack({
    orient,
    width,
    height,
    count: rows.length,
    bulletSize: Math.max(1, Number(viz.schema.bulletSize) || 1),
    ...labelMetrics(rows, family),
    axis:
      tickInput === false ? false : viz.schema.sharedDomain ? "shared" : "row",
    tickFontSize: style.tickFontSize,
    tickLabelWidth: Math.max(
      0,
      ...probe.flatMap(d => gaugeTicks(d, 10, false, 10).major.map(tickSize)),
    ),
    tickOverhang: [
      Math.max(0, ...probe.map(d => tickSize(d[0]) / 2)),
      Math.max(0, ...probe.map(d => tickSize(d[1]) / 2)),
    ],
  });

  const vertical = orient === "vertical";
  const bullets: BulletDatum[] = slots.map((slot, k) => {
    const r = rows[k];
    const axis = fitAxis(
      r.extent,
      tickInput,
      vertical ? slot.band.height : slot.band.width,
      vertical ? () => style.tickFontSize * 1.2 : tickSize,
      vertical ? 45 : 70,
    );
    return {
      __d3plus__: true,
      data: r.d,
      i: r.i,
      key: bulletKey(viz, r.d, r.i),
      value: r.value,
      target: r.target,
      forecast: r.forecast,
      name: r.name,
      subLabel: r.subLabel,
      track: {orient, band: slot.band, domain: axis.domain},
      bands: resolveBands(
        shadeBands(rowBands(viz, r.d, r.i), style.mix),
        axis.domain,
        style.mix(0.2),
      ),
      ticks: slot.axis ? axis.ticks : [],
      axis: slot.axis,
      label: slot.label,
      hit: slot.hit,
    };
  });

  viz.ctx.bullet = {
    orient,
    style,
    nameFontSize: NAME_FONT_SIZE,
    subFontSize: SUB_FONT_SIZE,
  } satisfies BulletShared;
  return {shapeData: bullets as unknown as DataPoint[]};
};
