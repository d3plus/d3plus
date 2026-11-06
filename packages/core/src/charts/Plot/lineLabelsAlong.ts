/**
    Line labels along their lines (`lineLabels: "along"`): each series' name
    runs along its own line, following its curve, on the stretch a scored
    search finds flattest and clearest of the other lines and labels. The
    text reads upright, and a series with no clear stretch goes unlabeled.
*/
import {fontExists, textWidth} from "@d3plus/dom";
import {fontFamily as defaultFontFamily} from "@d3plus/text";
import {samplePath} from "@d3plus/render";
import type {SceneNode} from "@d3plus/render";

import type {DataPoint} from "@d3plus/data";
import {shapeConfigFor} from "../features/emitHelpers.js";
import {
  offsetPolyline,
  polylineD,
  polylineLength,
  trimPolyline,
  uprightPoints,
} from "../features/pathLabelGeometry.js";
import type {Edges, Pt} from "../features/pathLabelGeometry.js";
import {PATH_LABEL_FONT_SIZE, pathLabelNodes} from "../features/pathLabels.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {rowLabelsAlong} from "./lineLabelSides.js";

/** Obstacle points, bucketed by cell for nearest-distance lookups. */
export class PointGrid {
  private cells = new Map<string, Pt[]>();

  /** @param cell The cell size: lookups see obstacles this far away. */
  constructor(private cell: number) {}

  private key(x: number, y: number): string {
    return `${Math.floor(x / this.cell)},${Math.floor(y / this.cell)}`;
  }

  /** Adds obstacle points. */
  add(points: Pt[]): void {
    for (const p of points) {
      const k = this.key(p[0], p[1]);
      const list = this.cells.get(k);
      if (list) list.push(p);
      else this.cells.set(k, [p]);
    }
  }

  /** The distance from `p` to its nearest obstacle within one cell, or `Infinity`. */
  nearest(p: Pt): number {
    const cx = Math.floor(p[0] / this.cell),
      cy = Math.floor(p[1] / this.cell);
    let best = Infinity;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const q of this.cells.get(`${cx + dx},${cy + dy}`) ?? [])
          best = Math.min(best, Math.hypot(p[0] - q[0], p[1] - q[1]));
    return best;
  }
}

/**
    Points every `step` pixels along a polyline.
    @param points The polyline.
    @param step The spacing.
*/
export function resample(points: Pt[], step: number): Pt[] {
  const length = polylineLength(points);
  const out: Pt[] = [];
  for (let s = 0; s <= length; s += step) {
    const [p] = trimPolyline(points, s, s);
    if (p) out.push(p);
  }
  return out;
}

/**
    How much a stretch bends: the sum of its turns, in radians.
    @param points The stretch.
*/
export function curvature(points: Pt[]): number {
  let total = 0;
  let prev: number | null = null;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0],
      dy = points[i][1] - points[i - 1][1];
    if (!dx && !dy) continue;
    const angle = Math.atan2(dy, dx);
    if (prev !== null) {
      let turn = Math.abs(angle - prev);
      if (turn > Math.PI) turn = 2 * Math.PI - turn;
      total += turn;
    }
    prev = angle;
  }
  return total;
}

/** What scoring a stretch needs. */
export interface StretchContext {
  grid: PointGrid;
  rect: Edges;
  fontSize: number;
  /** How far above the line the text's baseline sits. */
  lift: number;
}

/**
    The points a label along `points` would cover: its baseline and two rows
    above it, up to its letters' height.
    @param points The upright stretch.
    @param ctx The font size and lift.
*/
export function labelBand(points: Pt[], ctx: StretchContext): Pt[] {
  const step = Math.max(2, ctx.fontSize / 2);
  return [0, 0.35, 0.7].flatMap(f =>
    resample(offsetPolyline(points, ctx.lift + f * ctx.fontSize), step),
  );
}

/**
    A stretch's score, lower being better: how much it bends and slopes, less
    a bonus for room around its label; null when its label would leave the
    plot or touch another line or label.
    @param points The upright stretch.
    @param ctx The obstacles, plot area, and font.
*/
export function scoreStretch(points: Pt[], ctx: StretchContext): number | null {
  const band = labelBand(points, ctx);
  const {rect} = ctx;
  let clearance = Infinity;
  for (const p of band) {
    if (p[0] < rect.x0 || p[0] > rect.x1 || p[1] < rect.y0 || p[1] > rect.y1)
      return null;
    clearance = Math.min(clearance, ctx.grid.nearest(p));
  }
  if (clearance < 2) return null;
  const [x0, y0] = points[0];
  const [x1, y1] = points[points.length - 1];
  const slope = Math.abs(Math.atan2(y1 - y0, x1 - x0));
  const room = Math.min(clearance, ctx.fontSize) / ctx.fontSize;
  return curvature(points) * 2 + slope * 0.5 - room * 0.5;
}

/**
    The best-scoring stretch of `length` pixels along any of a line's
    pieces, upright, or null when every stretch is blocked or too bent.
    @param pieces The line's pieces (where its data has gaps), in pixels.
    @param length The stretch's length.
    @param ctx The obstacles, plot area, and font.
*/
export function bestStretch(
  pieces: Pt[][],
  length: number,
  ctx: StretchContext,
): Pt[] | null {
  let best: Pt[] | null = null;
  let bestScore = Infinity;
  const step = Math.max(4, ctx.fontSize / 2);
  for (const piece of pieces) {
    const total = polylineLength(piece);
    for (let from = 0; from + length <= total; from += step) {
      const stretch = uprightPoints(trimPolyline(piece, from, from + length));
      // A label can't follow a line that doubles back under it.
      if (curvature(stretch) > Math.PI / 2) continue;
      const score = scoreStretch(stretch, ctx);
      if (score !== null && score < bestScore) {
        bestScore = score;
        best = stretch;
      }
    }
  }
  return best;
}

/** A drawn series line: its row, and its pieces in the plot's coordinates. */
interface SeriesLine {
  row: DataPoint & {data?: DataPoint; i?: number};
  key: string;
  color: string;
  pieces: Pt[][];
}

/** Every drawn Line's pieces, sampled into points, with the offsets of the groups around it. */
function seriesLines(nodes: SceneNode[]): SeriesLine[] {
  const out: SeriesLine[] = [];
  const visit = (node: SceneNode, ox: number, oy: number) => {
    const t = node.transform ?? {};
    const x = ox + (t.x ?? 0),
      y = oy + (t.y ?? 0);
    if (node.type === "group") node.children.forEach(c => visit(c, x, y));
    const row = node.datum as SeriesLine["row"] | undefined;
    if (
      node.type !== "path" ||
      node.shapeType !== "Line" ||
      `${node.key}`.endsWith("::hit") ||
      row?.shape !== "Line"
    )
      return;
    // Each moveto starts a piece of its own (a gap in the data).
    const pieces = (node.d.match(/M[^M]*/g) ?? [])
      .map(d => samplePath(d).points.map(([px, py]): Pt => [px + x, py + y]))
      .filter(points => points.length > 1);
    const stroke = node.paint?.stroke;
    out.push({row, key: `${node.key}`, color: `${stroke ?? "#444"}`, pieces});
  };
  nodes.forEach(n => visit(n, 0, 0));
  return out;
}

/** The label font the Line shape's labelConfig sets, as plain values. */
function labelFont(viz: VizInstance): Record<string, unknown> {
  const config = (shapeConfigFor(viz, "Line").labelConfig ?? {}) as Record<
    string,
    unknown
  >;
  const out: Record<string, unknown> = {};
  for (const key of ["fontFamily", "fontSize", "fontWeight"])
    if (config[key] !== undefined && typeof config[key] !== "function")
      out[key] = config[key];
  return out;
}

/**
    The labels for every series `lineLabels` runs along its line, placed one
    by one so each stays clear of the lines and the labels before it. A
    plot (or panel) with a single line labels none. Counts the lines and
    labels into `viz._alongStats`, for the legend (see `alongLegend.ts`).
    @param viz The chart.
    @param marks The plot's drawn marks, its Lines among them.
    @param rect The plot area.
*/
export function emitAlongLabels(
  viz: VizInstance,
  marks: SceneNode[],
  rect: Edges,
): SceneNode[] {
  const setting = viz.schema.lineLabels;
  if (!setting) return [];
  const lines = seriesLines(marks);
  const along = lines.filter(l =>
    rowLabelsAlong(setting, (l.row.data ?? l.row) as DataPoint, l.row.i ?? 0),
  );
  const stats = viz._alongStats;
  if (stats) {
    stats.lines += lines.length;
    stats.requested += along.length;
  }
  // A lone line needs no name.
  if (!along.length || lines.length < 2) return [];
  const font = labelFont(viz);
  const fontSize = (font.fontSize as number) ?? PATH_LABEL_FONT_SIZE;
  const style = {
    "font-family": fontExists(
      (font.fontFamily as string | string[]) ?? defaultFontFamily,
    ) as string,
    "font-size": fontSize,
    "font-weight": (font.fontWeight as number) ?? 600,
  };
  const grid = new PointGrid(fontSize);
  for (const line of lines)
    for (const piece of line.pieces) grid.add(resample(piece, 2));
  const ctx: StretchContext = {grid, rect, fontSize, lift: 3.5};
  // A series drawn as several lines (observed and predicted, say) is named
  // once: its later lines count as named when an earlier one was.
  const named = new Set<string>();
  const labels = along.flatMap(line => {
    const text = `${viz._drawLabel(line.row, line.row.i ?? 0)}`;
    if (named.has(text)) {
      if (stats) stats.placed++;
      return [];
    }
    const length = (textWidth(text, style) as number) + fontSize;
    const stretch = bestStretch(line.pieces, length, ctx);
    if (!stretch) return [];
    grid.add(labelBand(stretch, ctx));
    named.add(text);
    if (stats) stats.placed++;
    return [
      {
        key: `line-label-along-${line.key}`,
        text,
        d: polylineD(offsetPolyline(stretch, ctx.lift)),
        color: line.color,
        anchor: "middle" as const,
      },
    ];
  });
  return pathLabelNodes(viz, labels, font);
}
