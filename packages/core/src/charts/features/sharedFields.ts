/**
    Config pieces the part-to-whole charts share: the tooltip's "Share" row
    and the legend that hides while it would repeat every drawn row.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";

import type {D3plusConfig} from "../../utils/D3plusConfig.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {colorScaleBucketShare} from "./colorScaleBucket.js";
import {summedShare} from "./shareKey.js";

/**
    The tooltip's "Share" row: a row's share of the drawn whole. A colorScale
    bucket sums the share of every row in its color range, and a merged
    legend row sums its members' shares.
    @param viz The chart.
    @param sumKey The schema accessor the chart sizes rows by.
*/
export function shareRow(viz: VizInstance, sumKey: "sum" | "value"): unknown[] {
  return [
    () => viz.schema.translate("Share"),
    (_d: DataPoint, _i: number, x: Record<string, unknown>) => {
      const pct = (s: number) =>
        `${formatAbbreviate(s * 100, viz.schema.locale)}%`;
      if (x._isColorScaleBucket) {
        const s = colorScaleBucketShare(
          viz,
          x.color,
          viz.schema[sumKey] as (d: DataPoint, i: number) => number,
        );
        return s == null ? "" : pct(s);
      }
      const share = summedShare(x);
      return Number.isFinite(share) ? pct(share) : "";
    },
  ];
}

/**
    Wraps the chart's legend so it hides when every drawn row is its own
    legend entry and `labeled` says the chart's labels already name each one.
    @param viz The chart.
    @param labeled Whether the chart's own labels name every row.
*/
export function rowLegend(
  viz: VizInstance,
  labeled: (viz: VizInstance) => boolean = () => true,
): (config: D3plusConfig, arr: DataPoint[]) => unknown {
  const base = viz.schema.legend as (
    config: D3plusConfig,
    arr: DataPoint[],
  ) => unknown;
  return (config: D3plusConfig, arr: DataPoint[]) => {
    if (arr.length === viz._filteredData.length && labeled(viz)) return false;
    return base.call(viz, config, arr);
  };
}
