/**
    The tooltip shown when hovering a trend line: the series (or "Trend
    Line"), the regression type, its fitted equation, R², and the number of
    observations it was fit to.
*/
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {RegressionResult} from "@d3plus/math";
import type {SceneEvent} from "@d3plus/render";

import {configPrep} from "../../utils/index.js";
import type {VizContext} from "../../utils/configPrep.js";
import {tooltipSwatch, withSwatch} from "../features/tooltipSwatch.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {axisName, axisValue, prepareTooltip} from "./sharedTooltip.js";
import type {TrendFit, TrendSample} from "./trendLines.js";

const SUPERSCRIPTS: Record<string, string> = {2: "²", 3: "³"};

/** Display names for each regression type, as translation keys. */
export const trendTypeNames: Record<string, string> = {
  exponential: "Exponential",
  linear: "Linear",
  logarithmic: "Logarithmic",
  polynomial: "Polynomial",
  power: "Power",
};

/** Joins signed terms into "a + b − c", dropping zero terms. */
function joinTerms(terms: [number, string][], format: (n: number) => string): string {
  const kept = terms.filter(([c]) => c !== 0);
  if (!kept.length) return format(0);
  return kept
    .map(([c, unit], i) => {
      const body = `${format(Math.abs(c))}${unit}`;
      if (i === 0) return c < 0 ? `−${body}` : body;
      return c < 0 ? ` − ${body}` : ` + ${body}`;
    })
    .join("");
}

/**
    The fitted equation as display text, e.g. `y = 1.24x + 3.41k` or
    `y = 2e^(0.3x)`. `x` and `y` name the independent and dependent axes, and
    swap for a fit along the y axis (a horizontal chart).
    @param fit The regression result.
    @param format Formats each coefficient.
    @param axis The independent axis the fit runs along.
*/
export function trendEquation(
  fit: Pick<RegressionResult, "type" | "coefficients">,
  format: (n: number) => string = String,
  axis: "x" | "y" = "x",
): string {
  const x = axis;
  const y = axis === "x" ? "y" : "x";
  const c = fit.coefficients;
  let rhs: string;
  if (fit.type === "exponential") rhs = `${format(c[0])}e^(${format(c[1])}${x})`;
  else if (fit.type === "power") rhs = `${format(c[0])}${x}^${format(c[1])}`;
  else if (fit.type === "logarithmic") rhs = joinTerms([[c[1], `ln(${x})`], [c[0], ""]], format);
  else {
    const terms = c
      .map((coef, k): [number, string] => [coef, k === 0 ? "" : k === 1 ? x : `${x}${SUPERSCRIPTS[k] || `^${k}`}`])
      .reverse();
    rhs = joinTerms(terms, format);
  }
  return `${y} = ${rhs}`;
}

/** Abbreviates a coefficient, keeping three significant digits on tiny values. */
function coefficientFormat(locale: string): (n: number) => string {
  return n => (n !== 0 && Math.abs(n) < 1e-3 ? n.toPrecision(3) : formatAbbreviate(n, locale));
}

/**
    The tooltip rows for a fit: type, equation, R², and observations. Given a
    projected sample, it leads with that projection: its independent-axis
    value (marked "Projected") and its predicted value, with the band's
    bounds when drawn.
*/
export function trendTooltipRows(viz: VizInstance, trend: TrendFit, sample?: TrendSample): string[][] {
  const {fit, axis} = trend;
  const t = (s: string) => viz.schema.translate(s);
  const rows: string[][] = [];
  if (sample && sample.projected) {
    const dep = axis === "x" ? "y" : "x";
    const value = (n: unknown) => axisValue(viz, dep, n);
    const bounds = sample.lci !== undefined ? ` (${value(sample.lci)} – ${value(sample.hci)})` : "";
    rows.push(
      [axisName(viz, axis), `${axisValue(viz, axis, sample[axis])} (${t("Projected")})`],
      [axisName(viz, dep), `${value(sample[dep])}${bounds}`],
    );
  }
  rows.push([t("Trend Line"), t(trendTypeNames[fit.type])]);
  // An equation in milliseconds since 1970 says nothing a reader can use.
  if (!viz[`_${axis}Time`])
    rows.push([t("Equation"), trendEquation(fit, coefficientFormat(viz.schema.locale), axis)]);
  rows.push(["R²", fit.r2.toFixed(3)], [t("Observations"), `${fit.n}`]);
  return rows;
}

/**
    The projected step nearest a content-space pointer along the fit's
    independent axis, when the pointer is over the projection; undefined over
    the fitted stretch (or for a fit with no projection).
*/
export function nearestProjectedSample(
  viz: VizInstance,
  trend: TrendFit,
  cursor: [number, number],
): TrendSample | undefined {
  const position = trend.axis === "x" ? viz._xFunc : viz._yFunc;
  if (!position) return undefined;
  const target = trend.axis === "x" ? cursor[0] : cursor[1];
  const nearest = (samples: TrendSample[]): TrendSample | undefined => {
    let best: TrendSample | undefined;
    let gap = Infinity;
    for (const sample of samples) {
      const d = Math.abs(position(sample[trend.axis] as DataPoint) - target);
      if (d < gap) [best, gap] = [sample, d];
    }
    return best;
  };
  const best = nearest(trend.samples);
  return best && best.projected ? nearest(trend.samples.filter(s => s.step)) : undefined;
}

/** Renders the trend tooltip at the pointer, leading with the nearest projected value when over the projection. */
export function renderTrendTooltip(
  viz: VizInstance,
  trend: TrendFit,
  event: SceneEvent,
  cursor?: [number, number],
): void {
  const native = event.nativeEvent as MouseEvent & TouchEvent;
  const position =
    native && native.touches && native.touches.length
      ? [native.touches[0].clientX, native.touches[0].clientY]
      : native
        ? [native.clientX, native.clientY]
        : event.point;
  prepareTooltip(viz)
    .data([trend.row || {}])
    .config(configPrep.bind(viz as unknown as VizContext)(viz.schema.tooltipConfig))
    .title(() => withSwatch(tooltipSwatch(trend.color, "Line"), trend.label))
    .thead([])
    .tbody(trendTooltipRows(viz, trend, cursor ? nearestProjectedSample(viz, trend, cursor) : undefined))
    .footer(false)
    .position(position)
    .render();
}
