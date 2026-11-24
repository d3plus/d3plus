/**
    The annotations a Plot draws, resolved against its drawn rows: its
    `quadrants`, `referenceBands`, `referenceLines` (and the chart's own),
    and `annotations`.
*/
import type {VizInstance} from "../viz/vizTypes.js";
import type {Annotation} from "./annotationTypes.js";
import {resolveCalloutSelect} from "./calloutSelect.js";
import {
  expandReferenceBands,
  expandReferenceLines,
  REFERENCE_BAND,
  REFERENCE_LINE,
} from "./referenceAnnotations.js";
import {
  DRAG_SOURCE,
  listSource,
  type DragKind,
  type DragSource,
} from "./referenceDragSource.js";
import {expandQuadrants} from "./referenceQuadrants.js";
import {
  resolveReferenceBands,
  resolveReferenceLines,
} from "./referenceValues.js";

/**
    An annotation of the chart's own, resolved against the drawn rows: a
    reference line or band's computed values, or a callout's `select`.
*/
/**
    Where entry `i` of one of the chart's list settings lives, for dragging.
    @param viz The chart.
    @param key The setting.
    @param kind The annotation kind its entries draw.
*/
function sourceOf(
  viz: VizInstance,
  key: "referenceLines" | "referenceBands",
  kind: DragKind,
): (i: number) => DragSource {
  const schema = viz.schema as unknown as Record<string, unknown>;
  return i =>
    listSource(
      kind,
      key,
      () => schema[key],
      list => (schema[key] = list),
      i,
    );
}

/** A draggable reference line or band of the chart's `annotations`, carrying where it lives. */
function ownSource(
  viz: VizInstance,
  annotation: Annotation,
  i: number,
): Annotation {
  const kind: DragKind | null =
    annotation.shape === REFERENCE_LINE
      ? "referenceLine"
      : annotation.shape === REFERENCE_BAND
        ? "referenceBand"
        : null;
  if (!kind || !annotation.draggable) return annotation;
  const source = listSource(
    kind,
    "annotations",
    () => viz._annotations,
    list => (viz._annotations = list as Record<string, unknown>[]),
    i,
  );
  return {...annotation, [DRAG_SOURCE]: source};
}

function resolveOwn(viz: VizInstance, annotation: Annotation): Annotation[] {
  if (annotation.shape === REFERENCE_LINE)
    return resolveReferenceLines(viz, [annotation]);
  if (annotation.shape === REFERENCE_BAND)
    return resolveReferenceBands(viz, [annotation]);
  if (annotation.shape === "Callout")
    return [resolveCalloutSelect(viz, annotation)];
  return [annotation];
}

/**
    Every annotation a Plot draws: its `quadrants`, then its
    `referenceBands`, then its `referenceLines` and the chart's own (so
    lines draw over bands), then its own `annotations`, with every
    statistic, function, and callout `select` resolved against the rows it
    draws.
    @param viz The chart.
*/
export function plotAnnotationList(viz: VizInstance): Annotation[] {
  const own = (viz._annotations || []) as unknown as Annotation[];
  return [
    ...expandQuadrants(viz, viz.schema.quadrants),
    ...resolveReferenceBands(
      viz,
      expandReferenceBands(
        viz.schema.referenceBands,
        sourceOf(viz, "referenceBands", "referenceBand"),
      ),
    ),
    ...resolveReferenceLines(viz, [
      ...expandReferenceLines(
        viz.schema.referenceLines,
        sourceOf(viz, "referenceLines", "referenceLine"),
      ),
      ...expandReferenceLines(viz._plotReferenceLines?.()),
    ]),
    ...own
      .map((d, i) =>
        d && typeof d.shape === "string" ? ownSource(viz, d, i) : null,
      )
      .filter((d): d is Annotation => !!d)
      .flatMap(d => resolveOwn(viz, d)),
  ];
}
