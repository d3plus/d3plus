import type {AxisConfig} from "../../utils/D3plusConfig.js";

type MaxSize = AxisConfig["maxSize"];

/** The limit a `maxSize` sets: a function is called with `size`, a number is the limit itself. */
export function resolveMaxSize(
  maxSize: MaxSize,
  size: number,
): number | undefined {
  return typeof maxSize === "function" ? maxSize(size) : maxSize;
}

/**
    The limit an axis's `maxSize` sets, read against the room the axis has
    across its labels: its height when it lies `horizontal`, else its width.
*/
export function axisMaxSize(
  schema: {maxSize?: MaxSize; width?: number; height?: number},
  horizontal: boolean,
): number | undefined {
  const size = horizontal ? schema.height : schema.width;
  return resolveMaxSize(schema.maxSize, size as number);
}

/**
    Replaces a function `maxSize` on `axis` with the limit it sets for `size`,
    so an axis drawn at another size than it was measured at keeps the limit
    it was measured with.
*/
export function pinMaxSize<T extends {schema: {maxSize?: MaxSize}}>(
  axis: T,
  size: number,
): T {
  const {maxSize} = axis.schema;
  if (typeof maxSize === "function") axis.schema.maxSize = maxSize(size);
  return axis;
}

/**
    Marks the `maxSize` a chart gives `axis` as the chart's own default
    limit, unless one of `configs` (the configs the chart applies to the
    axis, the user's among them) sets a `maxSize`. A default limit wraps the
    labels within it, but lets the axis take more than it to draw one line
    of labels and the title (see `strictMaxSize`).
*/
export function defaultMaxSize<T extends {_softMaxSize?: boolean}>(
  axis: T,
  ...configs: unknown[]
): T {
  axis._softMaxSize = !configs.some(
    (config: unknown) =>
      !!config &&
      typeof config === "object" &&
      (config as {maxSize?: unknown}).maxSize !== undefined,
  );
  return axis;
}

/**
    Whether `axis` keeps all it claims across its labels within its
    `maxSize`, however its labels are laid out (wrapped, slanted, upright or
    staggered), leaving out the labels and title that don't fit: any finite
    `maxSize` but a chart's own default (see `defaultMaxSize`).
*/
export function strictMaxSize(
  axis: {
    schema: {maxSize?: MaxSize; width?: number; height?: number};
    _softMaxSize?: boolean;
  },
  horizontal: boolean,
): boolean {
  if (axis._softMaxSize) return false;
  const limit = axisMaxSize(axis.schema, horizontal);
  return limit !== undefined && Number.isFinite(limit);
}
