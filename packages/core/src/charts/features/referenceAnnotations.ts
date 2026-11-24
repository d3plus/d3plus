/**
    Reference lines and bands: `referenceLines`/`referenceBands` entries
    expand into `"ReferenceLine"`/`"ReferenceBand"` annotations, drawn as a
    line across the plot (or the part of it between `from` and `to`) at one
    value, or a shaded span between two (a rectangle, with both an x and a y
    span), with an optional label. Both sit behind the data unless `layer: "front"`;
    their labels draw above it, clear of the data labels (see
    `placeReferenceLabels`).
*/
import type {LineNode, Paint, RectNode, SceneNode} from "@d3plus/render";

import {parseDash} from "../../shapes/Shape.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  axisPixel,
  axisSpan,
  categoryHalfStep,
  clipSpan,
  isVertical,
  type AnnotationAxis,
  type AnnotationFrame,
} from "./annotationFrame.js";
import {
  annotationTextNode,
  annotationTextStyle,
  wrapAnnotationText,
  type TextBlock,
} from "./annotationText.js";
import type {Annotation, AnnotationRef} from "./annotationTypes.js";
import type {Box} from "./calloutLayout.js";
import {
  DRAG_INDEX,
  dragLit,
  referenceDragState,
  referenceDragTarget,
} from "./referenceDrag.js";
import {referenceDragHandle} from "./referenceDragHandle.js";
import {registerLabelSpots, type LabelSpot} from "./referenceLabelPlacement.js";
import {
  referenceBandLabelSpots,
  referenceLineLabelSpots,
} from "./referenceLabelSpots.js";

/** The annotation shape a `referenceLines` entry expands into. */
export const REFERENCE_LINE = "ReferenceLine";
/** The annotation shape a `referenceBands` entry expands into. */
export const REFERENCE_BAND = "ReferenceBand";

const AXES: AnnotationAxis[] = ["x", "y", "x2", "y2"];

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** The entries of a `referenceLines`/`referenceBands` setting: a list, one entry, or nothing. */
function entries(setting: unknown): Record<string, unknown>[] {
  const list = Array.isArray(setting) ? setting : setting ? [setting] : [];
  return list.filter(
    (d): d is Record<string, unknown> => !!d && typeof d === "object",
  );
}

/**
    Expands `referenceLines` into `"ReferenceLine"` annotations, in the back
    layer unless an entry sets its own. With `indexed`, each draggable
    entry's annotation keeps its position in the setting (see
    `referenceDrag.ts`).
    @param setting The `referenceLines` setting.
    @param indexed Whether the setting is the chart's own `referenceLines`.
*/
export function expandReferenceLines(
  setting: unknown,
  indexed = false,
): Annotation[] {
  const list = Array.isArray(setting) ? setting : setting ? [setting] : [];
  return list.flatMap((d: unknown, i: number) => {
    if (!d || typeof d !== "object") return [];
    const entry = d as Record<string, unknown>;
    const out: Annotation = {layer: "back", ...entry, shape: REFERENCE_LINE};
    if (indexed && entry.draggable) out[DRAG_INDEX] = i;
    return [out];
  });
}

/**
    Expands `referenceBands` into `"ReferenceBand"` annotations, in the back
    layer unless an entry sets its own.
    @param setting The `referenceBands` setting.
*/
export function expandReferenceBands(setting: unknown): Annotation[] {
  return entries(setting).map(d => ({
    layer: "back",
    ...d,
    shape: REFERENCE_BAND,
  }));
}

/**
    The axis a reference entry is on: the first of `x`, `y`, `x2`, `y2` it
    sets, or null.
    @param entry The entry.
*/
export function referenceAxis(
  entry: Record<string, unknown>,
): AnnotationAxis | null {
  return AXES.find(a => entry[a] !== undefined && entry[a] !== null) ?? null;
}

/** The plot's pixel extent along an axis. */
const extent = (frame: AnnotationFrame, axis: AnnotationAxis): number[] =>
  isVertical(axis)
    ? [frame.plot.y0, frame.plot.y1]
    : [frame.plot.x0, frame.plot.x1];

/**
    The pixel extent a reference line spans along the other axis: from its
    `from` value to its `to` value (each end taking in its category's whole
    slot on a category axis of bars), else the plot's edges, clipped to the
    plot. Null when an end it sets has no position, or nothing is left.
    @param frame The plot area and its axes.
    @param axis The line's axis.
    @param entry The reference line.
*/
export function referenceLineSpan(
  frame: AnnotationFrame,
  axis: AnnotationAxis,
  entry: Record<string, unknown>,
): [number, number] | null {
  const other: AnnotationAxis = isVertical(axis) ? "x" : "y";
  const ref = entry.ref as AnnotationRef | undefined;
  const [lo, hi] = extent(frame, other);
  const given = (v: unknown) => v !== undefined && v !== null && v !== "";
  // The plot's start along the other axis: the left, or the bottom.
  const start = isVertical(other) ? hi : lo,
    end = isVertical(other) ? lo : hi;
  let a = given(entry.from) ? axisPixel(frame, other, entry.from, ref) : start;
  let b = given(entry.to) ? axisPixel(frame, other, entry.to, ref) : end;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const half = ref === "plot" ? 0 : categoryHalfStep(frame, other);
  const dir = Math.sign(b - a) || 1;
  if (given(entry.from)) a -= dir * half;
  if (given(entry.to)) b += dir * half;
  return clipSpan([Math.min(a, b), Math.max(a, b)], lo, hi);
}

/**
    Where a reference line runs: its axis, its pixel position `at` along that
    axis, its two end points (start first), and the extent it spans along
    the other axis (see `referenceLineSpan`). Null when it has no position
    or falls outside the plot area.
    @param frame The plot area and its axes.
    @param entry The reference line.
*/
export function referenceLinePoints(
  frame: AnnotationFrame,
  entry: Record<string, unknown>,
): {
  axis: AnnotationAxis;
  at: number;
  points: [number, number][];
  span: [number, number];
} | null {
  const axis = referenceAxis(entry);
  if (!axis) return null;
  const at = axisPixel(frame, axis, entry[axis], entry.ref as AnnotationRef);
  const [lo, hi] = extent(frame, axis);
  if (!Number.isFinite(at) || at < lo - 0.5 || at > hi + 0.5) return null;
  const span = referenceLineSpan(frame, axis, entry);
  if (!span) return null;
  const points: [number, number][] = isVertical(axis)
    ? [
        [span[0], at],
        [span[1], at],
      ]
    : [
        [at, span[1]],
        [at, span[0]],
      ];
  return {axis, at, points, span};
}

/**
    The rect a reference band shades, clipped to the plot area, and its
    axis: a span along one axis across the whole plot, or, with both an x
    and a y span, the rectangle between them (its axis the x one). Null when
    it has no position or lies wholly outside the plot.
    @param frame The plot area and its axes.
    @param entry The reference band.
*/
export function referenceBandRect(
  frame: AnnotationFrame,
  entry: Record<string, unknown>,
): {axis: AnnotationAxis; box: Box} | null {
  const spans = AXES.filter(a => {
    const v = entry[a];
    return Array.isArray(v) && v.length >= 2;
  });
  const across = spans.find(a => !isVertical(a)),
    along = spans.find(isVertical);
  const axis = across ?? along;
  if (!axis) return null;
  const {plot} = frame;
  const clipped = (a: AnnotationAxis): [number, number] | null => {
    const values = entry[a] as unknown[];
    const span = axisSpan(
      frame,
      a,
      [values[0], values[1]],
      entry.ref as AnnotationRef,
    );
    const [lo, hi] = extent(frame, a);
    return span && clipSpan(span, lo, hi);
  };
  const xs = across ? clipped(across) : [plot.x0, plot.x1];
  const ys = along ? clipped(along) : [plot.y0, plot.y1];
  if (!xs || !ys) return null;
  return {
    axis,
    box: {x: xs[0], y: ys[0], width: xs[1] - xs[0], height: ys[1] - ys[0]},
  };
}

/**
    The label's text node at its preferred spot, registered with the rest of
    its spots (see `placeReferenceLabels`), or null when the entry has no label.
    @param viz The chart.
    @param annotation The annotation, whose `label` and text styles it reads.
    @param key The node's key.
    @param spotsFor Every spot the wrapped label may take, the preferred first.
*/
export function referenceLabelNode(
  viz: VizInstance,
  annotation: Annotation,
  key: string,
  spotsFor: (block: TextBlock) => LabelSpot[],
): SceneNode | null {
  const text = annotation.label;
  if (text === undefined || text === null || text === false || text === "")
    return null;
  const style = annotationTextStyle(viz, k => annotation[k]);
  const block = wrapAnnotationText(`${text}`, style);
  if (!block.lines.length) return null;
  const spots = spotsFor(block);
  const node = annotationTextNode(block, style, {key, ...spots[0]});
  registerLabelSpots(node, block, spots);
  return node;
}

/** A `dash` setting's pattern: `true` is "4 4". */
export function dashOf(annotation: Annotation): number[] | undefined {
  const dash = annotation.dash ?? annotation.strokeDasharray;
  if (dash === true) return [4, 4];
  if (dash === false) return undefined;
  return parseDash(dash);
}

/**
    The scene nodes of a reference line: the line and its label.
    @param viz The chart.
    @param annotation The `"ReferenceLine"` annotation.
    @param frame The plot area and its axes.
    @param key The annotation's key, which prefixes its nodes'.
*/
export function referenceLineNodes(
  viz: VizInstance,
  annotation: Annotation,
  frame: AnnotationFrame,
  key: string,
): SceneNode[] {
  const line = referenceLinePoints(frame, annotation);
  if (!line) return [];
  const drag = referenceDragTarget(viz, annotation, frame, line);
  // A draggable line is labeled with its value unless it has a label.
  if (drag && annotation.label === undefined && !drag.plot)
    annotation = {...annotation, label: drag.text};
  const lit = drag && dragLit(referenceDragState(viz), drag.index);
  const style = annotationTextStyle(viz, k => annotation[k]);
  const paint: Paint = {
    fill: "none",
    stroke: (annotation.stroke as string) || style.fontColor,
    strokeWidth: num(annotation.strokeWidth, 1) + (lit ? 1 : 0),
    strokeOpacity: lit ? 1 : num(annotation.strokeOpacity, 0.6),
  };
  const dash = dashOf(annotation);
  if (dash) paint.strokeDasharray = dash;
  const out: SceneNode[] = [
    {
      type: "line",
      key: `${key}-line`,
      interactive: false,
      points: line.points,
      curve: "linear",
      paint,
    } as LineNode,
  ];
  // A partial line's label keeps to the part of the plot the line spans.
  const {plot} = frame;
  const spanned: AnnotationFrame = {
    ...frame,
    plot: isVertical(line.axis)
      ? {...plot, x0: line.span[0], x1: line.span[1]}
      : {...plot, y0: line.span[0], y1: line.span[1]},
  };
  const label = referenceLabelNode(viz, annotation, `${key}-label`, block =>
    referenceLineLabelSpots(
      spanned,
      line,
      block,
      annotation.labelPosition === "start" ? "start" : "end",
    ),
  );
  if (label) out.push(label);
  if (drag) out.push(referenceDragHandle(viz, drag));
  return out;
}

/**
    The scene nodes of a reference band: the shaded rect and its label.
    @param viz The chart.
    @param annotation The `"ReferenceBand"` annotation.
    @param frame The plot area and its axes.
    @param key The annotation's key, which prefixes its nodes'.
*/
export function referenceBandNodes(
  viz: VizInstance,
  annotation: Annotation,
  frame: AnnotationFrame,
  key: string,
): SceneNode[] {
  const band = referenceBandRect(frame, annotation);
  if (!band) return [];
  const style = annotationTextStyle(viz, k => annotation[k]);
  const paint: Paint = {
    fill: (annotation.fill as string) || style.fontColor,
    fillOpacity: num(annotation.fillOpacity, 0.08),
  };
  if (annotation.stroke) {
    paint.stroke = annotation.stroke as string;
    paint.strokeWidth = num(annotation.strokeWidth, 1);
    paint.strokeOpacity = num(annotation.strokeOpacity, 0.4);
  }
  const out: SceneNode[] = [
    {
      type: "rect",
      key: `${key}-band`,
      interactive: false,
      ...band.box,
      paint,
    } as RectNode,
  ];
  const label = referenceLabelNode(viz, annotation, `${key}-label`, block =>
    referenceBandLabelSpots(
      band.box,
      band.axis,
      block,
      annotation.labelPosition === "end" ? "end" : "start",
    ),
  );
  if (label) out.push(label);
  return out;
}
