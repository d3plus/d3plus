import {textSplit} from "@d3plus/text";

const softHyphen = "­";

/**
    Wraps a split function so it keeps each word whole: the hyphenated
    syllables it breaks a long word into (each ending in a soft hyphen) are
    joined back together.
    @param split The split function to wrap, `textSplit` by default.
*/
export function wholeWords(
  split: (sentence: string, i?: number) => string[] = textSplit,
): (sentence: string, i?: number) => string[] {
  return (sentence, i) =>
    split(sentence, i).reduce((words: string[], piece: string) => {
      const last = words.length - 1;
      if (last >= 0 && words[last].endsWith(softHyphen)) words[last] = words[last].slice(0, -1) + piece;
      else words.push(piece);
      return words;
    }, []);
}

/** Splits text into words as TextBox does, but keeps each word whole. */
export const wholeWordSplit = wholeWords();

/**
    Whether wrapped text fits its box in whole words. Text wraps by breaking
    a word too long for its line into hyphenated syllables, but it also
    hyphenates a word that would fit a line of its own, just to pack more
    onto the line before it. Only the first kind is a real mid-word break,
    so when a line ends in a hyphen, the text is wrapped again with every
    word kept whole: if that fits, a word was only split to pack the line.
    @param result The text as wrapped by default.
    @param wrapWhole Wraps the same text with words kept whole (see `wholeWords`).
    @returns Whether the text fits without breaking a word mid-word, and the
    wrap to draw: the whole-word wrap when that fits, `result` otherwise.
*/
export function wholeWordFit<T extends {lines: string[]; truncated: boolean}>(
  result: T,
  wrapWhole: () => T,
): {fits: boolean; result: T} {
  if (result.truncated) return {fits: false, result};
  if (!result.lines.slice(0, -1).some(line => line.endsWith("-"))) return {fits: true, result};
  const whole = wrapWhole();
  return whole.truncated ? {fits: false, result} : {fits: true, result: whole};
}
