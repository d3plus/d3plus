/**
    WordCloud's font sizes: each word's value mapped onto `fontMin`–`fontMax`.
*/

import {scaleLinear, scaleLog, scaleSqrt} from "d3-scale";

/** How values map onto font sizes: `"sqrt"`, `"linear"`, or `"log"`. */
export type FontScaleKind = "sqrt" | "linear" | "log";

/**
    Coerces a `fontScale` setting, falling back to `"sqrt"`.
    @param value The setting.
*/
export function fontScaleKind(value: unknown): FontScaleKind {
  return value === "linear" || value === "log" ? value : "sqrt";
}

/**
    The font size, in pixels, for each value: the smallest value draws at
    `min`, the largest at `max`, and the ones between by `kind` (with
    `"sqrt"`, a word's ink area grows about in step with its value). When
    every value is the same, every word draws at `max`.
    @param values Every word's value (each positive and finite).
    @param range The smallest and largest font sizes.
    @param kind How values map between them.
*/
export function wordFontSize(
  values: number[],
  range: [number, number],
  kind: FontScaleKind = "sqrt",
): (value: number) => number {
  const [min, max] = range;
  let lo = Infinity,
    hi = -Infinity;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!(hi > lo)) return () => max;
  const scale = (
    kind === "log"
      ? scaleLog()
      : kind === "linear"
        ? scaleLinear()
        : scaleSqrt()
  )
    .domain([lo, hi])
    .range([min, max])
    .clamp(true);
  return value => scale(value);
}
