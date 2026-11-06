/**
    Text along a path: sampling a path into a measured polyline, placing glyphs
    along it the way SVG's `<textPath>` does (each glyph's midpoint on the
    path, turned to the path's direction there), and the boxes the placed
    text covers, for hit testing and label collisions.
*/
import {path2polygon} from "@d3plus/math";

import type {FontSpec, TextLine, TextNode, TextPath} from "./scene.js";
import {lineLeft, strongDirection, visualOrder} from "./textAlign.js";

/** A path flattened into points, with the distance along the path to each. */
export interface PathSamples {
  points: [number, number][];
  /** The distance along the path to each point (`lengths[0]` is 0). */
  lengths: number[];
  /** The path's length. */
  total: number;
}

/** A point on a path and the path's direction there, in radians. */
export interface PathPoint {
  x: number;
  y: number;
  angle: number;
}

const sampleCache = new Map<string, PathSamples>();
const CACHE_SIZE = 200;

/** Builds the cumulative lengths of a list of points. */
function measured(points: [number, number][]): PathSamples {
  const lengths = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(
      lengths[i - 1] +
        Math.hypot(
          points[i][0] - points[i - 1][0],
          points[i][1] - points[i - 1][1],
        ),
    );
  return {points, lengths, total: lengths[lengths.length - 1] ?? 0};
}

/**
    Flattens an SVG path into points no more than `step` apart along its
    curves, with the distance along the path to each. A closing `Z` returns to
    the path's start. Results are cached by `d`.
    @param d The path's `d`.
    @param step The longest segment a curve is flattened into, in pixels.
*/
export function samplePath(d: string, step = 2): PathSamples {
  const key = `${step}|${d}`;
  const cached = sampleCache.get(key);
  if (cached) return cached;
  const points = path2polygon(d, step).map(
    ([x, y]) => [x, y] as [number, number],
  );
  if (/z\s*$/i.test(d) && points.length > 1) {
    const [x0, y0] = points[0];
    const [xn, yn] = points[points.length - 1];
    if (x0 !== xn || y0 !== yn) points.push([x0, y0]);
  }
  const samples = measured(points);
  if (sampleCache.size >= CACHE_SIZE)
    sampleCache.delete(sampleCache.keys().next().value as string);
  sampleCache.set(key, samples);
  return samples;
}

/**
    The samples text follows for a `TextPath`: the path as drawn, or for
    `side: "right"` the same path run backwards.
    @param path The text's path.
*/
export function textPathSamples(path: TextPath): PathSamples {
  const samples = samplePath(path.d);
  if (path.side !== "right") return samples;
  return measured([...samples.points].reverse());
}

/**
    The `d` an SVG `<textPath>` follows for a `TextPath`: the path itself, or
    for `side: "right"` its flattened points in reverse.
    @param path The text's path.
*/
export function textPathD(path: TextPath): string {
  if (path.side !== "right") return path.d;
  const round = (n: number) => Math.round(n * 100) / 100;
  return textPathSamples(path)
    .points.map(([x, y], i) => `${i ? "L" : "M"}${round(x)},${round(y)}`)
    .join("");
}

/**
    The point `distance` along a path and the path's direction there, or null
    when the distance falls off either end.
    @param samples The sampled path.
    @param distance The distance along the path.
*/
export function pointAtLength(
  samples: PathSamples,
  distance: number,
): PathPoint | null {
  const {points, lengths, total} = samples;
  if (points.length < 2 || distance < 0 || distance > total) return null;
  let lo = 0,
    hi = lengths.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (lengths[mid] <= distance) lo = mid;
    else hi = mid;
  }
  // Skip zero-length segments so the direction is defined.
  while (hi < points.length - 1 && lengths[hi] === lengths[lo]) hi++;
  const span = lengths[hi] - lengths[lo] || 1;
  const t = (distance - lengths[lo]) / span;
  const [x0, y0] = points[lo];
  const [x1, y1] = points[hi];
  return {
    x: x0 + (x1 - x0) * t,
    y: y0 + (y1 - y0) * t,
    angle: Math.atan2(y1 - y0, x1 - x0),
  };
}

/** One piece of text placed along a path, or a gap (empty text) between words. */
export interface PathGlyph {
  text: string;
  advance: number;
  /** The direction of the word the piece comes from, which a canvas draws it in (so brackets mirror only in right-to-left words). */
  dir?: "ltr" | "rtl";
  /** The run's font, when the line has styled runs. */
  font?: string;
}

/** Scripts whose letters change shape to join their neighbors, so a word is drawn whole. */
const joiningScript =
  /[\u0600-\u07FF\u0860-\u08FF\u0900-\u0DFF\u0E00-\u0EFF\u1000-\u109F\u1780-\u18AF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

/**
    Splits a line into the pieces a path places one by one, in the order they
    appear from the path's start: single characters (grapheme clusters), or
    whole words in scripts whose letters join (Arabic, Indic, Thai…). Words
    are ordered as `visualOrder` reads them, right-to-left words with their
    characters reversed, and a gap is left where the line has a space.
    @param runs The line's text, as runs with an optional font each.
    @param rtl Whether the line reads right to left.
    @param measure Measures a piece's advance in a font.
*/
export function pathGlyphs(
  runs: {text: string; font?: string}[],
  rtl: boolean,
  measure: (text: string, font?: string) => number,
): PathGlyph[] {
  const words: {text: string; font?: string}[] = [];
  for (const run of runs)
    for (const m of run.text.match(/\S+\s*|\s+/g) ?? [])
      words.push({text: m, font: run.font});
  const order = visualOrder(
    words.map(w => w.text),
    rtl,
  );
  const out: PathGlyph[] = [];
  order.forEach((idx, k) => {
    const word = words[idx];
    const body = word.text.trimEnd();
    let pieces = joiningScript.test(body)
      ? [body]
      : Array.from(graphemeSegmenter.segment(body), s => s.segment);
    const dir = strongDirection(body) ?? (rtl ? "rtl" : "ltr");
    if (dir === "rtl") pieces = pieces.reverse();
    for (const text of pieces)
      out.push({text, advance: measure(text, word.font), font: word.font, dir});
    const next = order[k + 1];
    if (next === undefined) return;
    // The space between two words belongs to whichever comes first.
    const first = words[Math.min(idx, next)];
    if (/\s$/.test(first.text))
      out.push({text: "", advance: measure(" ", first.font)});
  });
  return out;
}

/** A piece of text placed on a path: its center point on the path and its turn, in radians. */
export interface PlacedGlyph {
  text: string;
  dir?: "ltr" | "rtl";
  x: number;
  y: number;
  angle: number;
  font?: string;
}

/**
    Places pieces along a path one after another from `start`, each at the
    point its midpoint reaches and turned to the path there. Pieces whose
    midpoint falls off the path are left out, as SVG leaves them out.
    @param samples The sampled path.
    @param start The distance along the path where the first piece begins.
    @param glyphs The pieces, in order (see `pathGlyphs`).
*/
export function placeGlyphs(
  samples: PathSamples,
  start: number,
  glyphs: PathGlyph[],
): PlacedGlyph[] {
  const out: PlacedGlyph[] = [];
  let cursor = start;
  for (const g of glyphs) {
    if (g.text) {
      const p = pointAtLength(samples, cursor + g.advance / 2);
      if (p)
        out.push({
          text: g.text,
          x: p.x,
          y: p.y,
          angle: p.angle,
          font: g.font,
          dir: g.dir,
        });
    }
    cursor += g.advance;
  }
  return out;
}

/** A rotated box, by its center, size, and turn in degrees. */
export interface PathTextBox {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

/**
    The distance along a path text's path where its line begins (its left
    edge, read along the path), and the line itself.
    @param node A text node with a `path`.
*/
export function pathLineStart(
  node: TextNode,
): {line: TextLine; start: number} | null {
  const line = node.lines[0];
  if (!line) return null;
  return {line, start: lineLeft(line, node.font)};
}

/**
    The boxes a path text's glyphs cover, in the node's local coordinates:
    the line cut into pieces about one font size long, each turned to the
    path and spanning 0.8em above the baseline to 0.2em below.
    @param node A text node with a `path`.
*/
export function pathTextBoxes(node: TextNode): PathTextBox[] {
  if (!node.path) return [];
  const placed = pathLineStart(node);
  if (!placed || !placed.line.text) return [];
  const size = node.font?.size ?? 12;
  const samples = textPathSamples(node.path);
  const from = Math.max(0, placed.start);
  const to = Math.min(samples.total, placed.start + (placed.line.width || 0));
  const out: PathTextBox[] = [];
  const step = Math.max(4, size);
  for (let a = from; a < to; a += step) {
    const b = Math.min(to, a + step);
    const p = pointAtLength(samples, (a + b) / 2);
    if (!p) continue;
    // The glyph box's center sits 0.3em above the baseline, on the left of
    // the path's direction.
    out.push({
      x: p.x + Math.sin(p.angle) * size * 0.3,
      y: p.y - Math.cos(p.angle) * size * 0.3,
      width: b - a,
      height: size,
      angle: (p.angle * 180) / Math.PI,
    });
  }
  return out;
}

/**
    Whether a point (in the node's local coordinates) falls on a path text's
    glyphs, with the same loose margin as straight text.
    @param node A text node with a `path`.
    @param lx The point's x.
    @param ly The point's y.
*/
export function hitPathText(node: TextNode, lx: number, ly: number): boolean {
  const size = node.font?.size ?? 12;
  return pathTextBoxes(node).some(box => {
    const rad = (box.angle * Math.PI) / 180;
    const dx = lx - box.x,
      dy = ly - box.y;
    const u = dx * Math.cos(rad) + dy * Math.sin(rad);
    const v = -dx * Math.sin(rad) + dy * Math.cos(rad);
    return Math.abs(u) <= box.width / 2 + 1 && Math.abs(v) <= size * 0.65;
  });
}

/**
    The axis-aligned box around a rotated box's corners.
    @param box The rotated box.
*/
export function rotatedBoxBounds(box: PathTextBox): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const rad = (box.angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad)),
    sin = Math.abs(Math.sin(rad));
  const w = box.width * cos + box.height * sin;
  const h = box.width * sin + box.height * cos;
  return {x: box.x - w / 2, y: box.y - h / 2, width: w, height: h};
}

/** The CSS font string a path text's pieces are measured and painted in. */
export function pathFont(
  font: FontSpec,
  run?: {weight?: number | string; style?: string},
): string {
  return `${run?.style ?? font.style ?? "normal"} ${run?.weight ?? font.weight ?? "normal"} ${font.size ?? 12}px ${font.family ?? "sans-serif"}`;
}
