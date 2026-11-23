/**
    Reference lines that emphasize the rows on one side of them: a line's
    `highlight` ("above" or "below") grays every other drawn row the way the
    chart's `highlight` does, while the chart has no `highlight` of its own.
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import type {Annotation} from "./annotationTypes.js";
import {referenceAxis, REFERENCE_LINE} from "./referenceAnnotations.js";
import {numericValue, type DrawnRow} from "./referenceValues.js";

/**
    The data rows on the highlighted side of the reference lines that set
    `highlight`: each drawn row a line concerns (its `drawnRows`: every row,
    or its series' rows) whose value on the line's axis is strictly above
    (`"above"`) or below (`"below"`) the line's. Null when no line sets
    `highlight`.
    @param annotations The resolved annotations.
*/
export function referenceHighlightRows(
  annotations: Annotation[],
): DataPoint[] | null {
  const lines = annotations.filter(
    a =>
      a.shape === REFERENCE_LINE &&
      (a.highlight === "above" || a.highlight === "below"),
  );
  if (!lines.length) return null;
  return lines.flatMap(line => {
    const axis = referenceAxis(line);
    const at = axis && line.ref !== "plot" ? numericValue(line[axis]) : NaN;
    if (!axis || !Number.isFinite(at)) return [];
    const rows = (line.drawnRows ?? []) as DrawnRow[];
    return rows
      .filter(d => {
        const v = numericValue(d[axis]);
        return line.highlight === "above" ? v > at : v < at;
      })
      .map(d => d.data);
  });
}

/**
    Adds the rows a chart's reference lines highlight to its
    `_referenceHighlight` (each small-multiples panel adds its own).
    @param viz The chart.
    @param annotations The resolved annotations.
*/
export function collectReferenceHighlight(
  viz: VizInstance,
  annotations: Annotation[],
): void {
  const rows = referenceHighlightRows(annotations);
  if (!rows) return;
  const set = (viz._referenceHighlight ??= new Set<DataPoint>());
  rows.forEach(d => set.add(d));
}
