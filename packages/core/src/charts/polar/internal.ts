/**
    The polar charts' pipeline pieces (shared polar geometry, labels,
    chrome, wedge layout, and facet hooks, plus PolarArea's and
    RadialBar's layout, tracks, and emit), re-exported by
    `@d3plus/core/internal`.

    @module
*/
export {
  polarInnerRadius,
  polarLevels,
  polarPadAngle,
  polarRadius,
  polarSlots,
  polarStack,
} from "./geometry.js";
export type {PolarDomainInput, PolarScale, PolarSlot, PolarStackSegment} from "./geometry.js";
export {
  polarBoxesOverlap,
  polarHorizontalLayout,
  polarLabelFitRadius,
  polarLabelPlacement,
  polarLabelRoom,
  polarLabelsCollide,
  polarSpokeRotation,
} from "./labels.js";
export {polarCategoryLayout, polarCategoryNodes, polarLevelNodes} from "./chrome.js";
export {polarAxisConfig, polarLegend, polarValueRow, polarWedgeNodes} from "./config.js";
export {polarSlotArc, polarSlotTops, polarWedgeLayout} from "./wedgeLayout.js";
export type {PolarFrame, PolarWedge, PolarWedgeOptions} from "./wedgeLayout.js";
export {
  polarFacetHooks,
  polarFacetPanel,
  polarSharedExtent,
  sharePolarScale,
} from "./polarFacet.js";
export type {PolarDomainValues, PolarFacetScale} from "./polarFacet.js";
export {polarAreaDomainValues, polarAreaSlotOf} from "../PolarArea/applyLayout.js";
export {polarAreaEmit} from "../PolarArea/emit.js";
export {radialBarDomainValues, radialBarRows} from "../RadialBar/applyLayout.js";
export {radialBarEmit} from "../RadialBar/emit.js";
export {radialBarFootprint, radialBarLabelRoom, radialBarTracks} from "../RadialBar/tracks.js";
export {
  RADIAL_BAR_MIN_LABEL_GAP,
  radialBarSweep,
  radialBarTrackLabels,
  radialBarTrackLayout,
} from "../RadialBar/trackLayout.js";
export type {RadialBarFrame} from "../RadialBar/trackLayout.js";
