/**
    Trend line labels (`trendLineConfig.label`): text along each fitted line,
    near its end and just above it, kept upright, in the line's color over a
    halo of the chart's background. A label too long for its line is cut
    short with an ellipsis; a line too short for a label gets none.
*/
import type {SceneNode} from "@d3plus/render";

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
import {PATH_LABEL_FONT_SIZE, pathLabelNodes} from "../features/pathLabels.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {TrendFit} from "./trendLines.js";
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
    says nothing a reader can use).
    @param fit The fitted trend line.
    @param locale The chart's locale.
    @param time Whether the fit runs along a time axis.
*/
export function trendEquationLabel(
  fit: Pick<TrendFit, "fit" | "axis">,
  locale: string,
  time = false,
): string {
  const r2 = `R² = ${fit.fit.r2.toFixed(2)}`;
  if (time) return r2;
  return `${trendEquation(fit.fit, coefficientFormat(locale), fit.axis)}, ${r2}`;
}

/**
    A fit's label text for a `trendLineConfig.label` setting, or null for
    none: `true` names the series ("Trend" for a line fit to every point),
    `"equation"` gives its equation and R², and a function returns any text.
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
  if (setting === "equation")
    return trendEquationLabel(
      fit,
      viz.schema.locale,
      Boolean(viz[`_${fit.axis}Time`]),
    );
  return fit.row ? fit.label : viz.schema.translate("Trend");
}

/**
    The path a fit's label follows: the drawn (not projected) stretch of the
    line inside the plot, upright, lifted just above the stroke, and stopped
    short of its end; null when that stretch is too short for any text.
    @param points The fitted stretch's points, in pixels.
    @param rect The plot area.
    @param lift How far above the line's center the text's baseline sits.
    @param fontSize The label's font size.
*/
export function trendLabelPath(
  points: Pt[],
  rect: Edges,
  lift: number,
  fontSize: number,
): string | null {
  const run = uprightPoints(visibleRun(points, rect));
  const length = polylineLength(run);
  // Room for a few letters and their ellipsis, at least.
  if (length - END_INSET < fontSize * 4) return null;
  const path = offsetPolyline(trimPolyline(run, 0, length - END_INSET), lift);
  return polylineD(path);
}

/**
    The label nodes for every fitted trend line, when `trendLineConfig.label`
    asks for them.
    @param viz The chart.
    @param x Maps an x value to pixels.
    @param y Maps a y value to pixels.
    @param rect The plot area.
*/
export function emitTrendLabels(
  viz: VizInstance,
  x: PlotAxisFn,
  y: PlotAxisFn,
  rect: Edges,
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
  const labels = fits.flatMap(fit => {
    const text = trendLabelText(viz, fit, setting);
    if (!text) return [];
    const points = fit.samples
      .filter(s => !s.projected)
      .map((s): Pt => [x(s.x), y(s.y)]);
    const d = trendLabelPath(points, rect, strokeWidth / 2 + 2, fontSize);
    if (!d) return [];
    return [
      {
        key: `trend-label-${fit.id}`,
        text,
        d,
        color: fit.color,
        anchor: "end" as const,
      },
    ];
  });
  return pathLabelNodes(viz, labels, labelConfig);
}
