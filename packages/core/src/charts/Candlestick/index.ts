/**
    Candlestick — a Plot of financial periods along a time axis. Each row's
    open, high, low, and close draw as a candle (a wick from the high to the
    low around a body from the open to the close) or, with `variant: "ohlc"`,
    as an OHLC bar (a high-low line with the open ticked left and the close
    ticked right), colored by whether the period rose or fell.
*/

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {subtitleFeature, titleFeature, totalFeature} from "../features/features.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  fieldAccessor,
  installAggregation,
  keyedAccessor,
  rememberKey,
  syncChartAggs,
  type RowAccessor,
} from "./aggregate.js";
import {candlestickBuffer} from "./buffer.js";
import {CANDLESTICK_SHAPE, emitCandlesticks} from "./emit.js";
import {bandAxisDefaults, periodDate} from "./periods.js";
import {candleTooltipRows} from "./tooltip.js";
import {installVolumeStrip, noteVolumeTop, VOLUME_DEFAULTS, volumeAccessor} from "./volume.js";


/** Per-instance state kept on `viz.ctx.candlestick`. */
interface CandlestickState {
  /** The user's time accessor (what `x` was set to). */
  x: RowAccessor;
  /** `x` read as a Date, for evenly spaced periods. */
  xDate: RowAccessor;
  /** The key `y` was last set to, if any. */
  yKey?: string;
  /** The `time` accessor the chart supplied, so a user's own is left alone. */
  time?: RowAccessor;
}

const candleState = (viz: VizInstance) => viz.ctx.candlestick as CandlestickState;

/**
    Routes `x` through a Date parse when periods are evenly spaced, and makes
    `y` an alias of `close`: reading `viz._y` reads the close, and setting `y`
    sets it.
*/
function interceptAccessors(viz: VizInstance): void {
  const state = candleState(viz);
  const close = fieldAccessor(viz, "close");
  Object.defineProperty(viz, "_x", {
    configurable: true,
    enumerable: true,
    get: () => (viz.schema.skipGaps ? state.xDate : state.x),
    set: (fn: RowAccessor) => {
      if (fn !== state.xDate && fn !== state.x) state.x = fn;
    },
  });
  Object.defineProperty(viz, "_y", {
    configurable: true,
    enumerable: true,
    get: () => close,
    set: (fn: RowAccessor) => {
      if (fn !== close) viz.schema.close = fn;
    },
  });
  Object.defineProperty(viz, "_yKey", {
    configurable: true,
    enumerable: true,
    get: () => state.yKey ?? viz.schema.translate("Close"),
    set: (key: string) => {
      state.yKey = key === "y" ? undefined : key;
      // `y(key)` sets the close from that key, which then merges through `aggs`.
      if (state.yKey !== undefined && typeof viz.schema.close === "function") rememberKey(viz.schema.close, key);
    },
  });
}

/**
    Points `time` at the period accessor on a continuous time axis, so the
    axis reads dates; evenly spaced periods are categories and get none. A
    user's own `time` is left alone.
*/
function syncTime(viz: VizInstance): void {
  const state = candleState(viz);
  const current = viz.schema.time as RowAccessor | undefined;
  if (current !== undefined && current !== state.time) return;
  state.time = viz.schema.skipGaps ? undefined : (d: DataPoint, i: number) => viz._x!(d, i);
  viz.schema.time = state.time;
}

export const candlestickDef: ChartDefinition = {
  name: "Candlestick",
  paintDriven: true,
  features: [titleFeature, subtitleFeature, totalFeature],
  facet: {aspect: 16 / 9},

  setup: viz => {
    const x = accessor("date") as RowAccessor;
    viz.ctx.candlestick = {
      x,
      xDate: (d: DataPoint, i: number) => periodDate(candleState(viz).x(d, i)),
    } satisfies CandlestickState;
    viz._xKey = "date";
    interceptAccessors(viz);
    installAggregation(viz);
    installVolumeStrip(viz);
    viz._buffer = {...viz._buffer, [CANDLESTICK_SHAPE]: candlestickBuffer};
    viz._plotShapeEmitters = {[CANDLESTICK_SHAPE]: emitCandlesticks};
    // The tooltip's own rows list the period and its values.
    viz._tooltipAxisRows = false;
    // The value axis spans every period's range, so it takes no title from `close`.
    (viz as unknown as {_yTitle?: unknown})._yTitle = null;
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      syncTime(viz);
      syncChartAggs(viz);
      preDraw();
    };
    // Evenly spaced periods tick on calendar boundaries, per panel when faceted.
    const draw = viz._draw.bind(viz);
    viz._draw = (callback?: () => void) => {
      viz._plotAxisDefaults = viz.schema.skipGaps ? {x: bandAxisDefaults(viz)} : undefined;
      // Facet panels sharing scales share the volume strip's, from every panel's rows.
      if (viz._facetStep === "chrome") noteVolumeTop(viz);
      return draw(callback);
    };
  },

  ctx: {},

  fields: [
    /**
        Accessor (or data key) for each period's opening value. Defaults to
        `"open"`; a row without one opens at its close. Rows that share a
        series and a period merge into one candle, taking the first row's
        open (in data order, so sort rows oldest first). Override with an
        `aggs` entry on the data key, or, for a function accessor, on
        `"open"`.
    */
    {key: "open", coerce: keyedAccessor, default: "open"},
    /**
        Accessor (or data key) for each period's highest value. Defaults to
        `"high"`; the high always reaches the open and close. Merged rows
        take the highest high; `aggs` overrides it as it does for `open`.
    */
    {key: "high", coerce: keyedAccessor, default: "high"},
    /**
        Accessor (or data key) for each period's lowest value. Defaults to
        `"low"`; the low always reaches the open and close. Merged rows
        take the lowest low; `aggs` overrides it as it does for `open`.
    */
    {key: "low", coerce: keyedAccessor, default: "low"},
    /**
        Accessor (or data key) for each period's closing value. Defaults to
        `"close"`. The close is the chart's `y`: setting `y` sets it, rows
        without one are skipped, and hover snaps to it. Merged rows take
        the last row's close; `aggs` overrides it as it does for `open`.
    */
    {key: "close", coerce: keyedAccessor, default: "close"},
    /**
        Accessor (or data key) for each period's traded volume. Off by
        default; when set, a strip under the candles draws one bar per
        candle, as tall as its volume on the strip's own axis (ticks
        abbreviated, e.g. "1.2M"), in its candle's up or down color, and the
        tooltip adds a Volume row. Bars are always filled, hollow candles
        included, and take `shapeConfig.texture` and
        `shapeConfig.backgroundImage` like filled candles; they hover with
        their candle. The price axis shrinks to make room, and the x axis
        sits under the strip. Merged rows add their volumes; an `aggs` entry
        overrides it as it does for `open`. Set `false` to turn it off.
    */
    {key: "volume", coerce: volumeAccessor},
    /**
        The volume strip's layout and styling: `height`, its height as a
        share of the plot's (default `0.2`; pixels when above 1; at most
        half the plot); `gap`, the pixels between the candles and the strip
        (default `16`); `axisConfig`, Axis config for the strip's value axis;
        and `shapeConfig`, Path config for the bars (default
        `{fillOpacity: 0.5}`).
    */
    {key: "volumeConfig", merge: true, default: VOLUME_DEFAULTS},
    /**
        How each period draws: `"candlestick"` (default), a wick from the high
        to the low around a body from the open to the close; or `"ohlc"`, a
        line from the high to the low with the open ticked to the left and the
        close ticked to the right.
    */
    {key: "variant", default: "candlestick"},
    /**
        The color of periods that closed at or above their open: a color
        string, or an accessor of the row. Defaults to green.
    */
    {key: "upColor", default: "#2f9e44"},
    /**
        The color of periods that closed below their open: a color string, or
        an accessor of the row. Defaults to red.
    */
    {key: "downColor", default: "#e03131"},
    /**
        Draws rising candles as outlines and falling candles filled (default
        `true`), so direction reads without relying on color; `false` fills
        both. OHLC bars are never filled. An unfilled candle or bar takes no
        `shapeConfig.texture` or `shapeConfig.backgroundImage`; filled ones
        take both, with a texture's lines a shade darker than the body unless
        the texture sets its own `stroke`.
    */
    {key: "hollow", default: true},
    /** The share of each period's room the candle body (or OHLC ticks) spans, from 0 to 1. Defaults to 0.7. */
    {key: "bodyWidth", default: 0.7},
    /**
        Places periods one slot apart in date order (default `true`), so days
        without data (weekends, holidays) leave no gap; `false` places each
        period at its date on a continuous time axis.
    */
    {key: "skipGaps", default: true},
    {key: "discrete", default: "x"},
    {key: "legend", default: false, coerce: "const"},
    {key: "shape", default: constant(CANDLESTICK_SHAPE), coerce: "const"},
    {key: "timeline", default: false},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        tbody: (d: DataPoint, i: number) => candleTooltipRows(viz, d, i),
      }),
    },
  ],
};

/**
    Creates a candlestick (or OHLC bar) chart of financial periods, from rows
    with a date and open, high, low, and close values. Each row's date is read
    by `x` (default `"date"`): a Date, a timestamp, or a date string.
*/
export default makeChart(candlestickDef, Plot);
