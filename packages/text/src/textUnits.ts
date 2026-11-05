const cjkRange = /[\u3000-\u9FFF\uF900-\uFAFF]/;
const emojiRange = /\p{Extended_Pictographic}/u;

/**
    Whether a string holds a character that lines may break around without a
    space: CJK ideographs and kana, or an emoji.
    @param str The string to test.
*/
export function isBreakable(str: string): boolean {
  return cjkRange.test(str) || emojiRange.test(str);
}

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

/**
    Splits a string into user-perceived characters (grapheme clusters), so an
    emoji sequence or a letter with combining marks stays in one piece.
    @param str The string to split.
*/
export function graphemes(str: string): string[] {
  return Array.from(graphemeSegmenter.segment(str), s => s.segment);
}

/**
    Splits a line of text into the units justified text spreads apart: each
    run of non-space characters with the spaces after it, and each CJK
    character or emoji on its own (those scripts justify between characters).
    Leading spaces join the first unit.
    @param line The line to split.
*/
export function lineUnits(line: string): string[] {
  const units: string[] = [];
  let current = "";
  let prev = "";
  for (const g of graphemes(line)) {
    const space = /^\s+$/.test(g);
    const startsUnit =
      /\S/.test(current) &&
      !space &&
      (/\s$/.test(prev) || isBreakable(g) || isBreakable(prev));
    if (startsUnit) {
      units.push(current);
      current = "";
    }
    current += g;
    prev = g;
  }
  if (current) units.push(current);
  return units;
}
