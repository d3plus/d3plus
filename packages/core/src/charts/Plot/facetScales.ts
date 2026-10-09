/**
    The scales a faceted Plot's panels share (see `Plot/plotFacet.ts`), and
    how a panel's scale stages take them in.

    @module
*/
import type {D3Scale} from "../../utils/index.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A domain value for any of the four axes. */
export type DomainValue = number | string | Date;

/** Plot's four axes. */
export const AXES = ["x", "x2", "y", "y2"] as const;

/** The scales every panel of a faceted Plot shares. */
export interface PlotFacetScales {
  /** Per-axis domains that replace each panel's own data domains. */
  domains: Record<string, DomainValue[]>;
  /** Per-axis domains of the continuous scales after shape padding (bubble radii, box whiskers), which every panel draws with. */
  padded: Record<string, DomainValue[]>;
  /** The bubble size scale, when the chart sizes its circles. */
  size?: D3Scale;
}

/**
    A faceted panel's scales with the shared padded domains in place of the
    panel's own (see `PlotFacetScales.padded`); the scales unchanged when the
    panel isn't sharing scales.
*/
export function applyPaddedDomains<S extends Record<string, unknown>>(viz: VizInstance, scales: S): S {
  const padded = viz._plotFacetScales?.padded;
  if (!padded) return scales;
  const out: Record<string, unknown> = {...scales};
  for (const axis of AXES) {
    const scale = out[axis] as D3Scale | undefined;
    if (scale && padded[axis] && typeof scale.invert === "function")
      out[axis] = scale.copy().domain(padded[axis] as never);
  }
  return out as S;
}
