/**
    Draggable reference annotations: a reference line, a reference band's
    edges, or the quadrant dividers, set `draggable`, can be moved along
    their axis by the pointer or the keyboard (see `referenceDragHandle.ts`).
    Each move writes the new value into the setting it came from (see
    `referenceDragSource.ts`), so it lasts through redraws and reads back
    from the chart, fires the chart's `drag.<kind>` event, and repaints the
    plot at its current layout, so the line, its label, its `highlight`, and
    any `valueColors` threshold linked to it by `id` follow it; letting go
    fires `end.<kind>` and redraws the chart, refitting its axes. A chart
    without a plot to repaint (small multiples, Gantt) redraws on each move.
*/
import {date} from "@d3plus/dom";
import {formatDateFull} from "@d3plus/format";
import {timeDay, utcDay} from "d3-time";

import {reportHandlerError} from "../viz/reportHandlerError.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  axisPixel,
  isVertical,
  type AnnotationAxis,
  type AnnotationFrame,
} from "./annotationFrame.js";
import type {
  Annotation,
  AnnotationRef,
  AnnotationValue,
} from "./annotationTypes.js";
import {DRAG_SOURCE, type DragSource} from "./referenceDragSource.js";
import {
  categoryDragAxis,
  dragOptions,
  invertPixel,
  pixelOf,
  type DragAxis,
} from "./referenceDragValue.js";
import {numericValue} from "./referenceValues.js";

/** The range and step a target moves in, in its axis's values. */
export interface DragOptions {
  min?: number;
  max?: number;
  step?: number;
}

/** A draggable line or band edge as last painted: where it is and how it moves. */
export interface ReferenceDragTarget {
  /** Unique among the chart's targets (shared by the same line in every panel). */
  id: string;
  source: DragSource;
  axis: AnnotationAxis;
  /** Which end of a band's span it is, by its position in the setting. */
  edge?: 0 | 1;
  /** Whether its value is a fraction of the plot (`ref: "plot"`). */
  plot: boolean;
  /** How values map to pixels along its axis. */
  dragAxis: DragAxis;
  options: DragOptions;
  /** Its value: a number, a date's time, or a category's position. */
  value: number;
  /** The pixel position of its value along its axis. */
  at: number;
  /** The pixel position its handle sits at (a band's edge, off its value by half a category). */
  handleAt: number;
  /** The extent it spans along the other axis, in pixels. */
  span: [number, number];
  /** Which end of the span its grip sits at: the left or bottom (`"start"`), or the other. */
  grip: "start" | "end";
  /** The plot's length along its axis, in pixels. */
  length: number;
  /** Its accessible name. */
  name: string;
  /** Its value as the axis writes it. */
  text: string;
}

/** A chart's draggable targets, and which is lit (hovered, focused, or dragged), by id. */
export interface ReferenceDragState {
  targets: Map<string, ReferenceDragTarget>;
  hover?: string;
  focus?: string;
  dragging?: string;
  /** The target moved by keys since the last key was let go. */
  keyed?: string;
  /** The pending repaint's animation frame. */
  frame?: number;
}

/**
    A chart's draggable-annotation state, created on first use.
    @param viz The chart.
*/
export function referenceDragState(viz: VizInstance): ReferenceDragState {
  const ctx = viz.ctx ?? (viz.ctx = {});
  let state = ctx.referenceDrag as ReferenceDragState | undefined;
  if (!state) ctx.referenceDrag = state = {targets: new Map()};
  return state;
}

/** Whether a target is lit: hovered, focused, or being dragged. */
export function dragLit(state: ReferenceDragState, id: string): boolean {
  return state.dragging === id || state.hover === id || state.focus === id;
}

/**
    Whether a setting's entry can be dragged: it sets `draggable` and isn't
    one line per series.
    @param entry The entry.
*/
export function draggableEntry(
  entry: Record<string, unknown> | undefined,
): boolean {
  return !!entry && !!dragOptions(entry.draggable) && !entry.perSeries;
}

/**
    A dragged date as it reads on its own: with its year, and its time of
    day unless it falls on a day's start.
    @param value The date's time.
    @param utc Whether it reads in UTC.
*/
export function dateText(value: number, utc?: boolean): string {
  const d = new Date(value);
  const day = +(utc ? utcDay : timeDay).floor(d) === value;
  // Two dates a day (or a minute) apart set the precision it is written to.
  const next = new Date(value + (day ? 864e5 : 6e4));
  return formatDateFull(d, [d, next], {utc});
}

/** A comparable key for an axis value. */
const valueKey = (v: unknown): string => (v instanceof Date ? `${+v}` : `${v}`);

/**
    How values map to pixels on a target's axis: a fraction of the plot for
    `ref: "plot"`, its categories on a category axis, else its continuous
    domain. Null when the axis has none of these.
    @param frame The plot area and its axes.
    @param axis The axis.
    @param plot Whether values are fractions of the plot.
*/
export function dragAxisOf(
  frame: AnnotationFrame,
  axis: AnnotationAxis,
  plot: boolean,
): DragAxis | null {
  if (plot)
    return {scale: v => axisPixel(frame, axis, v, "plot"), domain: [0, 1]};
  const a = frame.axes[axis];
  if (a?.categories)
    return categoryDragAxis(a.categories, a.scale, isVertical(axis));
  if (!a || !a.domain) return null;
  return {scale: a.scale, domain: a.domain, time: a.time, utc: a.utc};
}

/**
    A setting's value as a number on a drag axis: a date's time, a
    category's position, or the number. NaN when it has none.
    @param axis The drag axis.
    @param value The value.
*/
export function dragValue(axis: DragAxis, value: unknown): number {
  if (axis.categories) {
    const i = axis.categories.findIndex(c => valueKey(c) === valueKey(value));
    return i < 0 ? NaN : i;
  }
  if (axis.time)
    return +(date(value as string | number, {utc: axis.utc}) || NaN);
  return numericValue(value);
}

/**
    The value a setting stores for a number on a drag axis: a Date on a
    time axis, the category on a category axis, else the number.
    @param axis The drag axis.
    @param value The number.
*/
export function storedValue(axis: DragAxis, value: number): AnnotationValue {
  if (axis.categories)
    return axis.categories[Math.round(value)] as AnnotationValue;
  return axis.time ? new Date(value) : value;
}

/** A drag setting's range and step on a drag axis: categories by position, snapping to whole ones. */
function optionsOf(axis: DragAxis, setting: unknown): DragOptions {
  if (!axis.categories) return dragOptions(setting) ?? {};
  const {min, max} = (setting ?? {}) as Record<string, unknown>;
  const at = (v: unknown) => {
    const i = v === undefined ? -1 : dragValue(axis, v);
    return Number.isFinite(i) && i >= 0 ? i : undefined;
  };
  return {min: at(min), max: at(max), step: 1};
}

/** Where a target is painted, and what it is. */
export interface TargetSpot {
  axis: AnnotationAxis;
  edge?: 0 | 1;
  value: unknown;
  ref?: unknown;
  at: number;
  handleAt: number;
  span: [number, number];
  grip: "start" | "end";
  name: string;
}

/**
    The drag target of a painted annotation, registered with the chart's
    state; null when its setting isn't draggable or its axis can't move it.
    @param viz The chart.
    @param source Where its setting lives.
    @param frame The plot area and its axes.
    @param spot Where it is painted.
*/
export function dragTarget(
  viz: VizInstance,
  source: DragSource | undefined,
  frame: AnnotationFrame,
  spot: TargetSpot,
): ReferenceDragTarget | null {
  const entry = source?.entry();
  if (!source || !draggableEntry(entry)) return null;
  const {axis} = spot;
  const plot = spot.ref === "plot";
  const dragAxis = dragAxisOf(frame, axis, plot);
  if (!dragAxis) return null;
  const value = dragValue(dragAxis, spot.value);
  if (!Number.isFinite(value)) return null;
  const axisFormat = !plot && axisOf(viz, axis)?._labelFormat;
  const format = axisFormat || String;
  const stored = storedValue(dragAxis, value);
  const {plot: p} = frame;
  const edge = spot.edge === undefined ? "" : `-${spot.edge}`;
  const target: ReferenceDragTarget = {
    id: `${source.key}-${axis}${edge}`,
    source,
    axis,
    ...(spot.edge === undefined ? {} : {edge: spot.edge}),
    plot,
    dragAxis,
    options: optionsOf(dragAxis, entry!.draggable),
    value,
    at: spot.at,
    handleAt: spot.handleAt,
    span: spot.span,
    grip: spot.grip,
    length: isVertical(axis) ? p.y1 - p.y0 : p.x1 - p.x0,
    name: spot.name,
    text: dragAxis.time ? dateText(value, dragAxis.utc) : format(stored),
  };
  referenceDragState(viz).targets.set(target.id, target);
  return target;
}

/** The rendered axis behind an annotation axis. */
const axisOf = (viz: VizInstance, axis: AnnotationAxis) =>
  ({x: viz._xAxis, y: viz._yAxis, x2: viz._x2Axis, y2: viz._y2Axis})[axis];

/** A label that names something: a non-empty string. */
const named = (label: unknown): string | undefined =>
  typeof label === "string" && label ? label : undefined;

/**
    The drag target of a painted reference line or quadrant divider.
    @param viz The chart.
    @param annotation The resolved line annotation.
    @param frame The plot area and its axes.
    @param line Where the line was drawn.
*/
export function lineDragTarget(
  viz: VizInstance,
  annotation: Annotation,
  frame: AnnotationFrame,
  line: {axis: AnnotationAxis; at: number; span: [number, number]},
): ReferenceDragTarget | null {
  const source = annotation[DRAG_SOURCE] as DragSource | undefined;
  const {axis} = line;
  const t = viz.schema.translate;
  const name =
    source?.kind === "quadrants"
      ? t(isVertical(axis) ? "Horizontal divider" : "Vertical divider")
      : (named(annotation.label) ?? t("Reference line"));
  return dragTarget(viz, source, frame, {
    axis,
    value: annotation[axis],
    ref: annotation.ref,
    at: line.at,
    handleAt: line.at,
    span: line.span,
    // The grip sits at the end away from the label.
    grip: annotation.labelPosition === "start" ? "end" : "start",
    name,
  });
}

const AXES: AnnotationAxis[] = ["x", "y", "x2", "y2"];

/**
    The drag targets of a painted reference band's edges: each end of each
    span it sets that lies in the plot, kept from passing the span's other
    end (by a step, a category on a category axis of points, or two
    pixels' worth).
    @param viz The chart.
    @param annotation The resolved band annotation.
    @param frame The plot area and its axes.
    @param box The band's rect.
*/
export function bandDragTargets(
  viz: VizInstance,
  annotation: Annotation,
  frame: AnnotationFrame,
  box: {x: number; y: number; width: number; height: number},
): ReferenceDragTarget[] {
  const source = annotation[DRAG_SOURCE] as DragSource | undefined;
  if (!source) return [];
  const t = viz.schema.translate;
  const band = named(annotation.label) ?? t("Reference band");
  const out: ReferenceDragTarget[] = [];
  for (const axis of AXES) {
    const values = annotation[axis];
    if (!Array.isArray(values) || values.length < 2) continue;
    const vertical = isVertical(axis);
    const ref = annotation.ref as AnnotationRef | undefined;
    const px = [0, 1].map(e => axisPixel(frame, axis, values[e], ref));
    const lo = vertical ? box.y : box.x;
    const hi = lo + (vertical ? box.height : box.width);
    const span: [number, number] = vertical
      ? [box.x, box.x + box.width]
      : [box.y, box.y + box.height];
    const {plot} = frame;
    const [p0, p1] = vertical ? [plot.y0, plot.y1] : [plot.x0, plot.x1];
    for (const edge of [0, 1] as const) {
      const at = px[edge],
        other = px[1 - edge];
      if (!Number.isFinite(at) || at < p0 - 0.5 || at > p1 + 0.5) continue;
      const near = at < other || (at === other && edge === 0);
      const target = dragTarget(viz, source, frame, {
        axis,
        edge,
        value: values[edge],
        ref,
        at,
        handleAt: near ? lo : hi,
        span,
        grip: annotation.labelPosition === "end" ? "start" : "end",
        name: "",
      });
      if (!target) continue;
      const otherValue = dragValue(target.dragAxis, values[1 - edge]);
      const start =
        target.value < otherValue ||
        (target.value === otherValue && edge === 0);
      keepApart(target, otherValue, start, frame);
      target.name = t(start ? "Start of {0}" : "End of {0}", undefined, band);
      out.push(target);
    }
  }
  return out;
}

/**
    Narrows a band edge's range so it can't pass the span's other end.
    @param target The edge.
    @param other The other end's value.
    @param start Whether the edge is the span's lower end.
    @param frame The plot area and its axes.
*/
function keepApart(
  target: ReferenceDragTarget,
  other: number,
  start: boolean,
  frame: AnnotationFrame,
): void {
  const {dragAxis: axis, options, value} = target;
  if (!Number.isFinite(other)) return;
  const slots = !!frame.axes[target.axis]?.slots;
  const gap = axis.categories
    ? slots
      ? 0
      : 1
    : (options.step ??
      Math.abs(
        invertPixel(axis, target.at + 2) - invertPixel(axis, target.at),
      ));
  if (start)
    options.max = Math.max(value, Math.min(options.max ?? other, other - gap));
  else
    options.min = Math.min(value, Math.max(options.min ?? other, other + gap));
}

/**
    Runs the chart's handler for a target's `drag.<kind>` or `end.<kind>`
    event with its value (a Date on a time axis, a category on a category
    axis; a band's whole span; the quadrants' `{x, y}` center), its
    setting's entry, its index (its position in its list, the setting's
    name, or the axis a quadrant divider moved), and the browser event
    behind it.
*/
export function fireReferenceEvent(
  viz: VizInstance,
  type: "drag" | "end",
  target: ReferenceDragTarget,
  event?: Event,
): void {
  const {source} = target;
  const handler = viz.schema.on?.[`${type}.${source.kind}`] as unknown;
  const entry = source.entry();
  if (typeof handler !== "function" || !entry) return;
  const value = source.payload
    ? source.payload(entry, target.axis)
    : entry[target.axis];
  // A quadrant divider reports the axis it moved.
  const index = source.kind === "quadrants" ? target.axis : source.index;
  try {
    handler.call(viz, value, entry, index, event);
  } catch (error) {
    reportHandlerError(error);
  }
}

/**
    Redraws the chart, refitting its axes; `instant` skips the transition
    (a redraw on each move).
    @param viz The chart.
    @param instant Whether to draw without a transition.
*/
export function redrawAfterDrag(viz: VizInstance, instant = false): void {
  if (typeof viz.render !== "function") return;
  if (instant) viz._instantNextDraw = true;
  viz.render();
}

/**
    Repaints the plot at its current layout on the next animation frame
    (now, without one), once however many moves come before it; a chart
    that can't repaint redraws instead.
    @param viz The chart.
*/
export function scheduleDragRepaint(viz: VizInstance): void {
  const state = referenceDragState(viz);
  if (state.frame !== undefined) return;
  const run = () => {
    state.frame = undefined;
    if (!viz._repaintPlot?.()) redrawAfterDrag(viz, true);
  };
  if (typeof requestAnimationFrame !== "function") return run();
  state.frame = requestAnimationFrame(run);
}

/**
    Moves a target to `value`: writes it into its setting (a Date on a time
    axis, the category on a category axis), fires `drag.<kind>`, and
    repaints. Returns false when the value is the target's own already, or
    not a number.
    @param viz The chart.
    @param target The target.
    @param value The new value, as a number.
    @param event The browser event behind the move.
*/
export function setReferenceValue(
  viz: VizInstance,
  target: ReferenceDragTarget,
  value: number,
  event?: Event,
): boolean {
  const entry = target.source.entry();
  if (!entry || !Number.isFinite(value) || value === target.value) return false;
  const stored = storedValue(target.dragAxis, value);
  const next: Record<string, unknown> = {...entry};
  if (target.edge !== undefined) {
    const span = entry[target.axis];
    const pair = Array.isArray(span) ? span.slice() : [];
    pair[target.edge] = stored;
    next[target.axis] = pair;
  } else next[target.axis] = stored;
  target.source.write(next);
  const at = pixelOf(target.dragAxis, value);
  target.handleAt += at - target.at;
  target.at = at;
  target.value = value;
  fireReferenceEvent(viz, "drag", target, event);
  scheduleDragRepaint(viz);
  return true;
}
