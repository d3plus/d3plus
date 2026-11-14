import {deviation, extent, max, min, quantile, range} from "d3-array";
import {interpolateRgb} from "d3-interpolate";
import {scaleLinear, scaleThreshold} from "d3-scale";

import {colorLighter} from "@d3plus/color";
import {unique} from "@d3plus/data";
import {ckmeans} from "@d3plus/math";

import type ColorScale from "./ColorScale.js";
import type {D3Scale} from "../../utils/index.js";
import {themeRamp, themeScaleColor} from "../../utils/theme.js";
import {resolveColorScaleType} from "./colorScaleType.js";
import type {ColorScaleType} from "./colorScaleType.js";

/** Computed values shared between the scale solve and the render branches. */
export interface ColorScaleCompute {
  /** The scale this render builds, with a `scale` function resolved. */
  scale: ColorScaleType;
  allValues: number[];
  domain: number[];
  ticks: number[] | undefined;
  labels: number[] | undefined;
  colors: string[];
  horizontal: boolean;
  height: string;
  width: string;
  x: string;
  y: string;
}

interface ScaleContext {
  scale: ColorScaleType;
  allValues: number[];
  domain: number[];
  negative: boolean;
  positive: boolean;
  diverging: boolean;
  numBuckets: number;
  colors: string[] | undefined;
}

interface ScaleResult {
  colors: string[];
  ticks: number[] | undefined;
  labels: number[] | undefined;
}

/**
    The scale's poles: unset ones come from the theme's `colorScale` tokens on
    a dark or custom theme, and from its `colorDefaults` otherwise.
*/
const colorMin = (cs: ColorScale): string =>
  cs.schema.colorMin ??
  themeScaleColor(cs._theme, "min", cs.schema.colorDefaults.off);
const colorMid = (cs: ColorScale): string =>
  cs.schema.colorMid ??
  themeScaleColor(cs._theme, "mid", cs.schema.colorDefaults.light);
const colorMax = (cs: ColorScale): string =>
  cs.schema.colorMax ??
  themeScaleColor(cs._theme, "max", cs.schema.colorDefaults.sequential);

/**
    A single-hue low→high ramp toward `base` that reads on the scale's theme,
    its palest step held darker on a light theme with `ordinalRamp`.
*/
const ramp = (cs: ColorScale, base: string, n: number): string[] =>
  themeRamp(
    cs._theme,
    base,
    n,
    Boolean(cs.schema.ordinalRamp) && !cs._theme?.dark,
  );

/**
    Steps a diverging pole `t` of the way back toward the midpoint: lighter on
    a light theme, and mixed into the dark midpoint on a dark one.
*/
const towardMid = (cs: ColorScale, pole: string, t: number): string =>
  cs._theme?.dark
    ? interpolateRgb.gamma(2.2)(pole, colorMid(cs))(t)
    : colorLighter(pole, t);

/**
    The number of colors a ColorScale steps through: its `buckets` setting (or
    the length of a `buckets` array) capped at the number of unique values. A
    diverging (non-jenks) scale caps it at an odd count, so a color centers on
    the midpoint, but never below 3, so each pole keeps its own color: a
    `buckets` setting under 3 still applies.
*/
export function colorScaleBucketCount(
  buckets: number | number[] | undefined,
  uniqueCount: number,
  diverging: boolean,
): number {
  const setting =
    (buckets instanceof Array ? buckets.length : buckets) ?? Infinity;
  if (!diverging) return Math.min(setting, uniqueCount);
  return Math.min(setting, Math.max(3, 2 * Math.floor(uniqueCount / 2) - 1));
}

/** Builds the jenks (ckmeans) threshold scale and assigns it to the instance. */
function computeJenksScale(cs: ColorScale, ctx: ScaleContext): ScaleResult {
  const {allValues, diverging, numBuckets} = ctx;
  let {colors} = ctx;
  let ticks: number[] | undefined;
  let labels: number[] | undefined;

  const buckets = min([
    colors ? colors.length : numBuckets,
    numBuckets,
    allValues.length,
  ])!;

  let jenks: number[][];

  if (cs.schema.buckets instanceof Array) {
    ticks = cs.schema.buckets;
  } else {
    if (diverging && cs.schema.centered) {
      const half = Math.floor(buckets / 2);
      const residual = buckets % 2;

      const negatives = allValues.filter((d: number) => d < cs.schema.midpoint);
      // A side with one value has no spread.
      const negativesDeviation = deviation(negatives) ?? 0;

      const positives = allValues
        .concat(cs.schema.midpoint)
        .filter((d: number) => d >= cs.schema.midpoint);
      const positivesDeviation = deviation(positives) ?? 0;

      // The odd bucket goes to the side with more spread (positives on a tie).
      const isNegativeMax = negativesDeviation > positivesDeviation ? 1 : 0;
      const isPositiveMax = 1 - isNegativeMax;

      const negativeJenks = ckmeans(
        negatives,
        min([half + residual * isNegativeMax, negatives.length])!,
      );
      const positiveJenks = ckmeans(
        positives,
        min([half + residual * isPositiveMax, positives.length])!,
      );

      jenks = negativeJenks.concat(positiveJenks);
    } else {
      jenks = ckmeans(allValues, buckets);
    }

    ticks = jenks.map((c: number[]) => c[0]);
  }

  const tickSet = new Set(ticks);

  if (ticks.length !== tickSet.size) labels = Array.from(tickSet);

  if (!colors) {
    if (diverging) {
      const base: string[] = [colorMin(cs), colorMid(cs), colorMax(cs)];
      const negatives = ticks
        .slice(0, buckets)
        .filter(
          (d: number, i: number) =>
            d < cs.schema.midpoint && ticks![i + 1] <= cs.schema.midpoint,
        );
      const spanning = ticks
        .slice(0, buckets)
        .filter(
          (d: number, i: number) =>
            d <= cs.schema.midpoint && ticks![i + 1] > cs.schema.midpoint,
        );
      // The last bucket runs on from its tick, so one starting at the
      // midpoint takes the positive pole.
      const positives = ticks
        .slice(0, buckets)
        .filter(
          (d: number, i: number) =>
            d > cs.schema.midpoint ||
            (d === cs.schema.midpoint && ticks![i + 1] === undefined),
        );
      const negativeColors = negatives.map((_d: number, i: number) =>
        !i ? base[0] : towardMid(cs, base[0], i / negatives.length),
      );
      const spanningColors = spanning.map(() => base[1]);
      const positiveColors = positives.map((_d: number, i: number) =>
        i === positives.length - 1
          ? base[2]
          : towardMid(cs, base[2], 1 - (i + 1) / positives.length),
      );
      colors = negativeColors.concat(spanningColors).concat(positiveColors);
    } else {
      // Single-hue ramp of the relevant pole, stepped in OKLab (see
      // @d3plus/color), reversed so a negative-only pole is the lowest value.
      const steps = ramp(
        cs,
        ctx.negative ? colorMin(cs) : colorMax(cs),
        numBuckets,
      );
      colors = ctx.negative ? steps.slice().reverse() : steps;
    }
  }

  if (ticks.length <= buckets) colors = colors.slice(-ticks.length);

  colors = [colors[0]].concat(colors);

  cs._colorScale = scaleThreshold<number, string>()
    .domain(ticks)
    .range(colors) as unknown as D3Scale<string>;

  return {colors, ticks, labels};
}

/**
    The values a diverging scale's buckets start at: `perSide` evenly spaced
    from `low` up to the `midpoint`, then `perSide` evenly spaced from the
    `midpoint` up to `high`, so each side splits its own span evenly.
*/
export function divergingThresholds(
  low: number,
  midpoint: number,
  high: number,
  perSide: number,
): number[] {
  const side = (from: number, to: number): number[] =>
    range(perSide).map((i: number) => from + i * ((to - from) / perSide));
  return side(low, midpoint).concat(side(midpoint, high));
}

/**
    The values a diverging quantile scale's buckets start at: the quantiles
    splitting the `values` below the `midpoint` into `perSide` buckets, then
    those splitting the values at or above it into `perSide` more. Each side
    counts the `midpoint` as one of its values, so its buckets reach it.
*/
export function divergingQuantiles(
  values: number[],
  midpoint: number,
  perSide: number,
): number[] {
  const side = (sideValues: number[]): number[] =>
    range(perSide).map((i: number) => quantile(sideValues, i / perSide)!);
  const below = values.filter((d: number) => d < midpoint).concat(midpoint);
  const above = [midpoint].concat(values.filter((d: number) => d >= midpoint));
  return side(below).concat(side(above));
}

/**
    The values a centered color array's stops sit at: `below` evenly spaced
    from `low` up to the `midpoint`, the `midpoint` itself, then `above` evenly
    spaced from the `midpoint` up to `high`, one per color.
*/
export function centeredStops(
  low: number,
  midpoint: number,
  high: number,
  below: number,
  above: number,
): number[] {
  const step = (from: number, to: number, n: number, i: number): number =>
    i === n ? to : from + i * ((to - from) / n);
  return range(below)
    .map((i: number) => step(low, midpoint, below, i))
    .concat(midpoint)
    .concat(
      range(1, above + 1).map((i: number) => step(midpoint, high, above, i)),
    );
}

/** Resolves the diverging linear-gradient color/bucket arrays. */
function resolveDivergingLinear(
  cs: ColorScale,
  ctx: ScaleContext,
  buckets: number[] | undefined,
): {colors: string[]; buckets: number[]} {
  const {domain, numBuckets, scale} = ctx;
  if (numBuckets === 1) {
    // A single bucket: the midpoint color across the whole domain.
    const thresholds = scale === "buckets" || scale === "quantile";
    return {
      colors: thresholds ? [colorMid(cs)] : [colorMid(cs), colorMid(cs)],
      buckets: buckets ?? (thresholds ? [domain[0]] : [domain[0], domain[1]]),
    };
  }
  const half = Math.floor(numBuckets / 2);
  const thresholds = scale === "buckets" || scale === "quantile";
  // A gradient over an even count still passes through the midpoint color at
  // the midpoint, unless it is drawn over explicit bucket values.
  const centered = numBuckets % 2 === 1 || (!thresholds && !buckets);
  const negativeColorScale = interpolateRgb.gamma(2.2)(
    colorMin(cs),
    colorMid(cs),
  );
  const negativeColors = range(0, half, 1).map((i: number) =>
    negativeColorScale(i / half),
  );
  const spanningColors = centered ? [colorMid(cs)] : [];
  const positiveColorScale = interpolateRgb.gamma(2.2)(
    colorMax(cs),
    colorMid(cs),
  );
  const positiveColors = range(0, half, 1)
    .map((i: number) => positiveColorScale(i / half))
    .reverse();
  const colors = negativeColors.concat(spanningColors).concat(positiveColors);
  if (!buckets) {
    const [low, high] = domain as number[];
    buckets =
      scale === "quantile"
        ? divergingQuantiles(ctx.allValues, cs.schema.midpoint, half)
        : divergingThresholds(low, cs.schema.midpoint, high, half);
    // A centered scale also stops at the domain's top; an even threshold
    // scale's last bucket runs on from its last threshold.
    if (centered) buckets.push(high);
  }
  return {colors, buckets};
}

/** Resolves the non-diverging linear-gradient color/bucket arrays. */
function resolveNonDivergingLinear(
  cs: ColorScale,
  ctx: ScaleContext,
  buckets: number[] | undefined,
): {colors: string[]; buckets: number[]} {
  const {allValues, domain, negative, positive, diverging, numBuckets, scale} =
    ctx;
  let {colors} = ctx;
  if (!colors) {
    // Single-hue ramp of the relevant pole, stepped in OKLab (low→high).
    // Negative-only scales put the pole on the most negative value, so the
    // ramp is reversed.
    const base = negative ? colorMin(cs) : colorMax(cs);
    if (scale === "buckets" || scale === "quantile") {
      const steps = ramp(cs, base, numBuckets);
      colors = positive ? steps : steps.slice().reverse();
    } else {
      const two = ramp(cs, base, 2);
      colors = negative ? two.slice().reverse() : two;
    }
  }
  if (!buckets) {
    if (scale === "quantile") {
      const step = 1 / (colors.length - 1);
      buckets = range(0, 1 + step / 2, step).map((d: number) =>
        quantile(allValues, d),
      ) as number[];
    } else if (diverging && cs.schema.color && cs.schema.centered) {
      const midIndex = colors.indexOf(colorMid(cs));
      buckets = centeredStops(
        (domain as number[])[0],
        cs.schema.midpoint,
        (domain as number[])[1],
        midIndex,
        colors.length - 1 - midIndex,
      );
    } else if ((domain as number[])[0] === (domain as number[])[1]) {
      // A single value takes the pole's color: one bucket, or a solid bar.
      const pole = negative ? colors[0] : colors[colors.length - 1];
      buckets = (domain as number[]).slice(0, scale === "buckets" ? 1 : 2);
      colors = buckets.map(() => pole);
    } else {
      const step =
        ((domain as number[])[1] - (domain as number[])[0]) /
        (colors.length - 1);
      buckets = range(
        (domain as number[])[0],
        (domain as number[])[1] + step / 2,
        step,
      );
    }
  }
  return {colors, buckets};
}

/**
    Places a linear scale's evenly spaced `stops` on a log scale, as a new
    array: each side of 0 steps in even powers out to its pole, from 1 (or,
    for a pole inside (-1, 1), from that side's stop nearest 0). The midpoint
    of 0 draws at 1 when the positive side reaches past 1, else at -1 when the
    negative side reaches past -1, else at 0, where the log axis splits, so it
    stays between the two sides.
*/
export function logStops(stops: number[]): number[] {
  /** Steps a side's magnitudes (ascending) in even powers out to its pole. */
  const side = (magnitudes: number[]): ((d: number) => number) => {
    const pole = magnitudes[magnitudes.length - 1];
    const base = pole > 1 ? 1 : magnitudes[0];
    return (d: number): number => base * Math.pow(pole / base, d / pole);
  };
  const ascending = (a: number, b: number): number => a - b;
  const negative = side(
    stops
      .filter((d: number) => d < 0)
      .map((d: number) => -d)
      .sort(ascending),
  );
  const positive = side(stops.filter((d: number) => d > 0).sort(ascending));
  const placed = stops.map((d: number) =>
    d < 0 ? -negative(-d) : d > 0 ? positive(d) : d,
  );
  const high = max(placed);
  const nearest = max(placed.filter((d: number) => d < 0));
  const zero = placed.indexOf(0);
  if (zero >= 0)
    placed[zero] =
      high! > 1 ? 1 : nearest !== undefined && nearest < -1 ? -1 : 0;
  return placed;
}

/**
    Merges a log scale's stops that land on one value, keeping the color
    farthest from the midpoint, as a `buckets` array with a repeated value
    gives. Stops that would leave fewer than 2 are kept as they are.
*/
export function mergeLogStops(
  stops: number[],
  colors: string[],
): {stops: number[]; colors: string[]} {
  const merged: number[] = [];
  const mergedColors: string[] = [];
  stops.forEach((stop: number, i: number) => {
    if (merged.length && stop === merged[merged.length - 1]) {
      if (stop > 0) mergedColors[mergedColors.length - 1] = colors[i];
    } else {
      merged.push(stop);
      mergedColors.push(colors[i]);
    }
  });
  return merged.length < 2
    ? {stops, colors}
    : {stops: merged, colors: mergedColors};
}

/** Builds the linear/log/buckets/quantile scale and assigns it to the instance. */
function computeLinearScale(cs: ColorScale, ctx: ScaleContext): ScaleResult {
  const {scale} = ctx;
  let buckets: number[] | undefined =
    cs.schema.buckets instanceof Array ? cs.schema.buckets : undefined;
  const resolved =
    ctx.diverging && !ctx.colors
      ? resolveDivergingLinear(cs, ctx, buckets)
      : resolveNonDivergingLinear(cs, ctx, buckets);
  let {colors} = resolved;
  buckets = resolved.buckets;
  let ticks: number[] | undefined;

  if (scale === "buckets" || scale === "quantile") {
    ticks = buckets;
    colors = [colors[0]].concat(colors);
  } else if (scale === "log") {
    buckets = logStops(buckets as number[]);
    ({stops: buckets, colors} = mergeLogStops(buckets, colors));
  }

  const scaleFn =
    scale === "buckets" || scale === "quantile" ? scaleThreshold : scaleLinear;
  cs._colorScale = (scaleFn as unknown as () => D3Scale<string>)()
    .domain(buckets as number[])
    .range(colors);

  return {colors, ticks, labels: undefined};
}

/**
    Solves the color scale (jenks or linear) for the current ColorScale config,
    assigning `_colorScale` and returning the values the render branches need.
*/
export function computeColorScale(cs: ColorScale): ColorScaleCompute {
  const horizontal = ["bottom", "top"].includes(cs.schema.orient);

  const height = horizontal ? "height" : "width",
    width = horizontal ? "width" : "height",
    x = horizontal ? "x" : "y",
    y = horizontal ? "y" : "x";

  const allValues = (
    cs._data
      .map(cs.schema.value)
      .filter(
        (d: unknown) => typeof d === "number" && !Number.isNaN(d),
      ) as number[]
  ).sort((a: number, b: number) => a - b);

  const scale = resolveColorScaleType(cs.schema.scale, allValues, cs);
  cs._scaleType = scale;

  const domain = (cs.schema.domain || extent(allValues)) as number[];
  const negative = domain[0] < cs.schema.midpoint;
  const positive = domain[1] > cs.schema.midpoint;
  const diverging = negative && positive;

  const numBuckets = colorScaleBucketCount(
    cs.schema.buckets,
    unique(allValues).length,
    diverging && scale !== "jenks",
  );

  let colors: string | string[] | undefined =
    diverging &&
    (!cs.schema.color ||
      (cs.schema.color instanceof Array &&
        !cs.schema.color.includes(colorMid(cs))))
      ? undefined
      : cs.schema.color;

  if (colors && !(colors instanceof Array)) {
    // A single hue expands to a low→high ramp, stepped in OKLab.
    colors = ramp(cs, colors, numBuckets);
  }

  const ctx: ScaleContext = {
    scale,
    allValues,
    domain,
    negative,
    positive,
    diverging,
    numBuckets,
    // A single color string is expanded to an array above, so by here this
    // is always an array (or undefined).
    colors: colors as string[] | undefined,
  };

  const result =
    scale === "jenks"
      ? computeJenksScale(cs, ctx)
      : computeLinearScale(cs, ctx);

  if (cs._colorScale!.clamp) cs._colorScale!.clamp(true);

  return {
    scale,
    allValues,
    domain,
    ticks: result.ticks,
    labels: result.labels,
    colors: result.colors,
    horizontal,
    height,
    width,
    x,
    y,
  };
}
