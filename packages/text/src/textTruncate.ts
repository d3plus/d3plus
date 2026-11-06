import {softHyphen} from "./softHyphen.js";
import {graphemes, lineUnits} from "./textUnits.js";

/** Builds the text that ends a truncated line, given the line's text and its 1-based number. */
export type EllipsisFunction = (text: string, line: number) => string;

/**
    The longest prefix of `parts` (joined) for which `fits` holds, by binary
    search over the part count. Returns the part count, from 0 to
    `parts.length`.
    @param parts The pieces to join, in order.
    @param fits Whether the first `n` pieces, joined, fit.
*/
export function longestFit(
  parts: string[],
  fits: (text: string) => boolean,
): number {
  let lo = 0,
    hi = parts.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (fits(parts.slice(0, mid).join(""))) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
    The part of a truncated line kept before its ellipsis, measured so the
    ended line fits `width`: the whole line when it fits with its ellipsis,
    and otherwise the line with whole words taken off its end until it does,
    or with `truncateWord`, single characters (grapheme clusters, so an emoji
    is never split). Empty when nothing fits.
    @param text The line's text.
    @param line The line's 1-based number.
    @param width The width the line may take.
    @param ellipsis Builds the ended line from its text and number.
    @param measure Measures a string's rendered width.
    @param truncateWord Whether characters, not just whole words, may be cut.
*/
export function ellipsisKeep(
  text: string,
  line: number,
  width: number,
  ellipsis: EllipsisFunction,
  measure: (text: string) => number,
  truncateWord = false,
): string {
  if (measure(ellipsis(text, line)) <= width) return text;
  const fits = (t: string) => measure(ellipsis(t.trimEnd(), line)) <= width;
  const parts = truncateWord ? graphemes(text) : lineUnits(text);
  // The whole line is known not to fit, so search one part short of it.
  const n = longestFit(parts.slice(0, -1), fits);
  return parts.slice(0, n).join("").trimEnd();
}

/**
    Ends a truncated line with its ellipsis, keeping as much of the line as
    fits `width` with it (see `ellipsisKeep`).
    @param text The line's text.
    @param line The line's 1-based number.
    @param width The width the line may take.
    @param ellipsis Builds the ended line from its text and number.
    @param measure Measures a string's rendered width.
    @param truncateWord Whether characters, not just whole words, may be cut.
*/
export function ellipsisLine(
  text: string,
  line: number,
  width: number,
  ellipsis: EllipsisFunction,
  measure: (text: string) => number,
  truncateWord = false,
): string {
  const keep = ellipsisKeep(text, line, width, ellipsis, measure, truncateWord);
  return ellipsis(keep, line);
}

/**
    The text a word is cut from: the word without the soft hyphen, newline, or
    spaces that may follow it.
    @param word The word as split from the sentence.
*/
export function cuttableWord(word: string): string {
  return word.replaceAll(softHyphen, "").replace(/\s+$/, "");
}

/**
    What a line holding `before` becomes when the start of the next word joins
    it: a space joins words that had one between them, a hyphen drawn at a
    soft-hyphen break comes off so the syllables rejoin, and anything else
    (CJK, emoji) joins directly.
    @param before The line's text so far.
    @param prevWord The word that ended the line, as split from the sentence.
*/
export function joinBase(before: string, prevWord: string | undefined): string {
  if (!before) return "";
  if (prevWord && prevWord.endsWith(softHyphen) && before.endsWith("-"))
    return before.slice(0, -1);
  if (prevWord && /\s$/.test(prevWord)) return `${before} `;
  return before;
}
