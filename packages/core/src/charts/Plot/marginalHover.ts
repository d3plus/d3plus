/**
    Hovering a marginal mark (see `marginalScene`): its own tooltip, named by
    its series, and a linked hover that lights the points it summarizes,
    along with every other marginal mark holding them.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneEvent} from "@d3plus/render";

import {configPrep} from "../../utils/index.js";
import type {ConfigPrepHost} from "../../utils/configPrep.js";
import {leadTitleWithSwatch, tooltipSwatch} from "../features/tooltipSwatch.js";
import {shapeHoverEnabled} from "../viz/shapeHover.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {MarginalMark} from "./marginalScene.js";
import {axisName, axisValue, prepareTooltip} from "./sharedTooltip.js";

/** The tooltip's title: the mark's series, or for a single series its axis. */
export function marginalTitle(viz: VizInstance, mark: MarginalMark): string {
  return mark.series.label || axisName(viz, mark.axis);
}

/**
    The tooltip's rows for a marginal mark, its values formatted as its axis
    formats them: a bin's range and count; a box's whisker ends, quartiles,
    median and count; an outlier's value; a density curve's value under the
    pointer (`value`, in marginal space) and count.
    @param viz The chart.
    @param mark The hovered mark.
    @param value The marginal-space value under the pointer, for a curve.
*/
export function marginalTooltipRows(
  viz: VizInstance,
  mark: MarginalMark,
  value?: number,
): string[][] {
  const t = (s: string) => viz.schema.translate(s) as string;
  const scale = viz._plotMarginals?.scales[mark.axis];
  const at = (v: number) =>
    axisValue(viz, mark.axis, scale ? scale.from(v) : v);
  const count = [
    t(mark.kind === "histogram" ? "Count" : "Observations"),
    formatAbbreviate(mark.rows.length, viz.schema.locale),
  ];
  const name = axisName(viz, mark.axis) || t("Value");
  if (mark.outlier) return [[name, at(mark.outlier.value)]];
  if (mark.bin)
    return [[name, `${at(mark.bin.x0)} – ${at(mark.bin.x1)}`], count];
  if (mark.box) {
    const b = mark.box;
    return [
      [t("Upper Whisker"), at(b.upperLimit)],
      [t("Upper Quartile"), at(b.third)],
      [t("Median"), at(b.median)],
      [t("Lower Quartile"), at(b.first)],
      [t("Lower Whisker"), at(b.lowerLimit)],
      count,
    ];
  }
  return value === undefined || !Number.isFinite(value)
    ? [count]
    : [[name, at(value)], count];
}

/**
    The marginal-space value under a content-space pointer along a mark's
    axis, or undefined when the axis can't be read back.
*/
function valueAt(
  viz: VizInstance,
  mark: MarginalMark,
  cursor: [number, number],
): number | undefined {
  const curve = mark.curve?.curve;
  const scale = viz._plotMarginals?.scales[mark.axis];
  const position = mark.axis === "x" ? viz._xFunc : viz._yFunc;
  if (!curve || !curve.length || !scale || !position) return undefined;
  const target = mark.axis === "x" ? cursor[0] : cursor[1];
  let best = curve[0][0],
    gap = Infinity;
  for (const [v] of curve) {
    const d = Math.abs(position(scale.from(v) as DataPoint) - target);
    if (d < gap) [best, gap] = [v, d];
  }
  return best;
}

/** The predicate a marginal hover sets, by the hovered mark, so moving within it doesn't repaint. */
const hoverFilters = new WeakMap<
  MarginalMark,
  (d: DataPoint, i: number) => boolean
>();

/**
    Hovering a marginal mark: its tooltip replaces any other, and unless
    shape hover is off, the points it summarizes stay lit while every other
    point dims (with the marginal marks that hold none of them). The leave
    path of `handleSharedHover` tears both down.
    @param viz The chart.
    @param mark The hovered mark.
    @param event The pointer event.
    @param cursor The pointer in content space.
*/
export function handleMarginalHover(
  viz: VizInstance,
  mark: MarginalMark,
  event: SceneEvent,
  cursor?: [number, number],
): void {
  viz._sharedHoverActive = true;
  viz._sharedHoverState = null;
  const native = event.nativeEvent as MouseEvent & TouchEvent;
  const position =
    native && native.touches && native.touches.length
      ? [native.touches[0].clientX, native.touches[0].clientY]
      : native
        ? [native.clientX, native.clientY]
        : event.point;
  const tip = prepareTooltip(viz)
    .data([mark.rows[0] ?? {}])
    .config(
      configPrep.bind(viz as unknown as ConfigPrepHost)(
        viz.schema.tooltipConfig,
      ),
    )
    .title(() => marginalTitle(viz, mark));
  const shape = mark.kind === "density" ? "Area" : "Rect";
  leadTitleWithSwatch(tip, tooltipSwatch(mark.series.color, shape))
    .thead([])
    .tbody(
      marginalTooltipRows(
        viz,
        mark,
        cursor ? valueAt(viz, mark, cursor) : undefined,
      ),
    )
    .footer(false)
    .position(position)
    .render();
  if (!shapeHoverEnabled(viz)) return;
  let filter = hoverFilters.get(mark);
  if (!filter) {
    const rows = new Set(mark.rows);
    filter = (d: DataPoint) => rows.has(d);
    hoverFilters.set(mark, filter);
  }
  if (viz._hover !== filter) viz.hover!(filter);
}
