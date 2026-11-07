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
  PolylineRuler,
  uprightPoints,
} from "../features/pathLabelGeometry.js";
import type {Edges, Pt} from "../features/pathLabelGeometry.js";
import {PATH_LABEL_FONT_SIZE, pathLabelNodes} from "../features/pathLabels.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {rowLabelsAlong} from "./lineLabelSides.js";

/**
    Obstacle points, bucketed by cell for nearest-distance lookups. Each
    point may carry a tag, so a lookup can ignore the points of the line a
    label sits on.
*/
export class PointGrid {
  private cells = new Map<number, [number, number, number][]>();

  /** @param cell The cell size: lookups see obstacles this far away. */
  constructor(private cell: number) {}

  /** A cell's key: its column and row, packed into one number. */
  private static key(cx: number, cy: number): number {
    return cx * 1048576 + cy;
  }

  /**
      Adds obstacle points.
      @param points The points.
      @param tag A tag `nearest` can ignore them by.
  */
  add(points: Pt[], tag = -1): void {
    for (const [x, y] of points) {
      const k = PointGrid.key(
        Math.floor(x / this.cell),
        Math.floor(y / this.cell),
      );
      const list = this.cells.get(k);
      if (list) list.push([x, y, tag]);
      else this.cells.set(k, [[x, y, tag]]);
    }
  }

  /**
      The distance from `p` to its nearest obstacle within one cell, or `Infinity`.
      @param p The point.
      @param ignore A tag whose points are left out.
  */
  nearest(p: Pt, ignore?: number): number {
    const cx = Math.floor(p[0] / this.cell),
      cy = Math.floor(p[1] / this.cell);
    let best = Infinity;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const list = this.cells.get(PointGrid.key(cx + dx, cy + dy));
        if (!list) continue;
        for (const [x, y, tag] of list) {
          if (tag !== -1 && tag === ignore) continue;
          const ex = p[0] - x,
            ey = p[1] - y;
          const d = ex * ex + ey * ey;
          if (d < best) best = d;
        }
      }
    return Math.sqrt(best);
  }
}

/**
    Points every `step` pixels along a polyline.
    @param points The polyline.
    @param step The spacing.
*/
export function resample(points: Pt[], step: number): Pt[] {
  const ruler = new PolylineRuler(points);
  const out: Pt[] = [];
  for (let s = 0; s <= ruler.length; s += step) {
    const p = ruler.at(s);
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
  /** How far above the line the text's baseline sits (below it when negative). */
  lift: number;
  /** The least room a label needs from every obstacle. Defaults to `2`. */
  minClearance?: number;
  /** The room past which a stretch scores no better. Defaults to the font size. */
  roomReach?: number;
  /** How much room counts against bends and slope. Defaults to `0.5`. */
  roomWeight?: number;
  /** How steep a stretch reads bottom to top (see `uprightPoints`). */
  steep?: number;
  /** A grid tag to ignore: the points of the line the label sits on. */
  ignore?: number;
  /** The most a stretch may turn in all, in radians (default a right angle). */
  maxTurn?: number;
}

/**
    The points a label along `points` would cover: its baseline and two rows
    above it, up to its letters' height.
    @param points The upright stretch.
    @param ctx The font size and lift.
*/
export function labelBand(points: Pt[], ctx: StretchContext): Pt[] {
  return BAND_ROWS.flatMap(f => bandRow(points, ctx, f));
}

/** The rows of a label's band, as fractions of its font size above its baseline. */
const BAND_ROWS = [0, 0.35, 0.7];

/** One row of a label's band (see `labelBand`). */
function bandRow(points: Pt[], ctx: StretchContext, f: number): Pt[] {
  const step = Math.max(2, ctx.fontSize / 2);
  return resample(offsetPolyline(points, ctx.lift + f * ctx.fontSize), step);
}

/**
    A stretch's score, lower being better: how much it bends and slopes, less
    a bonus for room around its label (up to `roomReach`, weighted by
    `roomWeight`); null when its label would leave the
    plot or come within `minClearance` of an obstacle (another line or
    label, or the edges of the band it runs in).
    @param points The upright stretch.
    @param ctx The obstacles, plot area, and font.
*/
export function scoreStretch(points: Pt[], ctx: StretchContext): number | null {
  const {rect, minClearance = 2} = ctx;
  let clearance = Infinity;
  // Row by row, so a blocked stretch stops at its first blocked row.
  for (const f of BAND_ROWS)
    for (const p of bandRow(points, ctx, f)) {
      if (p[0] < rect.x0 || p[0] > rect.x1 || p[1] < rect.y0 || p[1] > rect.y1)
        return null;
      clearance = Math.min(clearance, ctx.grid.nearest(p, ctx.ignore));
      if (clearance < minClearance) return null;
    }
  const [x0, y0] = points[0];
  const [x1, y1] = points[points.length - 1];
  const slope = Math.abs(Math.atan2(y1 - y0, x1 - x0));
  const {roomReach = ctx.fontSize, roomWeight = 0.5} = ctx;
  const room = Math.min(clearance, roomReach) / roomReach;
  return curvature(points) * 2 + slope * 0.5 - room * roomWeight;
}

/** A stretch `bestStretchAt` found: its points, its piece, and where along the piece it starts. */
export interface StretchSpot {
  points: Pt[];
  piece: number;
  from: number;
}

/**
    The best-scoring stretch of `length` pixels along any of a line's
    pieces, upright, with where it lies, or null when every stretch is
    blocked or too bent.
    @param pieces The line's pieces (where its data has gaps), in pixels.
    @param length The stretch's length.
    @param ctx The obstacles, plot area, and font.
    @param allow Which stretches may be taken, by their piece and start.
*/
export function bestStretchAt(
  pieces: Pt[][],
  length: number,
  ctx: StretchContext,
  allow?: (from: number, piece: number) => boolean,
): StretchSpot | null {
  let best: StretchSpot | null = null;
  let bestScore = Infinity;
  const step = Math.max(4, ctx.fontSize / 2);
  const maxTurn = ctx.maxTurn ?? Math.PI / 2;
  for (let index = 0; index < pieces.length; index++) {
    const ruler = new PolylineRuler(pieces[index]);
    for (let from = 0; from + length <= ruler.length; from += step) {
      if (allow && !allow(from, index)) continue;
      const stretch = uprightPoints(ruler.trim(from, from + length), ctx.steep);
      // A label can't follow a line that doubles back under it.
      if (curvature(stretch) > maxTurn) continue;
      const score = scoreStretch(stretch, ctx);
      if (score !== null && score < bestScore) {
        bestScore = score;
        best = {points: stretch, piece: index, from};
      }
    }
  }
  return best;
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
  return bestStretchAt(pieces, length, ctx)?.points ?? null;
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

/**
    The label font a shape's labelConfig sets, as plain values.
    @param viz The chart.
    @param shape The shape whose labelConfig to read.
*/
export function labelFont(
  viz: VizInstance,
  shape = "Line",
): Record<string, unknown> {
  const config = (shapeConfigFor(viz, shape).labelConfig ?? {}) as Record<
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
    stats.series += lines.length;
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
