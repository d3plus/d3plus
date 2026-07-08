import {textWidth} from "@d3plus/dom";

import defaultSplit from "./textSplit.js";
const softHyphen = "\u00AD";

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

export interface TextWrapResult {
  /** The array of wrapped line strings.*/
  lines: string[];
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
  width(): number;
  width(value: number): TextWrapGenerator;
}

interface WrapConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  height: number;
  lineHeight: number;
  maxLines: number | null;
  overflow: boolean;
  shape: "square" | "circle";
  split: (sentence: string) => string[];
  width: number;
}

/** The line data produced by a single word-flow pass. @private */
interface WrapPass {
  lineData: string[];
  /** The running width each line consumed while wrapping (see below). */
  lineWidths: number[];
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
function flowWords(
  words: string[],
  sizes: number[],
  config: WrapConfig,
  lineWidth: (line: number) => number,
): WrapPass {
  const {height, lineHeight, maxLines, overflow} = config;

  let line = 1,
    textProg = "",
    truncated = false,
    widthProg = 0;

  const lineData: string[] = [],
    // The running width each line consumed while wrapping. This is the sum
    // of the per-word widths the break logic actually compared against the
    // line's allowed width, which can differ from re-measuring the finished
    // line as a single string (e.g. a soft hyphen counts toward the break
    // decision but is stripped from the rendered line, and trailing spaces
    // measure as 0).
    lineWidths: number[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // `sizes` is built parallel to `words`, so index directly — `indexOf`
    // would rescan the array for every word (O(n²)), and the circle path runs
    // this loop once per candidate line count.
    const wordWidth = sizes[i];
    const width = lineWidth(line);

    // newline if breaking character or not enough width
    if (textProg.slice(-1) === "\n" || widthProg + wordWidth > width) {
      if (!i && !overflow) {
        truncated = true;
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
          if (lineText.endsWith(softHyphen))
            lineText = lineText.slice(0, -1) + "-";
          lineData[line - 1] = lineText;
        }
        line++;
        if (
          lineHeight * line > height ||
          (wordWidth > lineWidth(line) && !overflow) ||
          (maxLines && line > maxLines)
        ) {
          truncated = true;
          break;
        }
        widthProg = 0;
        lineData.push(word);
      }
    } else if (!i) lineData[0] = word;
    else {
      // Strip soft hyphen when syllables stay on the same line
      if (lineData[line - 1].endsWith(softHyphen)) {
        lineData[line - 1] = lineData[line - 1].slice(0, -1);
      }
      lineData[line - 1] += word;
    }

    textProg += word;
    widthProg += wordWidth;
    lineWidths[line - 1] = widthProg;
  }

  return {lineData, lineWidths, truncated};
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
    if (overflow || over <= 0) return {...pass, visibleWidths};
    if (over < bestOverflow) {
      bestOverflow = over;
      best = {...pass, visibleWidths};
    }
  }
  if (best) return {...best, truncated: true};
  // No line count produced even an untruncated layout. Fall back to a plain
  // full-width flow, and flag truncation so a resizing TextBox drops the font
  // size and re-wraps into something that fits — returning a non-truncated
  // result would claim the text fit and leave it overflowing the circle. Empty
  // input (no words) is genuinely not truncated, so leave that flag alone.
  const fallback = flowWords(words, sizes, config, () => 2 * radius);
  return words.length ? {...fallback, truncated: true} : fallback;
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

  const sizes = textWidth(words, style) as number[];

  const {lineData, lineWidths, truncated, visibleWidths} =
    shape === "circle"
      ? flowCircle(words, sizes, config, style)
      : flowWords(words, sizes, config, () => width);

  // Clean remaining soft hyphens from all lines
  const lines = lineData.map(l => l.replaceAll(softHyphen, ""));

  // Report each line's width as at least the width the break logic consumed,
  // so that re-wrapping the same text at the reported width is stable (a
  // consumer that sizes a box to `max(widths)` won't trigger another break).
  // The circle path already measured the finished lines while checking chord
  // fit, so reuse that instead of measuring the same strings again.
  const lineWidthsVisible = visibleWidths ?? (textWidth(lines, style) as number[]);

  return {
    lines,
    sentence,
    truncated,
    widths: lineWidthsVisible.map((w, i) => Math.max(w, lineWidths[i] || 0)),
    words,
  };
}

/**
    Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.
*/
export default function (): TextWrapGenerator {
  let fontFamily = "sans-serif",
    fontSize = 10,
    fontWeight: number | string = 400,
    height = 200,
    lineHeight: number | undefined,
    maxLines: number | null = null,
    overflow = false,
    shape: "square" | "circle" = "square",
    split: (sentence: string) => string[] = defaultSplit,
    width = 200;

  /**
      The inner return object and wraps the text and returns the line data array.
      @private
*/
  function textWrap(phrase: unknown): TextWrapResult {
    if (lineHeight === void 0) lineHeight = Math.ceil(fontSize * 1.4);
    return wrapSentence(phrase, {
      fontFamily,
      fontSize,
      fontWeight,
      height,
      lineHeight,
      maxLines,
      overflow,
      shape,
      split,
      width,
    });
  }

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
      Maximum width in pixels for the wrapped text.
*/
  textWrap.width = function (_?: number): number | typeof textWrap {
    return arguments.length ? ((width = _!), textWrap) : width;
  };

  return textWrap as TextWrapGenerator;
}
