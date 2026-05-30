/**
    Scale + tick layout helpers for `measureAxis` (see `axisLayout.ts`). Pure
    compute — no DOM. Each helper mutates the input `axis`'s scratch slots
    (`_d3Scale`, `_d3ScaleNegative`, `_tickUnit`, `_availableTicks`,
    `_visibleTicks`) exactly as the original inline `Axis.render` body did.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import {max, range as d3Range, min, sum} from "d3-array";
import * as scales from "d3-scale";
import {timeFormat} from "d3-time-format";

import {date} from "@d3plus/dom";
import {formatAbbreviate, formatDate} from "@d3plus/format";
import {formatLocale} from "@d3plus/locales";
import {closest} from "@d3plus/math";

const isNegative = (d: number): boolean => d < 0 || Object.is(d, -0);
const floorPow = (d: number): number =>
  Math.pow(10, Math.floor(Math.log10(Math.abs(d)))) *
  Math.pow(-1, isNegative(d) ? 1 : 0);
const ceilPow = (d: number): number =>
  Math.pow(10, Math.ceil(Math.log10(Math.abs(d)))) *
  Math.pow(-1, isNegative(d) ? 1 : 0);
const fixFloat = (d: number): number => {
  const str = `${d}`;
  if (str.includes("e-") || str === "0") return 0;
  const nineMatch = str.match(/(-*[0-9]+\.[0]*)([0-8]+)9{3,}[0-9]+$/);
  if (nineMatch) return +`${nineMatch[1]}${+nineMatch[2] + 1}`;
  const zeroMatch = str.match(/(-*[0-9]+\.[0]*)([1-9]+)0*[0-9]*0{3,}[0-9]+$/);
  if (zeroMatch) return +`${zeroMatch[1]}${+zeroMatch[2]}`;
  return d;
};

/** Builds the tick label formatter (user-supplied or scale-derived). */
export function buildTickFormat(
  axis: any,
  timeLocaleObj: any,
  getTicks: () => any[],
): (d: any) => any {
  return axis.schema.tickFormat
    ? axis.schema.tickFormat
    : (d: any) => {
        if (isNaN(d) || ["band", "ordinal", "point"].includes(axis.schema.scale)) {
          return d;
        } else if (axis.schema.scale === "time") {
          const refData = (axis._data.length ? axis._data : axis.schema.domain)
            .map((v: unknown) => date(v as string | number | false))
            .filter((d: Date | false): d is Date => d instanceof Date)
            .sort((a: Date, b: Date) => +a - +b);
          return formatDate(d, refData, timeFormat).replace(
            /^Q/g,
            timeLocaleObj.quarter as string,
          );
        } else if (
          axis.schema.scale === "linear" &&
          axis.schema.tickSuffix === "smallest"
        ) {
          const loc =
            typeof axis.schema.locale === "object"
              ? axis.schema.locale
              : formatLocale[axis.schema.locale];
          const {separator, suffixes} = loc;
          const suff = d >= 1000 ? suffixes[axis._tickUnit + 8] : "";
          const tick = d / Math.pow(10, 3 * axis._tickUnit);
          const number = formatAbbreviate(
            tick,
            loc,
            `,.${tick.toString().length}r`,
          );
          return `${number}${separator}${suff}`;
        } else {
          const ticks = getTicks();
          const inverted = ticks[1] < ticks[0];
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
          return `${prefix}${formatAbbreviate(d, axis.schema.locale)}${suffix}`;
        }
      };
}

/** Resolves the pixel range, clamping to config + expanding ordinal buckets. */
function resolveRange(axis: any, rangeOuter: number[], newRange: any): any[] {
  let range = newRange ? newRange.slice() : [undefined, undefined];
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

/** Rounds the linear/log domain to "nice" values per the rounding mode. */
function roundDomain(axis: any, initialDomain: any[]): void {
  const zeroLength = (d: number) => {
    if (smallScale) {
      if (!d) return 0;
      const m = `${d}`.match(/0\.(0*)/);
      if (m)
        return +`0.${Array(m[1].length + 1).fill(0).join("")}1`;
    }
    return `${Math.round(Math.abs(d))}`.length;
  };
  const smallScale = initialDomain.every(
    (d: number) => Math.abs(d) < 1,
  );
  const zeroArray = [
    zeroLength(initialDomain[0]),
    zeroLength(initialDomain[1]),
  ]
    .filter(Boolean)
    .sort();
  if (!zeroArray.length) return;
  const diverging =
    initialDomain.some((d: number) => isNegative(d)) &&
    initialDomain.some((d: number) => d > 0);
  const zeros =
    zeroArray.length === 1
      ? zeroArray[0]
      : zeroArray[0] > 1 && zeroArray[0] === zeroArray[1]
        ? zeroArray[0] - 1
        : axis.schema.rounding === "outside" || !diverging
          ? zeroArray[0] + (zeroArray[1] - zeroArray[0]) / 2
          : max(zeroArray)!;
  let factor: number =
    zeros < 1
      ? fixFloat(zeros)
      : +`1${Array(Math.floor(fixFloat(zeros)) - 1).fill(0).join("")}`;
  if (factor >= Math.abs(initialDomain[1] - initialDomain[0]))
    factor /= 2;
  const inverted = initialDomain[1] < initialDomain[0];
  const newDomain = [
    Math[
      axis.schema.rounding === "outside"
        ? inverted
          ? "ceil"
          : "floor"
        : inverted
          ? "floor"
          : "ceil"
    ](initialDomain[0] / factor) * factor,
    Math[
      axis.schema.rounding === "outside"
        ? inverted
          ? "floor"
          : "ceil"
        : inverted
          ? "ceil"
          : "floor"
    ](initialDomain[1] / factor) * factor,
  ];
  if (axis.schema.scale === "log") {
    if (newDomain[0] === 0) newDomain[0] = initialDomain[0];
    if (newDomain[1] === 0) newDomain[1] = initialDomain[1];
  }
  axis._d3Scale.domain(newDomain.map(fixFloat));
}

/** Dispatches domain rounding for linear vs. log scales. */
function applyRounding(axis: any, initialDomain: any[]): void {
  if (axis.schema.scale === "linear") {
    roundDomain(axis, initialDomain);
  } else if (axis.schema.scale === "log") {
    const powDomain: number[] = [];
    const inverted = initialDomain[1] < initialDomain[0];
    powDomain[0] = (
      axis.schema.rounding === "outside"
        ? isNegative(initialDomain[0])
          ? inverted
            ? floorPow
            : ceilPow
          : inverted
            ? ceilPow
            : floorPow
        : isNegative(initialDomain[0])
          ? inverted
            ? ceilPow
            : floorPow
          : inverted
            ? floorPow
            : ceilPow
    )(initialDomain[0]);
    powDomain[1] = (
      axis.schema.rounding === "inside"
        ? isNegative(initialDomain[1])
          ? inverted
            ? floorPow
            : ceilPow
          : inverted
            ? ceilPow
            : floorPow
        : isNegative(initialDomain[1])
          ? inverted
            ? floorPow
            : ceilPow
          : inverted
            ? floorPow
            : ceilPow
    )(initialDomain[1]);
    const powInverted = powDomain[1] < powDomain[0];
    if (
      powDomain[0] !== powDomain[1] &&
      powDomain.some((d: number) => Math.abs(d) > 10) &&
      powInverted === inverted
    ) {
      axis._d3Scale.domain(powDomain);
    } else {
      roundDomain(axis, initialDomain);
    }
  }
}

/** Splits a log scale into positive/negative sub-scales when it spans zero. */
function applyLogScaleSplit(axis: any): void {
  const domain = axis._d3Scale.domain() as number[];
  const data = axis._data as number[];
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
  const scaleRange = axis._d3Scale.range();

  if (isNegative(domain[0]) && isNegative(domain[domain.length - 1])) {
    axis._d3ScaleNegative = axis._d3Scale
      .copy()
      .domain(domain)
      .range(scaleRange);
    axis._d3Scale = null;
  } else if (domain[0] > 0 && domain[domain.length - 1] > 0) {
    axis._d3Scale.domain(domain).range(scaleRange);
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
    axis._d3ScaleNegative = axis._d3Scale.copy();
    (isNegative(domain[0]) ? axis._d3Scale : axis._d3ScaleNegative)
      .domain([isNegative(domain[0]) ? minValue : -minValue!, domain[1]])
      .range([scaleRange[0] + zero, scaleRange[1]]);
    (isNegative(domain[0]) ? axis._d3ScaleNegative : axis._d3Scale)
      .domain([domain[0], isNegative(domain[0]) ? -minValue! : minValue])
      .range([scaleRange[0], scaleRange[0] + zero]);
  }
}

/** Resolves the tick + label value arrays (config, scale ticks, or domain). */
function resolveTicksLabels(axis: any): {ticks: any[]; labels: any[]} {
  let ticks = (
    axis.schema.ticks
      ? axis.schema.scale === "time"
        ? (axis.schema.ticks as (string | number | false | undefined)[]).map(date)
        : axis.schema.ticks
      : (axis._d3Scale ? axis._d3Scale.ticks : axis._d3ScaleNegative.ticks)
        ? axis._getTicks()
        : axis.schema.domain
  ).slice();
  let labels = (
    axis.schema.labels
      ? axis.schema.scale === "time"
        ? (axis.schema.labels as (string | number | false | undefined)[]).map(date)
        : axis.schema.labels
      : (axis._d3Scale ? axis._d3Scale.ticks : axis._d3ScaleNegative.ticks)
        ? axis._getLabels()
        : ticks
  ).slice();

  if (axis.schema.scale === "time") {
    ticks = ticks.map(Number);
    labels = labels.map(Number);
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
function applyTickSuffixUnit(axis: any, labels: any[]): void {
  if (axis.schema.scale === "linear" && axis.schema.tickSuffix === "smallest") {
    const suffixes = labels.filter((d: unknown) => (d as number) >= 1000);
    if (suffixes.length > 0) {
      const minVal = Math.min(...suffixes);
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
function filterVisibleTicks(axis: any, ticks: any[], tickGet: any): any[] {
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
  axis: any,
  rangeOuter: number[],
  tickGet: any,
  newRangeArg?: any,
): {range: any[]; ticks: any[]; labels: any[]} {
  const newRange = newRangeArg !== undefined ? newRangeArg : axis.schema.range;
  const range = resolveRange(axis, rangeOuter, newRange);

  const scale = `scale${axis.schema.scale
    .charAt(0)
    .toUpperCase()}${axis.schema.scale.slice(1)}`;

  const initialDomain = axis.schema.domain.slice();

  axis._d3Scale = (scales as any)[scale]()
    .domain(
      axis.schema.scale === "time" ? initialDomain.map(date) : initialDomain,
    )
    .range(range);

  if (axis.schema.rounding !== "none") applyRounding(axis, initialDomain);

  if (axis._d3Scale.padding) axis._d3Scale.padding(axis.schema.scalePadding);
  if (axis._d3Scale.paddingInner)
    axis._d3Scale.paddingInner(axis.schema.paddingInner);
  if (axis._d3Scale.paddingOuter)
    axis._d3Scale.paddingOuter(axis.schema.paddingOuter);

  axis._d3ScaleNegative = null;
  if (axis.schema.scale === "log") applyLogScaleSplit(axis);

  const {ticks: rawTicks, labels} = resolveTicksLabels(axis);
  applyTickSuffixUnit(axis, labels);
  const ticks = filterVisibleTicks(axis, rawTicks, tickGet);

  return {range, ticks, labels};
}
