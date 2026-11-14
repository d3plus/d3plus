/**
    Trend line labels (`trendLineConfig.label`): text along each fitted line,
    near its end and just above it, kept upright, in the line's color over a
    halo of the chart's background. A label too long for its line is cut
    short with an ellipsis; a line too short for a label gets none.
*/
import {fontExists, textWidth} from "@d3plus/dom";
import {pathTextBoxes} from "@d3plus/render";
import type {SceneNode} from "@d3plus/render";
import {fontFamily as defaultFontFamily} from "@d3plus/text";

import {labelCorners, labelsOverlap} from "../features/linkLabelGeometry.js";
import type {LinkLabelBox} from "../features/linkLabelGeometry.js";
import {textLineBoxes} from "../features/linkLabels.js";
import type {PlotAxisFn} from "../features/plotPaint.js";
import {
  offsetPolyline,
  polylineD,
  polylineLength,
  trimPolyline,
  uprightPoints,
  visibleRun,
} from "../features/pathLabelGeometry.js";
import type {Edges, Pt} from "../features/pathLabelGeometry.js";
import {
  bendStrain,
  PATH_LABEL_SMOOTHING,
  smoothPolyline,
} from "../features/pathLabelBends.js";
import {PATH_LABEL_FONT_SIZE, pathLabelNodes} from "../features/pathLabels.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {TrendFit} from "./trendLines.js";
import {movingAverageWindowText} from "./trendMovingAverage.js";
import {coefficientFormat, trendEquation} from "./trendTooltip.js";

/** What `trendLineConfig.label` takes. */
export type TrendLabelSetting =
  boolean | "equation" | ((fit: TrendFit) => string | false | null | undefined);

/** How far a label stops short of its line's end, in pixels. */
const END_INSET = 6;

/**
    A fit's equation and R² as label text, e.g. `y = 2.1x + 3.4, R² = 0.84`,
    its coefficients abbreviated as the axes abbreviate numbers. A fit along
    a time axis shows only its R² (an equation in milliseconds since 1970
    says nothing a reader can use), and a moving average, which has
    neither, shows nothing.
    @param fit The fitted trend line.
    @param locale The chart's locale.
    @param time Whether the fit runs along a time axis.
*/
export function trendEquationLabel(
  fit: Pick<TrendFit, "fit" | "axis">,
  locale: string,
  time = false,
): string {
  if (fit.fit.type === "movingAverage") return "";
  const r2 = `R² = ${fit.fit.r2.toFixed(2)}`;
  if (time) return r2;
  return `${trendEquation(fit.fit, coefficientFormat(locale), fit.axis)}, ${r2}`;
}

/**
    A fit's label text for a `trendLineConfig.label` setting, or null for
    none: `true` names the series ("Trend" for a line fit to every point),
    `"equation"` gives its equation and R² (a moving average's name and
    window, such as "Moving Average (7)" or "Moving Average (30 days)"), and
    a function returns any text.
    @param viz The chart.
    @param fit The fitted trend line.
    @param setting The configured label.
*/
export function trendLabelText(
  viz: VizInstance,
  fit: TrendFit,
  setting: unknown,
): string | null {
  if (!setting) return null;
  if (typeof setting === "function") {
    const text = (setting as (f: TrendFit) => unknown)(fit);
    return text === false || text === null || text === undefined || text === ""
      ? null
      : `${text}`;
  }
  if (setting === "equation" && fit.fit.type === "movingAverage")
    return `${viz.schema.translate("Moving Average")} (${movingAverageWindowText(viz, fit.fit)})`;
  if (setting === "equation")
    return trendEquationLabel(
      fit,
      viz.schema.locale,
      Boolean(viz[`_${fit.axis}Time`]),
    );
  return fit.row ? fit.label : viz.schema.translate("Trend");
}

/** A label's box: its center, size, and turn in degrees. */
type Box = LinkLabelBox;

/** What placing a trend label needs. */
export interface TrendPlacement {
  fontSize: number;
  /** How far above the line's center the text's baseline sits. */
  lift: number;
  /** The label text's width. */
  width: number;
  /** The boxes of the labels already placed, which this one must clear. */
  obstacles: Box[];
}

/** The boxes a label covers along `d`, `width` long from its start. */
function pathBoxes(d: string, width: number, fontSize: number): Box[] {
  return pathTextBoxes({
    type: "text",
    key: "",
    x: 0,
    y: 0,
    font: {size: fontSize, anchor: "start"},
    lines: [{text: " ", x: 0, y: 0, width}],
    path: {d},
  });
}

/** Whether a box comes within a few pixels of any obstacle (more along the text, so neighbors read apart). */
const blocked = (box: Box, obstacles: Box[]) => {
  const grown = {...box, width: box.width + 12, height: box.height + 4};
  return obstacles.some(o => labelsOverlap(grown, o));
};

/** Whether any corner of a box falls outside the plot area. */
const outside = (box: Box, rect: Edges) =>
  labelCorners(box).some(
    ([x, y]) =>
      x < rect.x0 - 0.5 ||
      x > rect.x1 + 0.5 ||
      y < rect.y0 - 0.5 ||
      y > rect.y1 + 0.5,
  );

/**
    The path a fit's label follows and the boxes it covers, or null when its
    line has no clear spot for it: the drawn (not projected) stretch inside
    the plot, upright, smoothed of kinks shorter than a letter, and stopped
    short of its end. The label prefers the end of the line, just above it;
    when that spot overlaps an earlier label, runs out of the plot area, or
    bends too tightly for its letters to follow (see `bendStrain`), it
    slides back along the line to the nearest clear, gentle stretch, then
    tries the same below the line. A line bent tightly everywhere takes the
    clear stretch that bends least. A line too short for a few letters gets
    none.
    @param points The fitted stretch's points, in pixels.
    @param rect The plot area.
    @param place The font, lift, text width, and labels to clear.
*/
export function trendLabelSpot(
  points: Pt[],
  rect: Edges,
  place: TrendPlacement,
): {d: string; boxes: Box[]} | null {
  const {fontSize, lift, width, obstacles} = place;
  const run = smoothPolyline(
    uprightPoints(visibleRun(points, rect)),
    PATH_LABEL_SMOOTHING * fontSize,
  );
  const end = polylineLength(run) - END_INSET;
  // Room for a few letters and their ellipsis, at least.
  if (end < fontSize * 4) return null;
  const span = Math.min(width, end);
  const step = fontSize / 2;
  let fallback: {d: string; boxes: Box[]; strain: number} | null = null;
  // Above the line, then below it (its baseline a letter's height lower).
  for (const baseline of [lift, -(lift + fontSize * 0.75)])
    for (let to = end; to - span >= -1e-9; to -= step) {
      const path = offsetPolyline(
        trimPolyline(run, Math.max(0, to - span), to),
        baseline,
      );
      const d = polylineD(path);
      const boxes = pathBoxes(d, span, fontSize);
      if (!boxes.some(b => blocked(b, obstacles) || outside(b, rect))) {
        const strain = bendStrain(path, fontSize);
        if (strain <= 1) return {d, boxes};
        if (!fallback || strain < fallback.strain)
          fallback = {d, boxes, strain};
      }
      if (span >= end) break;
    }
  return fallback && {d: fallback.d, boxes: fallback.boxes};
}

/**
    The boxes of the labels a trend label must clear: the line labels at the
    lines' ends and along them, and Hexbin's contour labels, wherever they
    sit among the marks.
    @param marks The plot's marks.
*/
export function lineLabelBoxes(marks: SceneNode[]): Box[] {
  const out: Box[] = [];
  const visit = (node: SceneNode, ox: number, oy: number) => {
    const x = ox + (node.transform?.x ?? 0),
      y = oy + (node.transform?.y ?? 0);
    if (node.type === "group") node.children.forEach(c => visit(c, x, y));
    if (node.type !== "text") return;
    const row = node.datum as {data?: {shape?: unknown}} | undefined;
    const along = /^(line-label-along|contour-label)-/.test(`${node.key}`);
    if (!along && row?.data?.shape !== "Line") return;
    for (const box of textLineBoxes([node]))
      out.push({...box, x: box.x + ox, y: box.y + oy});
  };
  marks.forEach(n => visit(n, 0, 0));
  return out;
}

/**
    The label nodes for every fitted trend line, when `trendLineConfig.label`
    asks for them, placed one at a time (in series order) so none overlaps
    another or the plot's line labels.
    @param viz The chart.
    @param x Maps an x value to pixels.
    @param y Maps a y value to pixels.
    @param rect The plot area.
    @param marks The plot's marks, for the line labels to clear.
*/
export function emitTrendLabels(
  viz: VizInstance,
  x: PlotAxisFn,
  y: PlotAxisFn,
  rect: Edges,
  marks: SceneNode[] = [],
): SceneNode[] {
  const config = viz._trendLineConfig || {};
  const setting = config.label as TrendLabelSetting | undefined;
  const fits = viz._trendFits || [];
  if (!setting || !fits.length) return [];
  const labelConfig = (config.labelConfig || {}) as Record<string, unknown>;
  const fontSize =
    typeof labelConfig.fontSize === "number"
      ? labelConfig.fontSize
      : PATH_LABEL_FONT_SIZE;
  const strokeWidth =
    typeof config.strokeWidth === "number" ? config.strokeWidth : 2;
  const style = {
    "font-family": fontExists(
      (labelConfig.fontFamily as string | string[]) ?? defaultFontFamily,
    ) as string,
    "font-size": fontSize,
    "font-weight": (labelConfig.fontWeight as number) ?? 600,
  };
  const obstacles = lineLabelBoxes(marks);
  const labels = fits.flatMap(fit => {
    const text = trendLabelText(viz, fit, setting);
    if (!text) return [];
    const points = fit.samples
      .filter(s => !s.projected)
      .map((s): Pt => [x(s.x), y(s.y)]);
    const spot = trendLabelSpot(points, rect, {
      fontSize,
      lift: strokeWidth / 2 + 2,
      // A little past the measured text, for the ellipsis's rounding.
      width: (textWidth(text, style) as number) + 2,
      obstacles,
    });
    if (!spot) return [];
    obstacles.push(...spot.boxes);
    return [
      {
        key: `trend-label-${fit.id}`,
        text,
        d: spot.d,
        color: fit.color,
        anchor: "end" as const,
      },
    ];
  });
  return pathLabelNodes(viz, labels, labelConfig);
}
