/**
    `VizContext` — the pipeline-derived state companion to `ResolvedSpec`.

    This boundary splits a chart's runtime data into two halves:

      ResolvedSpec     <- user config (frozen, immutable; see resolveSpec.ts)
        ↓
      VizContext       <- pipeline-derived state (filteredData, drawDepth,
                          legendData, _id closures, …)

    `vizPreDrawPure(spec, prevCtx) → Partial<VizContext>` is the contract:
    given a frozen spec and any prior context, return the keys the stage
    computed. Callers compose this with their `prevCtx` via spread:

      const next = {...prevCtx, ...vizPreDrawPure(spec, prevCtx)};

    Same for `vizDrawPure(spec, ctx) → Partial<VizContext>`.

    The class `Viz._preDraw()` / `Viz._draw()` stay as imperative shims
    that wrap the pure functions + write results back to `this` (for back-
    compat with subclass overrides that read `this._filteredData` etc.).
    Direct callers of the pure functions get the architectural seam.
*/

import type {DataPoint} from "@d3plus/data";

/**
    The shape of every field vizPreDraw + vizDraw can populate. The
    `Record<string, unknown>` base covers chart-specific stash slots that
    aren't enumerated below; named fields type the common pipeline outputs.
*/
export interface VizContext extends Record<string, unknown> {
  /** Effective draw depth (capped to groupBy.length - 1). */
  drawDepth?: number;
  /** Unique-id-per-datum accessor (depth-scoped). */
  id?: (d: DataPoint, i: number) => string | number;
  /** Array-of-ids-per-datum accessor. */
  ids?: (d: DataPoint, i: number) => string[];
  /** Human-readable label-per-datum accessor (handles aggregation labels). */
  drawLabel?: (d: DataPoint, i: number, depth?: number) => string;
  /** Data after filter + timeFilter + threshold are applied. */
  filteredData?: DataPoint[];
  /** Per-id rank order used by legend + treemap label sorting. */
  legendData?: DataPoint[];
  /** Whether a "no data" message should currently be visible. */
  noDataMessage?: boolean;
}
