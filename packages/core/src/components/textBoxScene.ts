/**
    Turns laid-out text boxes (`TextBoxDatum`) into scene nodes: each line's
    position, its runs, and the node's font and paint.
*/
import {strip} from "@d3plus/text";
import {alignLines} from "@d3plus/render";
import type {
  FontSpec,
  LineAnchor,
  Paint,
  TextLine,
  TextNode,
  TextRun,
} from "@d3plus/render";

import type {TextBoxDatum} from "./textBoxLayout.js";

/**
    A line's baseline y within its box, for the box's vertical alignment and
    rotation.
    @param d The laid-out box.
    @param i The line's index.
*/
export function textBoxLineY(d: TextBoxDatum, i: number): number {
  if (d.r === 0 || d.vA === "top") return (i + 1) * d.lH - (d.lH - d.fS);
  if (d.vA === "middle")
    return (
      (d.h + d.fS) / 2 - (d.lH - d.fS) + (i - d.lines.length / 2 + 0.5) * d.lH
    );
  return (
    d.h -
    2 * (d.lH - d.fS) -
    (d.lines.length - (i + 1)) * d.lH +
    2 * Math.cos((Math.PI * d.r) / 180)
  );
}

/**
    Each line of a laid-out box placed across `width` for its `textAnchor`
    (start, middle, end, justify, or a percentage), with the anchor the lines
    are drawn with. A justified line carries one run per word, each at its
    own x. Lines get their y from `textBoxLineY`.
    @param d The laid-out box.
    @param width The width to place the lines across.
    @param rtl Whether the text reads right to left.
*/
export function textBoxLines(
  d: TextBoxDatum,
  width: number,
  rtl: boolean,
): {anchor: LineAnchor; lines: Omit<TextLine, "y">[]} {
  const last = d.lines.length - 1;
  const placed = alignLines(
    d.tA,
    width,
    d.lines.map((_, i) => ({
      width: d.widths[i] ?? 0,
      words: d.lineWords?.[i] ?? undefined,
      paragraphEnd: i === last || d.hardBreaks[i],
    })),
    rtl,
  );
  const lines = d.lines.map((text, i) => {
    const {x, width: lineWidth, wordX} = placed.lines[i];
    const words = d.lineWords?.[i];
    const runs: TextRun[] | undefined =
      wordX && words
        ? words.flatMap((word, k) =>
            (word.runs ?? [{text: word.text}]).map((run, j) =>
              j ? run : {...run, x: wordX[k]},
            ),
          )
        : (d.lineRuns?.[i] ?? undefined);
    return runs
      ? {text, x, width: lineWidth, runs}
      : {text, x, width: lineWidth};
  });
  return {anchor: placed.anchor, lines};
}

/**
    The x nudge rotated start-aligned text gets in left-to-right boxes, which
    keeps its first glyph clear of the box's edge.
*/
function rotateNudge(d: TextBoxDatum, anchor: LineAnchor, rtl: boolean) {
  return anchor === "start" && !rtl ? 2 * Math.sin((Math.PI * d.r) / 180) : 0;
}

/** The font a laid-out box's text is drawn with. */
export function textBoxFont(
  d: TextBoxDatum,
  anchor: LineAnchor,
  rtl: boolean,
): FontSpec {
  return {
    family: d.fF,
    size: d.fS,
    weight: d.fW,
    anchor,
    baseline: "alphabetic",
    dir: rtl ? "rtl" : "ltr",
  };
}

/** The paint a laid-out box's text is drawn with. */
export function textBoxPaint(d: TextBoxDatum): Paint {
  return {
    fill: d.fC,
    opacity: d.fO,
    ...(d.fStroke && d.fStroke !== "transparent" ? {stroke: d.fStroke} : {}),
    ...(d.fSW ? {strokeWidth: d.fSW} : {}),
  };
}

/**
    The text node for one laid-out box.
    @param d The laid-out box.
    @param rotateAnchor The point the box rotates about.
    @param rtl Whether the text reads right to left.
*/
export function textBoxNode(
  d: TextBoxDatum,
  rotateAnchor: [number, number],
  rtl: boolean,
): TextNode {
  const {anchor, lines} = textBoxLines(d, d.w, rtl);
  const nudge = rotateNudge(d, anchor, rtl);
  const ariaHidden = d.aH === "true" || (d.aH as unknown) === true;
  return {
    type: "text",
    key: d.id,
    id: `d3plus-textBox-${strip(d.id)}`,
    datum: d.data,
    index: d.i,
    x: 0,
    y: 0,
    width: d.w,
    height: d.h,
    lines: lines.map((ln, i) => ({
      ...ln,
      x: ln.x + nudge,
      ...(ln.runs && nudge
        ? {
            runs: ln.runs.map(r =>
              r.x === undefined ? r : {...r, x: r.x + nudge},
            ),
          }
        : {}),
      y: textBoxLineY(d, i),
    })),
    font: textBoxFont(d, anchor, rtl),
    paint: textBoxPaint(d),
    transform: {x: d.x, y: d.y, rotate: d.r, rotateAnchor},
    aria: ariaHidden ? {hidden: true} : undefined,
    interactive: d.pE !== "none",
  };
}
