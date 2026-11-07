/**
    Sizes a Pie slice's straight label to its slice: the name, wrapped
    between words onto as many lines as shows it largest, and the share on a
    smaller line beneath it, in a box centered on the slice's bisector (see
    `sectorBox.ts`).
*/
import type {SceneNode} from "@d3plus/render";

import {textLineBoxes} from "../features/linkLabels.js";
import {
  centeredSectorBox,
  largestSectorBox,
  sectorBoxRange,
} from "./sectorBox.js";
import type {SectorBox, SectorEdges} from "./sectorBox.js";

/** How a straight label is sized. */
export interface StraightLabelOptions {
  /** The smallest font size worth drawing. */
  fontMin: number;
  /** The largest font size to try. */
  fontMax: number;
  /** The room kept between the text and its box's edges, in pixels. */
  padding: number;
  /** The line height, as a multiple of the font size. */
  lineHeight: number;
  /** The share's font size, as a multiple of the name's. */
  shareRatio: number;
  /** The share is drawn when the name, with it, keeps at least this share of its size alone… */
  shareKeep: number;
  /** …or at least this font size. */
  shareFont: number;
  /** The room kept around the text inside its slice, as a multiple of the font size, when that is more than `padding`. */
  margin: number;
  /** The most lines the name wraps onto. */
  maxLines: number;
}

/** The defaults for `StraightLabelOptions`. */
export const STRAIGHT_LABEL_DEFAULTS: StraightLabelOptions = {
  fontMin: 8,
  fontMax: 50,
  padding: 5,
  lineHeight: 1.2,
  shareRatio: 0.7,
  shareKeep: 0.75,
  shareFont: 16,
  margin: 0.2,
  maxLines: 4,
};

/** A positive number, or undefined. */
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;

/**
    The straight label options a labelConfig asks for: its `fontSize` alone
    when it sets one, else `fontMin` to `fontMax` (8 to 50 by default), and
    its `padding` (5 by default).
    @param config The labelConfig.
*/
export function straightLabelOptions(
  config: Record<string, unknown>,
): StraightLabelOptions {
  const size = num(config.fontSize);
  const fontMax =
    size ?? num(config.fontMax) ?? STRAIGHT_LABEL_DEFAULTS.fontMax;
  const fontMin = Math.min(
    fontMax,
    size ?? num(config.fontMin) ?? STRAIGHT_LABEL_DEFAULTS.fontMin,
  );
  const padding =
    typeof config.padding === "number" && config.padding >= 0
      ? config.padding
      : STRAIGHT_LABEL_DEFAULTS.padding;
  return {...STRAIGHT_LABEL_DEFAULTS, fontMin, fontMax, padding};
}

/**
    The narrowest a text wraps between its words onto 1, 2, … lines: for
    each line count, the widest line at the best breaks. Stops at
    `maxLines`, or at one line per word.
    @param text The text.
    @param width A string's one-line width.
    @param maxLines The most lines.
*/
export function wrapWidths(
  text: string,
  width: (text: string) => number,
  maxLines: number,
): number[] {
  const words = text.split(/\s+/).filter(Boolean);
  const n = words.length;
  if (!n) return [];
  const cache = new Map<string, number>();
  const line = (i: number, j: number) => {
    const key = `${i},${j}`;
    let w = cache.get(key);
    if (w === undefined) {
      w = width(words.slice(i, j).join(" "));
      cache.set(key, w);
    }
    return w;
  };
  // best[j] is the narrowest the first j words wrap onto the current count.
  let best = Array.from({length: n + 1}, (_, j) => (j ? line(0, j) : 0));
  const out = [best[n]];
  for (let k = 2; k <= Math.min(maxLines, n); k++) {
    const next = best.map(() => Infinity);
    for (let j = k; j <= n; j++)
      for (let i = k - 1; i < j; i++)
        next[j] = Math.min(next[j], Math.max(best[i], line(i, j)));
    best = next;
    out.push(best[n]);
  }
  return out;
}

/** A straight label's sizes and boxes. */
export interface StraightLabelLayout {
  /** The name's font size. */
  fontSize: number;
  /** The lines the name wraps onto. */
  lines: number;
  /** The share's font size, or null when it isn't drawn. */
  shareSize: number | null;
  /** The name's box. */
  name: SectorBox;
  /** The share's box, beneath the name's. */
  share: SectorBox | null;
  /** The center of the whole label, on the slice's bisector. */
  center: [number, number];
  /** Whether no font size shows the whole name, so it is cut short at `fontMin`. */
  truncated: boolean;
}

/** A label's text block at one font size, and the room it claims in its slice. */
interface LabelSize {
  /** The text block's size. */
  width: number;
  height: number;
  /** The name's lines' height. */
  nameHeight: number;
  shareSize: number | null;
  /** The room kept around the block. */
  margin: number;
}

/**
    Lays a straight label out in a slice: the largest whole font size (up to
    `fontMax`) at which the name, wrapped onto some number of lines, and the
    share beneath it fit in a box centered on the slice's bisector, with
    room around them (see `margin`). The share is left off when it would
    shrink the name too much (see `shareKeep` and `shareFont`); a name on
    more lines must show larger than on fewer. The box goes halfway along
    the stretch of the bisector where it fits. When even `fontMin` doesn't
    fit the name whole, the label is one line at `fontMin`, as wide as the
    slice allows, and is cut short; null when that has no room for a few
    letters.
    @param edges The slice's edges (see `sectorEdges`).
    @param wraps The name's width at a font size of 1 on 1, 2, … lines (see `wrapWidths`).
    @param shareWidth The share's width at a font size of 1, or null for none.
    @param options How the label is sized.
*/
export function straightLabelLayout(
  edges: SectorEdges,
  wraps: number[],
  shareWidth: number | null,
  options: StraightLabelOptions = STRAIGHT_LABEL_DEFAULTS,
): StraightLabelLayout | null {
  const {fontMin, fontMax, padding: p, lineHeight: lh} = options;
  if (!wraps.length) return null;
  const sizeAt = (lines: number, s: number, share: boolean): LabelSize => {
    const shareSize = share
      ? Math.max(fontMin, Math.round(s * options.shareRatio))
      : null;
    // A pixel or two of slack, so the text wraps the same when it is drawn.
    const nameHeight = lines * lh * s + 1;
    const width =
      Math.max(wraps[lines - 1] * s, shareSize ? shareWidth! * shareSize : 0) *
        1.02 +
      2;
    const height = nameHeight + (shareSize ? p + lh * shareSize + 1 : 0);
    const margin = Math.max(p, s * options.margin);
    return {width, height, nameHeight, shareSize, margin};
  };
  const fits = (z: LabelSize) =>
    sectorBoxRange(edges, z.width + z.margin * 2, z.height + z.margin * 2) !==
    null;
  /** The largest whole font size that fits, from fontMin to fontMax. */
  const largest = (lines: number, share: boolean) => {
    let lo = Math.ceil(fontMin);
    let hi = Math.floor(fontMax);
    if (hi < lo) hi = lo = fontMin;
    if (!fits(sizeAt(lines, lo, share))) return 0;
    while (lo < hi) {
      const s = Math.ceil((lo + hi) / 2);
      if (fits(sizeAt(lines, s, share))) lo = s;
      else hi = s - 1;
    }
    return lo;
  };
  const best = (share: boolean) => {
    let pick = {lines: 0, size: 0};
    wraps.forEach((_, k) => {
      const size = largest(k + 1, share);
      if (size > pick.size) pick = {lines: k + 1, size};
    });
    return pick;
  };
  const alone = best(false);
  const withShare = shareWidth !== null ? best(true) : {lines: 0, size: 0};
  const keep = Math.min(alone.size * options.shareKeep, options.shareFont);
  const pick =
    withShare.size > 0 && withShare.size >= keep
      ? {...withShare, share: true}
      : {...alone, share: false};
  if (!pick.size) return cutShort(edges, options);
  const z = sizeAt(pick.lines, pick.size, pick.share);
  const outer = centeredSectorBox(
    edges,
    z.width + z.margin * 2,
    z.height + z.margin * 2,
  )!;
  const center: [number, number] = [
    outer.x + outer.width / 2,
    outer.y + outer.height / 2,
  ];
  // The boxes the text is drawn in: the block, and its padding.
  const x = center[0] - z.width / 2 - p;
  const top = center[1] - z.height / 2;
  return {
    fontSize: pick.size,
    lines: pick.lines,
    shareSize: z.shareSize,
    name: {
      x,
      y: top - p,
      width: z.width + p * 2,
      height: z.nameHeight + p * 2,
    },
    share: z.shareSize
      ? {
          x,
          y: top + z.nameHeight,
          width: z.width + p * 2,
          height: lh * z.shareSize + p * 2 + 1,
        }
      : null,
    center,
    truncated: false,
  };
}

/** One line at `fontMin`, as wide as the slice allows along its bisector, or null when that holds less than a few letters. */
function cutShort(
  edges: SectorEdges,
  options: StraightLabelOptions,
): StraightLabelLayout | null {
  const {fontMin, padding: p, lineHeight: lh} = options;
  const height = lh * fontMin + p * 2 + 1;
  const box = largestSectorBox(edges, w => [w, height]);
  if (!box || box.width - p * 2 < fontMin * 2) return null;
  return {
    fontSize: fontMin,
    lines: 1,
    shareSize: null,
    name: box,
    share: null,
    center: [box.x + box.width / 2, box.y + box.height / 2],
    truncated: true,
  };
}

/**
    Moves a label's text nodes up or down together, so their lines' glyphs
    are centered on `y`.
    @param nodes One label's nodes.
    @param y Where the lines' middle goes.
*/
export function centerLabelLines(nodes: SceneNode[], y: number): void {
  const boxes = textLineBoxes(nodes);
  if (!boxes.length) return;
  const top = Math.min(...boxes.map(b => b.y - b.height / 2));
  const bottom = Math.max(...boxes.map(b => b.y + b.height / 2));
  const shift = y - (top + bottom) / 2;
  const moved = new Set<object>();
  for (const node of nodes) {
    const tr = node.transform;
    if (!tr || moved.has(tr)) continue;
    moved.add(tr);
    tr.y = (tr.y ?? 0) + shift;
  }
}
