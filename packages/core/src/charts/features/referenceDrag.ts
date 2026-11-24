/**
    Draggable reference lines: a `referenceLines` entry with `draggable` set
    can be moved along its axis by the pointer or the keyboard (see
    `referenceDragHandle.ts`). Each move writes the new value into the
    entry, so it lasts through redraws and `referenceLines()` reads it back,
    fires the chart's `drag.referenceLine` event (and `end.referenceLine`
    when it settles), and repaints the plot at its current layout, so the
    line, its label, its `highlight`, and any `valueColors` threshold linked
    to it by `id` follow it without the axes moving.
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
import type {Annotation, AnnotationValue} from "./annotationTypes.js";
import {dragOptions, type DragAxis} from "./referenceDragValue.js";
import {isStatistic, numericValue} from "./referenceValues.js";

/** A draggable line as last painted: where it is and how it moves. */
export interface ReferenceDragTarget {
  /** Its position in `referenceLines`. */
  index: number;
  axis: AnnotationAxis;
  /** Whether its value is a fraction of the plot (`ref: "plot"`). */
  plot: boolean;
  /** How values map to pixels along its axis. */
  dragAxis: DragAxis;
  options: {min?: number; max?: number; step?: number};
  /** Its value, as a number (a date's time). */
  value: number;
  /** Its pixel position along its axis. */
  at: number;
  /** The extent it spans along the other axis, in pixels. */
  span: [number, number];
  /** The plot's length along its axis, in pixels. */
  length: number;
  /** Its accessible name. */
  name: string;
  /** Its value as the axis writes it. */
  text: string;
}

/** A chart's draggable lines and which of them is lit (hovered, focused, or dragged). */
export interface ReferenceDragState {
  targets: Map<number, ReferenceDragTarget>;
  hover?: number;
  focus?: number;
  dragging?: number;
  /** The pending repaint's animation frame. */
  frame?: number;
}

/** The internal key a `referenceLines` entry's annotation carries its position in under. */
export const DRAG_INDEX = "_dragIndex";

/**
    A chart's draggable-line state, created on first use.
    @param viz The chart.
*/
export function referenceDragState(viz: VizInstance): ReferenceDragState {
  const ctx = viz.ctx ?? (viz.ctx = {});
  let state = ctx.referenceDrag as ReferenceDragState | undefined;
  if (!state) ctx.referenceDrag = state = {targets: new Map()};
  return state;
}

/** Whether a line is lit: hovered, focused, or being dragged. */
export function dragLit(state: ReferenceDragState, index: number): boolean {
  return (
    state.dragging === index || state.hover === index || state.focus === index
  );
}

/** The `referenceLines` setting as a list. */
function lineList(viz: VizInstance): Record<string, unknown>[] {
  const setting = viz.schema?.referenceLines as unknown;
  const list = Array.isArray(setting) ? setting : setting ? [setting] : [];
  return list as Record<string, unknown>[];
}

/**
    Whether a `referenceLines` entry can be dragged: it sets `draggable`
    and a value of its own on one axis, not a statistic, a function, or one
    line per series.
    @param entry The entry.
    @param axis Its axis.
*/
export function draggableEntry(
  entry: Record<string, unknown> | undefined,
  axis: AnnotationAxis,
): boolean {
  if (!entry || !dragOptions(entry.draggable) || entry.perSeries) return false;
  const raw = entry[axis];
  return typeof raw !== "function" && !isStatistic(raw);
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

/** The rendered axis behind an annotation axis. */
const axisOf = (viz: VizInstance, axis: AnnotationAxis) =>
  ({x: viz._xAxis, y: viz._yAxis, x2: viz._x2Axis, y2: viz._y2Axis})[axis];

/**
    How a line's values map to pixels: a fraction of the plot for
    `ref: "plot"`, else its axis, when that axis is continuous (a number
    or time axis; a category axis has no values between its categories).
*/
function dragAxisOf(
  frame: AnnotationFrame,
  axis: AnnotationAxis,
  plot: boolean,
): DragAxis | null {
  if (plot)
    return {scale: v => axisPixel(frame, axis, v, "plot"), domain: [0, 1]};
  const a = frame.axes[axis];
  if (!a || a.categories || !a.domain) return null;
  return {scale: a.scale, domain: a.domain, time: a.time, utc: a.utc};
}

/**
    The drag target of a painted reference line, registered with the
    chart's state; null when the line isn't one of the chart's draggable
    `referenceLines` or can't move (a category axis, or small multiples).
    @param viz The chart.
    @param annotation The resolved `"ReferenceLine"` annotation.
    @param frame The plot area and its axes.
    @param line Where the line was drawn.
*/
export function referenceDragTarget(
  viz: VizInstance,
  annotation: Annotation,
  frame: AnnotationFrame,
  line: {axis: AnnotationAxis; at: number; span: [number, number]},
): ReferenceDragTarget | null {
  const index = annotation[DRAG_INDEX];
  if (typeof index !== "number" || viz._facetStep || viz._facetPanels?.length)
    return null;
  const {axis} = line;
  const entry = lineList(viz)[index];
  if (!draggableEntry(entry, axis)) return null;
  const plot = annotation.ref === "plot";
  const dragAxis = dragAxisOf(frame, axis, plot);
  if (!dragAxis) return null;
  const raw = annotation[axis];
  const value = dragAxis.time
    ? +(date(raw as string | number, {utc: dragAxis.utc}) || NaN)
    : numericValue(raw);
  if (!Number.isFinite(value)) return null;
  const format = (!plot && axisOf(viz, axis)?._labelFormat) || String;
  const {plot: p} = frame;
  const label = annotation.label;
  const target: ReferenceDragTarget = {
    index,
    axis,
    plot,
    dragAxis,
    options: dragOptions(entry.draggable)!,
    value,
    at: line.at,
    span: line.span,
    length: isVertical(axis) ? p.y1 - p.y0 : p.x1 - p.x0,
    name:
      typeof label === "string" && label
        ? label
        : viz.schema.translate("Reference line"),
    text: dragAxis.time ? dateText(value, dragAxis.utc) : format(value),
  };
  referenceDragState(viz).targets.set(index, target);
  return target;
}

/**
    Runs the chart's handler for a draggable line's `drag.referenceLine` or
    `end.referenceLine` event with the line's value (a Date on a time axis),
    its `referenceLines` entry, its position in the list, and the browser
    event behind it.
*/
export function fireReferenceEvent(
  viz: VizInstance,
  type: "drag" | "end",
  index: number,
  event?: Event,
): void {
  const handler = viz.schema.on?.[`${type}.referenceLine`] as unknown;
  const target = referenceDragState(viz).targets.get(index);
  const entry = lineList(viz)[index];
  if (typeof handler !== "function" || !target || !entry) return;
  try {
    handler.call(viz, entry[target.axis], entry, index, event);
  } catch (error) {
    reportHandlerError(error);
  }
}

/**
    Repaints the plot at its current layout on the next animation frame
    (now, without one), once however many moves come before it.
    @param viz The chart.
*/
export function scheduleDragRepaint(viz: VizInstance): void {
  const state = referenceDragState(viz);
  if (state.frame !== undefined) return;
  if (typeof requestAnimationFrame !== "function") {
    viz._repaintPlot?.();
    return;
  }
  state.frame = requestAnimationFrame(() => {
    state.frame = undefined;
    viz._repaintPlot?.();
  });
}

/**
    Moves a draggable line to `value`: writes it into the line's
    `referenceLines` entry (a Date on a time axis), fires
    `drag.referenceLine`, and repaints. Returns false when the value is
    the line's own already, or not a number.
    @param viz The chart.
    @param index The line's position in `referenceLines`.
    @param value The new value, as a number.
    @param event The browser event behind the move.
*/
export function setReferenceValue(
  viz: VizInstance,
  index: number,
  value: number,
  event?: Event,
): boolean {
  const target = referenceDragState(viz).targets.get(index);
  const list = lineList(viz).slice();
  const entry = list[index];
  if (!target || !entry || !Number.isFinite(value) || value === target.value)
    return false;
  const stored: AnnotationValue = target.dragAxis.time
    ? new Date(value)
    : value;
  list[index] = {...entry, [target.axis]: stored};
  viz.schema.referenceLines = list as typeof viz.schema.referenceLines;
  target.value = value;
  target.at = target.dragAxis.scale(target.dragAxis.time ? stored : value);
  fireReferenceEvent(viz, "drag", index, event);
  scheduleDragRepaint(viz);
  return true;
}
