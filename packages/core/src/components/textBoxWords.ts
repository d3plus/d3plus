/**
    The words of each wrapped line that justified text spreads apart, with
    any styled runs (bold/italic from HTML markup) split at word boundaries
    so each word can be placed on its own.
*/
import {textWidth} from "@d3plus/dom";
import type {TextWrapWord} from "@d3plus/text";

/** A parsed inline run (segment of a wrapped line with optional bold/italic). */
export interface LineRun {
  text: string;
  style?: {weight?: number | string; style?: "normal" | "italic"};
}

/** A word of a justified line: its text, its width, and its styled runs when the line has them. */
export interface JustifyWord {
  text: string;
  width: number;
  runs?: LineRun[];
}

/** A word's visible text: its markup removed. */
function visible(text: string): string {
  return text.replace(/<[^>]+>/g, "");
}

/**
    Splits a line's runs where its words begin, so each word gets the runs
    (or run pieces) that draw it. Returns null when the runs and words don't
    spell the same text.
    @param runs The line's styled runs.
    @param words The line's words as wrapped (markup included).
*/
export function splitRunsAtWords(
  runs: LineRun[],
  words: string[],
): LineRun[][] | null {
  const texts = words.map(visible);
  if (runs.map(r => r.text).join("") !== texts.join("")) return null;
  const out: LineRun[][] = texts.map(() => []);
  let w = 0,
    used = 0;
  for (const run of runs) {
    let rest = run.text;
    while (rest) {
      while (w < texts.length - 1 && used >= texts[w].length) {
        w++;
        used = 0;
      }
      const take = Math.min(rest.length, texts[w].length - used) || rest.length;
      out[w].push({...run, text: rest.slice(0, take)});
      rest = rest.slice(take);
      used += take;
    }
  }
  return out;
}

/**
    The words of each line for justified text. Plain lines use the wrap's
    words and widths; a line with styled runs measures each word's pieces in
    their own weight and style. A line whose runs can't be matched to its
    words gets null, and is not justified.
    @param lineWords Each line's words, as the wrap measured them.
    @param lineRuns Each line's styled runs, or null for plain text.
    @param style The font the text was measured with.
*/
export function justifyWords(
  lineWords: TextWrapWord[][],
  lineRuns: LineRun[][] | null,
  style: Record<string, string | number>,
): (JustifyWord[] | null)[] {
  return lineWords.map((words, l) => {
    const runs = lineRuns?.[l];
    if (!runs) return words;
    const pieces = splitRunsAtWords(
      runs,
      words.map(w => w.text),
    );
    if (!pieces) return null;
    return words.map((word, k) => {
      const parts = pieces[k];
      const width = parts.reduce((sum, part, j) => {
        const text = j === parts.length - 1 ? part.text.trimEnd() : part.text;
        const measured = textWidth(text, {
          ...style,
          "font-weight": part.style?.weight ?? style["font-weight"],
          "font-style": part.style?.style ?? "normal",
        }) as number;
        return sum + measured;
      }, 0);
      return {text: word.text, width, runs: parts};
    });
  });
}
