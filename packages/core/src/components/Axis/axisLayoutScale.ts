/**
    Scale + tick layout helpers for `measureAxis` (see `axisLayout.ts`). Pure
    compute — no DOM. Each helper mutates the input `axis`'s scratch slots
    (`_d3Scale`, `_d3ScaleNegative`, `_tickUnit`, `_availableTicks`,
    `_visibleTicks`) exactly as the original inline `Axis.render` body did.
*/
import {range as d3Range, min, sum} from "d3-array";
import * as scales from "d3-scale";
import {timeFormat} from "d3-time-format";

import {dateFormatter, formatAbbreviate} from "@d3plus/format";
import {formatLocale, type TimeLocaleDefinition} from "@d3plus/locales";
import {closest} from "@d3plus/math";

import type Axis from "./Axis.js";
import {applyAxisBreaks, breakTickValues} from "./axisBreak.js";
import type {TickGet} from "./axisLayoutLabels.js";
import {
  axisDateCategories,
  axisShownDates,
  axisTimeDomain,
  axisTimeReference,
  isCategoryAxis,
  isValidDate,
  parseTimeValues,
} from "./timeValues.js";
import {axisIsYearLike, formatYear} from "./yearValues.js";
import type {D3Scale} from "../../utils/index.js";
import {floorPow, isNegative, roundedDomain} from "./axisRounding.js";


/**
    Builds the tick label formatter (user-supplied or scale-derived). With a
    `rotatedTickFormat`, the formatter reads `axis._labelRotation` on every
    call, so labels measured and painted rotated use that one instead.
*/
export function buildTickFormat(
  axis: Axis,
  timeLocaleObj: TimeLocaleDefinition,
  getTicks: () => unknown[],
): (d: unknown) => string {
  const format = baseTickFormat(axis, timeLocaleObj, getTicks);
  const rotated = axis.schema.rotatedTickFormat as ((d: unknown) => string) | undefined;
  return rotated ? (d: unknown) => (axis._labelRotation ? rotated : format)(d) : format;
}

/** The tick label formatter for unrotated labels: `tickFormat`, else the scale's default. */
function baseTickFormat(
  axis: Axis,
  timeLocaleObj: TimeLocaleDefinition,
  getTicks: () => unknown[],
): (d: unknown) => string {
  let years: boolean | undefined;
  let categories: Date[] | undefined;
  // Every label reads all of the axis's dates, so they are read once per set
  // of dates (see `dateFormatter`) in the current default time locale.
  let memo: {dates: Date[]; format: typeof timeFormat; label: (d: Date, shown?: Date[]) => string} | undefined;
  const dateLabel = (dates: Date[], d: Date): string => {
    if (!memo || memo.dates !== dates || memo.format !== timeFormat)
      memo = {dates, format: timeFormat, label: dateFormatter(dates, timeFormat)};
    return memo.label(d, axisShownDates(axis)).replace(/^Q/g, timeLocaleObj.quarter);
  };
  const format = axis.schema.tickFormat as ((this: Axis, d: unknown) => string) | undefined;
  // A tickFormat may read the axis it labels as `this` (such as which labels it shows).
  return format
    ? (d: unknown): string => format.call(axis, d)
    : (d: unknown): string => {
        if (isValidDate(d) && isCategoryAxis(axis)) {
          return dateLabel((categories ??= axisDateCategories(axis)), d);
        } else if (
          isNaN(d as number) ||
          ["band", "ordinal", "point"].includes(axis.schema.scale)
        ) {
          return d as string;
        } else if (axis.schema.scale === "time") {
          return dateLabel(axisTimeReference(axis), d as Date);
        } else if (
          axis.schema.scale === "linear" &&
          axis.schema.tickSuffix === "smallest"
        ) {
          const loc =
            typeof axis.schema.locale === "object"
              ? axis.schema.locale
              : formatLocale[axis.schema.locale];
          const {separator, suffixes} = loc;
          const suff = (d as number) >= 1000 ? suffixes[axis._tickUnit + 8] : "";
          const tick = (d as number) / Math.pow(10, 3 * axis._tickUnit);
          const number = formatAbbreviate(
            tick,
            loc,
            `,.${tick.toString().length}r`,
          );
          return `${number}${separator}${suff}`;
        } else {
          const ticks = getTicks();
          const inverted = (ticks[1] as number) < (ticks[0] as number);
          const minTick = inverted ? ticks.length - 1 : 0;
          const maxTick = inverted ? 0 : ticks.length - 1;
          const prefix =
            axis.schema.rounding === "inside"
              ? ticks.indexOf(d) === minTick
                ? axis.schema.roundingInsideMinPrefix
                : ticks.indexOf(d) === maxTick
                  ? axis.schema.roundingInsideMaxPrefix
                  : ""
              : "";
          const suffix =
            axis.schema.rounding === "inside"
              ? ticks.indexOf(d) === minTick
                ? axis.schema.roundingInsideMinSuffix
                : ticks.indexOf(d) === maxTick
                  ? axis.schema.roundingInsideMaxSuffix
                  : ""
              : "";
          years ??= axisIsYearLike(axis);
          const number = years
            ? formatYear(d as number, axis.schema.locale)
            : formatAbbreviate(d as number, axis.schema.locale);
          return `${prefix}${number}${suffix}`;
        }
      };
}

/** Resolves the pixel range, clamping to config + expanding ordinal buckets. */
function resolveRange(
  axis: Axis,
  rangeOuter: number[],
  newRange: number[] | undefined,
): number[] {
  // Indices 0/1 are filled by the guards below before any read.
  let range: number[] = newRange ? newRange.slice() : [];
  let [minRange, maxRange] = rangeOuter;
  if (axis.schema.range) {
    if (axis.schema.range[0] !== undefined) minRange = axis.schema.range[0];
    if (axis.schema.range[axis.schema.range.length - 1] !== undefined)
      maxRange = axis.schema.range[axis.schema.range.length - 1]!;
  }
  if (range[0] === undefined || range[0] < minRange) range[0] = minRange;
  if (range[1] === undefined || range[1] > maxRange) range[1] = maxRange;

  const sizeInner = maxRange - minRange;
  if (axis.schema.scale === "ordinal" && axis.schema.domain.length > range.length) {
    if (newRange === axis.schema.range) {
      const buckets = axis.schema.domain.length + 1;
      range = d3Range(buckets)
        .map((d: number) => range[0] + sizeInner * (d / (buckets - 1)))
        .slice(1, buckets);
      range = range.map((d: number) => d - range[0] / 2);
    } else {
      const buckets = axis.schema.domain.length;
      const size = range[1] - range[0];
      range = d3Range(buckets).map(
        (d: number) => range[0] + size * (d / (buckets - 1)),
      );
    }
  }
  return range;
}


/** Splits a log scale into positive/negative sub-scales when it spans zero. */
function applyLogScaleSplit(axis: Axis): void {
  const domain = axis._d3Scale!.domain() as number[];
  const data = axis._scaleData as number[];
  if (domain[0] === 0) {
    const smallestNumber = min([min(data)!, Math.abs(domain[1])]);
    domain[0] =
      smallestNumber === 0 || smallestNumber === 1
        ? 1e-6
        : smallestNumber! <= 1
          ? floorPow(smallestNumber!)
          : 1;
    if (isNegative(domain[1])) domain[0] *= -1;
  } else if (domain[domain.length - 1] === 0) {
    const smallestNumber = min([min(data)!, Math.abs(domain[0])]);
    domain[domain.length - 1] =
      smallestNumber === 0 || smallestNumber === 1
        ? 1e-6
        : smallestNumber! <= 1
          ? floorPow(smallestNumber!)
          : 1;
    if (isNegative(domain[0])) domain[domain.length - 1] *= -1;
  }
  const scaleRange = axis._d3Scale!.range();

  if (isNegative(domain[0]) && isNegative(domain[domain.length - 1])) {
    axis._d3ScaleNegative = axis._d3Scale!
      .copy()
      .domain(domain)
      .range(scaleRange);
    axis._d3Scale = null;
  } else if (domain[0] > 0 && domain[domain.length - 1] > 0) {
    axis._d3Scale!.domain(domain).range(scaleRange);
  } else {
    const powers = domain
      .map((d: number) => Math.log10(Math.abs(d)))
      .map((d: number) => d || -1e-6);
    const leftPercentage = powers[0] / sum(powers);
    const zero = leftPercentage * (scaleRange[1] - scaleRange[0]);

    let minPositive = min([
      min(data.filter((d: number) => d >= 0))!,
      Math.abs(domain[1]),
    ]);
    if (minPositive === 1) minPositive = 1e-6;
    let minNegative = min([
      min(data.filter(isNegative))!,
      Math.abs(domain[0]),
    ]);
    if (minNegative === 1) minNegative = 1e-6;
    const minPosPow =
      minPositive === 0
        ? 1e-6
        : minPositive! <= 1
          ? floorPow(minPositive!)
          : 1;
    const minNegPow =
      minNegative === 0
        ? -1e-6
        : minNegative! <= 1
          ? floorPow(minNegative!)
          : 1;
    const minValue = min([Math.abs(minPosPow), Math.abs(minNegPow)]);
    axis._d3ScaleNegative = axis._d3Scale!.copy();
    (isNegative(domain[0]) ? axis._d3Scale : axis._d3ScaleNegative)!
      .domain([isNegative(domain[0]) ? minValue! : -minValue!, domain[1]])
      .range([scaleRange[0] + zero, scaleRange[1]]);
    (isNegative(domain[0]) ? axis._d3ScaleNegative : axis._d3Scale)!
      .domain([domain[0], isNegative(domain[0]) ? -minValue! : minValue!])
      .range([scaleRange[0], scaleRange[0] + zero]);
  }
}

/**
    The label lists an axis chooses among, when its `labels` is a list of
    lists (from the most labels to the fewest): the layout labels the first
    list whose labels all fit whole, else the last one, thinned.
*/
export function labelSets(axis: Axis): unknown[][] | undefined {
  const {labels} = axis.schema;
  return Array.isArray(labels) && labels.length && labels.every(Array.isArray)
    ? (labels as unknown[][])
    : undefined;
}

/**
    Resolves the tick + label value arrays (config, scale ticks, or domain).
    With a list of label lists, the labels are the one the layout is trying,
    and the ticks follow them unless `ticks` is set.
*/
function resolveTicksLabels(axis: Axis): {ticks: unknown[]; labels: unknown[]} {
  const sets = labelSets(axis);
  const ownLabels: unknown[] | undefined = sets
    ? sets[Math.min(axis._labelSet ?? 0, sets.length - 1)]
    : axis.schema.labels;
  const ownTicks: unknown[] | undefined = axis.schema.ticks || (sets ? ownLabels : undefined);
  let ticks = (
    ownTicks
      ? axis.schema.scale === "time"
        ? parseTimeValues(ownTicks)
        : ownTicks
      : (axis._d3Scale ? axis._d3Scale.ticks : axis._d3ScaleNegative?.ticks)
        ? axis._getTicks()
        : axis.schema.domain
  ).slice();
  let labels = (
    ownLabels
      ? axis.schema.scale === "time"
        ? parseTimeValues(ownLabels)
        : ownLabels
      : (axis._d3Scale ? axis._d3Scale.ticks : axis._d3ScaleNegative?.ticks)
        ? axis._getLabels()
        : ticks
  ).slice();

  if (axis.schema.scale === "time") {
    ticks = ticks.map(Number);
    labels = labels.map(Number);
  }
  if (axis._breaks.length) {
    ticks = breakTickValues(axis._breaks, ticks);
    // An explicit `labels` list labels just those values (an empty one, none).
    labels = breakTickValues(axis._breaks, labels, !ownLabels);
  }
  ticks = ticks.sort(
    (a: unknown, b: unknown) => axis._getPosition(a) - axis._getPosition(b),
  );
  labels = labels.sort(
    (a: unknown, b: unknown) => axis._getPosition(a) - axis._getPosition(b),
  );
  return {ticks, labels};
}

/** Sets `axis._tickUnit` for the "smallest" linear tick-suffix mode. */
function applyTickSuffixUnit(axis: Axis, labels: unknown[]): void {
  if (axis.schema.scale === "linear" && axis.schema.tickSuffix === "smallest") {
    const suffixes = labels.filter((d: unknown) => (d as number) >= 1000);
    if (suffixes.length > 0) {
      const minVal = Math.min(...(suffixes as number[]));
      let i = 1;
      while (i && i < 7) {
        const n = Math.pow(10, 3 * i);
        if (minVal / n >= 1) {
          axis._tickUnit = i;
          i += 1;
        } else {
          break;
        }
      }
    }
  }
}

/** Drops ticks that would visually collide, recording available/visible sets. */
function filterVisibleTicks(axis: Axis, ticks: unknown[], tickGet: TickGet): unknown[] {
  const pixels: (number | false)[] = [];
  axis._availableTicks = ticks;
  ticks.forEach((d: unknown, i: number) => {
    let s = tickGet({id: d, tick: true}, i);
    if (axis.schema.shape === "Circle") s *= 2;
    const t = axis._getPosition(d);
    if (!pixels.length || Math.abs(closest(t, pixels.filter((pix): pix is number => pix !== false))! - t) > s * 2)
      pixels.push(t);
    else pixels.push(false);
  });
  ticks = ticks.filter((_d: unknown, i: number) => pixels[i] !== false);
  axis._visibleTicks = ticks;
  return ticks;
}

/**
    Builds the scale, applies rounding/log adjustments, resolves ticks/labels,
    and filters colliding ticks. Mutates `axis` and returns the layout locals
    the caller threads through the rest of `measureAxis`.
*/
export function setAxisScale(
  axis: Axis,
  rangeOuter: number[],
  tickGet: TickGet,
  newRangeArg?: number[],
): {range: number[]; ticks: unknown[]; labels: unknown[]} {
  const newRange = newRangeArg !== undefined ? newRangeArg : axis.schema.range;
  const range = resolveRange(axis, rangeOuter, newRange);

  const scale = `scale${axis.schema.scale
    .charAt(0)
    .toUpperCase()}${axis.schema.scale.slice(1)}`;

  const initialDomain = axis.schema.domain.slice();

  axis._d3Scale = (scales as unknown as Record<string, () => D3Scale>)[scale]()
    .domain(
      axis.schema.scale === "time" ? axisTimeDomain(axis) : initialDomain,
    )
    .range(range);

  if (axis.schema.rounding !== "none") {
    const rounded = roundedDomain(initialDomain, axis.schema.rounding, axis.schema.scale);
    if (rounded) axis._d3Scale!.domain(rounded);
  }

  if (axis._d3Scale!.padding)
    axis._d3Scale!.padding(axis.schema.scalePadding);
  if (axis._d3Scale!.align) axis._d3Scale!.align(axis.schema.scaleAlign);
  if (axis._d3Scale!.paddingInner)
    axis._d3Scale!.paddingInner(axis.schema.paddingInner);
  if (axis._d3Scale!.paddingOuter)
    axis._d3Scale!.paddingOuter(axis.schema.paddingOuter);

  axis._d3ScaleNegative = null;
  if (axis.schema.scale === "log") applyLogScaleSplit(axis);

  // Breaks (an automatic baseline break and any `break` ranges) swap the
  // linear scale for a broken one that skips the removed values.
  applyAxisBreaks(axis, range);

  const {ticks: rawTicks, labels} = resolveTicksLabels(axis);
  applyTickSuffixUnit(axis, labels);
  const ticks = filterVisibleTicks(axis, rawTicks, tickGet);

  return {range, ticks, labels};
}
