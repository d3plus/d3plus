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
