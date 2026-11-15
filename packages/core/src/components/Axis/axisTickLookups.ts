/**
    Constant-time lookups `buildTickData` makes for each tick it lays out,
    matching what the array scans they replace (`includes`, and `find` by
    `===`) return.
*/
import type {AxisTextDatum} from "./axisLayoutLabels.js";

/** What `buildTickData` asks of a tick value. */
export interface TickLookups {
  /** Whether the value is one of the ticks, as `ticks.includes(d)`. */
  isTick: (d: unknown) => boolean;
  /** Whether the value is one of the labels, as `labels.includes(d)`. */
  isLabel: (d: unknown) => boolean;
  /** The value's measured label, as `textData.find(t => t.d === d)`. */
  text: (d: unknown) => AxisTextDatum | undefined;
  /** The scale data at the value, as `scaleData.find(t => +t === d)`. */
  scaleValue: (d: unknown) => unknown;
}

/**
    Indexes an axis's ticks, labels, measured labels, and scale data by value
    once, so each tick looks itself up in constant time.
    @param ticks The axis's ticks.
    @param labels The values it labels.
    @param textData Its measured labels.
    @param scaleData The data its scale spans.
*/
export function tickLookups(
  ticks: unknown[],
  labels: unknown[],
  textData: AxisTextDatum[],
  scaleData: unknown[],
): TickLookups {
  const tickSet = new Set(ticks),
    labelSet = new Set(labels);
  // `===` never matches NaN, which a Map would; the first match wins.
  const texts = new Map<unknown, AxisTextDatum>();
  textData.forEach((t: AxisTextDatum) => {
    if (t.d === t.d && !texts.has(t.d)) texts.set(t.d, t);
  });
  const numbers = new Map<number, unknown>();
  scaleData.forEach((t: unknown) => {
    const n = +(t as number);
    if (n === n && !numbers.has(n)) numbers.set(n, t);
  });
  return {
    isTick: d => tickSet.has(d),
    isLabel: d => labelSet.has(d),
    text: d => texts.get(d),
    scaleValue: d => (typeof d === "number" ? numbers.get(d) : undefined),
  };
}
