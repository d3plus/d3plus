import {prepareWithSegments} from "@chenglou/pretext";
import {hyphenated} from "hyphenated";

const cjkRange = /[\u3000-\u9FFF\uF900-\uFAFF]/;
const emojiRange = /\p{Extended_Pictographic}/u;
const softHyphen = "\u00AD";

function isBreakable(str) {
  return cjkRange.test(str) || emojiRange.test(str);
}

const minHyphenLength = 8;

/**
 * Splits a word into syllable segments using hyphenation patterns.
 * Each segment except the last gets a trailing soft hyphen.
 * Only applies to words longer than minHyphenLength characters.
 * @param {String} word
 * @returns {String[]}
 */
function hyphenate(word) {
  // Strip trailing whitespace, hyphenate the word, then re-attach
  const match = word.match(/^(.+?)(\s*)$/);
  if (!match) return [word];
  const [, text, trailing] = match;

  if (text.length < minHyphenLength) return [word];
  if (/[A-Z]/.test(text.slice(1))) return [word];

  const syllables = hyphenated(text).split(softHyphen);
  if (syllables.length <= 1) return [word];

  return syllables.map((syl, i) =>
    i < syllables.length - 1 ? syl + softHyphen : syl + trailing
  );
}

/**
    @function textSplit
    @desc Splits a given sentence into an array of words.
    @param {String} sentence
*/
export default function (sentence) {
  const prepared = prepareWithSegments(sentence, "10px sans-serif", {
    whiteSpace: "pre-wrap",
  });
  const {segments, kinds, breakableWidths} = prepared;

  const words = [];
  let prevKind = null;
  let wordHasBreakable = false;

  for (let i = 0; i < segments.length; i++) {
    if ((kinds[i] === "space" || kinds[i] === "preserved-space") && words.length > 0) {
      words[words.length - 1] += segments[i];
    } else if (
      prevKind === "text" &&
      kinds[i] === "text" &&
      words.length > 0 &&
      !isBreakable(segments[i]) &&
      !isBreakable(segments[i - 1]) &&
      !(breakableWidths[i] !== null && wordHasBreakable)
    ) {
      words[words.length - 1] += segments[i];
      if (breakableWidths[i] !== null) wordHasBreakable = true;
    } else {
      words.push(segments[i]);
      wordHasBreakable = breakableWidths[i] !== null;
    }
    prevKind = kinds[i];
  }

  // Hyphenate long words into syllable segments
  const result = [];
  for (const word of words) {
    const syllables = hyphenate(word);
    result.push(...syllables);
  }

  return result;
}
