/**
    `applyWordCloudLayout` — WordCloud's layout stage: sizes each drawn row's
    word by its value, picks its angle, rasterizes it, and places the words
    largest first on a spiral (see `cloudLayout.ts`), shrinking them all
    until every one fits. The placed cloud is centered in the chart area.
*/

import type {DataPoint} from "@d3plus/data";
import {fontFamilyStringify} from "@d3plus/text";

import {chartBounds} from "../features/chartGeometry.js";
import {resolveAccessor} from "../features/emitHelpers.js";
import {stampShare} from "../features/shareKey.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {fitCloud} from "./cloudLayout.js";
import type {CloudFit} from "./cloudLayout.js";
import {fontScaleKind, wordFontSize} from "./fontScale.js";
import {glyphFontLoads, rasterizeWords} from "./glyphMask.js";
import type {GlyphMetrics, GlyphWord} from "./glyphMask.js";
import {wordRotation} from "./rotation.js";
import {spiralKind} from "./spiral.js";
import {wordSize} from "./size.js";

/** One placed word. */
export interface WordCloudWord {
  __d3plus__: true;
  /** The word's row. */
  data: DataPoint;
  /** The row's index in the drawn data. */
  i: number;
  /** A key stable across redraws: the row's ids. */
  id: string;
  /** The text drawn. */
  text: string;
  /** The row's value. */
  value: number;
  /** The anchor (baseline center), in the chart area. */
  x: number;
  y: number;
  /** The font size in pixels, after any shrinking. */
  size: number;
  /** The angle in degrees, clockwise. */
  rotate: number;
  family: string;
  weight: number | string;
  /** The word's unrotated text box, from its anchor. */
  metrics: GlyphMetrics;
}

/** A word ready to place: its row, text, value, and font. */
interface Candidate extends GlyphWord {
  d: DataPoint;
  i: number;
  id: string;
  value: number;
}

/** The finite number a setting holds, or `fallback`. */
const numberOr = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return v !== null && v !== "" && Number.isFinite(n) ? n : fallback;
};

/**
    The drawn rows as words, largest value first (ties in data order): every
    row with text and a positive, finite value, sized by `fontScale` onto
    `fontMin`–`fontMax`. Stamps each row with its share of their total.
    @param viz The chart.
*/
export function wordCandidates(viz: VizInstance): Candidate[] {
  const data = (viz._filteredData ?? []) as DataPoint[];
  const valueOf = wordSize(viz);
  const family = fontFamilyStringify(
    viz.schema.fontFamily as string | string[],
  );
  const padding = Math.max(0, numberOr(viz.schema.wordPadding, 2));
  const rows: Omit<Candidate, "size">[] = [];
  data.forEach((d, i) => {
    const value = valueOf(d, i);
    const text = String(viz._drawLabel(d, i) ?? "").trim();
    if (!text || !(value > 0) || !Number.isFinite(value)) return;
    const id = viz._ids(d, i).join("-");
    rows.push({
      d,
      i,
      id,
      value,
      text,
      family,
      weight:
        resolveAccessor<number | string>(viz.schema.fontWeight, d, i) ?? 400,
      rotate: wordRotation(viz.schema.rotate, d, i, id),
      padding,
    });
  });
  const min = Math.max(1, numberOr(viz.schema.fontMin, 10));
  const max = Math.max(min, numberOr(viz.schema.fontMax, 60));
  const size = wordFontSize(
    rows.map(r => r.value),
    [min, max],
    fontScaleKind(viz.schema.fontScale),
  );
  // Each word's share of every drawn word's value, for the tooltip.
  const total = rows.reduce((a, r) => a + r.value, 0);
  for (const r of rows) stampShare(r.d, r.value / total);
  return rows
    .map(r => ({...r, size: size(r.value)}))
    .sort((a, b) => b.value - a.value || a.i - b.i);
}

/**
    Everything that changes a layout, so an unchanged one is reused: a web
    font loading since it was rasterized invalidates it too.
*/
function layoutKey(
  words: Candidate[],
  width: number,
  height: number,
  spiral: string,
): string {
  const parts = words.map(
    w =>
      `${w.id}\u0001${w.text}\u0001${w.size}\u0001${w.rotate}\u0001${w.weight}`,
  );
  const first = words[0];
  return [
    width,
    height,
    spiral,
    glyphFontLoads(),
    first ? `${first.family}|${first.padding}` : "",
    ...parts,
  ].join("\u0002");
}

/**
    Moves the placed words so the box around their glyphs sits in the middle
    of the `width` × `height` area.
*/
function centerOffset(
  fit: CloudFit,
  width: number,
  height: number,
): [number, number] {
  if (!fit.placed.length) return [0, 0];
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const p of fit.placed) {
    const s = fit.sprites[p.index];
    x0 = Math.min(x0, p.x + s.x0);
    y0 = Math.min(y0, p.y + s.y0);
    x1 = Math.max(x1, p.x + s.x0 + s.inkWidth);
    y1 = Math.max(y1, p.y + s.y0 + s.height);
  }
  return [(width - (x1 - x0)) / 2 - x0, (height - (y1 - y0)) / 2 - y0];
}

export const applyWordCloudLayout: TransformStage = ({viz}) => {
  const words = wordCandidates(viz as VizInstance);
  if (!words.length) {
    viz.ctx.wordCloudFit = undefined;
    return {shapeData: []};
  }
  const {width, height} = chartBounds(viz);
  const spiral = spiralKind(viz.schema.spiral);
  const key = layoutKey(words, width, height, spiral);
  const cache = viz.ctx.wordCloudCache as
    {key: string; fit: CloudFit; metrics: GlyphMetrics[]} | undefined;

  let fit: CloudFit;
  let metrics: GlyphMetrics[];
  if (cache && cache.key === key) ({fit, metrics} = cache);
  else {
    metrics = [];
    fit = fitCloud(
      words,
      sizes => {
        const glyphs = rasterizeWords(
          words.map((w, k) => ({...w, size: sizes[k]})),
        );
        metrics = glyphs.map(g => g.metrics);
        return glyphs.map(g => g.sprite);
      },
      {width, height, spiral},
    );
    viz.ctx.wordCloudCache = {key, fit, metrics};
    if (fit.dropped.length)
      console.warn(
        `[d3plus] WordCloud: ${fit.dropped.length} of ${words.length} words didn't fit the chart area, even at the smallest font size, and were left out.`,
      );
  }
  viz.ctx.wordCloudFit = fit;

  const [dx, dy] = centerOffset(fit, width, height);
  const shapeData: WordCloudWord[] = fit.placed.map(p => {
    const w = words[p.index];
    return {
      __d3plus__: true,
      data: w.d,
      i: w.i,
      id: w.id,
      text: w.text,
      value: w.value,
      x: p.x + dx,
      y: p.y + dy,
      size: fit.sizes[p.index],
      rotate: w.rotate,
      family: w.family,
      weight: w.weight,
      metrics: metrics[p.index],
    };
  });
  return {shapeData};
};
