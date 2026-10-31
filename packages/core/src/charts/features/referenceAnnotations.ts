/**
    Reference lines and bands: `referenceLines`/`referenceBands` entries
    expand into `"ReferenceLine"`/`"ReferenceBand"` annotations, drawn as a
    line across the whole plot at one value, or a shaded span between two,
    with an optional label. Both sit behind the data unless `layer: "front"`;
    their labels draw above it, clear of the data labels (see
    `placeReferenceLabels`).
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
import {
  LABEL_PAD as PAD,
  registerLabelSpots,
  slideSteps,
  type LabelSpot,
} from "./referenceLabelPlacement.js";

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

/** Each spot of `firsts` crossed with each of `seconds`, `firsts` varying slowest. */
const cross = <A, B>(firsts: A[], seconds: B[]): [A, B][] =>
  firsts.flatMap(a => seconds.map(b => [a, b] as [A, B]));

/**
    Every spot a reference line's label may take, the one
    `referenceLineLabelAt` picks first: then the other side of the line, then
    the line's other end on either side, then along the line from the
    preferred end on either side.
    @param frame The plot area and its axes.
    @param line The line's axis and pixel position.
    @param block The wrapped label.
    @param position Which end of the line is preferred.
*/
export function referenceLineLabelSpots(
  frame: AnnotationFrame,
  line: {axis: AnnotationAxis; at: number},
  block: TextBlock,
  position: "start" | "end" = "end",
): LabelSpot[] {
  const {plot} = frame;
  const first = referenceLineLabelAt(frame, line, block, position);
  const other = position === "start" ? "end" : "start";
  if (isVertical(line.axis)) {
    // A horizontal line: its ends are the plot's sides; its sides, above and below.
    const sides = [
      first.y,
      first.y === line.at + PAD ? line.at - PAD - block.height : line.at + PAD,
    ];
    const ends: [number, TextAlign][] = [
      [first.x, first.align],
      other === "start" ? [plot.x0 + PAD, "start"] : [plot.x1 - PAD, "end"],
    ];
    const along = slideSteps(
      first.align === "end" ? plot.x1 - PAD - block.width : plot.x0 + PAD,
      first.align === "end" ? plot.x0 + PAD : plot.x1 - PAD - block.width,
    );
    return [
      ...cross(ends, sides).map(([[x, align], y]) => ({x, y, align})),
      ...cross(along, sides).map(([x, y]) => ({x, y, align: "start" as const})),
    ];
  }
  // A vertical line: its ends are the plot's top and bottom; its sides, right and left.
  const sides: [number, TextAlign][] = [
    [first.x, first.align],
    first.align === "start" ? [line.at - PAD, "end"] : [line.at + PAD, "start"],
  ];
  const top = plot.y0 + PAD,
    bottom = plot.y1 - PAD - block.height;
  const ends = [first.y, first.y === top ? bottom : top];
  const along = slideSteps(first.y, first.y === top ? bottom : top);
  return cross([...ends, ...along], sides).map(([y, [x, align]]) => ({
    x,
    y,
    align,
  }));
}

/**
    Every spot a reference band's label may take, inside the band: the
    corner `referenceBandLabelAt` picks first, then the other top corner,
    then the bottom corners, then along the band's length from its top (or,
    across the plot, from its preferred side).
    @param box The band's rect.
    @param axis The band's axis.
    @param block The wrapped label.
    @param position Which top corner is preferred.
*/
export function referenceBandLabelSpots(
  box: Box,
  axis: AnnotationAxis,
  block: TextBlock,
  position: "start" | "end" = "start",
): LabelSpot[] {
  const startX: [number, TextAlign] = [box.x + PAD, "start"],
    endX: [number, TextAlign] = [box.x + box.width - PAD, "end"];
  const xs = position === "end" ? [endX, startX] : [startX, endX];
  const top = box.y + PAD,
    bottom = box.y + box.height - PAD - block.height;
  const corners = cross([top, bottom], xs).map(([y, [x, align]]) => ({
    x,
    y,
    align,
  }));
  if (isVertical(axis)) {
    const [[x0], [x1]] = xs;
    const fromX = position === "end" ? x0 - block.width : x0;
    const toX = position === "end" ? x1 : x1 - block.width;
    return [
      ...corners,
      ...cross(slideSteps(fromX, toX), [top, bottom]).map(([x, y]) => ({
        x,
        y,
        align: "start" as const,
      })),
    ];
  }
  return [
    ...corners,
    ...cross(slideSteps(top, bottom), xs).map(([y, [x, align]]) => ({
      x,
      y,
      align,
    })),
  ];
}

/**
    The label's text node at its preferred spot, registered with the rest of
    its spots (see `placeReferenceLabels`), or null when the entry has no label.
*/
function labelNode(
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
    referenceLineLabelSpots(
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
  const label = labelNode(viz, annotation, `${key}-label`, block =>
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
