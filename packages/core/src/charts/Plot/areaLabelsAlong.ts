/**
    Stacked area labels along their bands (`labelPosition: "along"`, the
    default for stacked areas): each series' name runs along its band's
    centerline, on the stretch where the band is thick enough for the text
    and flattest, in a color that reads on the band's fill. The font shrinks
    to fit a thinner band, and a band too thin for its name everywhere goes
    unlabeled.
*/
import {rgb} from "d3-color";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {fontExists, textWidth} from "@d3plus/dom";
import {fontFamily as defaultFontFamily} from "@d3plus/text";
import {samplePath} from "@d3plus/render";
import type {SceneNode} from "@d3plus/render";

import {shapeConfigFor, userLabelConfig} from "../features/emitHelpers.js";
import {offsetPolyline, polylineD} from "../features/pathLabelGeometry.js";
import type {Edges, Pt} from "../features/pathLabelGeometry.js";
import {pathLabelNodes} from "../features/pathLabels.js";
import type {PathLabel} from "../features/pathLabels.js";
import {chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {outsideBaselineBreak} from "./baselineBreak.js";
import {bestStretch, labelFont, PointGrid} from "./lineLabelsAlong.js";
import type {StretchContext} from "./lineLabelsAlong.js";

/** The room a label keeps from its band's edges, above and below it together. */
export const AREA_LABEL_PADDING = 4;

/** How far past a label, in font sizes, more room in its band still scores better. */
const ROOM_REACH = 1.5;

/** The largest along label when the Area's labelConfig sets no `fontSize` or `fontMax`. */
export const AREA_LABEL_FONT_MAX = 16;

/** The smallest along label, whatever lower `fontMin` the Area's labelConfig sets. */
export const AREA_LABEL_FONT_MIN = 8;

/**
    Whether a `labelPosition` value runs a stacked area's label along its
    band: `"along"` and `"auto"` (or anything unrecognized) do, `"inside"`
    and `"outside"` keep it in the band's largest box.
    @param position The row's `labelPosition`.
*/
export function labelsAlongBand(position: unknown): boolean {
  return position !== "inside" && position !== "outside";
}

/** A point on a band's centerline, and how thick the band is across it. */
export interface BandSection {
  point: Pt;
  thickness: number;
}

/**
    The centerline of a band: at every `step` pixels along `axis` (0 for a
    band running along x, 1 along y), the midpoint between the band's two
    edges there, and the distance between them.
    @param outline The band's closed outline.
    @param axis The axis the band runs along.
    @param step The spacing of the centerline's points.
*/
export function bandSections(
  outline: Pt[],
  axis: 0 | 1 = 0,
  step = 3,
): BandSection[] {
  if (outline.length < 3) return [];
  const other = axis ? 0 : 1;
  let lo = Infinity,
    hi = -Infinity;
  for (const p of outline) {
    lo = Math.min(lo, p[axis]);
    hi = Math.max(hi, p[axis]);
  }
  if (!(hi > lo)) return [];
  const count = Math.ceil((hi - lo) / step);
  const gap = (hi - lo) / count;
  const near = new Array<number>(count + 1).fill(Infinity);
  const far = new Array<number>(count + 1).fill(-Infinity);
  const mark = (k: number, v: number) => {
    near[k] = Math.min(near[k], v);
    far[k] = Math.max(far[k], v);
  };
  for (let i = 1; i < outline.length; i++) {
    const a = outline[i - 1],
      b = outline[i];
    const span = b[axis] - a[axis];
    const from = Math.ceil((Math.min(a[axis], b[axis]) - lo) / gap - 1e-9);
    const to = Math.floor((Math.max(a[axis], b[axis]) - lo) / gap + 1e-9);
    for (let k = from; k <= to; k++) {
      if (!span) {
        mark(k, a[other]);
        mark(k, b[other]);
      } else {
        const t = (lo + k * gap - a[axis]) / span;
        mark(k, a[other] + t * (b[other] - a[other]));
      }
    }
  }
  const out: BandSection[] = [];
  near.forEach((v, k) => {
    if (v > far[k]) return;
    const mid = (v + far[k]) / 2;
    const at = lo + k * gap;
    out.push({point: axis ? [mid, at] : [at, mid], thickness: far[k] - v});
  });
  return out;
}

/**
    The runs of a band's centerline where the band is at least `min` thick:
    the only places a label that needs that much room can sit.
    @param sections The band's sections (see `bandSections`).
    @param min The least thickness.
*/
export function thickRuns(sections: BandSection[], min: number): Pt[][] {
  const runs: Pt[][] = [];
  let run: Pt[] = [];
  for (const s of sections) {
    if (s.thickness >= min) run.push(s.point);
    else {
      if (run.length > 1) runs.push(run);
      run = [];
    }
  }
  if (run.length > 1) runs.push(run);
  return runs;
}

/**
    The polyline with points added along every segment longer than `step`,
    so no stretch of it is more than `step` pixels from a point.
    @param points The polyline.
    @param step The longest gap left between points.
*/
export function densify(points: Pt[], step: number): Pt[] {
  const out: Pt[] = points.slice(0, 1);
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const n = Math.ceil(Math.hypot(bx - ax, by - ay) / step);
    for (let k = 1; k <= n; k++)
      out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return out;
}

/**
    The font sizes to try for an along label, largest first: from `fontSize`
    (or `fontMax`) down to `fontMin`, a pixel at a time, stopping at
    `AREA_LABEL_FONT_MIN` however low `fontMin` goes (unless `fontSize`
    itself is smaller).
    @param config The Area's labelConfig.
*/
export function labelSizes(config: Record<string, unknown> = {}): number[] {
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;
  const max =
    num(config.fontSize) ?? num(config.fontMax) ?? AREA_LABEL_FONT_MAX;
  const floor = Math.max(num(config.fontMin) ?? 0, AREA_LABEL_FONT_MIN);
  const min = Math.min(max, floor);
  const sizes: number[] = [];
  for (let s = max; s >= min; s--) sizes.push(s);
  if (sizes[sizes.length - 1] !== min) sizes.push(min);
  return sizes;
}

/**
    The text color of a band's label: the `fontColor` a user's labelConfig
    sets (a color, or an accessor of the band's datum and index), else the
    color that contrasts with the band.
    @param fontColor The user's `fontColor`, if any.
    @param datum The band's datum.
    @param index The band's index.
    @param fill The color the band shows.
    @param colorDefaults The chart's `colorDefaults`, for the contrast.
*/
export function bandTextColor(
  fontColor: unknown,
  datum: DataPoint,
  index: number,
  fill: string,
  colorDefaults?: Parameters<typeof colorContrast>[1],
): string {
  const own =
    typeof fontColor === "function" ? fontColor(datum, index) : fontColor;
  if (typeof own === "string" && own) return own;
  return colorContrast(fill, colorDefaults);
}

/** Where a band's label goes: the path its baseline follows, and its font size. */
export interface BandLabelPlacement {
  /** The baseline, upright, in the plot's coordinates. */
  points: Pt[];
  fontSize: number;
}

/**
    The best stretch of a band's centerline for its label, at the largest
    font size that fits: a stretch where the band is at least the font size
    plus `AREA_LABEL_PADDING` thick under the whole label and inside the
    plot, scored toward where the band is thickest and flattest. Null when
    no size fits anywhere.
    @param outlines The band's closed outlines (one per run of defined data).
    @param width The label's width at a font size.
    @param sizes The font sizes to try, largest first.
    @param rect The plot area.
    @param axis The axis the band runs along.
*/
export function placeBandLabel(
  outlines: Pt[][],
  width: (fontSize: number) => number,
  sizes: number[],
  rect: Edges,
  axis: 0 | 1 = 0,
): BandLabelPlacement | null {
  const sections = outlines.map(o => bandSections(o, axis));
  const thickest = Math.max(0, ...sections.flat().map(s => s.thickness));
  if (!sizes.length) return null;
  const grid = new PointGrid(Math.max(...sizes) * ROOM_REACH);
  for (const outline of outlines) grid.add(densify(outline, 2));
  for (const fontSize of sizes) {
    // A band is no thicker across its slope than straight across its axis,
    // so only the runs that thick need scoring.
    const need = fontSize + AREA_LABEL_PADDING;
    if (need > thickest) continue;
    const runs = sections.flatMap(s => thickRuns(s, need));
    // The glyphs, 0.2em below the baseline to 0.8em above it, center on the
    // centerline, and keep half the padding from either edge.
    const ctx: StretchContext = {
      grid,
      rect,
      fontSize,
      lift: -0.3 * fontSize,
      minClearance: 0.2 * fontSize + AREA_LABEL_PADDING / 2,
      roomReach: fontSize * ROOM_REACH,
      roomWeight: 1.5,
      // Bands running up the chart read bottom to top within 25° of upright.
      steep: axis ? Math.tan((25 * Math.PI) / 180) : undefined,
    };
    const stretch = bestStretch(runs, width(fontSize) + fontSize, ctx);
    if (stretch) return {points: offsetPolyline(stretch, ctx.lift), fontSize};
  }
  return null;
}

/**
    The color a band shows: its fill, laid over the chart's background at
    its opacity.
    @param fill The band's fill.
    @param opacity Its fill opacity.
    @param background The chart's background.
*/
export function bandColor(
  fill: string,
  opacity: number,
  background: string,
): string {
  if (opacity >= 1) return fill;
  const f = rgb(fill),
    b = rgb(background);
  if (Number.isNaN(f.r) || Number.isNaN(b.r)) return fill;
  const mix = (x: number, y: number) => x * opacity + y * (1 - opacity);
  return rgb(mix(f.r, b.r), mix(f.g, b.g), mix(f.b, b.b)).formatHex();
}

/** A drawn stacked area: its datum, index, outlines, and the color it shows. */
interface Band {
  datum: DataPoint & {data?: DataPoint};
  index: number;
  key: string;
  outlines: Pt[][];
  fill: string;
}

/** Every drawn Area with a datum, sampled into outlines in the plot's coordinates. */
function drawnBands(nodes: SceneNode[], background: string): Band[] {
  const out: Band[] = [];
  const visit = (node: SceneNode, ox: number, oy: number) => {
    const t = node.transform ?? {};
    const x = ox + (t.x ?? 0),
      y = oy + (t.y ?? 0);
    if (node.type === "group") node.children.forEach(c => visit(c, x, y));
    if (
      node.type !== "path" ||
      node.shapeType !== "Area" ||
      !node.datum ||
      `${node.key}`.endsWith("::hit")
    )
      return;
    const outlines = (node.d.match(/M[^M]*/g) ?? [])
      .map(d => samplePath(d).points.map(([px, py]): Pt => [px + x, py + y]))
      .filter(points => points.length > 2);
    const paint = node.paint ?? {};
    const opacity =
      (typeof paint.fillOpacity === "number" ? paint.fillOpacity : 1) *
      (typeof paint.opacity === "number" ? paint.opacity : 1);
    out.push({
      datum: node.datum as Band["datum"],
      index: node.index ?? 0,
      key: `${node.key}`,
      outlines,
      fill: bandColor(`${paint.fill ?? "#444"}`, opacity, background),
    });
  };
  nodes.forEach(n => visit(n, 0, 0));
  return out;
}

/** A label's text from the Area's `label` accessor, or null for none. */
function labelText(label: unknown, d: DataPoint, i: number): string | null {
  let text = typeof label === "function" ? label(d, i) : label;
  if (Array.isArray(text)) text = text[0];
  if (text === false || text === null || text === undefined || text === "")
    return null;
  return `${text}`;
}

/**
    The labels along every stacked area band whose `labelPosition` runs it
    along (see `labelsAlongBand`), each in the text the Area's `label` gives.
    Counts the bands and labels into `viz._alongStats`, for the legend.
    @param viz The chart.
    @param marks The plot's drawn marks, its Areas among them.
    @param rect The plot area.
*/
export function emitAreaLabels(
  viz: VizInstance,
  marks: SceneNode[],
  rect: Edges,
): SceneNode[] {
  if (!viz.schema.stacked) return [];
  const background = chartBackground(viz);
  const bands = drawnBands(marks, background);
  if (!bands.length) return [];
  const config = shapeConfigFor(viz, "Area");
  const {fontColor} = userLabelConfig(viz, "Area");
  const font = labelFont(viz, "Area");
  const sizes = labelSizes(
    (config.labelConfig ?? {}) as Record<string, unknown>,
  );
  const style = {
    "font-family": fontExists(
      (font.fontFamily as string | string[]) ?? defaultFontFamily,
    ) as string,
    "font-weight": (font.fontWeight as number) ?? 600,
  };
  const axis = viz.schema.discrete === "y" ? 1 : 0;
  const position = viz.schema.labelPosition;
  // Counted for the legend (see `alongLegend.ts`).
  const stats = viz._alongStats;
  if (stats) stats.series += bands.length;
  const labels = bands.flatMap(band => {
    const row = (band.datum.data ?? band.datum) as DataPoint;
    const where =
      typeof position === "function" ? position(row, band.index) : position;
    if (!labelsAlongBand(where)) return [];
    const text = labelText(config.label, band.datum, band.index);
    if (!text) return [];
    if (stats) stats.requested++;
    const outlines = band.outlines.map(o => outsideBaselineBreak(viz, o));
    const placed = placeBandLabel(
      outlines,
      fontSize => textWidth(text, {...style, "font-size": fontSize}) as number,
      sizes,
      rect,
      axis,
    );
    if (!placed) return [];
    if (stats) stats.placed++;
    return [
      {
        key: `area-label-along-${band.key}`,
        text,
        d: polylineD(placed.points),
        color: bandTextColor(
          fontColor,
          band.datum,
          band.index,
          band.fill,
          viz.schema.colorDefaults,
        ),
        anchor: "middle" as const,
        datum: band.datum,
        index: band.index,
        fontSize: placed.fontSize,
      },
    ];
  });
  return pathLabelNodes(
    viz,
    labels,
    {
      ...font,
      fontColor: (d: PathLabel) => d.color,
      fontSize: (d: PathLabel & {fontSize: number}) => d.fontSize,
    },
    {halo: false},
  );
}

/**
    Wraps a stacked Area's `label` accessor so the bands labeled along their
    centerline (see `emitAreaLabels`) draw no label of their own.
    @param viz The chart.
    @param label The Area's `label` accessor.
*/
export function boxLabelsOnly(
  viz: VizInstance,
  label: unknown,
): (d: DataPoint, i: number) => unknown {
  return (d: DataPoint, i: number) => {
    const wrapped = d as DataPoint & {__d3plus__?: boolean; data?: DataPoint};
    const row = wrapped.__d3plus__ && wrapped.data ? wrapped.data : d;
    const index = typeof wrapped.i === "number" ? wrapped.i : i;
    const position = viz.schema.labelPosition;
    const where =
      typeof position === "function" ? position(row, index) : position;
    if (labelsAlongBand(where)) return false;
    return typeof label === "function" ? label(d, i) : label;
  };
}
