/**
    ParallelCoordinates' pipeline pieces (dimensions, brush filtering and
    DOM, paths, axes, emit, line states, formatting, and titles),
    re-exported by `@d3plus/core/internal`.

    @module
*/
export {
  autoLineOpacity,
  axisPositions,
  detectDimensions,
  dimensionDomain,
  dimensionType,
  isMissing,
  isNumeric,
  resolveDimensions,
  sharedDomains,
} from "./dimensions.js";
export type {DimensionType, ParallelDimension} from "./dimensions.js";
export {
  brushFromPixels,
  hasBrushes,
  isNumericRange,
  pixelsFromBrush,
  rowPasses,
  valuePasses,
} from "./brushFilter.js";
export type {BrushAxis} from "./brushFilter.js";
export {linePoints, parallelPath} from "./paths.js";
export type {LineAxis, ParallelCurve, ParallelOrient} from "./paths.js";
export {axisDomain, dimensionAxisConfig, dimensionTitleStyle, layoutAxes} from "./axes.js";
export type {AxesLayout, PlacedAxis} from "./axes.js";
export {brushTarget, parallelDimensionKeys, parallelOrient} from "./applyLayout.js";
export {stripLength, stripSelection, syncBrushDom} from "./brushDom.js";
export type {BrushTarget} from "./brushDom.js";
export {lineAriaLabel, parallelEmit, resolveLineOpacity} from "./emit.js";
export type {ParallelLine} from "./emit.js";
export {applyLineStates, grayscale} from "./lineStates.js";
export {dimensionTooltipRows, formatDimensionValue} from "./format.js";
export {titleHeight, titleNodes, titleWidths} from "./titles.js";
