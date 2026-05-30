import {deviation, extent, min, quantile, range} from "d3-array";
import {interpolateRgb} from "d3-interpolate";
import {scaleLinear, scaleThreshold} from "d3-scale";

import {colorLighter} from "@d3plus/color";
import {unique} from "@d3plus/data";
import {ckmeans} from "@d3plus/math";

import type ColorScale from "./ColorScale.js";

/** Computed values shared between the scale solve and the render branches. */
export interface ColorScaleCompute {
  allValues: number[];
  domain: number[];
  ticks: number[] | undefined;
  labels: number[] | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colors: any;
  horizontal: boolean;
  height: string;
  width: string;
  x: string;
  y: string;
}

interface ScaleContext {
  allValues: number[];
  domain: number[];
  negative: boolean;
  positive: boolean;
  diverging: boolean;
  numBuckets: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colors: any;
}

interface ScaleResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colors: any;
  ticks: number[] | undefined;
  labels: number[] | undefined;
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

  let jenks: number[][] = [];

  if (cs.schema.buckets instanceof Array) {
    ticks = cs.schema.buckets;
  } else {
    if (diverging && cs.schema.centered) {
      const half = Math.floor(buckets / 2);
      const residual = buckets % 2;

      const negatives = allValues.filter((d: number) => d < cs.schema.midpoint);
      const negativesDeviation = deviation(negatives);

      const positives = allValues
        .concat(cs.schema.midpoint)
        .filter((d: number) => d >= cs.schema.midpoint);
      const positivesDeviation = deviation(positives);

      const isNegativeMax =
        negativesDeviation! > positivesDeviation! ? 1 : 0;
      const isPositiveMax =
        positivesDeviation! > negativesDeviation! ? 1 : 0;

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
      colors = [cs.schema.colorMin, cs.schema.colorMid, cs.schema.colorMax];
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
      const positives = ticks
        .slice(0, buckets)
        .filter((d: number) => d > cs.schema.midpoint);
      const negativeColors = negatives.map((_d: number, i: number) =>
        !i ? colors[0] : colorLighter(colors[0], i / negatives.length),
      );
      const spanningColors = spanning.map(() => colors[1]);
      const positiveColors = positives.map((_d: number, i: number) =>
        i === positives.length - 1
          ? colors[2]
          : colorLighter(colors[2], 1 - (i + 1) / positives.length),
      );
      colors = negativeColors.concat(spanningColors).concat(positiveColors);
    } else {
      colors = range(0, numBuckets, 1)
        .map((i: number) => colorLighter(cs.schema.colorMax, i / numBuckets))
        .reverse();
    }
  }

  if (ticks.length <= buckets) colors = colors.slice(-ticks.length);

  colors = [colors[0]].concat(colors);

  cs._colorScale = scaleThreshold().domain(ticks).range(colors);

  return {colors, ticks, labels};
}

/** Resolves the diverging linear-gradient color/bucket arrays. */
function resolveDivergingLinear(
  cs: ColorScale,
  ctx: ScaleContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buckets: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): {colors: any; buckets: any} {
  const {domain, numBuckets} = ctx;
  const half = Math.floor(numBuckets / 2);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const negativeColorScale = (interpolateRgb as any).gamma(2.2)(
    cs.schema.colorMin,
    cs.schema.colorMid,
  );
  const negativeColors = range(0, half, 1).map((i: number) =>
    negativeColorScale(i / half),
  );
  const spanningColors = (numBuckets % 2 ? [0] : []).map(
    () => cs.schema.colorMid,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const positiveColorScale = (interpolateRgb as any).gamma(2.2)(
    cs.schema.colorMax,
    cs.schema.colorMid,
  );
  const positiveColors = range(0, half, 1)
    .map((i: number) => positiveColorScale(i / half))
    .reverse();
  const colors = negativeColors.concat(spanningColors).concat(positiveColors);
  if (!buckets) {
    const step = (colors.length - 1) / 2;
    buckets = [
      (domain as number[])[0],
      cs.schema.midpoint,
      (domain as number[])[1],
    ];
    buckets = range(
      (domain as number[])[0],
      cs.schema.midpoint,
      -((domain as number[])[0] - cs.schema.midpoint) / step,
    )
      .concat(
        range(
          cs.schema.midpoint,
          (domain as number[])[1],
          ((domain as number[])[1] - cs.schema.midpoint) / step,
        ),
      )
      .concat([(domain as number[])[1]]);
  }
  return {colors, buckets};
}

/** Resolves the non-diverging linear-gradient color/bucket arrays. */
function resolveNonDivergingLinear(
  cs: ColorScale,
  ctx: ScaleContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buckets: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): {colors: any; buckets: any} {
  const {allValues, domain, negative, positive, diverging, numBuckets} = ctx;
  let {colors} = ctx;
  if (!colors) {
    if (cs.schema.scale === "buckets" || cs.schema.scale === "quantile") {
      colors = range(0, numBuckets, 1).map((i: number) =>
        colorLighter(
          negative ? cs.schema.colorMin : cs.schema.colorMax,
          i / numBuckets,
        ),
      );
      if (positive) colors = colors.reverse();
    } else {
      colors = negative
        ? [cs.schema.colorMin, colorLighter(cs.schema.colorMin, 0.8)]
        : [colorLighter(cs.schema.colorMax, 0.8), cs.schema.colorMax];
    }
  }
  if (!buckets) {
    if (cs.schema.scale === "quantile") {
      const step = 1 / (colors.length - 1);
      buckets = range(0, 1 + step / 2, step).map((d: number) =>
        quantile(allValues, d),
      ) as number[];
    } else if (diverging && cs.schema.color && cs.schema.centered) {
      const midIndex = colors.indexOf(cs.schema.colorMid);
      const negativeStep =
        (cs.schema.midpoint - (domain as number[])[0]) / midIndex;
      const positiveStep =
        ((domain as number[])[1] - cs.schema.midpoint) /
        (colors.length - midIndex);
      const negativeBuckets = range(
        (domain as number[])[0],
        cs.schema.midpoint,
        negativeStep,
      );
      const positiveBuckets = range(
        cs.schema.midpoint,
        (domain as number[])[1] + positiveStep / 2,
        positiveStep,
      );

      buckets = negativeBuckets.concat(positiveBuckets);
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

/** Builds the linear/log/buckets/quantile scale and assigns it to the instance. */
function computeLinearScale(cs: ColorScale, ctx: ScaleContext): ScaleResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let buckets: any =
    cs.schema.buckets instanceof Array ? cs.schema.buckets : undefined;
  const resolved =
    ctx.diverging && !ctx.colors
      ? resolveDivergingLinear(cs, ctx, buckets)
      : resolveNonDivergingLinear(cs, ctx, buckets);
  let {colors} = resolved;
  buckets = resolved.buckets;
  let ticks: number[] | undefined;

  if (cs.schema.scale === "buckets" || cs.schema.scale === "quantile") {
    ticks = buckets;
    colors = [colors[0]].concat(colors);
  } else if (cs.schema.scale === "log") {
    const negativeBuckets = (buckets as number[]).filter((d: number) => d < 0);
    if (negativeBuckets.length) {
      const minVal = negativeBuckets[0];
      const newNegativeBuckets = negativeBuckets.map(
        (d: number) => -Math.pow(Math.abs(minVal), d / minVal),
      );
      negativeBuckets.forEach((bucket: number, i: number) => {
        (buckets as number[])[(buckets as number[]).indexOf(bucket)] =
          newNegativeBuckets[i];
      });
    }
    const positiveBuckets = (buckets as number[]).filter((d: number) => d > 0);
    if (positiveBuckets.length) {
      const maxVal = positiveBuckets[positiveBuckets.length - 1];
      const newPositiveBuckets = positiveBuckets.map((d: number) =>
        Math.pow(maxVal, d / maxVal),
      );
      positiveBuckets.forEach((bucket: number, i: number) => {
        (buckets as number[])[(buckets as number[]).indexOf(bucket)] =
          newPositiveBuckets[i];
      });
    }
    if ((buckets as number[]).includes(0))
      (buckets as number[])[(buckets as number[]).indexOf(0)] = 1;
  }

  const scaleFn =
    cs.schema.scale === "buckets" || cs.schema.scale === "quantile"
      ? scaleThreshold
      : scaleLinear;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cs._colorScale = (scaleFn as (...args: unknown[]) => any)()
    .domain(buckets)
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

  const allValues = (cs._data
    .map(cs.schema.value)
    .filter((d: unknown) => d !== null && typeof d === "number") as number[])
    .sort((a: number, b: number) => a - b);

  const domain = (cs.schema.domain || extent(allValues)) as number[];
  const negative = domain[0] < cs.schema.midpoint;
  const positive = domain[1] > cs.schema.midpoint;
  const diverging = negative && positive;

  const numBuckets = min([
    cs.schema.buckets instanceof Array
      ? cs.schema.buckets.length
      : cs.schema.buckets,
    diverging && cs.schema.scale !== "jenks"
      ? 2 * Math.floor(unique(allValues).length / 2) - 1
      : unique(allValues).length,
  ])!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let colors: any =
    diverging &&
    (!cs.schema.color ||
      (cs.schema.color instanceof Array &&
        !cs.schema.color.includes(cs.schema.colorMid)))
      ? undefined
      : cs.schema.color;

  if (colors && !(colors instanceof Array)) {
    colors = range(0, numBuckets, 1)
      .map((i: number) => colorLighter(colors, (i + 1) / numBuckets))
      .reverse();
  }

  const ctx: ScaleContext = {
    allValues,
    domain,
    negative,
    positive,
    diverging,
    numBuckets,
    colors,
  };

  const result =
    cs.schema.scale === "jenks"
      ? computeJenksScale(cs, ctx)
      : computeLinearScale(cs, ctx);

  if (cs._colorScale.clamp) cs._colorScale.clamp(true);

  return {
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
