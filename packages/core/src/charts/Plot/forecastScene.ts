/**
    The scene for a Plot's `forecast`: a shaded backdrop over the forecast
    stretch with a rule at its start and a label, and the dash array that
    draws each line's forecast stretch dashed.
*/
import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {backgroundColor, textWidth} from "@d3plus/dom";
import type {
  LineNode,
  Paint,
  RectNode,
  SceneNode,
  TextNode,
} from "@d3plus/render";

import {parseDash} from "../../shapes/Shape.js";
import {textureKey} from "../../shapes/textureKey.js";
import {backgroundImageNode} from "../features/backgroundImageEmit.js";
import type {PlotAxisFn, PlotDatum} from "../features/plotPaint.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {curvePolyline, splitDash, splitLength} from "./curveLength.js";
import {lineCurve} from "./lineCurve.js";
import {discreteRank, forecastStart, type ForecastStart} from "./forecast.js";

/** Key of the forecast backdrop group. */
export const FORECAST_KEY = "plot-forecast";

/** The plot's pixel frame, as `plotEmit` measures it. */
export interface ForecastFrame {
  x: PlotAxisFn;
  y: PlotAxisFn;
  xRange: number[];
  yRange: number[];
}

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** The text color of the chart's background, which the backdrop, rule, and label default to. */
function inkColor(viz: VizInstance): string {
  const bg = backgroundColor(viz._select?.node() as Element | null | undefined);
  return colorContrast(bg, viz.schema.colorDefaults);
}

/** The pixel position of a discrete-axis value. */
function discretePixel(
  viz: VizInstance,
  frame: ForecastFrame,
  value: unknown,
): number {
  return (viz.schema.discrete || "x") === "x" ? frame.x(value) : frame.y(value);
}

/**
    Which way later discrete values run in pixels: `1` toward higher pixel
    positions, `-1` toward lower (a reversed axis).
    @param viz The chart.
    @param frame The plot's axis functions and pixel ranges.
    @param rows The plotted Line rows.
*/
export function discreteDirection(
  viz: VizInstance,
  frame: ForecastFrame,
  rows: PlotDatum[],
): 1 | -1 {
  const discrete = viz.schema.discrete || "x";
  const rank = discreteRank(rows.map(d => d[discrete]));
  const placed = rows
    .map(d => ({
      at: rank(d[discrete]),
      px: discretePixel(viz, frame, d[discrete]),
    }))
    .filter(r => Number.isFinite(r.px))
    .sort((a, b) => a.at - b.at);
  if (placed.length < 2) return 1;
  return placed[placed.length - 1].px < placed[0].px ? -1 : 1;
}

/**
    Where a bar chart's forecast backdrop begins: halfway between the last
    slot before the forecast and the first slot inside it, so the first
    forecast bar sits wholly inside. A forecast whose first slot is its start
    (rows flagged from a series' first row) begins halfway from the slot
    before. NaN when there is no slot inside the forecast.
    @param viz The chart.
    @param frame The plot's axis functions and pixel ranges.
    @param rows The plotted rows.
    @param start Where the forecast begins.
    @param dir Which way later discrete values run in pixels.
*/
export function slotEdge(
  viz: VizInstance,
  frame: ForecastFrame,
  rows: PlotDatum[],
  start: ForecastStart,
  dir: number,
): number {
  if (start.next === undefined) return NaN;
  const next = discretePixel(viz, frame, start.next);
  if (!Number.isFinite(next)) return NaN;
  const at = discretePixel(viz, frame, start.value);
  if (Number.isFinite(at) && Math.abs(at - next) >= 0.5) return (at + next) / 2;
  const discrete = viz.schema.discrete || "x";
  const pixels = rows
    .map(d => discretePixel(viz, frame, d[discrete]))
    .filter(p => Number.isFinite(p));
  const nearest = (side: number) =>
    pixels
      .filter(p => (p - next) * dir * side > 0.5)
      .reduce<number | undefined>(
        (a, p) =>
          a === undefined || Math.abs(p - next) < Math.abs(a - next) ? p : a,
        undefined,
      );
  const before = nearest(-1);
  if (before !== undefined) return (before + next) / 2;
  const after = nearest(1);
  return after !== undefined ? next - (after - next) / 2 : next;
}

/**
    The forecast backdrop, rule, and label, or nothing when the chart has no
    forecast or it begins at the end of the axis. Lines (and areas and
    points) start the backdrop at the forecast's start; bars at the edge of
    the first forecast slot (see `slotEdge`).
    @param viz The chart.
    @param rows The plotted rows.
    @param frame The plot's axis functions and pixel ranges.
    @param slots Whether the rows are bars, which fill slots along the axis.
*/
export function emitForecast(
  viz: VizInstance,
  rows: PlotDatum[],
  frame: ForecastFrame,
  slots = false,
): SceneNode[] {
  const start = forecastStart(viz, rows);
  if (!start || !rows.length) return [];
  const horizontal = (viz.schema.discrete || "x") === "x";
  const dir = discreteDirection(viz, frame, rows);
  const p = slots
    ? slotEdge(viz, frame, rows, start, dir)
    : discretePixel(viz, frame, start.value);
  if (!Number.isFinite(p)) return [];
  const range = horizontal
    ? frame.xRange
    : [0, frame.yRange[1] - frame.yRange[0]];
  const cross = horizontal
    ? [0, frame.yRange[1] - frame.yRange[0]]
    : frame.xRange;
  const lo = Math.min(range[0], range[1]),
    hi = Math.max(range[0], range[1]);
  const far = dir > 0 ? hi : lo;
  const from = Math.min(Math.max(p, lo), hi);
  if (Math.abs(far - from) < 1) return [];
  // A start scrolled out of view (a zoomed plot) still shades, unmarked.
  const visible = p >= lo - 0.5 && p <= hi + 0.5;

  const config = viz.schema.forecastConfig as Record<string, unknown>;
  const ink = inkColor(viz);
  const regionLo = Math.min(from, far),
    size = Math.abs(far - from);
  const region: RectNode = {
    type: "rect",
    key: `${FORECAST_KEY}-region`,
    x: horizontal ? regionLo : cross[0],
    y: horizontal ? cross[0] : regionLo,
    width: horizontal ? size : cross[1] - cross[0],
    height: horizontal ? cross[1] - cross[0] : size,
    paint: {
      fill: (config.fill as string) || ink,
      fillOpacity: num(config.fillOpacity, 0.05),
    },
    interactive: false,
  };
  const children: SceneNode[] = [];
  if (config.fill !== false && config.fill !== "none") children.push(region);
  children.push(...backdropDecor(config, region, ink));
  if (visible && config.stroke !== false && config.stroke !== "none") {
    const paint: Paint = {
      fill: "none",
      stroke: (config.stroke as string) || ink,
      strokeWidth: num(config.strokeWidth, 1),
      strokeOpacity: num(config.strokeOpacity, 0.4),
    };
    const dash = parseDash(config.strokeDasharray);
    if (dash) paint.strokeDasharray = dash;
    children.push({
      type: "line",
      key: `${FORECAST_KEY}-rule`,
      points: horizontal
        ? [
            [from, cross[0]],
            [from, cross[1]],
          ]
        : [
            [cross[0], from],
            [cross[1], from],
          ],
      curve: "linear",
      paint,
      interactive: false,
    } as LineNode);
  }
  const label = visible ? forecastLabel(viz, config) : "";
  if (label)
    children.push(
      labelNode(viz, config, label, {
        from,
        dir: Math.sign(far - from),
        horizontal,
        cross,
        ink,
      }),
    );
  return children.length
    ? [{type: "group", key: FORECAST_KEY, interactive: false, children}]
    : [];
}

/**
    The backdrop's `texture` and `backgroundImage`, drawn over its shade. The
    backdrop is chart chrome with no data row, so the chart's own
    `shapeConfig.texture` and `backgroundImage` leave it plain; these come
    from `forecastConfig` alone, and are off by default. The texture is drawn
    in the backdrop's color (`fill`, or the chart's text color) on a
    transparent ground at `textureOpacity` (default `0.3`), so the shade
    still shows through it.
    @param config The `forecastConfig`.
    @param region The backdrop's rect.
    @param ink The chart's text color for its background.
*/
export function backdropDecor(
  config: Record<string, unknown>,
  region: RectNode,
  ink: string,
): SceneNode[] {
  const out: SceneNode[] = [];
  const color =
    typeof config.fill === "string" && config.fill !== "none"
      ? config.fill
      : ink;
  const texture = textureKey(
    config.texture,
    () => "transparent",
    () => color,
    (config.textureDefault as Record<string, unknown>) || undefined,
  );
  if (texture)
    out.push({
      ...region,
      key: `${FORECAST_KEY}-texture`,
      paint: {
        fill: `pattern:${texture}`,
        opacity: num(config.textureOpacity, 0.3),
      },
    } as RectNode);
  const url = config.backgroundImage;
  const image =
    typeof url === "string" &&
    backgroundImageNode(
      {backgroundImage: url, backgroundImageFit: config.backgroundImageFit},
      {...region, paint: {}},
      undefined as unknown as DataPoint,
      0,
    );
  if (image) out.push(image);
  return out;
}

/** The backdrop's label: `forecastConfig.label`, or "Forecast" in the chart's locale. */
function forecastLabel(
  viz: VizInstance,
  config: Record<string, unknown>,
): string {
  const label = config.label;
  if (label === false || label === null || label === "") return "";
  if (typeof label === "function") return `${label(viz.schema.locale)}`;
  return typeof label === "string" ? label : viz.schema.translate("Forecast");
}

/** The label's text node, just inside the backdrop's start at its top (or left) edge. */
function labelNode(
  viz: VizInstance,
  config: Record<string, unknown>,
  text: string,
  at: {
    from: number;
    dir: number;
    horizontal: boolean;
    cross: number[];
    ink: string;
  },
): TextNode {
  const size = num(config.fontSize, 12);
  const family = (config.fontFamily as string) || `${viz.schema.fontFamily}`;
  const width = textWidth(text, {"font-family": family, "font-size": size});
  const pad = 5;
  const forward = at.dir >= 0;
  const x = at.horizontal
    ? at.from + (forward ? pad : -pad)
    : at.cross[0] + pad;
  const y = at.horizontal
    ? at.cross[0] + pad + size / 2
    : at.from + (forward ? pad + size / 2 : -pad - size / 2);
  return {
    type: "text",
    key: `${FORECAST_KEY}-label`,
    interactive: false,
    x: 0,
    y: 0,
    transform: {x, y},
    lines: [{text, x: 0, y: 0, width}],
    font: {
      family,
      size,
      weight: (config.fontWeight as number | string) ?? 400,
      anchor: at.horizontal && !forward ? "end" : "start",
      baseline: "middle",
    },
    paint: {
      fill: (config.fontColor as string) || at.ink,
      opacity: num(config.fontOpacity, 0.7),
    },
  };
}

/**
    A Line `strokeDasharray` that draws each line solid up to where its
    forecast starts and in `forecastConfig.lineDasharray` after it, or null
    when the chart has no forecast or no line dash. A line whose series has
    no forecast of its own (when starts are per series) stays solid.
    @param viz The chart.
    @param values The plotted Line rows, as the Line shape receives them.
    @param shapeConfig The Line's position accessors.
    @param frame The plot's axis functions and pixel ranges.
*/
export function forecastLineDash(
  viz: VizInstance,
  values: PlotDatum[],
  shapeConfig: Record<string, unknown>,
  frame: ForecastFrame,
): ((d: DataPoint, i: number) => number[] | undefined) | null {
  const config = viz.schema.forecastConfig as Record<string, unknown>;
  const dash = parseDash(config.lineDasharray);
  if (!dash || !dash.some(v => v > 0)) return null;
  const start = forecastStart(viz, values);
  if (!start || (start.series && !start.series.size)) return null;
  const startOf = (id: string): number => {
    const value = start.series ? start.series.get(id) : start.value;
    return value === undefined ? NaN : discretePixel(viz, frame, value);
  };
  const axis = (viz.schema.discrete || "x") === "x" ? 0 : 1;
  const px = shapeConfig.x as (d: PlotDatum) => number;
  const py = shapeConfig.y as (d: PlotDatum) => number;
  const curve = lineCurve(viz, values[0]);
  const cache = new Map<string, number[] | undefined>();
  return (_d, i) => {
    const id = `${values[i]?.id}`;
    if (!cache.has(id)) {
      const at = startOf(id);
      if (!Number.isFinite(at)) cache.set(id, undefined);
      else {
        const points = values
          .filter(v => `${v.id}` === id)
          .map(v => [px(v), py(v)] as [number, number]);
        const [before, total] = splitLength(
          curvePolyline(points, curve),
          axis,
          at,
        );
        cache.set(id, splitDash(before, total, dash));
      }
    }
    return cache.get(id);
  };
}

/**
    A Line `strokeDasharray` accessor: the forecast dash for a line with a
    forecast stretch, and the Line's own `strokeDasharray` for the rest.
    @param dash The forecast dash accessor (see `forecastLineDash`).
    @param own The Line's configured `strokeDasharray`.
*/
export function forecastDashOr(
  dash: (d: DataPoint, i: number) => number[] | undefined,
  own: unknown,
): (d: DataPoint, i: number) => unknown {
  return (d, i) => {
    const forecast = dash(d, i);
    if (forecast) return forecast;
    return typeof own === "function" ? own(d, i) : own;
  };
}

/** The rows a Plot draws as lines, from its shape groups. */
export function lineRows(shapeData: [string, DataPoint[]][]): PlotDatum[] {
  const group = shapeData.find(([key]) => key === "Line");
  return (group ? group[1] : []) as unknown as PlotDatum[];
}

/**
    Every row a Plot draws, from its shape groups, and whether they fill
    slots along the discrete axis: bars, with no lines or areas among them.
    @param shapeData The Plot's shape groups.
*/
export function forecastRows(shapeData: [string, DataPoint[]][]): {
  rows: PlotDatum[];
  slots: boolean;
} {
  const keys = shapeData.map(([key]) => key);
  const rows = shapeData.flatMap(([, data]) => data) as unknown as PlotDatum[];
  const slots =
    keys.includes("Bar") && !keys.includes("Line") && !keys.includes("Area");
  return {rows, slots};
}
