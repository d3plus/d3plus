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
import type {BandBody} from "./referenceDragBand.js";
import {
  axisPixel,
  isVertical,
  type AnnotationAxis,
  type AnnotationFrame,
} from "./annotationFrame.js";
import type {Annotation, AnnotationValue} from "./annotationTypes.js";
import {
  DRAG_SERIES,
  DRAG_SOURCE,
  type DragSource,
} from "./referenceDragSource.js";
import {
  categoryDragAxis,
  dragOptions,
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
  /** A band edge's other end's value, which it crosses rather than lands on (unless `meets`). */
  other?: number;
  /** Whether a band edge may share its other end's value (a category axis of bars, whose ends take whole slots). */
  meets?: boolean;
  /** The series a `perSeries` line is drawn for. */
  series?: string;
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
  /** The draggable bands' bodies, by id. */
  bodies: Map<string, BandBody>;
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
  if (!state)
    ctx.referenceDrag = state = {targets: new Map(), bodies: new Map()};
  return state;
}

/** Whether a target is lit: hovered, focused, or being dragged. */
export function dragLit(state: ReferenceDragState, id: string): boolean {
  return state.dragging === id || state.hover === id || state.focus === id;
}

/**
    Whether a setting's entry can be dragged: it sets `draggable`.
    @param entry The entry.
*/
export function draggableEntry(
  entry: Record<string, unknown> | undefined,
): boolean {
  return !!entry && !!dragOptions(entry.draggable);
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
  series?: string;
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
  const {plot: p} = frame;
  const edge = spot.edge === undefined ? "" : `-${spot.edge}`;
  const series = spot.series === undefined ? "" : `-s${spot.series}`;
  const target: ReferenceDragTarget = {
    id: `${source.key}-${axis}${edge}${series}`,
    source,
    axis,
    ...(spot.edge === undefined ? {} : {edge: spot.edge}),
    ...(spot.series === undefined ? {} : {series: spot.series}),
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
    text: valueText(viz, axis, dragAxis, plot)(value),
  };
  referenceDragState(viz).targets.set(target.id, target);
  return target;
}

/** The rendered axis behind an annotation axis. */
const axisOf = (viz: VizInstance, axis: AnnotationAxis) =>
  ({x: viz._xAxis, y: viz._yAxis, x2: viz._x2Axis, y2: viz._y2Axis})[axis];

/**
    How a value on a drag axis reads: a date with its year, or the value
    (or category) as the axis writes it.
    @param viz The chart.
    @param axis The annotation axis.
    @param dragAxis The drag axis.
    @param plot Whether values are fractions of the plot.
*/
export function valueText(
  viz: VizInstance,
  axis: AnnotationAxis,
  dragAxis: DragAxis,
  plot: boolean,
): (value: number) => string {
  if (dragAxis.time) return v => dateText(v, dragAxis.utc);
  const format = (!plot && axisOf(viz, axis)?._labelFormat) || String;
  return v => format(storedValue(dragAxis, v));
}

/** A label that names something: a non-empty string. */
export const named = (label: unknown): string | undefined =>
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
  const series = annotation[DRAG_SERIES];
  return dragTarget(viz, source, frame, {
    axis,
    ...(typeof series === "string" ? {series} : {}),
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

/**
    Runs the chart's `drag.<kind>` or `end.<kind>` handler for a source with
    a value, the setting's entry, an index, the browser event, and (for a
    `perSeries` line) the series.
*/
export function fireDragEvent(
  viz: VizInstance,
  type: "drag" | "end",
  source: DragSource,
  value: (entry: Record<string, unknown>) => unknown,
  index: unknown,
  event?: Event,
  series?: string,
): void {
  const handler = viz.schema.on?.[`${type}.${source.kind}`] as unknown;
  const entry = source.entry();
  if (typeof handler !== "function" || !entry) return;
  const args = [value(entry), entry, index, event];
  if (series !== undefined) args.push(series);
  try {
    handler.call(viz, ...args);
  } catch (error) {
    reportHandlerError(error);
  }
}

/**
    Runs the chart's handler for a target's `drag.<kind>` or `end.<kind>`
    event with its value (a Date on a time axis, a category on a category
    axis; a band's whole span; the quadrants' `{x, y}` center; a
    `perSeries` line's own series' value), its setting's entry, its index
    (its position in its list, the setting's name, or the axis a quadrant
    divider moved), the browser event behind it, and a `perSeries` line's
    series.
*/
export function fireReferenceEvent(
  viz: VizInstance,
  type: "drag" | "end",
  target: ReferenceDragTarget,
  event?: Event,
): void {
  const {axis, series, source} = target;
  const value = (entry: Record<string, unknown>) => {
    if (series !== undefined)
      return (entry.seriesValues as Record<string, unknown> | undefined)?.[
        series
      ];
    return source.payload ? source.payload(entry, axis) : entry[axis];
  };
  // A quadrant divider reports the axis it moved.
  const index = source.kind === "quadrants" ? axis : source.index;
  fireDragEvent(viz, type, source, value, index, event, series);
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
  // A band edge crosses its other end rather than landing on it.
  if (value === target.other && !target.meets) return false;
  const stored = storedValue(target.dragAxis, value);
  const next: Record<string, unknown> = {...entry};
  if (target.edge !== undefined) {
    const span = entry[target.axis];
    const pair = Array.isArray(span) ? span.slice() : [];
    pair[target.edge] = stored;
    // Crossing its other end, the edge takes that end's place in the span.
    const other = target.other ?? NaN;
    if ((target.value - other) * (value - other) < 0) {
      pair.reverse();
      target.edge = target.edge ? 0 : 1;
    }
    next[target.axis] = pair;
  } else if (target.series !== undefined) {
    const own = (entry.seriesValues ?? {}) as Record<string, unknown>;
    next.seriesValues = {...own, [target.series]: stored};
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
