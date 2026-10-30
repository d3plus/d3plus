/**
    Per-box text layout for `TextBox`: wraps and sizes each datum's text
    (shrinking it to fit in resize mode), splits HTML markup into styled runs,
    and positions the box. Pure compute — no DOM.
*/
import {max, min, sum} from "d3-array";

import type {DataPoint} from "@d3plus/data";
import {fontExists, parseSides, textWidth} from "@d3plus/dom";
import {textWrap} from "@d3plus/text";

import {fontStack} from "./fontStack.js";
import type TextBox from "./TextBox.js";

/** A parsed inline run (segment of a wrapped line with optional bold/italic). */
interface LineRun {
  text: string;
  style?: {weight?: number | string; style?: "normal" | "italic"};
}

/** Internal shape produced by the data reduce in render(). */
export interface TextBoxDatum {
  aH: string;
  data: DataPoint;
  i: number;
  lines: string[];
  /** Per-line parsed runs when `_html` is configured; null when plain text. */
  lineRuns: LineRun[][] | null;
  fC: string;
  fStroke: string;
  fSW: number;
  /** The CSS font-family to draw with: the measured family, then its fallbacks. */
  fF: string;
  fO: number;
  fW: number | string;
  id: string;
  pE: string;
  tA: string;
  vA: string;
  widths: number[];
  /** Whether the text needed more room than the box gave it (cut short or dropped). */
  truncated: boolean;
  fS: number;
  lH: number;
  w: number;
  h: number;
  r: number;
  x: number;
  y: number;
}

/** Parses a "style: foo; …" string from defaultHtmlLookup into TextRun style. */
function parseStyleString(
  styleStr: string,
): {weight?: number | string; style?: "normal" | "italic"} | undefined {
  const out: {weight?: number | string; style?: "normal" | "italic"} = {};
  for (const decl of styleStr.split(";")) {
    const [k, v] = decl.split(":").map(s => s.trim());
    if (!k || !v) continue;
    if (k === "font-weight") out.weight = /^\d+$/.test(v) ? Number(v) : v;
    else if (k === "font-style")
      out.style = v === "italic" ? "italic" : "normal";
  }
  return out.weight === undefined && out.style === undefined ? undefined : out;
}

/**
    Walks one wrapped line, applies the regex cleanup (closing dangling
    open tags, opening trailing closing tags), then splits it into runs by the
    configured htmlLookup. Returns the new openTag state for the next line so a
    multi-line bold/italic continues to style subsequent lines.
*/
function lineToRuns(
  raw: string,
  htmlLookup: Record<string, string>,
  openTag: string | false,
): {runs: LineRun[]; openTag: string | false} {
  // textContent escaping: keep entity escaping in sync with render()
  // so SVG output stays identical.
  let cleaned = raw
    .trimEnd()
    .replace(/&([^;&]*)/g, (str, a) => (a === "amp" ? str : `&amp;${a}`))
    .replace(/<([^A-z^/]+)/g, (_str, a) => `&lt;${a}`)
    .replace(/<$/g, "&lt;")
    .replace(
      /(<[^>^/]+>)([^<^>]+)$/g,
      (_str, a, b) => `${a}${b}${a.replace("<", "</")}`,
    )
    .replace(
      /^([^<^>]+)(<\/[^>]+>)/g,
      (_str, a, b) => `${b.replace("</", "<")}${a}${b}`,
    );

  // If we're already inside an open tag from a previous line, prefix this
  // line with the opening tag so the same tag closes within the line.
  let nextOpenTag: string | false = openTag;
  if (nextOpenTag && !cleaned.startsWith("<")) {
    cleaned = `<${nextOpenTag}>${cleaned}`;
    if (!cleaned.includes(`</${nextOpenTag}>`)) cleaned += `</${nextOpenTag}>`;
  }

  const tagRegex = /<([A-z]+)[^>]*>([^<^>]+)<\/[^>]+>/g;
  const runs: LineRun[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(cleaned)) !== null) {
    if (m.index > lastIndex)
      runs.push({text: cleaned.slice(lastIndex, m.index)});
    const tag = m[1];
    const inner = m[2];
    const styleStr = htmlLookup[tag];
    if (styleStr) {
      // If the original raw line contains a closing tag, the tag has terminated.
      if (raw.includes(`</${tag}>`)) nextOpenTag = false;
      else nextOpenTag = tag;
      runs.push({text: inner, style: parseStyleString(styleStr)});
    } else {
      runs.push({text: inner});
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < cleaned.length) runs.push({text: cleaned.slice(lastIndex)});

  // If the raw line never opened a tag but we already had openTag set, the
  // line is fully inside that tag — wrap it.
  if (!runs.length && cleaned) runs.push({text: cleaned});

  return {runs, openTag: nextOpenTag};
}

/** Builds the per-line LineRun arrays from wrapped lines, carrying open-tag state. */
function buildLineRuns(box: TextBox, lineData: string[]): LineRun[][] | null {
  let lineRuns: LineRun[][] | null = null;
  if (box.schema.html) {
    const lookup = box.schema.html as Record<string, string>;
    let openTag: string | false = false;
    const out: LineRun[][] = [];
    let hasStyle = false;
    for (const ln of lineData) {
      const {runs, openTag: next} = lineToRuns(ln, lookup, openTag);
      out.push(runs);
      openTag = next;
      if (runs.some(r => r.style)) hasStyle = true;
    }
    // Only emit runs when at least one line carries a style; otherwise
    // leave runs unset so the renderer emits a single text node.
    if (hasStyle) lineRuns = out;
  }
  return lineRuns;
}

/** Pre-scales the font size to fit the box area before wrapping (resize mode). */
function resizeFontSize(
  fS: number,
  w: number,
  h: number,
  lH: number,
  words: string[],
  style: Record<string, string | number>,
  shape: string,
): number {
  const sizes = textWidth(words, style) as unknown as number[];

  const areaMod = 1.165 + (w / h) * 0.1,
    // A circle fills only ~π/4 of its bounding box, so scale the usable area
    // down to keep the initial font-size guess from overshooting.
    boxArea = w * h * (shape === "circle" ? Math.PI / 4 : 1),
    maxWidth = max(sizes) as number,
    textArea = sum(sizes, (d: number) => d * lH) * areaMod;

  if (maxWidth > w || textArea > boxArea) {
    const areaRatio = Math.sqrt(boxArea / textArea),
      widthRatio = w / maxWidth;
    const sizeRatio = min([areaRatio, widthRatio])!;
    fS = Math.floor(fS * sizeRatio);
  }

  const heightMax = Math.floor(h * 0.8);
  if (fS > heightMax) fS = heightMax;
  return fS;
}

/** Assembles the final TextBoxDatum from the resolved layout values. */
function assembleTextBoxDatum(
  box: TextBox,
  d: DataPoint,
  i: number,
  layout: {
    lineData: string[];
    line: number;
    fS: number;
    lH: number;
    w: number;
    h: number;
    vA: string;
    style: Record<string, string | number>;
    widths: number[];
    truncated: boolean;
    padding: {top: number; right: number; bottom: number; left: number};
  },
): TextBoxDatum {
  const {lineData, line, fS, lH, w, h, vA, style, widths, truncated, padding} =
    layout;
  const tH = line * lH;
  const r = box.schema.rotate(d, i);
  let yP =
    r === 0
      ? vA === "top"
        ? 0
        : vA === "middle"
          ? h / 2 - tH / 2
          : h - tH
      : 0;
  yP -= lH * 0.1;

  // Pre-compute per-line runs from HTML markup, carrying open-tag state
  // across lines so a multi-line <b> continues to bold subsequent lines.
  const lineRuns = buildLineRuns(box, lineData);

  return {
    aH: box.schema.ariaHidden(d, i),
    data: d,
    i,
    lines: lineData,
    lineRuns,
    fC: box.schema.fontColor(d, i),
    fStroke: box.schema.fontStroke(d, i),
    fSW: box.schema.fontStrokeWidth(d, i),
    fF: fontStack(
      box.schema.fontFamily(d, i) as string | string[],
      style["font-family"] as string | false,
    ),
    fO: box.schema.fontOpacity(d, i),
    fW: style["font-weight"],
    id: box.schema.id(d, i),
    pE: box.schema.pointerEvents(d, i),
    tA: box.schema.textAnchor(d, i),
    vA: box.schema.verticalAlign(d, i),
    widths,
    truncated,
    fS,
    lH,
    w,
    h,
    r,
    x: box.schema.x(d, i) + padding.left,
    y: box.schema.y(d, i) + yP + padding.top,
  };
}

/**
    Computes the laid-out text box for a single data point, or null when the
    text is undefined or wraps to no visible lines.
*/
export function computeTextBoxDatum(
  box: TextBox,
  d: DataPoint,
  i: number,
): TextBoxDatum | null {
  const that = box;
  let t = box.schema.text(d, i);
  if (t === void 0) return null;
  t = `${t}`.trim();

  const resize = box.schema.fontResize(d, i);
  const lHRatio = box.schema.lineHeight(d, i) / box.schema.fontSize(d, i);

  let fS = resize ? box.schema.fontMax(d, i) : box.schema.fontSize(d, i),
    lH = resize ? fS * lHRatio : box.schema.lineHeight(d, i),
    line = 1,
    lineData: string[] = [],
    wrapResults: {lines: string[]; truncated: boolean; widths: number[]} = {
      lines: [],
      truncated: false,
      widths: [],
    };

  const style: Record<string, string | number> = {
    "font-family": fontExists(box.schema.fontFamily(d, i)) as string,
    "font-size": fS,
    "font-weight": box.schema.fontWeight(d, i),
    "line-height": lH,
  };

  const padding = parseSides(box.schema.padding(d, i));

  const h = box.schema.height(d, i) - (padding.top + padding.bottom),
    w = box.schema.width(d, i) - (padding.left + padding.right),
    shape = box.schema.shape(d, i) as string;

  const wrapper = textWrap()
    .fontFamily(style["font-family"] as string)
    .fontSize(fS)
    .fontWeight(style["font-weight"])
    .lineHeight(lH)
    .maxLines(box.schema.maxLines(d, i))
    .height(h)
    .overflow(box.schema.overflow(d, i))
    .shape(shape as "square" | "circle")
    .width(w)
    .split(box.schema.split);

  const fMax = box.schema.fontMax(d, i),
    fMin = box.schema.fontMin(d, i),
    vA = box.schema.verticalAlign(d, i),
    words = box.schema.split(t, i);

  /**
    Figures out the lineData to be used for wrapping.
    @private
*/
  function checkSize(): void {
    const truncate = () => {
      if (line < 1) lineData = [that.schema.ellipsis("", line)];
      else lineData[line - 1] = that.schema.ellipsis(lineData[line - 1], line);
    };

    if (resize) {
      // fontMin/fontMax bound the resize search; a fixed fontSize is used as given.
      fS = max([fS, fMin])!;
      fS = min([fS, fMax])!;
      lH = fS * lHRatio;
      wrapper.fontSize(fS).lineHeight(lH);
      style["font-size"] = fS;
      style["line-height"] = lH;
    }

    wrapResults = wrapper(t!);
    lineData = wrapResults.lines.filter((l: string) => l !== "");
    line = lineData.length;

    if (wrapResults.truncated) {
      if (resize) {
        fS--;
        if (fS < fMin) {
          fS = fMin;
          truncate();
          return;
        } else checkSize();
      } else truncate();
    }
  }

  // A resized font can't shrink below fontMin, so a box narrower than that
  // holds nothing; a fixed font is wrapped as given and keeps whatever fits.
  const minWidth = resize ? fMin : 0;
  if (w > minWidth && (h > lH || (resize && h > fMin * lHRatio))) {
    if (resize) fS = resizeFontSize(fS, w, h, lH, words, style, shape);
    checkSize();
  }

  if (!lineData.length) return null;

  return assembleTextBoxDatum(box, d, i, {
    lineData,
    line,
    fS,
    lH,
    w,
    h,
    vA,
    style,
    widths: wrapResults.widths,
    truncated: wrapResults.truncated,
    padding,
  });
}
