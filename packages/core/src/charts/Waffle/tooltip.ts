/**
    Waffle's "Value" and "Share" rows, shared by cell and legend tooltips.

    @module
*/

import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";

import {colorScaleBucketShare} from "../features/colorScaleBucket.js";
import {shareOfRows, summedShare, unwrapRow} from "../features/shareKey.js";
import type {VizInstance} from "../viz/vizTypes.js";

type Row = Record<string, unknown>;
type Cell = (d: DataPoint, i: number, x: Row) => string;

/** Formats a 0–1 share as an abbreviated percentage, or "" when not finite. */
export function formatShare(
  share: number | null | undefined,
  locale: string,
): string {
  return share == null || !Number.isFinite(share)
    ? ""
    : `${formatAbbreviate(share * 100, locale)}%`;
}

/**
    The share a tooltip row reports for `x`: the summed share of a colorScale
    swatch's range, or the share d3plus stamped on the row (summed over a
    merged legend row's members).
*/
export function waffleShare(viz: VizInstance, x: Row): number | null {
  const sum = viz.schema.sum as (d: DataPoint, i: number) => number;
  if (x._isColorScaleBucket) return colorScaleBucketShare(viz, x.color, sum);
  const row = unwrapRow(x);
  const share = summedShare(row);
  // A legend entry the layout hasn't stamped (a threshold bucket) reads its
  // share of every legend row's value.
  return Number.isFinite(share)
    ? share
    : shareOfRows(row, viz._legendData || [], d => sum(d as DataPoint, 0));
}

/** The `[label, value]` tooltip rows: the summed value, then its share. */
export function waffleTooltipRows(viz: VizInstance): [() => string, Cell][] {
  const locale = () => viz.schema.locale as string;
  return [
    [
      () => viz.schema.translate("Value"),
      (d, i, x) => {
        if (x && x._isColorScaleBucket) return "";
        const sum = viz.schema.sum as (d: DataPoint, i: number) => number;
        const v = Number(sum(d, i));
        return Number.isFinite(v) ? formatAbbreviate(v, locale()) : "";
      },
    ],
    [
      () => viz.schema.translate("Share"),
      (_d, _i, x) => formatShare(waffleShare(viz, x ?? {}), locale()),
    ],
  ];
}
