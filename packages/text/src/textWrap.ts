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
  split: (sentence: string) => string[];
  width: number;
}

/**
    Breaks a single sentence into wrapped lines using the resolved style config.
    @private
*/
function wrapSentence(phrase: unknown, config: WrapConfig): TextWrapResult {
  const {
    fontFamily,
    fontSize,
    fontWeight,
    height,
    lineHeight,
    maxLines,
    overflow,
    split,
    width,
  } = config;

  const sentence = stringify(phrase);
  const words = split(sentence);

  const style: Record<string, string | number> = {
    "font-family": fontFamily,
    "font-size": fontSize,
    "font-weight": fontWeight,
    "line-height": lineHeight,
  };

  let line = 1,
    textProg = "",
    truncated = false,
    widthProg = 0;

  const lineData: string[] = [],
    // The running width each line consumed while wrapping. This is the sum
    // of the per-word widths the break logic actually compared against
    // `width`, which can differ from re-measuring the finished line as a
    // single string (e.g. a soft hyphen counts toward the break decision but
    // is stripped from the rendered line, and trailing spaces measure as 0).
    lineWidths: number[] = [],
    sizes = textWidth(words, style);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordWidth = sizes[words.indexOf(word)];

    // newline if breaking character or not enough width
    if (textProg.slice(-1) === "\n" || widthProg + wordWidth > width) {
      if (!i && !overflow) {
        truncated = true;
        break;
      }
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
        (wordWidth > width && !overflow) ||
        (maxLines && line > maxLines)
      ) {
        truncated = true;
        break;
      }
      widthProg = 0;
      lineData.push(word);
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

  // Clean remaining soft hyphens from all lines
  const lines = lineData.map(l => l.replaceAll(softHyphen, ""));

  // Report each line's width as at least the width the break logic consumed,
  // so that re-wrapping the same text at the reported width is stable (a
  // consumer that sizes a box to `max(widths)` won't trigger another break).
  const lineWidthsVisible = textWidth(lines, style) as number[];

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
