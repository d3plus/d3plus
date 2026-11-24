/**
    The values a draggable reference line takes: a pixel position read back
    into a value on its axis, kept inside its bounds and rounded to its
    `step` (or, without one, to about a pixel's worth of the axis), and the
    value a key press moves it to.
*/
import {
  timeDay,
  timeHour,
  timeMinute,
  timeSecond,
  utcDay,
  utcHour,
  utcMinute,
  utcSecond,
} from "d3-time";
import type {TimeInterval} from "d3-time";

/** The `draggable` setting of a reference line. */
export interface ReferenceDragConfig {
  /** The lowest value the line can be dragged to. Defaults to the axis's lowest. */
  min?: number | Date;
  /** The highest value the line can be dragged to. Defaults to the axis's highest. */
  max?: number | Date;
  /** The value steps the line snaps to, as multiples of `step` (milliseconds on a time axis). */
  step?: number;
}

/** How a draggable line reads and rounds values along its axis. */
export interface DragAxis {
  /** Maps a value (a number, or a Date on a time axis) to its pixel. */
  scale: (value: unknown) => number;
  /** The axis's lowest and highest values, as numbers. */
  domain: [number, number];
  /** Whether the axis plots dates. */
  time?: boolean;
  /** Whether its dates round in UTC. */
  utc?: boolean;
}

const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/** A bound as a number: a number, or a Date's time. */
const bound = (v: unknown): number | undefined => {
  const n = v instanceof Date ? +v : v;
  return finite(n) ? n : undefined;
};

/**
    The options of a `draggable` setting: `true` takes the defaults, an
    object its `min`, `max`, and `step`. Null when the line isn't draggable.
    @param setting The setting.
*/
export function dragOptions(setting: unknown): {
  min?: number;
  max?: number;
  step?: number;
} | null {
  if (setting === true) return {};
  if (!setting || typeof setting !== "object") return null;
  const {min, max, step} = setting as ReferenceDragConfig;
  return {
    min: bound(min),
    max: bound(max),
    step: finite(step) && step > 0 ? step : undefined,
  };
}

/**
    The value a pixel position stands for on an axis, found by halving the
    axis's domain (so linear, log, and time axes, and axes with a baseline
    break, read alike), or NaN for an axis without a finite domain.
    @param axis The axis.
    @param px The pixel position.
*/
export function invertPixel(axis: DragAxis, px: number): number {
  const [lo, hi] = axis.domain;
  if (!finite(lo) || !finite(hi) || !finite(px)) return NaN;
  const at = (v: number): number =>
    axis.scale(axis.time ? new Date(v) : v) as number;
  const pLo = at(lo),
    pHi = at(hi);
  if (!finite(pLo) || !finite(pHi) || pLo === pHi) return lo;
  const rising = pHi > pLo;
  if (rising ? px <= pLo : px >= pLo) return lo;
  if (rising ? px >= pHi : px <= pHi) return hi;
  let a = lo,
    b = hi;
  for (let i = 0; i < 60; i++) {
    const mid = (a + b) / 2;
    const p = at(mid);
    if (p === px) return mid;
    if (p < px === rising) a = mid;
    else b = mid;
  }
  return (a + b) / 2;
}

/** The decimal places a number is written with. */
function decimals(n: number): number {
  const text = `${n}`;
  const exp = /e-(\d+)$/.exec(text);
  if (exp) return +exp[1] + (text.split("e")[0].split(".")[1] ?? "").length;
  return (text.split(".")[1] ?? "").length;
}

/**
    A value rounded to the nearest multiple of `step`, written with no more
    decimal places than `step` has.
    @param value The value.
    @param step The step.
*/
export function snapToStep(value: number, step: number): number {
  if (!finite(value) || !finite(step) || step <= 0) return value;
  const snapped = Math.round(value / step) * step;
  return +snapped.toFixed(Math.min(20, decimals(step)));
}

/** The time intervals a dragged date rounds to, longest first. */
const INTERVALS: [number, TimeInterval, TimeInterval][] = [
  [864e5, timeDay, utcDay],
  [36e5, timeHour, utcHour],
  [6e4, timeMinute, utcMinute],
  [1e3, timeSecond, utcSecond],
];

/**
    The value one pixel spans at `px` on an axis, as a power of ten (the
    precision a dragged value rounds to without a `step`).
    @param axis The axis.
    @param px The pixel position.
*/
export function pixelPrecision(axis: DragAxis, px: number): number {
  const span = Math.abs(invertPixel(axis, px + 1) - invertPixel(axis, px - 1));
  if (!finite(span) || span <= 0) return 0;
  return Math.pow(10, Math.floor(Math.log10(span / 2)));
}

/**
    A value rounded to about a pixel's worth of the axis at `px`: to a power
    of ten on a numeric axis, and on a time axis to the longest of a day, an
    hour, a minute, or a second that a pixel spans.
    @param axis The axis.
    @param value The value.
    @param px Its pixel position.
*/
export function roundToPixel(
  axis: DragAxis,
  value: number,
  px: number,
): number {
  if (axis.time) {
    const span = Math.abs(invertPixel(axis, px + 1) - invertPixel(axis, px));
    const unit = INTERVALS.find(([ms]) => span >= ms) ?? INTERVALS[3];
    return +(axis.utc ? unit[2] : unit[1]).round(new Date(value));
  }
  const precision = pixelPrecision(axis, px);
  return precision ? snapToStep(value, precision) : value;
}

/**
    The range a line can move in: the axis's domain, narrowed by `min` and
    `max`.
    @param axis The axis.
    @param options The line's drag options.
*/
export function dragRange(
  axis: DragAxis,
  options: {min?: number; max?: number},
): [number, number] {
  const lo = Math.min(...axis.domain),
    hi = Math.max(...axis.domain);
  const min = options.min !== undefined ? Math.max(lo, options.min) : lo;
  const max = options.max !== undefined ? Math.min(hi, options.max) : hi;
  return min <= max ? [min, max] : [lo, hi];
}

/**
    Keeps a value inside a range, stepping a value snapped past an end back
    to the nearest step inside it.
    @param value The value.
    @param range The lowest and highest values.
    @param step The step the value snaps to.
*/
export function clampValue(
  value: number,
  [lo, hi]: [number, number],
  step?: number,
): number {
  if (value < lo)
    return step ? snapToStep(Math.ceil(lo / step) * step, step) : lo;
  if (value > hi)
    return step ? snapToStep(Math.floor(hi / step) * step, step) : hi;
  return value;
}

/**
    The value a dragged line takes at a pixel position: read off the axis,
    snapped to `step` (or rounded to about a pixel's worth), and kept in
    its range.
    @param axis The axis.
    @param px The pixel position.
    @param options The line's drag options.
*/
export function valueAtPixel(
  axis: DragAxis,
  px: number,
  options: {min?: number; max?: number; step?: number},
): number {
  const raw = invertPixel(axis, px);
  if (!finite(raw)) return NaN;
  const value = options.step
    ? snapToStep(raw, options.step)
    : roundToPixel(axis, raw, px);
  return clampValue(value, dragRange(axis, options), options.step);
}

/** The keys that move a focused line, and how many steps each moves it (`Infinity` to an end). */
export const DRAG_KEYS: Record<string, number> = {
  ArrowUp: 1,
  ArrowRight: 1,
  ArrowDown: -1,
  ArrowLeft: -1,
  PageUp: 10,
  PageDown: -10,
  Home: -Infinity,
  End: Infinity,
};

/** How far one key press moves a line without a `step`: a hundredth of the plot. */
export const KEY_PIXEL_SHARE = 0.01;

/**
    The value a key moves a line to, or null for a key that doesn't move
    it. Arrow keys move it one `step` (without one, about a hundredth of
    the plot), Page Up and Page Down ten, and Home and End to the ends of
    its range. Up and right raise its value.
    @param key The key pressed.
    @param axis The axis.
    @param current The line's value and pixel position.
    @param length The plot's length along the axis, in pixels.
    @param options The line's drag options.
*/
export function keyValue(
  key: string,
  axis: DragAxis,
  current: {value: number; px: number},
  length: number,
  options: {min?: number; max?: number; step?: number},
): number | null {
  const steps = DRAG_KEYS[key];
  if (steps === undefined) return null;
  const range = dragRange(axis, options);
  if (steps === -Infinity) return clampValue(range[0], range, options.step);
  if (steps === Infinity) return clampValue(range[1], range, options.step);
  if (options.step)
    return clampValue(
      snapToStep(current.value + steps * options.step, options.step),
      range,
      options.step,
    );
  // A pixel move in whichever direction raises the value.
  const delta = Math.max(1, length * KEY_PIXEL_SHARE) * Math.abs(steps);
  const up = invertPixel(axis, current.px + 1) > invertPixel(axis, current.px);
  const px = current.px + (up === steps > 0 ? delta : -delta);
  const next = roundToPixel(axis, invertPixel(axis, px), px);
  return clampValue(next, range);
}
