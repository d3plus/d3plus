/**
    Hexbin's contour labels: each labelled level's value written along its
    contour lines, the way a topographic map labels elevation. Labels sit
    centered on the line, read upright, break the line beneath them, and
    keep clear of the other contours and labels; long rings take several,
    `labelSpacing` apart, and dense levels are labelled every `labelStep`-th.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {fontExists, textWidth} from "@d3plus/dom";
import type {SceneNode} from "@d3plus/render";
import {fontFamily as defaultFontFamily} from "@d3plus/text";

import {
  offsetPolyline,
  polylineD,
  polylineLength,
  trimPolyline,
  type Edges,
  type Pt,
} from "../features/pathLabelGeometry.js";
import {
  labelMinRadius,
  PATH_LABEL_SMOOTHING,
  smoothPolyline,
} from "../features/pathLabelBends.js";
import {pathLabelNodes, type PathLabel} from "../features/pathLabels.js";
import {
  bestStretchAt,
  labelBand,
  PointGrid,
  resample,
  type StretchContext,
} from "../Plot/lineLabelsAlong.js";
import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {PlotFrame} from "./layers.js";
import {hexbinMeta, type ContourMeta, type HexbinSettings} from "./settings.js";
import {contourLevelText} from "./tooltip.js";

/** The labels' font size when `labelConfig` sets none. */
export const CONTOUR_LABEL_FONT_SIZE = 10;

/** With more levels than this, `labelStep: "auto"` labels every other level. */
export const CONTOUR_LABEL_MAX_LEVELS = 5;

/** How far below the line a label's baseline sits, in ems, so its digits' middles sit on the line. */
const BASELINE_DROP = 0.3;

/** The gap the line breaks for at each end of a label, in ems. */
const END_GAP = 0.4;

/** The least room a label keeps from the other lines and labels, in ems. */
const CLEARANCE = 0.3;

/** The most a label's stretch may turn in all, in radians. */
const MAX_TURN = Math.PI / 3;

/**
    A contour path's rings as closed polylines (the last point repeats the
    first).
    @param d The contour's path: `M x,y L x,y … Z` per ring.
*/
export function contourRings(d: string): Pt[][] {
  return (d.match(/M[^MZ]*/g) ?? [])
    .map(ring =>
      ring
        .slice(1)
        .split("L")
        .map(pair => pair.split(",").map(Number) as Pt)
        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y)),
    )
    .filter(points => points.length > 2)
    .map(points => [...points, points[0]]);
}

/**
    How many levels apart labelled levels are (see `contourConfig.labelStep`):
    a whole number of at least 1, or with `"auto"` (or anything else), 1
    with up to `CONTOUR_LABEL_MAX_LEVELS` levels and 2 with more.
    @param option The `labelStep` option.
    @param count How many levels there are.
*/
export function contourLabelStep(option: unknown, count: number): number {
  if (typeof option === "number" && Number.isFinite(option))
    return Math.max(1, Math.round(option));
  return count > CONTOUR_LABEL_MAX_LEVELS ? 2 : 1;
}

/**
    Which levels take labels: every `step`-th one, keeping the levels at
    multiples of `step` times their spacing (the "index" contours), or
    every `step`-th position, from the `step`-th lowest, when the levels
    aren't evenly spaced from zero.
    @param levels The levels, lowest first.
    @param step How many levels apart labelled levels are (see `contourLabelStep`).
*/
export function labelledLevels(
  levels: number[],
  step = contourLabelStep("auto", levels.length),
): boolean[] {
  if (step <= 1) return levels.map(() => true);
  const spacing = levels[1] - levels[0];
  const even =
    spacing > 0 &&
    levels.every((l, i) => !i || Math.abs(l - levels[i - 1] - spacing) < 1e-9);
  const multiple = (l: number) => Math.round(l / spacing) % step === 0;
  if (
    even &&
    Math.abs(levels[0] / spacing - Math.round(levels[0] / spacing)) < 1e-9
  )
    return levels.map(multiple);
  return levels.map((_, i) => (i + 1) % step === 0);
}

/**
    The least distance between two labels' middles along one contour line,
    in pixels (see `contourConfig.labelSpacing`): a positive number as
    given, or with `"auto"` (or anything else), 20 ems or half the plot's
    mean side, whichever is longer.
    @param option The `labelSpacing` option.
    @param fontSize The labels' font size.
    @param frame The plot area.
*/
export function contourLabelSpacing(
  option: unknown,
  fontSize: number,
  frame: Pick<PlotFrame, "width" | "height">,
): number {
  if (typeof option === "number" && option > 0 && Number.isFinite(option))
    return option;
  return Math.max(fontSize * 20, (frame.width + frame.height) / 4);
}

/**
    The distance between two points along a closed ring of length `total`,
    whichever way round is shorter.
    @param a How far along the ring the first point lies.
    @param b How far along the ring the second point lies.
    @param total The ring's length.
*/
export function ringDistance(a: number, b: number, total: number): number {
  const d = Math.abs((((a - b) % total) + total) % total);
  return Math.min(d, total - d);
}

/**
    The points a placed label keeps other labels from: its band (see
    `labelBand`), widened by half an em above and below, so stacked labels
    on neighboring contours keep a gap between them.
    @param points The label's upright stretch.
    @param ctx The font size and lift.
*/
export function paddedBand(points: Pt[], ctx: StretchContext): Pt[] {
  const pad = ctx.fontSize / 2;
  return [-pad, 0, pad].flatMap(d =>
    labelBand(points, {...ctx, lift: ctx.lift + d}),
  );
}

/**
    The stretches labels along a closed ring take, on the ring smoothed of
    kinks shorter than a letter: as many as its length allows at `spacing`
    pixels apart (at least one), each the best-scoring stretch left that is
    clear of the obstacles and at least `spacing` along the ring from the
    others. Each one's padded band (see `paddedBand`) is added to the
    obstacles.
    @param ring The closed ring.
    @param length Each label's length.
    @param ctx The obstacles (ignoring the ring's own points), plot area, and font.
    @param spacing The least distance between two labels' middles along the ring (at least a label's length).
*/
export function ringLabelStretches(
  ring: Pt[],
  length: number,
  ctx: StretchContext,
  spacing: number,
): Pt[][] {
  const path = smoothPolyline(ring, PATH_LABEL_SMOOTHING * ctx.fontSize);
  const total = polylineLength(path);
  if (!(total > length * 2)) return [];
  // Labels closer than their own length would overlap.
  const gap = Math.max(spacing, length);
  // Twice round, so a stretch can cross where the ring starts and ends.
  const loop = trimPolyline([...path, ...path.slice(1)], 0, total + length);
  const count = Math.max(1, Math.floor(total / gap));
  const middles: number[] = [];
  const out: Pt[][] = [];
  while (out.length < count) {
    const spot = bestStretchAt(
      [loop],
      length,
      ctx,
      from =>
        from < total &&
        middles.every(m => ringDistance(from + length / 2, m, total) >= gap),
    );
    if (!spot) break;
    middles.push(spot.from + length / 2);
    out.push(spot.points);
    ctx.grid.add(paddedBand(spot.points, ctx));
  }
  return out;
}

/** Each contour level's drawn color, by its index: its stroke, or for filled contours its fill. */
function levelColors(nodes: SceneNode[]): Map<number, string> {
  const colors = new Map<number, string>();
  for (const node of nodes) {
    const meta = hexbinMeta(node.datum as DataPoint | undefined);
    if (meta?.kind !== "contour") continue;
    const paint = node.paint ?? {};
    const color = (paint.strokeWidth ?? 0) > 0 ? paint.stroke : paint.fill;
    if (color) colors.set(meta.index, color);
  }
  return colors;
}

/** The plot area's edges. */
const frameEdges = (frame: PlotFrame): Edges => ({
  x0: frame.left,
  y0: frame.top,
  x1: frame.left + frame.width,
  y1: frame.top + frame.height,
});

/**
    The labels along a Hexbin's contour lines (`contourConfig.labels`): for
    each labelled level, its formatted value along its rings, centered on
    the line, upright, on a pad of the chart's background that breaks the
    line beneath (when the contours are lines). Inert: no hover, click, or
    keyboard stop.
    @param viz The chart.
    @param rows The contour rows, lowest level first.
    @param nodes The contours' drawn nodes, for their colors.
    @param frame The plot area.
    @param settings The chart's resolved options.
    @param obstacles Other lines to keep clear of, such as trend lines.
*/
export function emitContourLabels(
  viz: VizInstance,
  rows: DataPoint[],
  nodes: SceneNode[],
  frame: PlotFrame,
  settings: HexbinSettings,
  obstacles: Pt[][] = [],
): SceneNode[] {
  const {labels, labelSpacing, labelStep, strokeWidth} = settings.contourConfig;
  const {minRadius, ...labelConfig} = settings.contourConfig.labelConfig;
  if (!labels || !rows.length) return [];
  const metas = rows
    .map(row => hexbinMeta(row))
    .filter((m): m is ContourMeta => m?.kind === "contour");
  const rings = metas.map(meta => contourRings(meta.path));
  const fontSize =
    typeof labelConfig.fontSize === "number"
      ? labelConfig.fontSize
      : CONTOUR_LABEL_FONT_SIZE;
  const style = {
    "font-family": fontExists(
      (labelConfig.fontFamily as string | string[] | undefined) ??
        defaultFontFamily,
    ) as string,
    "font-size": fontSize,
    "font-weight": (labelConfig.fontWeight as number | undefined) ?? 600,
  };
  const rect = frameEdges(frame);
  const grid = new PointGrid(fontSize);
  for (const line of obstacles) grid.add(resample(line, 2));
  let tag = 0;
  const tags = rings.map(level =>
    level.map(ring => {
      grid.add(resample(ring, 2), tag);
      return tag++;
    }),
  );
  const ctx: StretchContext = {
    grid,
    rect,
    fontSize,
    lift: -BASELINE_DROP * fontSize,
    maxTurn: MAX_TURN,
    minRadius: labelMinRadius(minRadius),
    // Wide enough that no line slips between the band's rows.
    minClearance: Math.max(2, CLEARANCE * fontSize),
  };
  const spacing = contourLabelSpacing(labelSpacing, fontSize, frame);
  const colors = levelColors(nodes);
  const lines = settings.contours === "lines" && strokeWidth > 0;
  const labelled = labelledLevels(
    metas.map(m => m.level),
    contourLabelStep(labelStep, metas.length),
  );
  const pads: SceneNode[] = [];
  const texts: PathLabel[] = [];
  metas.forEach((meta, l) => {
    if (!labelled[l]) return;
    const text = contourLevelText(viz, meta.level);
    if (!text) return;
    const length = (textWidth(text, style) as number) + 2 * END_GAP * fontSize;
    rings[l].forEach((ring, r) => {
      ctx.ignore = tags[l][r];
      ringLabelStretches(ring, length, ctx, spacing).forEach((stretch, k) => {
        const key = `contour-label-${meta.index}-${r}-${k}`;
        if (lines)
          pads.push({
            type: "path",
            key: `${key}-pad`,
            d: polylineD(stretch),
            interactive: false,
            aria: {hidden: true},
            paint: {
              fill: "none",
              stroke: chartBackground(viz),
              strokeWidth: strokeWidth + 2,
              strokeLinecap: "butt",
            },
          });
        texts.push({
          key,
          text,
          d: polylineD(offsetPolyline(stretch, ctx.lift)),
          color: colors.get(meta.index) ?? backgroundInk(viz),
          anchor: "middle",
        });
      });
    });
  });
  return [
    ...pads,
    ...pathLabelNodes(viz, texts, {
      fontSize,
      ...labelConfig,
    }),
  ];
}
