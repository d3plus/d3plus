/**
    The series a Plot's marginal strips split their points into: one per
    legend entry, colored like its points, when the points fall into groups;
    otherwise a single series of every point.

    @module
*/
import {colorGray} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import {themed} from "../../utils/theme.js";
import {colorCategory} from "../features/legendCategory.js";
import {legendKeys} from "../features/legendKeys.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** One series of a marginal strip. */
export interface MarginalSeries {
  key: string;
  color: string;
  /** Its legend entry's name; empty for the single series of every point. */
  label: string;
}

/** A plotted point: its source row and the row's index. */
export interface MarginalPoint {
  row: DataPoint;
  i: number;
}

/** The marginal series of a chart's points, and the series each point is in. */
export interface MarginalGrouping {
  series: MarginalSeries[];
  groupOf: (point: MarginalPoint) => string;
}

/**
    Whether points keyed by `keys` fall into groups: more than one key, and
    at least one shared by several points. Points that each have a color of
    their own (a Scatter whose only `groupBy` level is its ids) form one
    series instead.
    @param keys Each point's legend key.
*/
export function marginalGrouped(keys: string[]): boolean {
  const distinct = new Set(keys).size;
  return distinct > 1 && distinct < keys.length;
}

/**
    Splits the plotted points into marginal series by legend entry (see
    `marginalGrouped`), each painted with its first point's fill and named
    by its color category or its label at the legend's depth. A chart
    colored by `colorScale` draws a single series. A single series takes
    the points' fill when they share one, else the theme's muted gray, and
    the name of the one color category they share, if any.
    @param viz The chart.
    @param points The plotted points.
*/
export function marginalSeries(
  viz: VizInstance,
  points: MarginalPoint[],
): MarginalGrouping {
  const {getAttr, colorOf, keyOf} = legendKeys(viz);
  const keys = viz.schema.colorScale
    ? points.map(() => "")
    : points.map(({row, i}) => keyOf(row, i, colorOf(row, i)));
  const index = new Map(points.map((p, k) => [p, k]));
  if (marginalGrouped(keys)) {
    const series = new Map<string, MarginalSeries>();
    points.forEach(({row, i}, k) => {
      if (series.has(keys[k])) return;
      const label =
        colorCategory(colorOf(row, i)) ??
        viz._drawLabel(row, i, viz._legendDepth ?? 0);
      series.set(keys[k], {
        key: keys[k],
        color: getAttr(row, i, "fill"),
        label,
      });
    });
    return {series: [...series.values()], groupOf: p => keys[index.get(p)!]};
  }
  const fills = new Set(points.map(({row, i}) => getAttr(row, i, "fill")));
  const shared = fills.size === 1 && !viz.schema.colorScale;
  const color = shared
    ? [...fills][0]
    : themed(viz._theme, t => t.textMuted, colorGray[500]);
  // Every point in one legend entry (the others hidden) keeps its name.
  const first = points[0];
  const label =
    shared && first && new Set(keys).size === 1
      ? (colorCategory(colorOf(first.row, first.i)) ?? "")
      : "";
  return {series: [{key: "", color, label}], groupOf: () => ""};
}
