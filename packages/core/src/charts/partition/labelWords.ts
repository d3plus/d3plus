/**
    Word-level label fitting shared by the partition charts (Sunburst,
    Icicle): splitting a label into whole words, measuring them once at a 1px
    font size, counting the lines they wrap to, and searching for the largest
    font size a label fits at.
*/

import {fontExists, textWidth} from "@d3plus/dom";
import {fontFamily, textSplit} from "@d3plus/text";
import type {DataPoint} from "@d3plus/data";

const EPSILON = 1e-6;
const SOFT_HYPHEN = "­";

/** A label's words measured at a 1px font size, so any size is a multiplication away. */
export interface LabelMetrics {
  words: number[];
  space: number;
}

export interface LabelFitOptions {
  /** Smallest font size worth drawing (px). Default 8. */
  fontMin?: number;
  /** Largest font size to try (px). Default 24. */
  fontMax?: number;
  /** Inner padding of the label box (px). Default 2. */
  padding?: number;
  /** Line height as a multiple of the font size. Default 1.2. */
  lineHeight?: number;
  /** Most lines a label may wrap to. Default 3. */
  maxLines?: number;
}

/** `options` with every unset fit option at its default. */
export function labelFitDefaults(
  options: LabelFitOptions = {},
): Required<LabelFitOptions> {
  return {
    fontMin: 8,
    fontMax: 24,
    padding: 2,
    lineHeight: 1.2,
    maxLines: 3,
    ...options,
  };
}

/**
    Splits a label into words at spaces only — the shared splitter, with its
    hyphenated syllables joined back into whole words, so a long word is never
    broken across lines.
*/
export function partitionSplit(sentence: string): string[] {
  const words: string[] = [];
  let joining = false;
  for (const part of textSplit(sentence)) {
    if (joining) words[words.length - 1] += part.replace(SOFT_HYPHEN, "");
    else words.push(part.replace(SOFT_HYPHEN, ""));
    joining = part.endsWith(SOFT_HYPHEN);
  }
  return words;
}

/**
    A label's whole words measured at a 1px font size; `measure` returns the
    widths of the strings it's given at that size.
*/
export function labelMetrics(
  text: string,
  measure: (strings: string[]) => number[],
): LabelMetrics {
  const words = partitionSplit(text)
    .map(w => w.trim())
    .filter(Boolean);
  if (!words.length) return {words: [], space: 0};
  const [space, ...widths] = measure([" ", ...words]);
  return {words: widths, space};
}

/** Resolves a label style value that may be a per-datum accessor. */
function labelStyle(value: unknown, d: DataPoint, fallback: unknown): unknown {
  const v =
    typeof value === "function"
      ? (value as (d: DataPoint, i: number) => unknown)(d, 0)
      : value;
  return v ?? fallback;
}

/** Measures `text` for `datum` in the label font `labelConfig` sets (see `labelMetrics`). */
export function measureLabel(
  text: string,
  datum: DataPoint,
  labelConfig: Record<string, unknown>,
): LabelMetrics {
  const style = {
    "font-family": fontExists(
      labelStyle(labelConfig.fontFamily, datum, fontFamily) as string[],
    ) as string,
    "font-size": 100,
    "font-weight": labelStyle(labelConfig.fontWeight, datum, 400) as number,
  };
  return labelMetrics(text, strings =>
    (textWidth(strings, style) as number[]).map(w => w / 100),
  );
}

/**
    How many lines a label wraps to at `fontSize` within `width`, breaking only
    between words; Infinity when a single word is wider than the line.
*/
export function wrapLineCount(
  metrics: LabelMetrics,
  fontSize: number,
  width: number,
): number {
  let lines = 1;
  let current = 0;
  for (const word of metrics.words) {
    const w = word * fontSize;
    if (w > width + EPSILON) return Infinity;
    const next = current ? current + metrics.space * fontSize + w : w;
    if (next > width + EPSILON) {
      lines++;
      current = w;
    } else current = next;
  }
  return lines;
}

/**
    The largest whole font size from `fontMin` to `fontMax` that `fits`
    accepts, assuming every size below a fitting one fits too; null when
    `fontMin` doesn't.
*/
export function largestFontSize(
  fits: (fontSize: number) => boolean,
  fontMin: number,
  fontMax: number,
): number | null {
  if (!fits(fontMin)) return null;
  let lo = fontMin;
  let hi = Math.max(fontMin, fontMax);
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (fits(mid)) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
