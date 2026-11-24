/**
    Dragging a reference band: each end of each span it sets moves on its
    own (crossing the other end swaps them), and its body moves the whole
    band, both ends of each span together (both spans, for a rectangle),
    keeping their distance apart.
*/
import type {VizInstance} from "../viz/vizTypes.js";
import {
  axisPixel,
  isVertical,
  type AnnotationAxis,
  type AnnotationFrame,
} from "./annotationFrame.js";
import type {Annotation, AnnotationRef} from "./annotationTypes.js";
import type {Box} from "./calloutLayout.js";
import {
  dragAxisOf,
  draggableEntry,
  dragTarget,
  dragValue,
  fireDragEvent,
  named,
  referenceDragState,
  scheduleDragRepaint,
  storedValue,
  valueText,
  type DragOptions,
  type ReferenceDragTarget,
} from "./referenceDrag.js";
import {DRAG_SOURCE, type DragSource} from "./referenceDragSource.js";
import {
  dragOptions,
  dragRange,
  keyValue,
  pixelOf,
  valueAtPixel,
  type DragAxis,
} from "./referenceDragValue.js";

const AXES: AnnotationAxis[] = ["x", "y", "x2", "y2"];

/** The spans a band sets: each axis with a two-value array. */
const spanAxes = (annotation: Annotation): AnnotationAxis[] =>
  AXES.filter(a => {
    const v = annotation[a];
    return Array.isArray(v) && v.length >= 2;
  });

/**
    The drag targets of a painted reference band's edges: each end of each
    span it sets that lies in the plot. An edge dragged past the span's
    other end crosses it, the two swapping places.
    @param viz The chart.
    @param annotation The resolved band annotation.
    @param frame The plot area and its axes.
    @param box The band's rect.
*/
export function bandDragTargets(
  viz: VizInstance,
  annotation: Annotation,
  frame: AnnotationFrame,
  box: Box,
): ReferenceDragTarget[] {
  const source = annotation[DRAG_SOURCE] as DragSource | undefined;
  if (!source) return [];
  const t = viz.schema.translate;
  const band = named(annotation.label) ?? t("Reference band");
  const ref = annotation.ref as AnnotationRef | undefined;
  const {plot} = frame;
  const out: ReferenceDragTarget[] = [];
  for (const axis of spanAxes(annotation)) {
    const values = annotation[axis] as unknown[];
    const vertical = isVertical(axis);
    const px = [0, 1].map(e => axisPixel(frame, axis, values[e], ref));
    const lo = vertical ? box.y : box.x;
    const hi = lo + (vertical ? box.height : box.width);
    const span: [number, number] = vertical
      ? [box.x, box.x + box.width]
      : [box.y, box.y + box.height];
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
      target.other = dragValue(target.dragAxis, values[1 - edge]);
      target.meets = !!target.dragAxis.categories && !!frame.axes[axis]?.slots;
      const start =
        target.value < target.other ||
        (target.value === target.other && edge === 0);
      target.name = t(start ? "Start of {0}" : "End of {0}", undefined, band);
      out.push(target);
    }
  }
  return out;
}

/** One span of a band's body: how it moves along its axis. */
export interface BodySpan {
  axis: AnnotationAxis;
  dragAxis: DragAxis;
  options: DragOptions;
  /** Its ends' values, in the setting's order. */
  values: [number, number];
  /** Its ends' pixel positions. */
  at: [number, number];
  /** The plot's length along its axis, in pixels. */
  length: number;
  /** Writes a value as the axis writes it. */
  text: (value: number) => string;
}

/** A band's body as last painted: its rect and the spans it moves. */
export interface BandBody {
  id: string;
  source: DragSource;
  box: Box;
  spans: BodySpan[];
  /** Its accessible name. */
  name: string;
  /** Its spans as they read. */
  text: string;
  /** The body's overlay element, which a press is tested against. */
  el?: HTMLElement;
}

/**
    The body of a painted draggable band, registered with the chart's
    state; null when it isn't draggable or no span can move.
    @param viz The chart.
    @param annotation The resolved band annotation.
    @param frame The plot area and its axes.
    @param box The band's rect.
*/
export function bandBody(
  viz: VizInstance,
  annotation: Annotation,
  frame: AnnotationFrame,
  box: Box,
): BandBody | null {
  const source = annotation[DRAG_SOURCE] as DragSource | undefined;
  const entry = source?.entry();
  if (!source || !draggableEntry(entry)) return null;
  const ref = annotation.ref as AnnotationRef | undefined;
  const spans: BodySpan[] = [];
  for (const axis of spanAxes(annotation)) {
    const plot = ref === "plot";
    const dragAxis = dragAxisOf(frame, axis, plot);
    if (!dragAxis) continue;
    const raw = annotation[axis] as unknown[];
    const values = [0, 1].map(e => dragValue(dragAxis, raw[e]));
    if (!values.every(Number.isFinite)) continue;
    const options: DragOptions = dragOptions(entry!.draggable) ?? {};
    if (dragAxis.categories) options.step = 1;
    const {plot: p} = frame;
    spans.push({
      axis,
      dragAxis,
      options,
      values: values as [number, number],
      at: values.map(v => pixelOf(dragAxis, v)) as [number, number],
      length: isVertical(axis) ? p.y1 - p.y0 : p.x1 - p.x0,
      text: valueText(viz, axis, dragAxis, plot),
    });
  }
  if (!spans.length) return null;
  const t = viz.schema.translate;
  const band = named(annotation.label) ?? t("Reference band");
  const body: BandBody = {
    id: `${source.key}-body`,
    source,
    box,
    spans,
    name: t("Move {0}", undefined, band),
    text: bodyText(spans),
  };
  referenceDragState(viz).bodies.set(body.id, body);
  return body;
}

/** A band's spans as they read: "40 – 60", or "x: 10 – 20, y: 40 – 60". */
function bodyText(spans: BodySpan[]): string {
  const text = (s: BodySpan) =>
    s.values
      .slice()
      .sort((a, b) => a - b)
      .map(s.text)
      .join(" – ");
  return spans.length === 1
    ? text(spans[0])
    : spans.map(s => `${s.axis}: ${text(s)}`).join(", ");
}

/**
    How far a span's ends move for its lower end to land at `lower`: kept so
    both ends stay inside its range.
    @param span The span.
    @param lower Where its lower end would go.
*/
export function spanShift(span: BodySpan, lower: number): number {
  const [lo, hi] = dragRange(span.dragAxis, span.options);
  const min = Math.min(...span.values),
    max = Math.max(...span.values);
  if (!Number.isFinite(lower)) return 0;
  return Math.max(lo - min, Math.min(hi - max, lower - min));
}

/**
    How far a span's ends move when its lower end is dragged `delta` pixels
    from where `from` (the span as the drag began) had it.
    @param from The span as the drag began.
    @param delta The pixels moved along its axis.
*/
export function dragShift(from: BodySpan, delta: number): number {
  const i = from.values[0] <= from.values[1] ? 0 : 1;
  return spanShift(
    from,
    valueAtPixel(from.dragAxis, from.at[i] + delta, from.options),
  );
}

/**
    How far a span's ends move for a key, or null for a key that doesn't
    move it: the step (or pixels) its lower end would move, and Home and
    End to the ends of its range (kept inside it).
    @param span The span.
    @param key The key pressed.
*/
export function keyShift(span: BodySpan, key: string): number | null {
  const i = span.values[0] <= span.values[1] ? 0 : 1;
  const next = keyValue(
    key,
    span.dragAxis,
    {value: span.values[i], px: span.at[i]},
    span.length,
    span.options,
  );
  return next === null ? null : spanShift(span, next);
}

/**
    Moves a band's body: shifts each span's ends by its `shifts` entry,
    writes them into the band's setting, fires `drag.referenceBand` with
    the band's span (or, for a rectangle, `{x, y}` spans), and repaints.
    Returns false when nothing moved.
    @param viz The chart.
    @param body The band's body.
    @param from Each span's values the shifts start from.
    @param shifts How far each span moves, by axis.
    @param event The browser event behind the move.
*/
export function moveBody(
  viz: VizInstance,
  body: BandBody,
  from: [number, number][],
  shifts: Partial<Record<AnnotationAxis, number>>,
  event?: Event,
): boolean {
  const entry = body.source.entry();
  if (!entry) return false;
  const next: Record<string, unknown> = {...entry};
  let moved = false;
  body.spans.forEach((span, i) => {
    const shift = shifts[span.axis] ?? 0;
    const values = from[i].map(v => v + shift) as [number, number];
    if (values[0] === span.values[0] && values[1] === span.values[1]) return;
    moved = true;
    span.values = values;
    span.at = values.map(v => pixelOf(span.dragAxis, v)) as [number, number];
    next[span.axis] = values.map(v => storedValue(span.dragAxis, v));
  });
  if (!moved) return false;
  body.source.write(next);
  body.text = bodyText(body.spans);
  fireBodyEvent(viz, "drag", body, event);
  scheduleDragRepaint(viz);
  return true;
}

/**
    Runs the chart's `drag.referenceBand` or `end.referenceBand` handler for
    a moved band body: its span (or, for a rectangle, its spans by axis).
*/
export function fireBodyEvent(
  viz: VizInstance,
  type: "drag" | "end",
  body: BandBody,
  event?: Event,
): void {
  const value = (entry: Record<string, unknown>) =>
    body.spans.length === 1
      ? entry[body.spans[0].axis]
      : Object.fromEntries(body.spans.map(s => [s.axis, entry[s.axis]]));
  fireDragEvent(viz, type, body.source, value, body.source.index, event);
}
