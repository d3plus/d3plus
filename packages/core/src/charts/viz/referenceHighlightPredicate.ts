/**
    The highlight a chart's reference lines apply (see
    `features/referenceHighlight.ts`), read by the interaction dimming. Kept
    apart from the annotation code so dimming doesn't import it.
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "./vizTypes.js";

/**
    The predicate a chart's reference lines highlight with: whether a row
    is one they emphasize. Null when none set `highlight`.
    @param viz The chart.
*/
export function referenceHighlightPredicate(
  viz: Pick<VizInstance, "_referenceHighlight">,
): ((d: DataPoint) => boolean) | null {
  const set = viz._referenceHighlight;
  return set ? (d: DataPoint) => set.has(d) : null;
}
