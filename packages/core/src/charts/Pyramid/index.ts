/**
    Pyramid — a horizontal BarChart whose two sides (e.g. Male / Female)
    extend in opposite directions from a shared center line, one row per
    category (e.g. age band). Values stay positive; the left side is mirrored
    internally and the value axis reads magnitudes on both halves.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {Scene} from "@d3plus/render";

import TextBox from "../../components/TextBox.js";
import accessor from "../../utils/accessor.js";
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import BarChart from "../BarChart/index.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  absoluteFormat,
  finite,
  frameTotals,
  pyramidExtent,
  pyramidSides,
  pyramidTotal,
  sideSign,
  symmetricDomain,
  type RowAccessor,
} from "./pyramidData.js";
import {
  allCategories,
  captureAxisStyles,
  categoryLabelConfig,
  categoryText,
  gutterAxisDefaults,
  gutterInset,
  gutterLabels,
  gutterStackOffset,
  gutterWidth,
  labelFont,
  type AxisRestore,
  type CategoryPosition,
} from "./gutter.js";
import {pyramidScene} from "./scene.js";
import {pyramidStackOrder} from "./stackOrder.js";

/** Per-instance state kept on `viz.ctx.pyramid`. */
interface PyramidState {
  /** The user's value accessor (what `x` was set to), before mirroring. */
  value: RowAccessor;
  /** Side values in drawing order, left first. */
  sides: string[];
  /** The current frame's total value and comparison value (percent mode). */
  total: number;
  comparisonTotal: number;
  /** What the chart last wrote to `xConfig`, so user values are left alone. */
  domain?: unknown;
  tickFormat?: unknown;
  title?: string;
  /** Formatters the chart wrapped to read magnitudes. */
  wrapped: WeakSet<object>;
  titleBox: TextBox;
  /** Each side's distance from zero: the center gutter's half-width in values, or 0. */
  inset: number;
  labelBox: TextBox;
  /** The axes' own styles, captured before the center layout changes them. */
  restore?: AxisRestore;
}

/** Data keys behind string `comparison` accessors, for tooltip labels. */
const comparisonKeys = new WeakMap<object, string>();

const pyramidState = (viz: VizInstance) => viz.ctx.pyramid as PyramidState;

/** The accessor that splits rows into sides: the first `groupBy` level. */
const sideOf = (viz: VizInstance): RowAccessor => viz.schema.groupBy[0];

/** `fraction` as a locale-formatted percentage. */
const percentText = (viz: VizInstance, fraction: number) =>
  `${formatAbbreviate(fraction * 100, viz.schema.locale)}%`;

/** A value as the axis shows it: abbreviated, or a percentage in percent mode. */
function valueFormat(viz: VizInstance): (d: number) => string {
  return viz.schema.percent
    ? (d: number) => percentText(viz, d)
    : (d: number) => formatAbbreviate(d, viz.schema.locale);
}

/**
    Mirrors the user's value accessor: the left side's values come back
    negative (and as a share of the frame's total in percent mode), so the
    Plot pipeline stacks and scales them leftward from the center line.
*/
function mirrorValue(viz: VizInstance) {
  return (d: DataPoint, i: number) => {
    const state = pyramidState(viz);
    const raw = state.value(d, i);
    const n = finite(raw);
    if (n === undefined) return raw;
    const magnitude = viz.schema.percent ? (state.total ? Math.abs(n) / state.total : 0) : Math.abs(n);
    return sideSign(state.sides, sideOf(viz)(d, i)) * magnitude;
  };
}

/** Routes reads of `viz._x` through the mirror while keeping `x()` writes as the source. */
function interceptValue(viz: VizInstance): void {
  const state = pyramidState(viz);
  const mirrored = mirrorValue(viz);
  state.value = viz._x as RowAccessor;
  Object.defineProperty(viz, "_x", {
    configurable: true,
    enumerable: true,
    get: () => mirrored,
    set: (fn: RowAccessor) => {
      if (fn !== mirrored) state.value = fn;
    },
  });
}

/** Keeps the value axis reading magnitudes, wrapping any user `tickFormat`. */
function syncTickFormat(viz: VizInstance, state: PyramidState): void {
  const config = viz._xConfig!;
  const current = config.tickFormat;
  if (current === undefined || current === state.tickFormat) {
    config.tickFormat = state.tickFormat = absoluteFormat(valueFormat(viz), () => state.inset);
    state.wrapped.add(config.tickFormat as object);
  } else if (typeof current === "function" && !state.wrapped.has(current)) {
    config.tickFormat = absoluteFormat(current as (d: number) => string, () => state.inset);
    state.wrapped.add(config.tickFormat as object);
  }
}

/**
    The largest single-side category total (with comparison values): over
    every frame with `axisPersist`, else the current one.
*/
function valueExtent(viz: VizInstance, state: PyramidState): number {
  const persist = !!viz._axisPersist;
  const rows: DataPoint[] = persist ? viz._data : viz._filteredData;
  const time = persist && viz.schema.time ? (viz.schema.time as RowAccessor) : undefined;
  const scaled = (fn: RowAccessor, frameTotal: number): RowAccessor => {
    if (!viz.schema.percent) return fn;
    const totals = time ? frameTotals(rows, fn, time) : undefined;
    return (d, i) => {
      const total = totals ? totals.get(`${time!(d, i)}`) ?? 0 : frameTotal;
      const v = finite(fn(d, i));
      return v === undefined || !total ? 0 : v / total;
    };
  };
  const comparison = viz.schema.comparison as RowAccessor | undefined;
  return pyramidExtent(rows, {
    category: viz._y as RowAccessor,
    side: sideOf(viz),
    value: scaled(state.value, state.total),
    comparison: comparison ? scaled(comparison, state.comparisonTotal) : undefined,
    frame: time,
  });
}

/** Centers the value axis on zero: `[-extent, extent]` across both sides (and the gutter). */
function syncDomain(viz: VizInstance, state: PyramidState, extent: number): void {
  const config = viz._xConfig!;
  const ours = config.domain !== undefined && config.domain === state.domain;
  if (config.domain !== undefined && !ours) return;
  if (!viz.schema.symmetric || viz.schema.xDomain) {
    if (ours) delete config.domain;
    state.domain = undefined;
    return;
  }
  config.domain = state.domain = symmetricDomain(extent + state.inset);
}

/**
    Lays out the center gutter: each side starts `inset` from zero, and the
    value axis breaks there as wide as the widest category label.
*/
function syncGutter(viz: VizInstance, state: PyramidState, extent: number): void {
  const position = viz.schema.categoryPosition as CategoryPosition;
  state.restore ??= captureAxisStyles(viz);
  const center = position === "center";
  state.inset = center ? gutterInset(extent) : 0;
  let width = 0;
  if (center) {
    const categories = allCategories(viz);
    const config = categoryLabelConfig(viz);
    const fonts = categories.map((c, i) => labelFont(config, c, i));
    width = gutterWidth(categories.map(c => categoryText(viz, c)), fonts);
  }
  viz._plotAxisDefaults = gutterAxisDefaults(position, state.inset, width, viz.schema.xBreak, state.restore);
}

/** In percent mode, titles the value axis "Percent of Total" unless the user titled it. */
function syncTitle(viz: VizInstance, state: PyramidState): void {
  const config = viz._xConfig!;
  // Plot's own automatic title (the value's data key).
  const auto = (viz as unknown as {_xTitle?: string})._xTitle;
  if (viz.schema.percent) {
    if (config.title === undefined || config.title === auto || config.title === state.title) {
      config.title = state.title = viz.schema.translate("Percent of Total");
    }
  } else if (state.title !== undefined) {
    if (config.title === state.title) config.title = auto;
    state.title = undefined;
  }
}

/** Height reserved above the bars for the side titles. */
function sideTitleInset(viz: VizInstance): number {
  if (!viz.schema.sideTitles) return 0;
  const config = viz.schema.sideTitleConfig as Record<string, unknown>;
  const fontSize = typeof config.fontSize === "number" ? config.fontSize : 14;
  const padding = typeof config.padding === "number" ? config.padding : 0;
  return Math.ceil(fontSize * 1.2 + padding * 2);
}

/** Resolves sides, totals, and the value axis after Plot's pre-draw. */
function preparePyramid(viz: VizInstance): void {
  const state = pyramidState(viz);
  state.sides = pyramidSides(viz._data, sideOf(viz), viz.schema.sides);
  const frame: DataPoint[] = viz._legendData || viz._filteredData || [];
  state.total = pyramidTotal(frame, state.value);
  const comparison = viz.schema.comparison as RowAccessor | undefined;
  state.comparisonTotal = comparison ? pyramidTotal(frame, comparison) : 0;
  syncTickFormat(viz, state);
  const extent = valueExtent(viz, state);
  syncGutter(viz, state, extent);
  syncDomain(viz, state, extent);
  syncTitle(viz, state);
  viz._plotInsetTop = sideTitleInset(viz);
}

/** Each side's display name: the top-level label of its first row. */
function sideLabels(viz: VizInstance, sides: string[]): string[] {
  const side = sideOf(viz);
  return sides.map(s => {
    const index = viz._data.findIndex((d: DataPoint, i: number) => `${side(d, i)}` === s);
    return index >= 0 ? viz._drawLabel(viz._data[index], index, 0) : s;
  });
}

/** Tooltip rows: the value's share of the total (or the value itself in percent mode) and any comparison. */
function tooltipRows(viz: VizInstance, d: DataPoint, i: number): [string, string][] {
  const state = pyramidState(viz);
  const value = finite(state.value(d, i));
  if (value === undefined) return [];
  const rows: [string, string][] = [];
  const percent = !!viz.schema.percent;
  if (percent) {
    const key = viz._xKey;
    rows.push([typeof key === "string" ? key : viz.schema.translate("Value"), formatAbbreviate(Math.abs(value), viz.schema.locale)]);
  } else if (state.total) {
    rows.push([viz.schema.translate("Percent of Total"), percentText(viz, Math.abs(value) / state.total)]);
  }
  const comparison = viz.schema.comparison as RowAccessor | undefined;
  const c = comparison ? finite(comparison(d, i)) : undefined;
  if (comparison && c !== undefined) {
    const label = comparisonKeys.get(comparison) ?? viz.schema.translate("Comparison");
    rows.push([label, percent
      ? percentText(viz, state.comparisonTotal ? Math.abs(c) / state.comparisonTotal : 0)
      : formatAbbreviate(Math.abs(c), viz.schema.locale)]);
  }
  return rows;
}

export const pyramidDef: ChartDefinition = {
  name: "Pyramid",
  paintDriven: true,
  features: [titleFeature, subtitleFeature, totalFeature],
  defaults: {groupPadding: 1},

  setup: viz => {
    viz.ctx.pyramid = {
      value: viz._x as RowAccessor,
      sides: [],
      total: 0,
      comparisonTotal: 0,
      wrapped: new WeakSet(),
      titleBox: new TextBox(),
      inset: 0,
      labelBox: new TextBox(),
    } satisfies PyramidState;
    interceptValue(viz);
    // Each side stacks outward from its own edge of the center gutter.
    viz._stackOffset = gutterStackOffset(() => pyramidState(viz).inset);
    // Both sides share one stack per row, so they draw at the same position
    // and diverge from the center line.
    viz._stackGroup = () => "group";
    viz._stackOrder = pyramidStackOrder((d, i) =>
      viz._ids(d, i).slice(1, viz._drawDepth + 1).join("_"),
    ) as unknown as VizInstance["_stackOrder"];
    // Colors follow the deepest drawn groupBy level, so a sub-group stacked on
    // both sides (e.g. Urban / Rural) shares one color and legend entry.
    viz.schema.color = (d: DataPoint, i: number) => {
      const groupBy = viz.schema.groupBy as RowAccessor[];
      return groupBy[Math.max(0, Math.min(viz._drawDepth ?? 0, groupBy.length - 1))](d, i);
    };
    // Rows are read off the category axis, so bars carry no labels.
    viz.schema.shapeConfig.Bar = {...viz.schema.shapeConfig.Bar, label: false};
    viz.schema.shapeConfig.ariaLabel = (d: DataPoint, i: number) => {
      const format = viz._xConfig!.tickFormat as (v: unknown) => string;
      return `${viz._drawLabel(d, i)}, ${viz._y!(d, i)}: ${format(viz._x!(d, i))}.`;
    };
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      preDraw();
      preparePyramid(viz);
    };
    const toScene = (viz.toScene as unknown as () => Scene).bind(viz);
    (viz as unknown as {toScene: () => Scene}).toScene = () => {
      const state = pyramidState(viz);
      const comparison = viz.schema.comparison as RowAccessor | undefined;
      return pyramidScene(viz, toScene(), {
        sides: state.sides,
        labels: sideLabels(viz, state.sides),
        side: sideOf(viz),
        comparison,
        divisor: viz.schema.percent ? state.comparisonTotal : 1,
        titleBox: state.titleBox,
        showTitles: !!viz.schema.sideTitles,
        inset: state.inset,
        gutter: state.inset ? edges => gutterLabels(viz, state.labelBox, edges) : undefined,
      });
    };
  },

  ctx: {},

  fields: [
    /**
        Both halves meet at the center line, so the value axis never breaks
        away from zero.
    */
    {key: "baselineBreak", default: false},
    /**
        Where the category labels (e.g. age bands) are drawn: `"center"`
        (default) down a gutter between the two halves, as wide as the widest
        label, with each half reading outward from zero at its edge; or
        `"left"`, on a regular category axis beside the chart.
    */
    {key: "categoryPosition", default: "center"},
    /**
        An optional comparison value for each row, drawn as an outline around
        each side's bars (e.g. the same population a decade earlier). Accepts
        a data key or an accessor function. Included in the symmetric domain,
        the tooltip, and, in percent mode, scaled to its own total.
    */
    {
      key: "comparison",
      coerce: v => {
        if (typeof v !== "string") return v || undefined;
        const fn = accessor(v);
        comparisonKeys.set(fn, v);
        return fn;
      },
    },
    /**
        Line styles for the comparison outline: `stroke`, `strokeWidth`,
        `strokeOpacity`, and `strokeDasharray`. Each may be a function of the
        side value and its index (0 = left).
    */
    {
      key: "comparisonConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        stroke: () => backgroundInk(viz),
        strokeDasharray: "4 3",
        strokeOpacity: 1,
        strokeWidth: 1.5,
      }),
    },
    {key: "discrete", default: "y"},
    /**
        Draws each value as a fraction of the current frame's total (both
        sides together), with the value axis and tooltip reading percentages.
    */
    {key: "percent", default: false},
    /**
        Draws the name of each side centered above its half of the chart.
    */
    {key: "sideTitles", default: true},
    /** TextBox styles for the side titles. */
    {
      key: "sideTitleConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        fontColor: () => backgroundInk(viz),
        fontSize: 14,
        fontWeight: 600,
        padding: 2,
        textAnchor: "middle",
        verticalAlign: "middle",
      }),
    },
    /**
        The side values (from the first `groupBy` level) as `[left, right]`.
        Unlisted values are drawn on the right. Defaults to the order sides
        first appear in the data.
    */
    {key: "sides"},
    {key: "stacked", default: true},
    /**
        Centers the value axis on zero so both halves share one scale, sized
        to the largest single side. Set to `false` to fit the data instead.
        Ignored when `xDomain` or `xConfig.domain` is set.
    */
    {key: "symmetric", default: true},
    {key: "tooltipConfig", merge: true, factory: (viz: VizInstance) => ({
      tbody: (d: DataPoint, i: number) => tooltipRows(viz, d, i),
    })},
  ],
};

/**
    Creates a population pyramid: horizontal bars for two groups (the first
    `groupBy` level, e.g. Male / Female) extending in opposite directions
    from a shared center line, one row per `y` category (e.g. age band).
    Values stay positive — the left side is mirrored internally and the value
    axis reads magnitudes on both halves. The category labels run down a
    gutter between the halves (or beside the chart, with `categoryPosition`).
    Deeper `groupBy` levels stack within each side.
*/
export default makeChart(pyramidDef, BarChart);
