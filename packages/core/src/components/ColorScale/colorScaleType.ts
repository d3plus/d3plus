import {warnConfig} from "../../utils/configWarnings.js";

/** The kinds of scale a ColorScale can build. */
export type ColorScaleType =
  "buckets" | "jenks" | "linear" | "log" | "quantile";

/**
    A ColorScale `scale` setting: a scale name, or a function that picks one
    from the values the scale is built from (sorted ascending) and their
    `[min, max]` extent, called with the ColorScale as `this`.
*/
export type ColorScaleTypeSetting =
  | ColorScaleType
  | ((
      this: unknown,
      values: number[],
      extent: [number, number] | [undefined, undefined],
    ) => ColorScaleType);

export const colorScaleTypes: readonly ColorScaleType[] = [
  "buckets",
  "jenks",
  "linear",
  "log",
  "quantile",
];

/** Whether a scale draws as discrete swatches (one per bucket) rather than a bar. */
export const isBucketScale = (scale: ColorScaleType): boolean =>
  scale === "buckets" || scale === "jenks" || scale === "quantile";

/**
    Resolves a `scale` setting to a scale name for one render. A function is
    called with the sorted `values` and their extent, with `context` as
    `this`. An unknown name warns and falls back to `"linear"`.
*/
export function resolveColorScaleType(
  setting: unknown,
  values: number[],
  context?: unknown,
): ColorScaleType {
  const extent = (
    values.length ? [values[0], values[values.length - 1]] : [void 0, void 0]
  ) as [number, number] | [undefined, undefined];
  const scale =
    typeof setting === "function"
      ? (setting as (...args: unknown[]) => unknown).call(
          context,
          values.slice(),
          extent,
        )
      : setting;
  if (colorScaleTypes.includes(scale as ColorScaleType))
    return scale as ColorScaleType;
  warnConfig(
    `ColorScale received unknown scale ${JSON.stringify(scale) ?? String(scale)}; using "linear". ` +
      `Use one of ${colorScaleTypes.map(d => `"${d}"`).join(", ")}, or a function returning one.`,
  );
  return "linear";
}
