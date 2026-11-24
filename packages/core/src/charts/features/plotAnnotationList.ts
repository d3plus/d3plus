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
import {expandQuadrants} from "./referenceQuadrants.js";
import {
  resolveReferenceBands,
  resolveReferenceLines,
} from "./referenceValues.js";

/**
    An annotation of the chart's own, resolved against the drawn rows: a
    reference line or band's computed values, or a callout's `select`.
*/
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
      expandReferenceBands(viz.schema.referenceBands),
    ),
    ...resolveReferenceLines(viz, [
      ...expandReferenceLines(viz.schema.referenceLines, true),
      ...expandReferenceLines(viz._plotReferenceLines?.()),
    ]),
    ...own
      .filter(d => !!d && typeof d.shape === "string")
      .flatMap(d => resolveOwn(viz, d)),
  ];
}
