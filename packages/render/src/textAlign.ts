/**
    Horizontal text placement shared by text layout (TextBox, chart titles)
    and the code that reads laid-out lines back (hit testing, label boxes,
    font-size transitions). Lines are drawn at an x read with the node's
    `FontSpec.anchor` and `dir`; these helpers compute that x from a
    configured alignment and turn it back into the line's left edge.
*/
import type {FontSpec} from "./scene.js";

/** The anchor a text node's lines are drawn with. */
export type LineAnchor = "start" | "middle" | "end";

/**
    A configured horizontal text alignment: `"start"`, `"middle"`, `"end"`,
    `"justify"`, or a percentage string such as `"25%"`.
*/
export type TextAlign = LineAnchor | "justify" | `${number}%`;

/**
    The physical side a line extends from its x: `start` is the left in
    left-to-right text and the right in right-to-left text, and `end` the
    opposite.
    @param anchor The node's anchor (`start` when unset).
    @param dir The node's writing direction (`ltr` when unset).
*/
export function anchorSide(
  anchor?: string,
  dir?: string,
): "left" | "center" | "right" {
  if (anchor === "middle") return "center";
  const rtl = dir === "rtl";
  return (anchor === "end") !== rtl ? "right" : "left";
}

/**
    The left edge of a laid-out line, from its x and width and the node's
    anchor and direction.
    @param line The line's anchor x and width.
    @param font The node's font (its `anchor` and `dir` are read).
*/
export function lineLeft(
  line: {x: number; width: number},
  font?: Pick<FontSpec, "anchor" | "dir">,
): number {
  const w = line.width || 0;
  const side = anchorSide(font?.anchor, font?.dir);
  return side === "center"
    ? line.x - w / 2
    : side === "right"
      ? line.x - w
      : line.x;
}

/**
    The share of the box a percentage alignment places a line at (`"25%"` is
    0.25), clamped to 0–1, or null when the alignment is not a percentage.
    @param align The configured alignment.
*/
export function alignShare(align: unknown): number | null {
  if (typeof align !== "string") return null;
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*%\s*$/.exec(align);
  if (!m) return null;
  return Math.max(0, Math.min(1, Number(m[1]) / 100));
}

const rtlChar = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const strongChar = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]|\p{L}/u;

/**
    The direction of a string's first strongly-directional letter, or null
    when it has none (digits, punctuation).
    @param text The string to read.
*/
export function strongDirection(text: string): "ltr" | "rtl" | null {
  const m = strongChar.exec(text);
  if (!m) return null;
  return rtlChar.test(m[0]) ? "rtl" : "ltr";
}

/**
    The left-to-right order the words of a line appear in. Words run in the
    line's direction, except that a run of words in the other direction keeps
    its own order (as "New York" reads left to right in Arabic text). A word
    with no letters takes the direction of the words around it when both
    agree, and the line's direction otherwise.
    @param words The line's words, in reading order.
    @param rtl Whether the line reads right to left.
*/
export function visualOrder(words: string[], rtl: boolean): number[] {
  const base = rtl ? "rtl" : "ltr";
  const strong = words.map(strongDirection);
  const dirs = strong.map((d, i) => {
    if (d) return d;
    const before = strong.slice(0, i).reverse().find(Boolean) ?? base;
    const after = strong.slice(i + 1).find(Boolean) ?? base;
    return before === after ? before : base;
  });
  const groups: number[][] = [];
  dirs.forEach((d, i) => {
    const last = groups[groups.length - 1];
    if (d !== base && last && dirs[last[0]] !== base) last.push(i);
    else groups.push([i]);
  });
  if (rtl) groups.reverse();
  return groups.flatMap(g => (!rtl && dirs[g[0]] !== base ? g.reverse() : g));
}

/** One line to place: its width, and for justified text its words and whether it ends a paragraph. */
export interface AlignLineInput {
  /** The line's rendered width. */
  width: number;
  /** The line's words with their widths (not counting trailing spaces), for justified text. */
  words?: {text: string; width: number}[];
  /** Whether the line ends a paragraph (the last line, or one ending in a newline), which justified text leaves start-aligned. */
  paragraphEnd?: boolean;
}

/** A placed line: the x to draw it at, its width, and for a justified line each word's x. */
export interface AlignedLine {
  x: number;
  width: number;
  /** Each word's x (read with the node's anchor and direction), in the order of `AlignLineInput.words`. */
  wordX?: number[];
}

/**
    Places each word of a justified line so the first starts at the line's
    start edge and the last ends at its end edge, with the spare width split
    evenly between them. Returns null when the line has fewer than two words
    or no room to spread them.
*/
function justifyLine(
  words: {text: string; width: number}[],
  boxWidth: number,
  rtl: boolean,
): AlignedLine | null {
  if (words.length < 2) return null;
  const total = words.reduce((s, w) => s + w.width, 0);
  const gap = (boxWidth - total) / (words.length - 1);
  if (!(gap >= 0)) return null;
  const wordX: number[] = [];
  let cursor = 0;
  for (const i of visualOrder(
    words.map(w => w.text),
    rtl,
  )) {
    wordX[i] = rtl ? cursor + words[i].width : cursor;
    cursor += words[i].width + gap;
  }
  return {x: rtl ? boxWidth : 0, width: boxWidth, wordX};
}

/**
    Places each line of a text block in a box of `boxWidth`, returning the
    anchor to draw the block with and each line's x.

    - `start`, `middle`, `end` anchor every line at the box's start edge,
      center, or end edge (the start is the right edge in right-to-left text).
    - A percentage places each line's anchor that share of the way across the
      box, as start-aligned text shifted by `p × (boxWidth − lineWidth)`, so
      `"0%"`, `"50%"`, and `"100%"` match `start`, `middle`, and `end`.
      Percentages follow the writing direction: in right-to-left text `"0%"`
      is the right edge.
    - `justify` spreads the words of each line across the box, except lines
      that end a paragraph, which are start-aligned.
    @param align The configured alignment.
    @param boxWidth The box's width.
    @param lines The lines to place.
    @param rtl Whether the text reads right to left.
*/
export function alignLines(
  align: unknown,
  boxWidth: number,
  lines: AlignLineInput[],
  rtl = false,
): {anchor: LineAnchor; lines: AlignedLine[]} {
  if (align === "middle")
    return {
      anchor: "middle",
      lines: lines.map(l => ({x: boxWidth / 2, width: l.width})),
    };
  if (align === "end")
    return {
      anchor: "end",
      lines: lines.map(l => ({x: rtl ? 0 : boxWidth, width: l.width})),
    };
  const share = alignShare(align) ?? 0;
  const startX = (width: number) => {
    const offset = share ? share * (boxWidth - width) : 0;
    return rtl ? boxWidth - offset : offset;
  };
  return {
    anchor: "start",
    lines: lines.map(l => {
      const justified =
        align === "justify" && !l.paragraphEnd && l.words
          ? justifyLine(l.words, boxWidth, rtl)
          : null;
      return justified ?? {x: startX(l.width), width: l.width};
    }),
  };
}
