/**
    Reference lines and bands: `referenceLines`/`referenceBands` entries
    expand into `"ReferenceLine"`/`"ReferenceBand"` annotations, drawn as a
    line across the whole plot at one value, or a shaded span between two,
    with an optional label. Both sit behind the data unless `layer: "front"`;
    their labels draw above it.
*/
import type {LineNode, Paint, RectNode, SceneNode} from "@d3plus/render";

import {parseDash} from "../../shapes/Shape.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  axisPixel,
  axisSpan,
  clipSpan,
  isVertical,
  type AnnotationAxis,
  type AnnotationFrame,
} from "./annotationFrame.js";
import {
  annotationTextNode,
  annotationTextStyle,
  wrapAnnotationText,
  type TextAlign,
  type TextBlock,
} from "./annotationText.js";
import type {Annotation, AnnotationRef} from "./annotationTypes.js";
import type {Box} from "./calloutLayout.js";

/** The annotation shape a `referenceLines` entry expands into. */
export const REFERENCE_LINE = "ReferenceLine";
/** The annotation shape a `referenceBands` entry expands into. */
export const REFERENCE_BAND = "ReferenceBand";

/** Gap between a reference label and its line or band edge, in pixels. */
const PAD = 4;

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
    layer unless an entry sets its own.
    @param setting The `referenceLines` setting.
*/
export function expandReferenceLines(setting: unknown): Annotation[] {
  return entries(setting).map(d => ({
    layer: "back",
    ...d,
    shape: REFERENCE_LINE,
  }));
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
    Where a reference line runs: its axis, its pixel position `at` along that
    axis, and its two end points across the plot (start first). Null when it
    has no position or falls outside the plot area.
    @param frame The plot area and its axes.
    @param entry The reference line.
*/
export function referenceLinePoints(
  frame: AnnotationFrame,
  entry: Record<string, unknown>,
): {axis: AnnotationAxis; at: number; points: [number, number][]} | null {
  const axis = referenceAxis(entry);
  if (!axis) return null;
  const at = axisPixel(frame, axis, entry[axis], entry.ref as AnnotationRef);
  const [lo, hi] = extent(frame, axis);
  if (!Number.isFinite(at) || at < lo - 0.5 || at > hi + 0.5) return null;
  const {plot} = frame;
  const points: [number, number][] = isVertical(axis)
    ? [
        [plot.x0, at],
        [plot.x1, at],
      ]
    : [
        [at, plot.y1],
        [at, plot.y0],
      ];
  return {axis, at, points};
}

/**
    The rect a reference band shades, clipped to the plot area, and its
    axis. Null when it has no position or lies wholly outside the plot.
    @param frame The plot area and its axes.
    @param entry The reference band.
*/
export function referenceBandRect(
  frame: AnnotationFrame,
  entry: Record<string, unknown>,
): {axis: AnnotationAxis; box: Box} | null {
  const axis = referenceAxis(entry);
  const values = axis ? entry[axis] : undefined;
  if (!axis || !Array.isArray(values) || values.length < 2) return null;
  const span = axisSpan(
    frame,
    axis,
    [values[0], values[1]],
    entry.ref as AnnotationRef,
  );
  const [lo, hi] = extent(frame, axis);
  const clipped = span && clipSpan(span, lo, hi);
  if (!clipped) return null;
  const {plot} = frame;
  const box: Box = isVertical(axis)
    ? {
        x: plot.x0,
        y: clipped[0],
        width: plot.x1 - plot.x0,
        height: clipped[1] - clipped[0],
      }
    : {
        x: clipped[0],
        y: plot.y0,
        width: clipped[1] - clipped[0],
        height: plot.y1 - plot.y0,
      };
  return {axis, box};
}

/**
    Where a reference line's label goes (the top-left of its text block, and
    its alignment): beside the line's `"end"` (the right of a horizontal line,
    the top of a vertical one) or `"start"`, above a horizontal line (below
    it near the plot's top) and right of a vertical one (left of it near the
    plot's right edge).
    @param frame The plot area and its axes.
    @param line The line's axis and pixel position.
    @param block The wrapped label.
    @param position Which end of the line.
*/
export function referenceLineLabelAt(
  frame: AnnotationFrame,
  line: {axis: AnnotationAxis; at: number},
  block: TextBlock,
  position: "start" | "end" = "end",
): {x: number; y: number; align: TextAlign} {
  const {plot} = frame;
  if (isVertical(line.axis)) {
    const above = line.at - PAD - block.height;
    return {
      x: position === "start" ? plot.x0 + PAD : plot.x1 - PAD,
      y: above >= plot.y0 ? above : line.at + PAD,
      align: position === "start" ? "start" : "end",
    };
  }
  const right = line.at + PAD + block.width <= plot.x1;
  return {
    x: right ? line.at + PAD : line.at - PAD,
    y: position === "start" ? plot.y1 - PAD - block.height : plot.y0 + PAD,
    align: right ? "start" : "end",
  };
}

/**
    Where a reference band's label goes: inside its top-left corner
    (`"start"`) or top-right (`"end"`).
    @param box The band's rect.
    @param position Which corner.
*/
export function referenceBandLabelAt(
  box: Box,
  position: "start" | "end" = "start",
): {x: number; y: number; align: TextAlign} {
  return position === "end"
    ? {x: box.x + box.width - PAD, y: box.y + PAD, align: "end"}
    : {x: box.x + PAD, y: box.y + PAD, align: "start"};
}

/** The label's text node, or null when the entry has no label. */
function labelNode(
  viz: VizInstance,
  annotation: Annotation,
  key: string,
  place: (block: TextBlock) => {x: number; y: number; align: TextAlign},
): SceneNode | null {
  const text = annotation.label;
  if (text === undefined || text === null || text === false || text === "")
    return null;
  const style = annotationTextStyle(viz, k => annotation[k]);
  const block = wrapAnnotationText(`${text}`, style);
  if (!block.lines.length) return null;
  return annotationTextNode(block, style, {key, ...place(block)});
}

/** A `dash` setting's pattern: `true` is "4 4". */
function dashOf(annotation: Annotation): number[] | undefined {
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
  const style = annotationTextStyle(viz, k => annotation[k]);
  const paint: Paint = {
    fill: "none",
    stroke: (annotation.stroke as string) || style.fontColor,
    strokeWidth: num(annotation.strokeWidth, 1),
    strokeOpacity: num(annotation.strokeOpacity, 0.6),
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
  const label = labelNode(viz, annotation, `${key}-label`, block =>
    referenceLineLabelAt(
      frame,
      line,
      block,
      annotation.labelPosition === "start" ? "start" : "end",
    ),
  );
  if (label) out.push(label);
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
  const label = labelNode(viz, annotation, `${key}-label`, () =>
    referenceBandLabelAt(
      band.box,
      annotation.labelPosition === "end" ? "end" : "start",
    ),
  );
  if (label) out.push(label);
  return out;
}
