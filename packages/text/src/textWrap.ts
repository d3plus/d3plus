import {textWidth} from "@d3plus/dom";

import {softHyphen} from "./softHyphen.js";
import defaultSplit from "./textSplit.js";
import {
  cuttableWord,
  ellipsisKeep,
  joinBase,
  longestFit,
} from "./textTruncate.js";
import type {EllipsisFunction} from "./textTruncate.js";
import {graphemes, lineUnits} from "./textUnits.js";

/**
    Coerces value into a String.
    @param value The value to convert to a string.
    @private
*/
function stringify(value: unknown): string {
  if (value === void 0) return "undefined";
  if (typeof value === "string" || value instanceof String)
    return value as string;
  return JSON.stringify(value);
}

/** One unit of a wrapped line that justified text spreads apart. */
export interface TextWrapWord {
  /** The unit's text, with any spaces that follow it. */
  text: string;
  /** The unit's rendered width in pixels, not counting the spaces after it. */
  width: number;
}

export interface TextWrapResult {
  /**
      Whether each line ended at a newline in the text, rather than where the
      width ran out.
  */
  hardBreaks: boolean[];
  /** The array of wrapped line strings.*/
  lines: string[];
  /**
      Each line split into the units justified text spreads apart (a word with
      the spaces after it, or a single CJK character or emoji), with their
      widths. Measured when first read, and left out of the result's keys
      (so printing a result doesn't list it).
  */
  lineWords: TextWrapWord[][];
  /** The index (in `words`) of the first word that did not fit, or `words.length` when all of them did. */
  nextWord: number;
  /** The original input sentence.*/
  sentence: string;
  /** Whether the text was truncated.*/
  truncated: boolean;
  /** The pixel widths of each line.*/
  widths: number[];
  /** The array of words from splitting.*/
  words: string[];
}

export interface TextWrapGenerator {
  (sentence: string): TextWrapResult;
  ellipsis(): EllipsisFunction | null;
  ellipsis(value: EllipsisFunction | string | null): TextWrapGenerator;
  fontFamily(): string;
  fontFamily(value: string): TextWrapGenerator;
  fontSize(): number;
  fontSize(value: number): TextWrapGenerator;
  fontWeight(): number | string;
  fontWeight(value: number | string): TextWrapGenerator;
  height(): number;
  height(value: number): TextWrapGenerator;
  lineHeight(): number | undefined;
  lineHeight(value: number): TextWrapGenerator;
  maxLines(): number | null;
  maxLines(value: number | null): TextWrapGenerator;
  overflow(): boolean;
  overflow(value: boolean): TextWrapGenerator;
  shape(): "square" | "circle";
  shape(value: "square" | "circle"): TextWrapGenerator;
  split(): (sentence: string) => string[];
  split(value: (sentence: string) => string[]): TextWrapGenerator;
  truncateWord(): boolean;
  truncateWord(value: boolean): TextWrapGenerator;
  width(): number;
  width(value: number): TextWrapGenerator;
}

interface WrapConfig {
  ellipsis: EllipsisFunction | null;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  height: number;
  lineHeight: number;
  maxLines: number | null;
  overflow: boolean;
  shape: "square" | "circle";
  split: (sentence: string) => string[];
  truncateWord: boolean;
  width: number;
}

/** The line data produced by a single word-flow pass. @private */
interface WrapPass {
  /** Whether each line ended at a newline in the text. */
  hardBreaks: boolean[];
  /** Whether each line ended where a word broke between syllables (drawing a hyphen). */
  hyphenBreaks: boolean[];
  lineData: string[];
  /** The width allowed for each 1-based line. */
  lineWidth: (line: number) => number;
  /** The running width each line consumed while wrapping (see below). */
  lineWidths: number[];
  /** The index of the first word that did not fit (`words.length` when all did). */
  nextWord: number;
  /**
      Whether the word that did not fit would have started a line of its own
      (it is wider than a whole line), rather than continued the last one.
  */
  ownLine: boolean;
  truncated: boolean;
  /**
      The rendered width of each finished line, measured once by the circle
      path while validating chord fit. When present, `wrapSentence` reuses it
      instead of re-measuring the same lines.
  */
  visibleWidths?: number[];
}

/**
    Runs the word-flow loop once. `lineWidth(line)` receives the 1-based line
    number and returns the width allowed for that line, so callers can vary the
    available width per line — a constant for a rectangle, or the circle's chord
    at that line's height for a circle.
    @private
*/
/** Widths of the characters the flow loop adds or removes between words. */
interface GapMetrics {
  /** The advance of one ordinary space in the wrap's font. */
  space: number;
  /** The advance of the hyphen a soft hyphen renders as at a line break. */
  hyphen: number;
}

function flowWords(
  words: string[],
  sizes: number[],
  gaps: GapMetrics,
  config: WrapConfig,
  lineWidth: (line: number) => number,
): WrapPass {
  const {height, lineHeight, maxLines, overflow} = config;

  let line = 1,
    nextWord = words.length,
    ownLine = false,
    textProg = "",
    truncated = false,
    widthProg = 0;

  const hardBreaks: boolean[] = [],
    hyphenBreaks: boolean[] = [],
    lineData: string[] = [],
    // The running width each line consumed while wrapping: the per-word
    // widths the break logic compared against the line's allowed width, plus
    // the gaps between them, which tracks the rendered line.
    lineWidths: number[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // `sizes` is built parallel to `words`, so index directly — `indexOf`
    // would rescan the array for every word (O(n²)), and the circle path runs
    // this loop once per candidate line count.
    const wordWidth = sizes[i];
    const width = lineWidth(line);
    // A line ending in a soft hyphen gives that hyphen's width back if the
    // next syllable joins it, so the fit check is made without it.
    const joinHyphen =
      i && lineData[line - 1] && lineData[line - 1].endsWith(softHyphen)
        ? gaps.hyphen
        : 0;

    // newline if breaking character or not enough width
    const hardBreak = textProg.slice(-1) === "\n";
    if (hardBreak || widthProg - joinHyphen + wordWidth > width) {
      if (!i && !overflow) {
        truncated = true;
        nextWord = 0;
        ownLine = true;
        break;
      }
      if (!i) {
        // The very first word is wider than its line and overflow is allowed:
        // keep it on the first line instead of breaking. There is no prior line
        // to leave, and advancing `line` past the empty `lineData` here would
        // desync the two so later lines read `lineData[line - 1]` as undefined.
        lineData[0] = word;
      } else {
        if (lineData.length >= line) {
          let lineText = lineData[line - 1].trimEnd();
          // Convert trailing soft hyphen to visible hyphen at line breaks
          if (lineText.endsWith(softHyphen)) {
            lineText = lineText.slice(0, -1) + "-";
            hyphenBreaks[line - 1] = true;
          }
          lineData[line - 1] = lineText;
          hardBreaks[line - 1] = hardBreak;
        }
        line++;
        const noRoom =
          lineHeight * line > height || (maxLines && line > maxLines);
        if (noRoom || (wordWidth > lineWidth(line) && !overflow)) {
          truncated = true;
          nextWord = i;
          ownLine = !noRoom;
          break;
        }
        widthProg = 0;
        lineData.push(word);
      }
    } else if (!i) lineData[0] = word;
    else {
      // Strip the soft hyphen when syllables stay on the same line; its glyph
      // was counted with the previous syllable and no longer renders.
      if (joinHyphen) {
        lineData[line - 1] = lineData[line - 1].slice(0, -1);
        widthProg -= joinHyphen;
      }
      lineData[line - 1] += word;
    }

    textProg += word;
    widthProg += wordWidth;
    lineWidths[line - 1] = widthProg;
    // A word's measured width stops at its last glyph, so the space it
    // carries only takes up room once another word follows it on the line.
    // Rendered text collapses a run of spaces to one, so a run counts once.
    if (endsWithSpace(word)) widthProg += gaps.space;
  }

  for (let l = 0; l < lineData.length; l++) hardBreaks[l] = !!hardBreaks[l];
  return {
    hardBreaks,
    hyphenBreaks,
    lineData,
    lineWidth,
    lineWidths,
    nextWord,
    ownLine,
    truncated,
  };
}

/** Whether a word carries one or more ordinary spaces after it. */
function endsWithSpace(word: string): boolean {
  return / $/.test(word);
}

/**
    Builds a per-line width function for `total` vertically-centered lines
    inside a circle of the given radius. Each line is measured at whichever of
    its glyph-box edges sits farther from the center (glyphs span roughly the
    font size, centered in the line box), so the returned chord keeps the whole
    line within the circle. Lines through the middle get the full diameter;
    lines near the top and bottom get progressively less.

    The block is assumed to be vertically centered on the circle — which is how
    TextBox positions circle labels (verticalAlign "middle"). Pairing
    `shape: "circle"` with a top/bottom alignment would measure lines against
    chords for a position they aren't rendered at.
    @private
*/
function circleLineWidth(
  radius: number,
  total: number,
  lineHeight: number,
  fontSize: number,
): (line: number) => number {
  const blockHeight = total * lineHeight;
  return (line: number) => {
    // Center of this line's box, measured from the circle's center.
    const center = -blockHeight / 2 + (line - 0.5) * lineHeight;
    const edge = Math.abs(center) + fontSize / 2;
    if (edge >= radius) return 0;
    return 2 * Math.sqrt(radius * radius - edge * edge);
  };
}

/**
    Measures each finished line as it will actually render (soft hyphens
    stripped). The per-word widths the flow loop compares against exclude
    trailing spaces, so a line can measure wider than the running total the
    break decisions used once inter-word spaces are counted.
    @private
*/
function measureLines(
  lineData: string[],
  style: Record<string, string | number>,
): number[] {
  return textWidth(
    lineData.map(l => l.replaceAll(softHyphen, "")),
    style,
  ) as number[];
}

/**
    Wraps text to fit inside a circle by giving each line its own width — the
    chord of the circle at that line's vertical position. The block is kept
    vertically centered, so the number of lines feeds back into every line's
    width; this searches upward from a single line for the fewest lines whose
    real rendered widths all fit inside the circle. If no line count fits (the
    text is simply too big), it returns the attempt that spills the least and
    reports truncation, so a resizing caller shrinks the font and tries again.
    @private
*/
function flowCircle(
  words: string[],
  sizes: number[],
  gaps: GapMetrics,
  config: WrapConfig,
  style: Record<string, string | number>,
): WrapPass {
  const {fontSize, height, lineHeight, maxLines, overflow, width} = config;
  const radius = Math.min(width, height) / 2;

  // The most lines that can stack vertically within the circle. Bounded by the
  // token count too — a line holds at least one word, so more passes than there
  // are words can never fit more text — which also keeps the search finite when
  // lineHeight is 0 (`verticalMax` would otherwise be Infinity and never end).
  const verticalMax = Math.max(1, Math.floor((2 * radius) / lineHeight));
  let cap = maxLines ? Math.min(verticalMax, maxLines) : verticalMax;
  cap = Math.min(cap, words.length);

  let best: WrapPass | null = null;
  let bestOverflow = Infinity;
  for (let n = 1; n <= cap; n++) {
    const pass = flowWords(
      words,
      sizes,
      gaps,
      {...config, maxLines: n},
      circleLineWidth(radius, n, lineHeight, fontSize),
    );
    if (pass.truncated) continue;

    // Validate the real rendered widths against the chords for the ACTUAL line
    // count: flowWords can settle on fewer lines than the search `n`, and the
    // block is re-centered to that count at render time, so the chords that
    // matter belong to `pass.lineData.length`, not `n`.
    const visibleWidths = measureLines(pass.lineData, style);
    const chord = circleLineWidth(
      radius,
      pass.lineData.length,
      lineHeight,
      fontSize,
    );
    const over = Math.max(0, ...visibleWidths.map((w, i) => w - chord(i + 1)));
    // `overflow` opts out of containment — let the text spill, as the flag asks.
    if (overflow || over <= 0)
      return {...pass, lineWidth: chord, visibleWidths};
    if (over < bestOverflow) {
      bestOverflow = over;
      best = {...pass, lineWidth: chord, visibleWidths};
    }
  }
  if (best) return {...best, truncated: true};
  // No line count produced even an untruncated layout. Fall back to a plain
  // full-width flow, and flag truncation so a resizing TextBox drops the font
  // size and re-wraps into something that fits — returning a non-truncated
  // result would claim the text fit and leave it overflowing the circle. Empty
  // input (no words) is genuinely not truncated, so leave that flag alone.
  const fallback = flowWords(words, sizes, gaps, config, () => 2 * radius);
  return words.length ? {...fallback, truncated: true} : fallback;
}

/**
    With `truncateWord`, fills the room the text ran out of with the start of
    the word that did not fit: as much of it as fits with the ellipsis, on the
    last line, or on a line of its own when the word is wider than a whole
    line. Returns whether a line changed.
    @private
*/
function cutNextWord(
  pass: WrapPass,
  words: string[],
  config: WrapConfig,
  measure: (text: string) => number,
): boolean {
  const {ellipsis, truncateWord} = config;
  const {lineData, nextWord, ownLine} = pass;
  if (!pass.truncated || !truncateWord || nextWord >= words.length)
    return false;
  const prevWord = words[nextWord - 1];
  // A word after a newline starts a paragraph the box has no room for.
  if (!ownLine && (!lineData.length || prevWord?.endsWith("\n"))) return false;
  const line = ownLine ? lineData.length + 1 : lineData.length;
  const base = ownLine ? "" : joinBase(lineData[line - 1], prevWord);
  const width = pass.lineWidth(line);
  const end = (t: string) => (ellipsis ? ellipsis(t, line) : t);
  const chars = graphemes(cuttableWord(words[nextWord]));
  const n = longestFit(chars, t => measure(end(base + t)) <= width);
  if (!n) return false;
  lineData[line - 1] = end(base + chars.slice(0, n).join(""));
  pass.hardBreaks[line - 1] = false;
  return true;
}

/**
    Ends a truncated wrap's last line with the ellipsis, measured to fit the
    line's width (unless the wrap may overflow). A line left with nothing but
    its ellipsis gives way to the line before it, which takes the ellipsis
    instead. Returns whether a line changed.
    @private
*/
function endLine(
  pass: WrapPass,
  config: WrapConfig,
  measure: (text: string) => number,
): boolean {
  const {ellipsis, overflow, truncateWord} = config;
  const {hardBreaks, hyphenBreaks, lineData} = pass;
  if (!pass.truncated || !ellipsis || !lineData.length) return false;
  for (let line = lineData.length; line; line--) {
    const last = lineData[line - 1];
    // The hyphen drawn where a word broke between syllables gives way to
    // the ellipsis.
    const text = hyphenBreaks[line - 1] ? last.slice(0, -1) : last;
    const keep = overflow
      ? text
      : ellipsisKeep(
          text,
          line,
          pass.lineWidth(line),
          ellipsis,
          measure,
          truncateWord,
        );
    if (keep || line === 1) {
      lineData[line - 1] = ellipsis(keep, line);
      return true;
    }
    lineData.pop();
    hardBreaks.pop();
  }
  return true;
}

/**
    Splits each line into the units justified text spreads apart, and
    measures them (without the spaces after them) in one pass.
    @private
*/
function measureUnits(
  lines: string[],
  style: Record<string, string | number>,
): TextWrapWord[][] {
  const perLine = lines.map(lineUnits);
  const flat = perLine.flat();
  const sizes = flat.length
    ? (textWidth(
        flat.map(u => u.trimEnd()),
        style,
      ) as number[])
    : [];
  let k = 0;
  return perLine.map(units =>
    units.map(text => ({text, width: sizes[k++] ?? 0})),
  );
}

/**
    Breaks a single sentence into wrapped lines using the resolved style config.
    @private
*/
function wrapSentence(phrase: unknown, config: WrapConfig): TextWrapResult {
  const {fontFamily, fontSize, fontWeight, shape, split, width} = config;

  const sentence = stringify(phrase);
  const words = split(sentence);

  const style: Record<string, string | number> = {
    "font-family": fontFamily,
    "font-size": fontSize,
    "font-weight": fontWeight,
    "line-height": config.lineHeight,
  };

  // A syllable ending in a soft hyphen is measured with the hyphen it renders
  // at a break (a soft hyphen itself measures zero), which the loop removes
  // again when syllables stay together.
  const sizes = textWidth(
    words.map(w => (w.endsWith(softHyphen) ? `${w.slice(0, -1)}-` : w)),
    style,
  ) as number[];
  // Measurement stops at a word's last glyph, so the spaces between words
  // are counted separately. A non-breaking space keeps the font's space
  // advance where a trailing ordinary space collapses to nothing.
  const gaps: GapMetrics = {
    space: textWidth("\u00a0", style) as number,
    hyphen: textWidth("-", style) as number,
  };

  const pass =
    shape === "circle"
      ? flowCircle(words, sizes, gaps, config, style)
      : flowWords(words, sizes, gaps, config, () => width);
  const {hardBreaks, lineData, lineWidths, nextWord, truncated} = pass;

  const measure = (text: string) =>
    textWidth(text.replaceAll(softHyphen, ""), style) as number;
  // A cut word or an ellipsis changes the last line, so its width from the
  // flow no longer applies.
  const ended =
    cutNextWord(pass, words, config, measure) || endLine(pass, config, measure);
  if (ended) lineWidths[lineData.length - 1] = 0;
  const visibleWidths = ended ? undefined : pass.visibleWidths;

  // Clean remaining soft hyphens from all lines
  const lines = lineData.map(l => l.replaceAll(softHyphen, ""));

  // Report each line's width as at least the width the break logic consumed,
  // so that re-wrapping the same text at the reported width is stable (a
  // consumer that sizes a box to `max(widths)` won't trigger another break).
  // The circle path already measured the finished lines while checking chord
  // fit, so reuse that instead of measuring the same strings again.
  const lineWidthsVisible =
    visibleWidths ?? (textWidth(lines, style) as number[]);

  const result = {
    hardBreaks,
    lines,
    nextWord,
    sentence,
    truncated,
    widths: lineWidthsVisible.map((w, i) => Math.max(w, lineWidths[i] || 0)),
    words,
  } as TextWrapResult;
  // Measured only when read, and left out of the result's enumerable keys so
  // printing or comparing a result doesn't measure every word.
  let units: TextWrapWord[][] | undefined;
  Object.defineProperty(result, "lineWords", {
    get: () => (units ??= measureUnits(lines, style)),
  });
  return result;
}

/**
    Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.
*/
export default function (): TextWrapGenerator {
  let ellipsis: EllipsisFunction | null = null,
    fontFamily = "sans-serif",
    fontSize = 10,
    fontWeight: number | string = 400,
    height = 200,
    lineHeight: number | undefined,
    maxLines: number | null = null,
    overflow = false,
    shape: "square" | "circle" = "square",
    split: (sentence: string) => string[] = defaultSplit,
    truncateWord = false,
    width = 200;

  /**
      The inner return object and wraps the text and returns the line data array.
      @private
*/
  function textWrap(phrase: unknown): TextWrapResult {
    if (lineHeight === void 0) lineHeight = Math.ceil(fontSize * 1.4);
    return wrapSentence(phrase, {
      ellipsis,
      fontFamily,
      fontSize,
      fontWeight,
      height,
      lineHeight,
      maxLines,
      overflow,
      shape,
      split,
      truncateWord,
      width,
    });
  }

  /**
      Ends a truncated wrap's last line: a function given the line's text and
      1-based number that returns the ended line, or a string to append. The
      ended line is measured, and words come off its end until it fits the
      width. `null` (the default) leaves truncated lines as they wrapped.
*/
  textWrap.ellipsis = function (
    _?: EllipsisFunction | string | null,
  ): EllipsisFunction | null | typeof textWrap {
    if (!arguments.length) return ellipsis;
    ellipsis = typeof _ === "string" ? (text: string) => `${text}${_}` : _!;
    return textWrap;
  };

  /**
      The font family used for text measurement.
*/
  textWrap.fontFamily = function (_?: string): string | typeof textWrap {
    return arguments.length ? ((fontFamily = _!), textWrap) : fontFamily;
  };

  /**
      The font size in pixels used for text measurement.
*/
  textWrap.fontSize = function (_?: number): number | typeof textWrap {
    return arguments.length ? ((fontSize = _!), textWrap) : fontSize;
  };

  /**
      The font weight used for text measurement.
*/
  textWrap.fontWeight = function (
    _?: number | string,
  ): number | string | typeof textWrap {
    return arguments.length ? ((fontWeight = _!), textWrap) : fontWeight;
  };

  /**
      Maximum height in pixels for the wrapped text.
*/
  textWrap.height = function (_?: number): number | typeof textWrap {
    return arguments.length ? ((height = _!), textWrap) : height;
  };

  /**
      The line height in pixels. Defaults to 1.1 times the [font size](#textWrap.fontSize).
*/
  textWrap.lineHeight = function (
    _?: number,
  ): number | undefined | typeof textWrap {
    return arguments.length ? ((lineHeight = _!), textWrap) : lineHeight;
  };

  /**
      Maximum number of lines allowed when wrapping.
*/
  textWrap.maxLines = function (
    _?: number | null,
  ): number | null | typeof textWrap {
    return arguments.length ? ((maxLines = _!), textWrap) : maxLines;
  };

  /**
      Whether text is allowed to overflow its bounding box.
*/
  textWrap.overflow = function (_?: boolean): boolean | typeof textWrap {
    return arguments.length ? ((overflow = _!), textWrap) : overflow;
  };

  /**
      The bounding shape used when wrapping. `"square"` (default) fills the full
      [width](#textWrap.width) on every line; `"circle"` treats
      [width](#textWrap.width)/[height](#textWrap.height) as the diameter and
      shortens lines near the top and bottom so the text stays inside the circle.
*/
  textWrap.shape = function (
    _?: "square" | "circle",
  ): "square" | "circle" | typeof textWrap {
    return arguments.length ? ((shape = _!), textWrap) : shape;
  };

  /**
      The function used to split text into words.
*/
  textWrap.split = function (
    _?: (sentence: string) => string[],
  ): ((sentence: string) => string[]) | typeof textWrap {
    return arguments.length ? ((split = _!), textWrap) : split;
  };

  /**
      Whether a truncated wrap may cut a word: the word that did not fit (or a
      first word wider than the whole line) is cut to the longest start that
      fits with the [ellipsis](#textWrap.ellipsis), by whole characters, so an
      emoji or accented letter is never split. Defaults to `false`, which only
      breaks between words.
*/
  textWrap.truncateWord = function (_?: boolean): boolean | typeof textWrap {
    return arguments.length ? ((truncateWord = _!), textWrap) : truncateWord;
  };

  /**
      Maximum width in pixels for the wrapped text.
*/
  textWrap.width = function (_?: number): number | typeof textWrap {
    return arguments.length ? ((width = _!), textWrap) : width;
  };

  return textWrap as TextWrapGenerator;
}
