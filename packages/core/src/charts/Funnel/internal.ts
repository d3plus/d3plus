/**
    Funnel's pipeline pieces (geometry, labels, layout, facet hooks, emit,
    and tooltip rows), re-exported by `@d3plus/core/internal`.

    @module
*/
export {
  conversionRates,
  largestValue,
  monotoneSlopes,
  profileKnots,
  profileSlice,
  segmentWidth,
  sliceExtent,
  slicePath,
  stageSpans,
  stageWidths,
} from "./funnelGeometry.js";
export type {
  FunnelCurve,
  ProfileKnot,
  ProfilePoint,
  StageSpan,
} from "./funnelGeometry.js";
export {
  conversionModes,
  fitFontSize,
  lineBoxes,
  planFunnelLabels,
  planLabel,
} from "./funnelLabels.js";
export type {
  FunnelLabelPlan,
  LabelBox,
  LabelPlan,
  LabelSizing,
  StageLabelInput,
} from "./funnelLabels.js";
export {
  funnelCurve,
  funnelOrder,
  funnelOrient,
  funnelStages,
  sharedScaleMax,
} from "./applyLayout.js";
export {
  funnelFacetHooks,
  funnelFacetPanel,
  shareFunnelLabelSize,
  shareFunnelScale,
} from "./funnelFacet.js";
export type {FunnelFacetScale} from "./funnelFacet.js";
export type {FunnelShared, FunnelStage} from "./applyLayout.js";
export {
  funnelEmit,
  neckConfig,
  neckPaint,
  stageAria,
} from "./emit.js";
export {
  funnelLabelNodes,
  labelSizeCap,
  percentText,
  planStageLabels,
  stageBoxes,
  stageLabelSize,
  stageLines,
} from "./labelNodes.js";
export type {StageLabels} from "./labelNodes.js";
export {funnelTooltipRows} from "./index.js";
