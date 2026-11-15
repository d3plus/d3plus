import {it} from "vitest";
import assert from "assert";
import {isWordRun} from "../src/textSplit.ts";

/**
    `isWordRun` answers ASCII letters and digits without the word segmenter,
    as the segmenter would.
*/

const segmenter = new Intl.Segmenter(undefined, {granularity: "word"});
const segmented = str =>
  str.length > 1 && Array.from(segmenter.segment(str)).some(s => s.isWordLike);

it("isWordRun — matches the word segmenter", () => {
  const chars = "abcxyzABCXYZ0123456789 -_.,'’:/&%$éü中😀 ".match(/./gu);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const samples = ["", "a", "ab", "4488", "x1", "A9z", "a b", "--", "é"];
  for (let n = 0; n < 3000; n++)
    samples.push(
      Array.from(
        {length: 1 + Math.floor(rand() * 8)},
        () => chars[Math.floor(rand() * chars.length)],
      ).join(""),
    );
  for (const str of samples)
    assert.strictEqual(isWordRun(str), segmented(str), JSON.stringify(str));
});
