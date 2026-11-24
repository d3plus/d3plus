/**
    Quadrants: a Plot's `quadrants` setting expands into a `"Quadrants"`
    annotation, drawn as a line across the plot at the center's x and one
    at its y, each quadrant with an optional fill and a label in its outer
    corner. The center defaults to the mean of the drawn rows on each axis.
*/
import type {Paint, RectNode, SceneNode} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";
import {axisPixel, type AnnotationFrame} from "./annotationFrame.js";
import type {TextBlock} from "./annotationText.js";
import type {Annotation, AnnotationRef} from "./annotationTypes.js";
import type {Box} from "./calloutLayout.js";
import {
  REFERENCE_LINE,
  referenceLabelNode,
  referenceLineNodes,
} from "./referenceAnnotations.js";
import {LABEL_PAD as PAD, type LabelSpot} from "./referenceLabelPlacement.js";
import {drawnRows, resolveValue, stackAxis} from "./referenceValues.js";
import {
  DRAG_SOURCE,
  settingSource,
  type DragSource,
} from "./referenceDragSource.js";

/** The annotation shape a `quadrants` setting expands into. */
export const QUADRANTS = "Quadrants";

/** The four quadrants, by the corner of the plot each takes. */
export type QuadrantCorner =
  "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

/** The quadrants in reading order. */
export const QUADRANT_CORNERS: QuadrantCorner[] = [
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight",
];

/** The divider styles a `quadrants` setting passes to its two lines. */
const LINE_KEYS = ["stroke", "strokeOpacity", "strokeWidth", "dash", "ref"];

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/**
    Expands a `quadrants` setting (`true`, or its config) into a
    `"Quadrants"` annotation in the back layer, its center's `x` and `y`
    resolved against the drawn rows (`"mean"` by default, or the plot's
    middle with `ref: "plot"`). Nothing when it is off, or a center finds
    no value.
    @param viz The chart.
    @param setting The `quadrants` setting.
*/
export function expandQuadrants(
  viz: VizInstance,
  setting: unknown,
): Annotation[] {
  if (!setting) return [];
  const config = (setting === true ? {} : setting) as Record<string, unknown>;
  if (typeof config !== "object") return [];
  const rows = drawnRows(viz);
  const center = (axis: "x" | "y") => {
    const raw = config[axis] ?? (config.ref === "plot" ? 0.5 : "mean");
    return resolveValue(raw, rows, axis, stackAxis(viz, axis));
  };
  const x = center("x"),
    y = center("y");
  if (x === null || y === null) return [];
  const out: Annotation = {layer: "back", ...config, shape: QUADRANTS, x, y};
  if (config.draggable) out[DRAG_SOURCE] = quadrantSource(viz, {x, y});
  return [out];
}

/**
    Where a draggable `quadrants` setting lives: a move writes the divider's
    value as the center's `x` or `y`, and its events report the whole center.
    @param viz The chart.
    @param center The center as drawn.
*/
export function quadrantSource(
  viz: VizInstance,
  center: {x: unknown; y: unknown},
): DragSource {
  const schema = viz.schema as unknown as Record<string, unknown>;
  return settingSource(
    "quadrants",
    "quadrants",
    () => schema.quadrants,
    entry => (schema.quadrants = entry),
    (entry, axis) => ({...center, [axis]: entry[axis]}),
  );
}

/**
    The four quadrant rects of a plot split at a pixel center (clamped to
    the plot), keyed by corner.
    @param plot The plot area.
    @param center The center's pixel position.
*/
export function quadrantBoxes(
  plot: AnnotationFrame["plot"],
  center: [number, number],
): Record<QuadrantCorner, Box> {
  const cx = Math.max(plot.x0, Math.min(plot.x1, center[0]));
  const cy = Math.max(plot.y0, Math.min(plot.y1, center[1]));
  const left = {x: plot.x0, width: cx - plot.x0},
    right = {x: cx, width: plot.x1 - cx},
    top = {y: plot.y0, height: cy - plot.y0},
    bottom = {y: cy, height: plot.y1 - cy};
  return {
    topLeft: {...left, ...top},
    topRight: {...right, ...top},
    bottomLeft: {...left, ...bottom},
    bottomRight: {...right, ...bottom},
  };
}

/**
    Every spot a quadrant's label may take, inside its box: the box's outer
    corner (the plot's corner) first, then the other corner along the same
    edge, then the two corners nearer the center.
    @param box The quadrant's rect.
    @param corner Which quadrant.
    @param block The wrapped label.
*/
export function quadrantLabelSpots(
  box: Box,
  corner: QuadrantCorner,
  block: TextBlock,
): LabelSpot[] {
  const top = box.y + PAD,
    bottom = box.y + box.height - PAD - block.height;
  const start = {x: box.x + PAD, align: "start" as const},
    end = {x: box.x + box.width - PAD, align: "end" as const};
  const [y0, y1] = corner.startsWith("top") ? [top, bottom] : [bottom, top];
  const [x0, x1] = corner.endsWith("Left") ? [start, end] : [end, start];
  return [
    {...x0, y: y0},
    {...x1, y: y0},
    {...x0, y: y1},
    {...x1, y: y1},
  ];
}

/**
    The scene nodes of a `"Quadrants"` annotation: each quadrant's fill,
    the two dividers, and each quadrant's label. Nothing when its center has
    no position.
    @param viz The chart.
    @param annotation The `"Quadrants"` annotation.
    @param frame The plot area and its axes.
    @param key The annotation's key, which prefixes its nodes'.
*/
export function quadrantNodes(
  viz: VizInstance,
  annotation: Annotation,
  frame: AnnotationFrame,
  key: string,
): SceneNode[] {
  const ref = annotation.ref as AnnotationRef | undefined;
  const center: [number, number] = [
    axisPixel(frame, "x", annotation.x, ref),
    axisPixel(frame, "y", annotation.y, ref),
  ];
  if (!center.every(Number.isFinite)) return [];
  const boxes = quadrantBoxes(frame.plot, center);
  const quadrant = (corner: QuadrantCorner) =>
    (annotation[corner] ?? {}) as Record<string, unknown>;
  const out: SceneNode[] = [];
  QUADRANT_CORNERS.forEach(corner => {
    const q = quadrant(corner),
      box = boxes[corner];
    const fill = (q.fill ?? annotation.fill) as string | undefined;
    if (!fill || box.width < 0.5 || box.height < 0.5) return;
    const paint: Paint = {
      fill,
      fillOpacity: num(q.fillOpacity ?? annotation.fillOpacity, 0.08),
    };
    out.push({
      type: "rect",
      key: `${key}-${corner}`,
      interactive: false,
      ...box,
      paint,
    } as RectNode);
  });
  const line: Annotation = {
    shape: REFERENCE_LINE,
    [DRAG_SOURCE]: annotation[DRAG_SOURCE],
  };
  LINE_KEYS.forEach(k => {
    if (annotation[k] !== undefined) line[k] = annotation[k];
  });
  out.push(
    ...referenceLineNodes(viz, {...line, x: annotation.x}, frame, `${key}-x`),
    ...referenceLineNodes(viz, {...line, y: annotation.y}, frame, `${key}-y`),
  );
  QUADRANT_CORNERS.forEach(corner => {
    const q = quadrant(corner);
    const merged: Annotation = {...annotation, label: q.label};
    Object.keys(q).forEach(k => (merged[k] = q[k]));
    const label = referenceLabelNode(viz, merged, `${key}-${corner}-label`, b =>
      quadrantLabelSpots(boxes[corner], corner, b),
    );
    if (label) out.push(label);
  });
  return out;
}
