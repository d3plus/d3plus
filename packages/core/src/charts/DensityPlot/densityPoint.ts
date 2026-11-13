/**
    What each DensityPlot curve point carries about its group, and how to read
    it off a (possibly wrapped) row.
*/
import type {DataPoint} from "@d3plus/data";

import {unwrapRow} from "../helpers/densityChart.js";
import type {DensitySummary} from "../helpers/densityData.js";

/** The key each curve point keeps its group's distribution under. */
export const DENSITY_POINT = "__d3plusDensityPoint";

/** What a curve point carries under `DENSITY_POINT`. */
export interface DensityPointMeta {
  summary: DensitySummary;
  /** The group's unscaled density at this point. */
  density: number;
}

/** The distribution a (possibly wrapped) curve point carries, if any. */
export function densityPointMeta(d: DataPoint): DensityPointMeta | undefined {
  const row = unwrapRow(d);
  const meta = row?.[DENSITY_POINT];
  return meta && typeof meta === "object" && !Array.isArray(meta)
    ? (meta as unknown as DensityPointMeta)
    : undefined;
}
