/**
    The density helpers shared by Violin and Ridgeline (grouping, kernel
    density summaries, width scale and the density-chart plumbing),
    re-exported by `@d3plus/core/internal`.

    @module
*/
export {
  densityAt,
  densityGroups,
  densityStats,
  densityWidthScale,
  sortByMedian,
} from "./densityData.js";
export type {
  DensityGroup,
  DensityGroupOptions,
  DensityScale,
  DensitySummary,
  MedianSort,
} from "./densityData.js";
export {
  DENSITY,
  densityMeta,
  densityShapeId,
  densityTooltipRows,
  installDensity,
  summarizeBeforePreDraw,
  unwrapRow,
} from "./densityChart.js";
export type {DensityLayout, DensityMeta} from "./densityChart.js";
