/**
    Tooltip rendering for Plot's snapped hover (#779): the shared multi-series
    tooltip and the single-mark tooltip. Both sit at the snapped discrete
    position (the other coordinate follows the pointer) with no arrow.
*/
import {formatAbbreviate, formatDate} from "@d3plus/format";
import type {SceneEvent} from "@d3plus/render";

import {configPrep} from "../../utils/index.js";
import type {VizContext} from "../../utils/configPrep.js";
import {tooltipSwatch, withSwatch} from "../features/tooltipSwatch.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {SharedHover} from "./sharedHover.js";

type Axis = "x" | "y";
const other = (k: Axis): Axis => (k === "x" ? "y" : "x");

/** An axis's display name: its configured title, else its data key. */
function axisName(viz: VizInstance, k: Axis): string {
  const config = viz[`_${k}Config`] as {title?: unknown} | undefined;
  if (config && typeof config.title === "string") return config.title;
  const key = viz[`_${k}Key`];
  return typeof key === "string" ? key : "";
}

/**
    Formats a value for an axis: the axis's `tickFormat` when set, else dates
    through d3plus's date formatter, continuous-axis numbers abbreviated, and
    anything else (e.g. a numeric year on the discrete axis) as-is.
*/
function axisValue(viz: VizInstance, k: Axis, value: unknown): string {
  const config = viz[`_${k}Config`] as {tickFormat?: (d: unknown) => string} | undefined;
  if (config && typeof config.tickFormat === "function") return config.tickFormat(value);
  if (value instanceof Date) return formatDate(value, [value]);
  if (typeof value === "number" && k !== viz.schema.discrete)
    return formatAbbreviate(value, viz.schema.locale);
  return String(value);
}

/** `[axis name, formatted value]` for one axis of a hovered row. */
function axisRow(viz: VizInstance, k: Axis, hover: SharedHover): string[] {
  const row = hover.rows[0];
  const accessor = viz[`_${k}`];
  const raw = accessor ? accessor(row.datum, row.index) : hover.value;
  return [axisName(viz, k), axisValue(viz, k, raw)];
}

/**
    The tooltip's client position: the discrete-axis coordinate locked to the
    snapped position (surface space → client space via the pointer's own
    offset), the other following the pointer.
*/
function snappedPosition(viz: VizInstance, hover: SharedHover, event: SceneEvent): number[] {
  const native = event.nativeEvent as MouseEvent & TouchEvent;
  const client =
    native && native.touches && native.touches.length
      ? [native.touches[0].clientX, native.touches[0].clientY]
      : native
        ? [native.clientX, native.clientY]
        : event.point;
  const t = viz._zoomTransform;
  const c = viz._chartTransform;
  const k = hover.axis;
  const surface = (hover.px + (c?.[k] ?? 0)) * (t?.scale ?? 1) + (t?.[k] ?? 0);
  const i = k === "x" ? 0 : 1;
  const position = [client[0], client[1]];
  position[i] = client[i] - event.point[i] + surface;
  return position;
}

/**
    Holds the tooltip's own arrow/thead/tbody to restore once the snapped
    hover ends (see `restoreTooltip`), so the next legend or default tooltip
    isn't left with these rows — and resets thead/tbody to them before each
    render so rows never accumulate.
*/
export function prepareTooltip(viz: VizInstance) {
  const tip = viz._tooltipClass!;
  if (!viz._sharedTooltipSaved)
    viz._sharedTooltipSaved = {arrow: tip.arrow(), thead: tip.thead(), tbody: tip.tbody()};
  const saved = viz._sharedTooltipSaved;
  return tip.thead(saved.thead).tbody(saved.tbody);
}

/** Puts back what `prepareTooltip` held. */
export function restoreTooltip(viz: VizInstance): void {
  const saved = viz._sharedTooltipSaved;
  if (saved) viz._tooltipClass!.arrow(saved.arrow).thead(saved.thead).tbody(saved.tbody);
  viz._sharedTooltipSaved = undefined;
}

/**
    The shared tooltip: title from the continuous axis, a header row naming
    the hovered discrete value, then one `[name, value]` row per series, the
    name led by a swatch in its series stroke. User `tooltipConfig` styles
    apply first; the shared title/rows win.
*/
export function renderSharedTooltip(viz: VizInstance, hover: SharedHover, event: SceneEvent): void {
  const cont = other(hover.axis);
  prepareTooltip(viz)
    .data([hover.rows[0].datum])
    .config(configPrep.bind(viz as unknown as VizContext)(viz.schema.tooltipConfig))
    .title(() => axisName(viz, cont))
    .thead(axisRow(viz, hover.axis, hover))
    .tbody(hover.rows.map(r => [
      withSwatch(tooltipSwatch(r.color, r.shape), r.name),
      axisValue(viz, cont, r.value),
    ]))
    .footer(false)
    .arrow(false)
    .position(snappedPosition(viz, hover, event))
    .render();
}

/**
    The single-mark tooltip (one series, `tooltipShared(false)`, or a
    side-by-side bar): the default title (the mark's label, unless
    `tooltipConfig` sets one), its x and y values, then any rows the chart's
    `tooltipConfig` adds.
*/
export function renderSingleTooltip(viz: VizInstance, hover: SharedHover, event: SceneEvent): void {
  const row = hover.rows[0];
  const deeper = viz._drawDepth < viz.schema.groupBy.length - 1;
  const tip = prepareTooltip(viz)
    .data([row.datum])
    .title(() => withSwatch(tooltipSwatch(row.color, row.shape), viz._drawLabel(row.datum, row.index)))
    .footer(deeper && viz.schema.on["click.shape"] ? viz.schema.translate("Click to Expand") : false)
    .config(configPrep.bind(viz as unknown as VizContext)(viz.schema.tooltipConfig));
  const extra = tip.tbody();
  tip
    .tbody([axisRow(viz, "x", hover), axisRow(viz, "y", hover), ...(Array.isArray(extra) ? extra : [])])
    .arrow(false)
    .position(snappedPosition(viz, hover, event))
    .render();
}
