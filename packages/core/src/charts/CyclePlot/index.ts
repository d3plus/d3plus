/**
    CyclePlot — a LinePlot split into one touching panel per season (a
    month, quarter, weekday, or hour), each plotting that season across the
    cycles in the data, with a line at its mean.
*/

import {assign, date} from "@d3plus/dom";
import type {ColorDefaults} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {mean} from "d3-array";
import {findWeekStart, locale as timeLocales} from "@d3plus/locales";

import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import type {FacetValue} from "../facet/facetConfig.js";
import LinePlot from "../LinePlot/index.js";
import {chartUtc} from "../Plot/plotRangeBreaks.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {cycleFacetHooks} from "./cycleFacet.js";
import {cycleMeanLines} from "./cycleMeans.js";
import {
  cycleAxisLabel,
  cycleTooltipRows,
  cycleTooltipTitle,
  type CycleTooltipContext,
} from "./cycleTooltip.js";
import {
  cycleEndLabel,
  cyclePeriodLabel,
  cyclePeriodOf,
  cyclePeriodOrder,
  cycleStartOf,
  resolveCyclePeriod,
  type CyclePeriod,
} from "./cyclePeriods.js";

/** A row accessor. */
type RowFn = (d: DataPoint, i: number) => unknown;

/** What a CyclePlot reads its dates with, resolved each draw. */
export interface CycleState {
  /** The user's `x` accessor, which reads each row's date. */
  source: RowFn;
  /** The accessor CyclePlot plots along x: each row's cycle start (`NaN` without a date). */
  cycleX: (d: DataPoint, i: number) => Date | number;
  /** Each row's season (its panel). */
  facet: (d: DataPoint, i: number) => number | undefined;
  period: CyclePeriod;
  utc: boolean;
  weekStart: number;
  /** Labels a cycle at either end of a panel's x axis (see `cycleEndLabel`). */
  endLabel?: (cycle: Date) => string;
  /** The first and last cycles every panel shows, and their labels when they fit (see `shareCycleScales`). */
  ends?: Date[];
  endLabels?: string[];
}

/** The mean of the values `value` reads from `rows`: how rows in the same season and cycle merge by default. */
export function meanAgg(
  rows: DataPoint[],
  value: (d: DataPoint) => unknown,
): number | undefined {
  return mean(rows, d => {
    const v = value(d);
    return typeof v === "number" ? v : undefined;
  });
}

/** The chart's cycle state. */
const cycleState = (viz: VizInstance) => viz.ctx.cycle as CycleState;

/**
    A row's date: its `x` value (the first one, for rows merged across the
    same cycle), parsed in UTC with `utc`.
*/
export function cycleDate(value: unknown, utc: boolean): Date | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === undefined || v === null || v === "") return undefined;
  const parsed = date(v as Parameters<typeof date>[0], {utc});
  return parsed instanceof Date && !isNaN(+parsed) ? parsed : undefined;
}

/** The time locale a chart names its seasons in. */
const timeLocaleOf = (viz: VizInstance) =>
  timeLocales[viz.schema.locale as string] ?? timeLocales["en-US"];

/** A panel's title: its season's short name in the chart's locale. */
export function cycleTitle(viz: VizInstance, value: FacetValue): string {
  return cyclePeriodLabel(
    Number(value),
    cycleState(viz).period,
    timeLocaleOf(viz),
  );
}

/** Orders two panels by their seasons' place in the cycle (weekdays from the locale's first). */
export function cycleCompare(
  viz: VizInstance,
  a: FacetValue,
  b: FacetValue,
): number {
  const {period, weekStart} = cycleState(viz);
  const order = cyclePeriodOrder(period, weekStart);
  return order.indexOf(Number(a)) - order.indexOf(Number(b));
}

/** What CyclePlot's tooltips read from the chart (see `cycleTooltip.ts`). */
export function cycleTooltipContext(viz: VizInstance): CycleTooltipContext {
  const state = cycleState(viz);
  return {
    date: (d, i) => cycleDate(state.source(d, i), state.utc),
    season: state.facet,
    period: state.period,
    locale: timeLocaleOf(viz),
    utc: state.utc,
  };
}

/**
    Reads this draw's period, time zone, and week start, points `x` and
    `facet` at each row's cycle and season, and averages the rows that
    share both (see `meanAgg`) unless `aggs` sets the `y` key's merge.
*/
export function prepareCycle(viz: VizInstance): void {
  const state = cycleState(viz);
  if (viz._x !== state.cycleX && viz._x) state.source = viz._x as RowFn;
  state.period = resolveCyclePeriod(viz.schema.period);
  state.utc = chartUtc(viz);
  state.weekStart = findWeekStart(`${viz.schema.locale ?? ""}`);
  const locale = timeLocaleOf(viz);
  const {period, utc} = state;
  state.endLabel = cycle => cycleEndLabel(cycle, period, locale, utc);
  state.ends = state.endLabels = undefined;
  viz._x = state.cycleX;
  viz.schema.facet = state.facet;
  // Rows in the same season and cycle average, unless `aggs` says otherwise.
  const key = viz._yKey;
  const aggs = viz.schema.aggs as Record<string, unknown>;
  if (typeof key === "string" && (!(key in aggs) || aggs[key] === meanAgg))
    aggs[key] = meanAgg;
}

/**
    The chart's `color`, with a row of no series (data without `groupBy`)
    taking the first color of the chart's categorical palette.
*/
export function cycleColor(
  viz: VizInstance,
  base: (d: DataPoint, i: number) => unknown,
): (d: DataPoint, i: number) => unknown {
  return (d, i) => {
    const c = base(d, i);
    if (c !== undefined && c !== null) return c;
    return (viz.schema.colorDefaults as ColorDefaults).scale.range()[0];
  };
}

export const cyclePlotDef: ChartDefinition = {
  name: "CyclePlot",
  paintDriven: true,
  facet: cycleFacetHooks,

  setup: viz => {
    const state: CycleState = {
      source: viz._x as RowFn,
      period: "month",
      utc: false,
      weekStart: 1,
      cycleX: (d, i) => {
        const t = cycleDate(state.source(d, i), state.utc);
        return t
          ? cycleStartOf(t, state.period, state.utc, state.weekStart)
          : NaN;
      },
      facet: (d, i) => {
        const t = cycleDate(state.source(d, i), state.utc);
        return t ? cyclePeriodOf(t, state.period, state.utc) : undefined;
      },
    };
    viz.ctx.cycle = state;
    // The x axis places each cycle along its panel, labeling only the first
    // and last (see `cycleFacet.ts`); the panel titles name the seasons.
    viz._xConfig = assign({}, viz._xConfig ?? {}, {padding: 0, scale: "time"});
    // The y axis keeps its title beside its labels in a narrow first panel.
    viz._yConfig = assign({}, viz._yConfig ?? {}, {maxSize: Infinity});
    viz.schema.color = cycleColor(viz, viz.schema.color);
    // The x axis plots every period of `time`, through its cycles.
    viz._timeOnDiscrete = true;
    viz._plotReferenceLines = () => cycleMeanLines(viz);
    // Tooltips show each point's date, not the cycle it sits at.
    viz._tooltipAxisLabel = (axis, d, i) =>
      cycleAxisLabel(viz, cycleTooltipContext(viz), axis, d, i);
    viz.schema.facetConfig = {
      padding: 0,
      rows: 1,
      sort: (a: FacetValue, b: FacetValue) => cycleCompare(viz, a, b),
      title: (value: FacetValue) => cycleTitle(viz, value),
    };
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      prepareCycle(viz);
      preDraw();
    };
  },

  ctx: {},

  fields: [
    /** CyclePlot badges only the y axis on hover: the panel titles name the seasons. */
    {key: "axisHover", default: "y"},
    /** CyclePlot names its series in the legend: lines in narrow panels leave no room to label them. */
    {key: "lineLabels", default: false},
    /**
        Draws a line across each panel at each series' mean over the
        panel's cycles. On by default.
    */
    {key: "mean", default: true},
    /**
        Styles the `mean` lines like a `referenceLines` entry:
        `stroke` (the chart's text color for one series, else each
        series' color), `strokeOpacity` (`1`), `strokeWidth`, `dash`,
        `label`, and `layer`.
        @type {ReferenceLineConfig}
    */
    {key: "meanConfig", merge: true, default: {}},
    /**
        The season each panel shows, read from each row's `x` date:
        `"month"` (the default; one panel per month, plotted across the
        years), `"quarter"` (across the years), `"weekday"` (across the
        weeks, from the first day of the locale's week), or `"hour"`
        (across the days).
        @type {"month" | "quarter" | "weekday" | "hour"}
    */
    {key: "period", default: "month"},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (d: DataPoint, i: number) =>
          cycleTooltipTitle(viz, cycleTooltipContext(viz), d, i),
        tbody: (d: DataPoint, i: number) =>
          cycleTooltipRows(viz, cycleTooltipContext(viz), d, i),
      }),
    },
  ],
};

/**
    Creates a cycle plot (a seasonal subseries plot) from an array of data:
    a LinePlot split into one panel per season, set side by side with no
    gap between them. Each panel plots one season across the cycles in the
    data, such as every January across the years, so a reader can compare
    the seasons and see how each one changed. Each row's `x` value is its
    date, and `period` picks the season: `"month"` (the default),
    `"quarter"`, `"weekday"` (from the first day of the locale's week), or
    `"hour"`. Rows in the same season and cycle merge into their mean (set
    `aggs` for the `y` key to merge them otherwise). The panels share one y
    axis, labeled on the left, each x axis labels its first and last cycle
    (when both fit without overlapping), and each
    draws a line at its mean (see `mean` and `meanConfig`). The panel titles
    name the seasons in the chart's locale; read the dates in UTC with
    `xConfig: {utc: true}`. The panels are small multiples whose `facet` is
    the season, so `facetConfig` adjusts them (its `padding`, `title`, and
    `titleConfig`).
*/
export default makeChart(cyclePlotDef, LinePlot);
