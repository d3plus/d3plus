/**
    Candlestick's pipeline pieces (OHLC geometry, period aggregation, the
    volume strip, buffering, emit, period axes, and tooltip rows),
    re-exported by `@d3plus/core/internal`.

    @module
*/
export {
  candleChange,
  candleDirection,
  candlePath,
  candleWidth,
  finiteValue,
  ohlcBarPath,
  ohlcExtent,
  periodSpacing,
  pixelCenter,
  readOhlc,
} from "./ohlc.js";
export type {
  CandleDirection,
  CandlestickVariant,
  Ohlc,
  OhlcAccessor,
  OhlcAccessors,
} from "./ohlc.js";
export {
  aggregateFunctionFields,
  DEFAULT_AGGS,
  firstValue,
  keyedAccessor,
  lastValue,
  maxValue,
  minValue,
  ohlcAccessors,
  sumValue,
  syncDefaultAggs,
} from "./aggregate.js";
export type {Aggregator} from "./aggregate.js";
export {
  emitVolume,
  installVolumeStrip,
  stripSize,
  VOLUME_DEFAULTS,
  volumeAccessor,
  volumeScale,
  volumeStripRect,
} from "./volume.js";
export type {VolumeConfig, VolumeStrip} from "./volume.js";
export {candlestickBuffer, widenDomain} from "./buffer.js";
export {CANDLESTICK_SHAPE, candleTexture, emitCandlesticks, layoutCandles} from "./emit.js";
export type {CandleLayout} from "./emit.js";
export {bandAxisDefaults, periodDate} from "./periods.js";
export {
  candleAriaLabel,
  candleTooltipRows,
  formatChange,
  formatPrice,
  volumeAriaLabel,
} from "./tooltip.js";
