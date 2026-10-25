/**
    Drives the colorScale's hover mark (#770): hovering a chart shape marks
    its colorScale value on the colorScale (see `ColorScale.hover`), and
    leaving it, or hovering anything else, clears the mark.
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneEvent, SceneNode} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";
import {colorScaleBucketOf} from "./colorScaleBucket.js";

type Wrapped = DataPoint & {__d3plus__?: boolean; data?: DataPoint};

/**
    The colorScale value of a hovered scene node: its datum unwrapped to the
    source row (as the shapes' fill unwraps it), read through the chart's
    `colorScale`. Null for chrome (legend, axes, the colorScale itself), a
    node without a row, or a row without a finite value.
    @param viz The chart.
    @param node The hovered scene node.
*/
export function colorScaleHoverValue(
  viz: VizInstance,
  node: SceneNode | undefined,
): number | null {
  const colorScale = viz.schema.colorScale as
    ((d: DataPoint, i: number) => unknown) | false | undefined;
  if (!node || typeof colorScale !== "function") return null;
  if ((node as {interactionGroup?: string}).interactionGroup) return null;
  if (colorScaleBucketOf(node.datum)) return null;
  let d = node.datum as Wrapped | undefined;
  let i = typeof node.index === "number" ? node.index : 0;
  while (d && d.__d3plus__ && d.data) {
    d = d.data as Wrapped;
    if (typeof d.i === "number") i = d.i;
  }
  if (!d || typeof d !== "object") return null;
  const value = colorScale(d, i);
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const n = +value;
  return Number.isFinite(n) ? n : null;
}

/**
    Updates the colorScale's hover mark for a pointer event, repainting only
    when the marked value changes. Moves are ignored while a transition is
    in flight; leaving the chart always clears the mark.
    @param viz The chart.
    @param event The pointer event.
*/
export function handleColorScaleHover(
  viz: VizInstance,
  event: SceneEvent,
): void {
  const cs = viz._colorScaleClass;
  if (!cs || !viz.schema.colorScale) return;
  let next: number | false = false;
  if (event.type === "mousemove" || event.type === "mouseenter") {
    if (viz._transitionEndsAt && Date.now() < viz._transitionEndsAt) return;
    if (cs.hoverMark() === false) return;
    next = colorScaleHoverValue(viz, event.pick?.node) ?? false;
  } else if (event.type !== "mouseleave") return;
  if ((cs.hover() ?? false) === next) return;
  cs.hover(next);
  viz._scheduleSceneRepaint();
}

/**
    The swatch to keep lit for the colorScale's hovered value when the chart
    has no hover predicate of its own (shape hover is off, as on Geomap,
    Calendar, or past `dataCutoff`): the value's bucket color, and the
    opacity the other swatches dim to (`hoverOpacity`, or 0.5 when that is
    1). Null when the chart's own hover drives the highlight, nothing is
    marked, `hoverMark` is off, or the scale isn't drawn as swatches.
    @param viz The chart.
*/
export function hoveredSwatch(
  viz: VizInstance,
): {color: unknown; dimOpacity: number} | null {
  const cs = viz._colorScaleClass;
  if (!cs || typeof viz._hover === "function") return null;
  const value: unknown = cs.hover();
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    cs.hoverMark() === false ||
    cs._barGeometry ||
    typeof cs._colorScale !== "function"
  )
    return null;
  const shapeConfig = viz.schema.shapeConfig as
    {hoverOpacity?: unknown} | undefined;
  const hoverOpacity = shapeConfig?.hoverOpacity;
  return {
    color: cs._colorScale(value),
    dimOpacity:
      typeof hoverOpacity === "number" && hoverOpacity < 1 ? hoverOpacity : 0.5,
  };
}
