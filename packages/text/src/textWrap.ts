import {textWidth} from "@d3plus/dom";

import defaultSplit from "./textSplit.js";
import stringify from "./stringify.js";
import {trimRight} from "./trim.js";

const softHyphen = "\u00AD";

export interface TextWrapResult {
  /** The array of wrapped line strings. */
  lines: string[];
  /** The original input sentence. */
  sentence: string;
  /** Whether the text was truncated. */
  truncated: boolean;
  /** The pixel widths of each line. */
  widths: number[];
  /** The array of words from splitting. */
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

/**
    @function textWrap
    @desc Based on the defined styles and dimensions, breaks a string into an array of strings for each line of text.
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
  function textWrap(sentence: string): TextWrapResult {
    sentence = stringify(sentence);

    if (lineHeight === void 0) lineHeight = Math.ceil(fontSize * 1.4);

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
      sizes = textWidth(words, style);

    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      const wordWidth = sizes[words.indexOf(word)];

      // newline if breaking character or not enough width
      if (textProg.slice(-1) === "\n" || widthProg + wordWidth > width) {
        if (!i && !overflow) {
          truncated = true;
          break;
        }
        if (lineData.length >= line) {
          let lineText = trimRight(lineData[line - 1]);
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
    }

    // Clean remaining soft hyphens from all lines
    const lines = lineData.map(l => l.replaceAll(softHyphen, ""));

    return {
      lines,
      sentence,
      truncated,
      widths: textWidth(lines, style),
      words,
    };
  }

  /**
      @memberof textWrap
      @desc If *value* is specified, sets the font family accessor to the specified function or string and returns this generator. If *value* is not specified, returns the current font family.
      @param {Function|String} [*value* = "sans-serif"]
  */
  textWrap.fontFamily = function (_?: string): string | typeof textWrap {
    return arguments.length ? ((fontFamily = _!), textWrap) : fontFamily;
  };

  /**
      @memberof textWrap
      @desc If *value* is specified, sets the font size accessor to the specified function or number and returns this generator. If *value* is not specified, returns the current font size.
      @param {Function|Number} [*value* = 10]
  */
  textWrap.fontSize = function (_?: number): number | typeof textWrap {
    return arguments.length ? ((fontSize = _!), textWrap) : fontSize;
  };

  /**
      @memberof textWrap
      @desc If *value* is specified, sets the font weight accessor to the specified function or number and returns this generator. If *value* is not specified, returns the current font weight.
      @param {Function|Number|String} [*value* = 400]
  */
  textWrap.fontWeight = function (
    _?: number | string,
  ): number | string | typeof textWrap {
    return arguments.length ? ((fontWeight = _!), textWrap) : fontWeight;
  };

  /**
      @memberof textWrap
      @desc If *value* is specified, sets height limit to the specified value and returns this generator. If *value* is not specified, returns the current value.
      @param {Number} [*value* = 200]
  */
  textWrap.height = function (_?: number): number | typeof textWrap {
    return arguments.length ? ((height = _!), textWrap) : height;
  };

  /**
      @memberof textWrap
      @desc If *value* is specified, sets the line height accessor to the specified function or number and returns this generator. If *value* is not specified, returns the current line height accessor, which is 1.1 times the [font size](#textWrap.fontSize) by default.
      @param {Function|Number} [*value*]
  */
  textWrap.lineHeight = function (
    _?: number,
  ): number | undefined | typeof textWrap {
    return arguments.length ? ((lineHeight = _!), textWrap) : lineHeight;
  };

  /**
      @memberof textWrap
      @desc If *value* is specified, sets the maximum number of lines allowed when wrapping.
      @param {Function|Number} [*value*]
  */
  textWrap.maxLines = function (
    _?: number | null,
  ): number | null | typeof textWrap {
    return arguments.length ? ((maxLines = _!), textWrap) : maxLines;
  };

  /**
      @memberof textWrap
      @desc If *value* is specified, sets the overflow to the specified boolean and returns this generator. If *value* is not specified, returns the current overflow value.
      @param {Boolean} [*value* = false]
  */
  textWrap.overflow = function (_?: boolean): boolean | typeof textWrap {
    return arguments.length ? ((overflow = _!), textWrap) : overflow;
  };

  /**
      @memberof textWrap
      @desc If *value* is specified, sets the word split function to the specified function and returns this generator. If *value* is not specified, returns the current word split function.
      @param {Function} [*value*] A function that, when passed a string, is expected to return that string split into an array of words to textWrap. The default split function splits strings on the following characters: `-`, `/`, `;`, `:`, `&`
  */
  textWrap.split = function (
    _?: (sentence: string) => string[],
  ): ((sentence: string) => string[]) | typeof textWrap {
    return arguments.length ? ((split = _!), textWrap) : split;
  };

  /**
      @memberof textWrap
      @desc If *value* is specified, sets width limit to the specified value and returns this generator. If *value* is not specified, returns the current value.
      @param {Number} [*value* = 200]
  */
  textWrap.width = function (_?: number): number | typeof textWrap {
    return arguments.length ? ((width = _!), textWrap) : width;
  };

  return textWrap as TextWrapGenerator;
}
