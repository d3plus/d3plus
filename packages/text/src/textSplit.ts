import {prepareWithSegments} from "@chenglou/pretext";
// @ts-ignore
import {hyphenated} from "hyphenated";

import {softHyphen} from "./softHyphen.js";

const cjkRange = /[\u3000-\u9FFF\uF900-\uFAFF]/;
const emojiRange = /\p{Extended_Pictographic}/u;

function isBreakable(str: string): boolean {
  return cjkRange.test(str) || emojiRange.test(str);
}

const wordSegmenter = new Intl.Segmenter(undefined, {granularity: "word"});

/** Whether a segment is a run of word characters, which pretext can break between letters. */
function isWordRun(str: string): boolean {
  return str.length > 1 && Array.from(wordSegmenter.segment(str)).some(s => s.isWordLike);
}

const minHyphenLength = 8;

/**
 * Splits a word into syllable segments using hyphenation patterns.
 * Each segment except the last gets a trailing soft hyphen.
 * Only applies to words longer than minHyphenLength characters.
 * @param {String} word
 * @returns {String[]}
 */
function hyphenate(word: string): string[] {
  // Strip trailing whitespace, hyphenate the word, then re-attach
  const match = word.match(/^(.+?)(\s*)$/);
  if (!match) return [word];
  const [, text, trailing] = match;

  if (text.length < minHyphenLength) return [word];
  if (/[A-Z]/.test(text.slice(1))) return [word];

  const syllables: string[] = (hyphenated(text) as string).split(softHyphen);
  if (syllables.length <= 1) return [word];

  return syllables.map((syl, i) =>
    i < syllables.length - 1 ? syl + softHyphen : syl + trailing,
  );
}

/**
    Splits a given sentence into an array of words.
    @param sentence The sentence to split into words.
*/
export default function (sentence: string): string[] {
  const prepared = prepareWithSegments(sentence, "10px sans-serif", {
    whiteSpace: "pre-wrap",
  });
  const {segments, kinds} = prepared;

  const words: string[] = [];
  let prevKind: string | null = null;
  let wordHasBreakable = false;

  for (let i = 0; i < segments.length; i++) {
    const wordRun = isWordRun(segments[i]);
    if (
      (kinds[i] === "space" || kinds[i] === "preserved-space") &&
      words.length > 0
    ) {
      words[words.length - 1] += segments[i];
    } else if (
      prevKind === "text" &&
      kinds[i] === "text" &&
      words.length > 0 &&
      !isBreakable(segments[i]) &&
      !isBreakable(segments[i - 1]) &&
      !(wordRun && wordHasBreakable)
    ) {
      words[words.length - 1] += segments[i];
      if (wordRun) wordHasBreakable = true;
    } else {
      words.push(segments[i]);
      wordHasBreakable = wordRun;
    }
    prevKind = kinds[i];
  }

  // Hyphenate long words into syllable segments
  const result: string[] = [];
  for (const word of words) {
    const syllables = hyphenate(word);
    result.push(...syllables);
  }

  return result;
}
