/**
    Candlestick's Plot shape emitter: one Path per period, a candle (wick and
    body) or an OHLC bar, colored by whether the period rose or fell.

    Each candle is stamped as a `"Candlestick"` mark carrying its row as its
    datum, plus one interaction point at its close, so Plot's snapped hover,
    tooltips, and `.Candlestick` event handlers treat it like any other mark.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import configPrep from "../../utils/configPrep.js";
import type {VizContext} from "../../utils/configPrep.js";
import {collectComputed, makeShape, shapeConfigFor} from "../features/emitHelpers.js";
import type {PlotAxisFn, PlotDatum} from "../features/plotPaint.js";
import type {ShapeEmitContext, ShapeEmitter} from "../features/shapeEmit.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {ohlcAccessors} from "./buffer.js";
import {
  candleDirection,
  candlePath,
  candleWidth,
  ohlcBarPath,
  periodSpacing,
  pixelCenter,
  readOhlc,
  type CandleDirection,
  type CandlestickVariant,
  type Ohlc,
} from "./ohlc.js";
import {candleAriaLabel} from "./tooltip.js";

/** The shape key candles are drawn under. */
export const CANDLESTICK_SHAPE = "Candlestick";

/** Pixel layout of one period. */
export interface CandleLayout {
  /** Center along the time axis. */
  cx: number;
  /** The body's (or OHLC ticks') full width. */
  width: number;
  /** Open/high/low/close as pixel positions. */
  px: Ohlc;
  direction: CandleDirection;
  /** The path drawn for the period. */
  d: string;
}

/** The widest a lone period's candle is drawn, in pixels. */
const LONE_PERIOD_ROOM = 40;
/** The narrowest hover target around a candle, in pixels. */
const MIN_HIT_WIDTH = 6;

/** A per-row color setting: a color string or an accessor over the user's row. */
type ColorSetting = string | ((d: DataPoint, i: number) => string) | undefined;

const resolveColor = (setting: ColorSetting, d: PlotDatum): string | undefined =>
  typeof setting === "function" ? setting(d.data, d.i) : setting;

/**
    Lays out every row with a finite close: its center, its width (a share of
    the smallest gap between periods), and its path.
    @param viz The chart.
    @param rows The formatted rows to draw.
    @param x The time axis's value-to-pixel function.
    @param y The value axis's value-to-pixel function.
    @param range The time axis's pixel range.
*/
export function layoutCandles(
  viz: VizInstance,
  rows: PlotDatum[],
  x: PlotAxisFn,
  y: PlotAxisFn,
  range: number[],
): Map<PlotDatum, CandleLayout> {
  const accessors = ohlcAccessors(viz);
  const variant = viz.schema.variant as CandlestickVariant;
  const room = Math.min(Math.abs(range[range.length - 1] - range[0]), LONE_PERIOD_ROOM);
  const centers = rows.map(d => x(d.x));
  const width = candleWidth(periodSpacing(centers, room), Number(viz.schema.bodyWidth));
  // Even widths keep both body edges on pixel centers, like the wick.
  const snapped = width >= 2 ? 2 * Math.round(width / 2) : width;
  const layouts = new Map<PlotDatum, CandleLayout>();
  rows.forEach((d, k) => {
    const v = readOhlc(d.data, d.i, accessors);
    if (!v || !Number.isFinite(centers[k])) return;
    const px: Ohlc = {
      open: pixelCenter(y(v.open)),
      high: pixelCenter(y(v.high)),
      low: pixelCenter(y(v.low)),
      close: pixelCenter(y(v.close)),
    };
    if (![px.open, px.high, px.low, px.close].every(Number.isFinite)) return;
    const cx = pixelCenter(centers[k]);
    layouts.set(d, {
      cx,
      width: snapped,
      px,
      direction: candleDirection(v.open, v.close),
      d: variant === "ohlc" ? ohlcBarPath(cx, snapped, px) : candlePath(cx, snapped, px),
    });
  });
  return layouts;
}

/**
    The library's candle styling, beneath the user's `shapeConfig.Candlestick`:
    up and down colors on the stroke, and on the fill of a down candle (and of
    an up candle unless `hollow`). OHLC bars are never filled.
*/
function candleStyle(viz: VizInstance, layoutOf: (d: PlotDatum) => CandleLayout): Record<string, unknown> {
  const color = (d: PlotDatum): string | undefined =>
    resolveColor(
      (layoutOf(d).direction === "up" ? viz.schema.upColor : viz.schema.downColor) as ColorSetting,
      d,
    );
  return {
    fill: (d: PlotDatum) => {
      const {direction} = layoutOf(d);
      const hollow = viz.schema.variant === "ohlc" || (direction === "up" && viz.schema.hollow);
      return hollow ? "none" : color(d);
    },
    stroke: color,
    strokeWidth: 1,
    strokeLinecap: "butt",
  };
}

/**
    Emits the candles for a Plot's `"Candlestick"` rows. Styled by
    `upColor`/`downColor`/`hollow`, then any keys nested under
    `shapeConfig.Candlestick`.
    @param ctx The Plot shape-emit context.
*/
export const emitCandlesticks: ShapeEmitter = (ctx: ShapeEmitContext) => {
  const {viz, x, y, xRange} = ctx;
  const rows = ctx.values as unknown as PlotDatum[];
  const layouts = layoutCandles(viz, rows, x, y, xRange);
  if (!layouts.size) return [];
  const layoutOf = (d: PlotDatum): CandleLayout => layouts.get(d)!;
  const nested = viz.schema.shapeConfig[CANDLESTICK_SHAPE] as Record<string, unknown> | undefined;

  const path = makeShape("Path")
    .renderMode("compute")
    .config(shapeConfigFor(viz, CANDLESTICK_SHAPE))
    .config(candleStyle(viz, layoutOf))
    .config(nested ? configPrep.bind(viz as unknown as VizContext)(nested as Parameters<typeof configPrep>[0]) : {})
    .config({
      ariaLabel: (d: PlotDatum) => candleAriaLabel(viz, d.data, d.i),
      d: (d: PlotDatum) => layoutOf(d).d,
      hitArea: (d: PlotDatum) => {
        const {cx, width, px} = layoutOf(d);
        const w = Math.max(width, MIN_HIT_WIDTH);
        return {x: cx - w / 2, y: px.high - 2, width: w, height: px.low - px.high + 4};
      },
      id: (d: PlotDatum) => `${d.id}_${d.discrete}`,
      label: false,
      x: 0,
      y: 0,
    })
    .data(Array.from(layouts.keys()));
  viz._wirePlotShapeEvents!(path, CANDLESTICK_SHAPE, ctx.events);

  return collectComputed(path).map(node => {
    const d = node.datum as unknown as PlotDatum | undefined;
    const l = d && layouts.get(d);
    const point = l ? {interactionPoints: [{x: l.cx, y: l.px.close, datum: d as unknown as DataPoint, index: d!.i}]} : {};
    return {...node, shapeType: CANDLESTICK_SHAPE, ...point} as SceneNode;
  });
};
