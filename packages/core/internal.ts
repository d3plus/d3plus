/**
    `@d3plus/core/internal` — the v4 scene-graph pipeline, exposed for
    parity/regression tests and for advanced users building custom charts on
    the `ChartDefinition` contract.

    This surface is intentionally **not** part of the stable public API. The
    chart classes, components, shapes, and config types in `@d3plus/core` are
    the supported entry points and follow semver. Everything re-exported here
    is implementation detail of the rendering pipeline and may change in any
    minor release. Import it knowingly.
*/

// ── Chart-specific layout stages (one per Viz subclass) ──────────────────────
export {
  applyBulletLayout,
  bulletExtents,
} from "./src/charts/Bullet/applyLayout.js";
export {
  applyCalendarLayout,
  calendarDateFormat,
  calendarLabelStyle,
  calendarOrient,
  calendarPeriod,
  rowDate,
  rowsExtent,
} from "./src/charts/Calendar/applyLayout.js";
export {applyChordLayout} from "./src/charts/Chord/applyLayout.js";
export {applyFunnelLayout} from "./src/charts/Funnel/applyLayout.js";
export {applyGaugeLayout} from "./src/charts/Gauge/applyLayout.js";
export {applyGeomapLayout} from "./src/charts/Geomap/applyLayout.js";
export {applyMatrixLayout} from "./src/charts/Matrix/applyLayout.js";
export {
  applyNetworkLayout,
  placeLoneNodes,
} from "./src/charts/Network/applyLayout.js";
export {
  graphLinkEnd,
  graphNodeId,
  graphNodeRows,
  resolveGraphLinks,
  resolveGraphNodes,
  zoomToNodeBounds,
} from "./src/charts/Network/graph.js";
export type {GraphLink, GraphNode} from "./src/charts/Network/graph.js";
export {installGraphFluent} from "./src/charts/Network/graphFluent.js";
export type {GraphFluent} from "./src/charts/Network/graphFluent.js";
export {
  applyArcDiagramLayout,
  arcNodeGroup,
  arcRadiusScale,
  arcSizeLegendScale,
} from "./src/charts/ArcDiagram/applyLayout.js";
export type {
  ArcCtx,
  ArcLink,
  ArcNode,
} from "./src/charts/ArcDiagram/applyLayout.js";
export {
  arcApex,
  arcBox,
  arcEndTip,
  arcPathD,
  arcPoint,
  arcScale,
  arcSideOf,
  naturalCompare,
  nodeDegrees,
  slotPositions,
  sortArcNodes,
} from "./src/charts/ArcDiagram/arcGeometry.js";
export type {
  ArcGeometry,
  ArcOrient,
  ArcSide,
  NodeSort,
} from "./src/charts/ArcDiagram/arcGeometry.js";
export {
  emitArcLabels,
  fitLabels,
  labelReach,
  labelWidthLimit,
  placeArcLabel,
} from "./src/charts/ArcDiagram/arcLabels.js";
export type {ArcLabel, LabelFit} from "./src/charts/ArcDiagram/arcLabels.js";
export {
  arcDiagramEmit,
  arcLabelAnchor,
  arcLabelPath,
} from "./src/charts/ArcDiagram/emit.js";
export {arcFocus, setupArcEvents} from "./src/charts/ArcDiagram/events.js";
export {
  bindSvgBackgroundClick,
  clearLinkFocus,
  focusLink,
  installFocusBackgroundClick,
  linkEndsBox,
  linkFocusId,
} from "./src/charts/features/linkFocus.js";
export type {FocusBox} from "./src/charts/features/linkFocus.js";
export {
  isLinkDatum,
  LINK_HIT_WIDTH,
  linkArrows,
  linkAriaLabel,
  linkCellText,
  linkEndLabel,
  linkHighlight,
  linkHitPath,
  linkMeta,
  linkNodeOf,
  linkTooltipConfig,
  linkTooltipRows,
  linkTooltipTitle,
  makeLinkDatum,
  nodeConnectionRows,
  nodeConnections,
  nodeHighlight,
  nodeTooltipLinkLimit,
  publishLinkGraph,
  rtlLocale,
  setLinkValue,
} from "./src/charts/features/linkInteraction.js";
export type {
  LinkDatum,
  LinkEnd,
  LinkGraph,
  LinkMeta,
} from "./src/charts/features/linkInteraction.js";
export {
  measuresTask,
  networkMeasures,
} from "./src/charts/features/networkMeasures.js";
export type {
  MeasureArc,
  MeasuresTask,
  NetworkMeasures,
} from "./src/charts/features/networkMeasures.js";
export {
  cancelIdleWork,
  IDLE_BUDGET,
  IdleQueue,
  idleQueue,
  requestIdle,
} from "./src/charts/features/idleQueue.js";
export type {IdleJob} from "./src/charts/features/idleQueue.js";
export {
  NODE_STATS,
  nodeStatRows,
  nodeStatsFields,
  nodeStatsGraph,
  nodeStatsInIdle,
  scheduleNodeStats,
  STAT_PENDING,
  nodeTooltipStatList,
} from "./src/charts/features/nodeStats.js";
export type {
  NodeStat,
  NodeStatsGraph,
  StatLink,
} from "./src/charts/features/nodeStats.js";
export {applyRingsLayout} from "./src/charts/Rings/applyLayout.js";
export {applySankeyLayout} from "./src/charts/Sankey/applyLayout.js";
export {applyPackLayout} from "./src/charts/Pack/applyLayout.js";
export {applyParallelLayout} from "./src/charts/ParallelCoordinates/applyLayout.js";
export {
  applyPieLayout,
  pieAspect,
  pieBaseRadius,
  pieRingLayout,
  pieSweepOf,
} from "./src/charts/Pie/applyLayout.js";
export {
  fitRing,
  isFullTurn,
  pieSweep,
  ringExtent,
  ringSizeFor,
  sweepFraction,
} from "./src/charts/Pie/arcFit.js";
export type {ArcBox, PieSweep, RingFit} from "./src/charts/Pie/arcFit.js";
export {applyPolarAreaLayout} from "./src/charts/PolarArea/applyLayout.js";
export {applyPriestleyLayout} from "./src/charts/Priestley/applyLayout.js";
export {
  isTimeAxis,
  measureTimeAxis,
  parseTime,
  renderTimeAxis,
  rowTime,
  seedTimeAggs,
  timeFields,
} from "./src/charts/Priestley/timeAxis.js";
export type {
  TimeAxisFrame,
  TimeAxisSize,
  TimeValue,
} from "./src/charts/Priestley/timeAxis.js";
export {
  applyGanttLayout,
  ganttDomain,
  ganttTasks,
  LABEL_INDENT,
  LABEL_PADDING,
  MAX_ROW_STEP,
} from "./src/charts/Gantt/applyLayout.js";
export type {GanttLayout, GanttMark} from "./src/charts/Gantt/applyLayout.js";
export {
  ganttEmit,
  milestoneRadius,
  remainingShade,
  REMAINING_MIX,
} from "./src/charts/Gantt/emit.js";
export {
  dependencyNodes,
  dependencyStyle,
  groupNodes,
  labelNodes,
  taskEnd,
  taskStart,
  todayNodes,
  todayValue,
} from "./src/charts/Gantt/ganttDecor.js";
export type {DependencyStyle} from "./src/charts/Gantt/ganttDecor.js";
export {
  bracketPath,
  diamondPath,
  elbowRoute,
  labelColumnWidth,
  progressSplit,
} from "./src/charts/Gantt/ganttGeometry.js";
export type {Point, Span} from "./src/charts/Gantt/ganttGeometry.js";
export {
  ellipsize,
  fitLabel,
  ganttLabelFont,
  LABEL_FONT_SIZE,
  labelWidth,
} from "./src/charts/Gantt/ganttLabels.js";
export type {
  FittedLabel,
  GanttLabelFont,
} from "./src/charts/Gantt/ganttLabels.js";
export {
  dependencyIds,
  ganttRows,
  isMilestone,
  normalizeProgress,
  sortTasks,
} from "./src/charts/Gantt/ganttRows.js";
export type {
  GanttGroupRow,
  GanttRow,
  GanttTask,
  GanttTaskRow,
  TaskSort,
} from "./src/charts/Gantt/ganttRows.js";
export {
  dayCount,
  ganttAriaLabel,
  ganttDuration,
  ganttTooltipRows,
  percent,
  taskTimes,
  timeFormatter,
} from "./src/charts/Gantt/ganttTooltip.js";
export type {TaskTimes} from "./src/charts/Gantt/ganttTooltip.js";
export {applyRadarLayout} from "./src/charts/Radar/applyLayout.js";
export {applyRadialBarLayout} from "./src/charts/RadialBar/applyLayout.js";
export {applyRadialMatrixLayout} from "./src/charts/RadialMatrix/applyLayout.js";
export {applyIcicleLayout} from "./src/charts/Icicle/applyLayout.js";
export {
  applySunburstLayout,
  sunburstFocus,
} from "./src/charts/Sunburst/applyLayout.js";
export {applyTreeLayout} from "./src/charts/Tree/applyLayout.js";
export {applyTreemapLayout} from "./src/charts/Treemap/applyLayout.js";
export {
  applyWaffleLayout,
  waffleFillOptions,
} from "./src/charts/Waffle/applyLayout.js";
export type {WaffleCell} from "./src/charts/Waffle/applyLayout.js";

export {
  accumulate as binAccumulate,
  cumulativeNormalize as binCumulativeNormalize,
  default as binData,
} from "./src/charts/Histogram/binData.js";
export {heightLabel as histogramHeightLabel} from "./src/charts/Histogram/labels.js";
export {bulletStack} from "./src/charts/Bullet/bulletLayout.js";
export {
  fitAxis as bulletAxis,
  normalizeBands as bulletBands,
} from "./src/charts/Bullet/bulletGeometry.js";
export {
  absoluteFormat,
  frameTotals,
  pyramidExtent,
  pyramidSides,
  pyramidTotal,
  sideSign,
  snapMagnitude,
  symmetricDomain,
} from "./src/charts/Pyramid/pyramidData.js";
export {pyramidStackOrder} from "./src/charts/Pyramid/stackOrder.js";
export {
  gutterAxisDefaults,
  gutterInset,
  gutterStackOffset,
  gutterWidth,
  thinBands,
} from "./src/charts/Pyramid/gutter.js";
export {
  bandStep,
  comparisonOutline,
  dashArray,
  sideTitleBoxes,
} from "./src/charts/Pyramid/scene.js";
export {curveFactory, lineCurve} from "./src/charts/Plot/lineCurve.js";
export {
  curvePolyline,
  splitDash,
  splitLength,
} from "./src/charts/Plot/curveLength.js";
export {
  GAP_DASH,
  complementIntervals,
  gapsAfter,
  intersectIntervals,
  intervalsDash,
  patternIntervals,
  pointLengths,
  resolveConnectGaps,
  runIndices,
  runPath,
} from "./src/charts/Plot/connectGaps.js";
export type {
  ConnectGaps,
  ConnectGapsConfig,
  GapBridge,
  Interval,
} from "./src/charts/Plot/connectGaps.js";
export {
  breakLines,
  clipBands,
  lineGaps,
} from "./src/charts/Plot/connectGapsScene.js";
export type {LineGaps, SeriesGaps} from "./src/charts/Plot/connectGapsScene.js";
export {
  lineLabelKey,
  lineLabelSides,
  lineLabelText,
  lineLabelValue,
  rowLineLabelSides,
} from "./src/charts/Plot/lineLabelSides.js";
export {spreadLabelPositions} from "./src/charts/Plot/lineLabelSpread.js";
export {
  AREA_LABEL_FONT_MAX,
  AREA_LABEL_FONT_MIN,
  AREA_LABEL_FONT_WEIGHT,
  AREA_LABEL_PADDING,
  bandColor,
  bandFontWeight,
  bandSections,
  boxLabelsOnly,
  densify,
  emitAreaLabels,
  labelSizes,
  labelsAlongBand,
  placeBandLabel,
  thickRuns,
} from "./src/charts/Plot/areaLabelsAlong.js";
export type {
  BandLabelPlacement,
  BandSection,
} from "./src/charts/Plot/areaLabelsAlong.js";
export type {
  LineLabelConfig,
  LineLabelSide,
  LineLabelsSetting,
  LineLabelsValue,
  LineLabelValueFormat,
} from "./src/charts/Plot/lineLabelSides.js";
export {
  lineLabelBox,
  lineLabelConfig,
} from "./src/charts/Plot/lineLabelEmit.js";
export {
  fitLineLabelText,
  labelOverlapsLine,
  lineLabelCap,
  lineLabelSpace,
  measureLineLabel,
  measurePlotLineLabels,
} from "./src/charts/Plot/pipelineLineLabels.js";
export {
  bumpLineLabels,
  emitLineLabelConnectors,
} from "./src/charts/features/lineLabels.js";
export {
  autoForecastStart,
  discreteOrder,
  discreteRank,
  forecastDefaults,
  forecastRow,
  forecastStart,
  seriesForecastStarts,
  trendForecastStart,
} from "./src/charts/Plot/forecast.js";
export type {
  ForecastRow,
  ForecastSetting,
  ForecastStart,
} from "./src/charts/Plot/forecast.js";
export {
  backdropDecor,
  discreteDirection,
  emitForecast,
  forecastDashOr,
  forecastLineDash,
  forecastRows,
  lineRows,
  slotEdge,
} from "./src/charts/Plot/forecastScene.js";
export type {ForecastFrame} from "./src/charts/Plot/forecastScene.js";
export {
  anchorPoint,
  axisPixel,
  axisSpan,
  categoryHalfStep,
  clipSpan,
  inPlot,
  isVertical,
  plotAnnotationFrame,
} from "./src/charts/features/annotationFrame.js";
export type {
  AnnotationAxis,
  AnnotationFrame,
  AxisFrame,
  PlotRect,
} from "./src/charts/features/annotationFrame.js";
export {
  annotationTextNode,
  annotationTextStyle,
  wrapAnnotationText,
} from "./src/charts/features/annotationText.js";
export type {
  AnnotationText,
  TextAlign,
  TextBlock,
} from "./src/charts/features/annotationText.js";
export {
  arrowheadPoints,
  clampBox,
  connectorEndpoints,
  offsetBox,
  placeCalloutBox,
  pullBack,
} from "./src/charts/features/calloutLayout.js";
export type {
  Box as CalloutBox,
  Point as CalloutPoint,
} from "./src/charts/features/calloutLayout.js";
export {
  calloutNodes,
  calloutPicker,
  calloutRowNodes,
} from "./src/charts/features/calloutScene.js";
export {
  expandReferenceBands,
  expandReferenceLines,
  REFERENCE_BAND,
  REFERENCE_LINE,
  referenceAxis,
  referenceBandLabelAt,
  referenceBandLabelSpots,
  referenceBandNodes,
  referenceBandRect,
  referenceLineLabelAt,
  referenceLineLabelSpots,
  referenceLineNodes,
  referenceLinePoints,
} from "./src/charts/features/referenceAnnotations.js";
export {textHalo} from "./src/charts/features/textHalo.js";
export {
  bindAccessors,
  handleAxisTooltip,
  isAxisTooltipDatum,
  resolveAxisTooltip,
} from "./src/charts/features/axisTooltip.js";
export type {AxisTooltipContent} from "./src/charts/features/axisTooltip.js";
export {
  axisTooltipTarget,
  inertAxis,
  labelCut,
  stampTickTooltips,
  stampTitleTooltip,
  tickRank,
} from "./src/components/Axis/axisTooltipTargets.js";
export type {
  AxisTooltipTarget,
  RankedAxis,
} from "./src/components/Axis/axisTooltipTargets.js";
export {
  clearGraphFocus,
  withinArea,
} from "./src/charts/features/ensureZoomDom.js";
export {
  labelSpotBox,
  pickLabelSpot,
  placeReferenceLabels,
  registerLabelSpots,
  slideSteps,
} from "./src/charts/features/referenceLabelPlacement.js";
export type {LabelSpot} from "./src/charts/features/referenceLabelPlacement.js";
export {
  openDomainEnds,
  referenceDomainValues,
  widenReferenceDomains,
  widenToValues,
} from "./src/charts/Plot/referenceDomains.js";
export {
  annotationLayer,
  collectAnnotationGroup,
  emitAnnotations,
  plotAnnotationList,
  renderPlotAnnotation,
} from "./src/charts/features/plotAnnotations.js";
export {
  betweenPoints,
  emitFillBetween,
  fillBetweenDefaults,
  fillBetweenPairs,
  inheritedFillStyle,
  sideClip,
  valueDirection,
} from "./src/charts/Plot/fillBetween.js";
export type {
  BetweenPoint,
  FillBetweenSetting,
} from "./src/charts/Plot/fillBetween.js";
export {
  closestFreeOffset,
  fitSwarms,
  swarmExtent,
  swarmFitScale,
  swarmLayout,
} from "./src/charts/Plot/swarmLayout.js";
export type {
  SwarmFit,
  SwarmFitOptions,
  SwarmNode,
  SwarmOverflow,
} from "./src/charts/Plot/swarmLayout.js";
export {
  applySwarmLanes,
  resolveSwarm,
  swarmHidesAxis,
  swarmPlacements,
} from "./src/charts/Plot/swarm.js";
export type {
  SwarmConfig,
  SwarmPlacement,
  SwarmSetting,
  SwarmState,
} from "./src/charts/Plot/swarm.js";
export {
  confidenceCrossAxis,
  confidenceValueAxis,
  crossAxisValues,
  crossBounds,
  resolveConfidenceAxes,
  rowCrossConfidence,
  syncConfidenceAxes,
} from "./src/charts/Plot/confidenceAxes.js";
export type {ConfidenceAxes} from "./src/charts/Plot/confidenceAxes.js";
export {
  emitPointConfidence,
  pointErrorBoxes,
  pointErrorObstacles,
  pointErrorPath,
} from "./src/charts/Plot/pointConfidence.js";
export type {PointBars} from "./src/charts/Plot/pointConfidence.js";
export {
  anchorAtBase,
  barErrorReach,
} from "./src/charts/Plot/barLabelConfidence.js";
export {
  compareCategories,
  stepValue,
  waterfallKinds,
  waterfallStackOffset,
  waterfallStep,
  waterfallSteps,
} from "./src/charts/Waterfall/steps.js";
export type {
  StepAccessors,
  WaterfallKind,
  WaterfallStep,
} from "./src/charts/Waterfall/steps.js";
export {
  categoryKey as paretoCategoryKey,
  paretoComparator,
  paretoSteps,
} from "./src/charts/Pareto/paretoSteps.js";
export type {
  ParetoAccessors,
  ParetoStep,
} from "./src/charts/Pareto/paretoSteps.js";
export {
  connectorBars,
  connectorNodes,
  connectorSegments,
} from "./src/charts/Waterfall/connectors.js";
export type {
  ConnectorBar,
  ConnectorSegment,
} from "./src/charts/Waterfall/connectors.js";
export {
  kindColor,
  labelAlign,
  labelBox,
  stepLabel,
  tooltipRows as waterfallTooltipRows,
} from "./src/charts/Waterfall/labels.js";
export {
  bandOpacityTargets,
  boundOrValue,
  confidenceBands,
  DEFAULT_BAND_OPACITY,
  extraBandValues,
  layerOpacities,
  resolveConfidenceBands,
  rowBands,
} from "./src/charts/Plot/confidenceBands.js";
export type {
  BandBounds,
  ConfidenceBand,
} from "./src/charts/Plot/confidenceBands.js";
export {
  appendPointConfidence,
  axisBoundRows,
  bandRows,
  rangeText,
} from "./src/charts/Plot/confidenceTooltip.js";
export {emitLineBands} from "./src/charts/Plot/lineBands.js";
export {nestSunburst, sunburstLayout} from "./src/charts/Sunburst/partition.js";
export {
  sunburstPadAngle,
  sunburstRadii,
} from "./src/charts/Sunburst/geometry.js";
export {
  sunburstLabelBox,
  sunburstSplit,
} from "./src/charts/Sunburst/labelFit.js";
export {
  addDays,
  blockDays,
  blockMonths,
  blockWeeks,
  calendarBlocks,
  calendarDayKey,
  dateExtent,
  daysBetween,
  parseCalendarDate,
  resolveWeekStart,
  startOfDay,
  weekIndex,
  weekdaySlot,
} from "./src/charts/Calendar/calendarDates.js";
export type {
  CalendarBlock,
  CalendarDay,
  CalendarPeriod,
} from "./src/charts/Calendar/calendarDates.js";
export {
  blockGrid,
  cellCornerRadius,
  fitCalendar,
  monthLabelWeek,
  monthOutlinePath,
  slotPosition,
  weekdayLabelSlots,
} from "./src/charts/Calendar/calendarGrid.js";
export type {
  CalendarFit,
  CalendarFitInput,
  CalendarOrient,
} from "./src/charts/Calendar/calendarGrid.js";
export {
  calendarInsets,
  calendarLayout,
  labelPadding,
  weekdayNames,
} from "./src/charts/Calendar/calendarLayout.js";
export type {
  CalendarCell,
  CalendarLabel,
  CalendarLabelOptions,
  CalendarLayoutInput,
  CalendarLayoutResult,
  CalendarOutline,
} from "./src/charts/Calendar/calendarLayout.js";
export {
  calendarDateSpecifier,
  calendarFormatter,
  calendarTimeLocale,
  narrowName,
} from "./src/charts/Calendar/calendarFormat.js";
export {
  calendarEmit,
  calendarPalette,
  colorValue,
  hasColorValue,
} from "./src/charts/Calendar/emit.js";
export {sunburstLabelMetrics} from "./src/charts/Sunburst/emit.js";
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
} from "./src/charts/Funnel/funnelGeometry.js";
export type {
  FunnelCurve,
  ProfileKnot,
  ProfilePoint,
  StageSpan,
} from "./src/charts/Funnel/funnelGeometry.js";
export {
  conversionModes,
  fitFontSize,
  lineBoxes,
  planFunnelLabels,
  planLabel,
} from "./src/charts/Funnel/funnelLabels.js";
export type {
  FunnelLabelPlan,
  LabelBox,
  LabelPlan,
  LabelSizing,
  StageLabelInput,
} from "./src/charts/Funnel/funnelLabels.js";
export {
  funnelCurve,
  funnelOrder,
  funnelOrient,
  funnelStages,
  sharedScaleMax,
} from "./src/charts/Funnel/applyLayout.js";
export {
  funnelFacetHooks,
  funnelFacetPanel,
  shareFunnelLabelSize,
  shareFunnelScale,
} from "./src/charts/Funnel/funnelFacet.js";
export type {FunnelFacetScale} from "./src/charts/Funnel/funnelFacet.js";
export type {
  FunnelShared,
  FunnelStage,
} from "./src/charts/Funnel/applyLayout.js";
export {
  funnelEmit,
  neckConfig,
  neckPaint,
  stageAria,
} from "./src/charts/Funnel/emit.js";
export {
  funnelLabelNodes,
  labelSizeCap,
  percentText,
  planStageLabels,
  stageBoxes,
  stageLabelSize,
  stageLines,
} from "./src/charts/Funnel/labelNodes.js";
export type {StageLabels} from "./src/charts/Funnel/labelNodes.js";
export {funnelTooltipRows} from "./src/charts/Funnel/index.js";
export {
  applyBarWidths,
  barKey,
  barSpanAxisConfig,
  barWidthAccessor,
  barWidthLabel,
  barWidthTooltipRows,
  labelBarWidth,
  layoutBarSpans,
  measureBars,
} from "./src/charts/Plot/barWidth.js";
export type {
  BarSpan,
  BarSpanLayout,
  BarWidthAccessor,
  MeasuredBar,
} from "./src/charts/Plot/barWidth.js";
export {
  isExpandOffset,
  marimekkoAxisDefaults,
  marimekkoFacetAxes,
  marimekkoFixedAxes,
  percentText as marimekkoPercentText,
} from "./src/charts/Marimekko/axis.js";
export {
  largestRadius,
  lollipopBuffer,
  STEM_KEY_SUFFIX,
  stemFromBar,
  stemPoints,
} from "./src/charts/Lollipop/stemLayout.js";
export type {
  BarBox,
  StemLayout,
  StemPoint,
} from "./src/charts/Lollipop/stemLayout.js";
export {lollipopEmit} from "./src/charts/Lollipop/emit.js";
export {bubbleEmit, largestFirst} from "./src/charts/BubbleChart/emit.js";
export {zeroAnchoredRadius} from "./src/charts/Plot/pipeline.js";
export {columnHighlight} from "./src/charts/Plot/columnHighlight.js";
export {
  CONNECTOR_KEY_SUFFIX,
  dumbbellEmit,
  dumbbellSpans,
} from "./src/charts/Dumbbell/emit.js";
export type {DumbbellSpan} from "./src/charts/Dumbbell/emit.js";
export {
  categoryGaps,
  gapComparator,
  syncGapSort,
} from "./src/charts/Dumbbell/gapSort.js";
export type {
  CategoryComparator,
  GapSort,
  GapSortState,
} from "./src/charts/Dumbbell/gapSort.js";
export {
  largestRemainder,
  waffleCellGeometry,
  waffleCellPosition,
  waffleCounts,
  waffleGrid,
} from "./src/charts/Waffle/waffleLayout.js";
export type {
  WaffleCellGeometry,
  WaffleFillDirection,
  WaffleFillStart,
  WaffleGridPosition,
} from "./src/charts/Waffle/waffleLayout.js";
export {
  waffleCellGeometryNode,
  waffleCellShape,
} from "./src/charts/Waffle/emit.js";
export type {WaffleCellShape} from "./src/charts/Waffle/emit.js";
export {
  formatShare,
  waffleShare,
  waffleTooltipRows,
} from "./src/charts/Waffle/tooltip.js";
export {
  densityAt,
  densityGroups,
  densityStats,
  densityWidthScale,
  sortByMedian,
} from "./src/charts/helpers/densityData.js";
export type {
  DensityGroup,
  DensityGroupOptions,
  DensityScale,
  DensitySummary,
  MedianSort,
} from "./src/charts/helpers/densityData.js";
export {
  DENSITY,
  densityMeta,
  densityShapeId,
  densityTooltipRows,
  installDensity,
  summarizeBeforePreDraw,
  unwrapRow,
} from "./src/charts/helpers/densityChart.js";
export type {
  DensityLayout,
  DensityMeta,
} from "./src/charts/helpers/densityChart.js";
export {
  growFromLine,
  growRectsFromCenter,
} from "./src/charts/helpers/densityEnter.js";
export {
  densityCurves,
  densityHeightLabel,
  densityHeightScale,
  pooledBandwidth,
  resolveDensityScale,
} from "./src/charts/DensityPlot/densityCurves.js";
export type {
  DensityCurveOptions,
  DensityCurves,
} from "./src/charts/DensityPlot/densityCurves.js";
export {
  categoryStep,
  violinEdges,
  violinOutline,
  violinSlots,
} from "./src/charts/Violin/violinLayout.js";
export type {
  ViolinPoint,
  ViolinSide,
  ViolinSlot,
  ViolinSlotOptions,
} from "./src/charts/Violin/violinLayout.js";
export {emitInner, innerSet} from "./src/charts/Violin/inner.js";
export type {
  InnerFrame,
  PlacedViolin,
  ViolinInner,
} from "./src/charts/Violin/inner.js";
export {VIOLIN_PADDING, violinEmit} from "./src/charts/Violin/emit.js";
export {
  ridgelineEmit,
  ridgelinePadding,
  ridgeOverlap,
} from "./src/charts/Ridgeline/emit.js";
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
} from "./src/charts/ParallelCoordinates/dimensions.js";
export type {
  DimensionType,
  ParallelDimension,
} from "./src/charts/ParallelCoordinates/dimensions.js";
export {
  brushFromPixels,
  hasBrushes,
  isNumericRange,
  pixelsFromBrush,
  rowPasses,
  valuePasses,
} from "./src/charts/ParallelCoordinates/brushFilter.js";
export type {BrushAxis} from "./src/charts/ParallelCoordinates/brushFilter.js";
export {
  linePoints,
  parallelPath,
} from "./src/charts/ParallelCoordinates/paths.js";
export type {
  LineAxis,
  ParallelCurve,
  ParallelOrient,
} from "./src/charts/ParallelCoordinates/paths.js";
export {
  axisDomain,
  dimensionAxisConfig,
  dimensionTitleStyle,
  layoutAxes,
} from "./src/charts/ParallelCoordinates/axes.js";
export type {
  AxesLayout,
  PlacedAxis,
} from "./src/charts/ParallelCoordinates/axes.js";
export {chromeNode} from "./src/charts/ParallelCoordinates/chrome.js";
export {
  brushTarget,
  parallelDimensionKeys,
  parallelOrient,
} from "./src/charts/ParallelCoordinates/applyLayout.js";
export {
  clearStrip,
  stripLength,
  stripSelection,
  syncBrushDom,
} from "./src/charts/ParallelCoordinates/brushDom.js";
export type {BrushTarget} from "./src/charts/ParallelCoordinates/brushDom.js";
export {
  lineAriaLabel,
  parallelEmit,
  resolveLineOpacity,
} from "./src/charts/ParallelCoordinates/emit.js";
export type {ParallelLine} from "./src/charts/ParallelCoordinates/emit.js";
export {applyLineStates} from "./src/charts/ParallelCoordinates/lineStates.js";
export {
  dimensionTooltipRows,
  formatDimensionValue,
} from "./src/charts/ParallelCoordinates/format.js";
export {
  titleHeight,
  titleNodes,
  titleWidths,
} from "./src/charts/ParallelCoordinates/titles.js";
export {
  aggregateAlluvial,
  alluvialPathText,
} from "./src/charts/Alluvial/aggregate.js";
export type {
  AlluvialBand,
  AlluvialGraph,
  AlluvialNode,
  AlluvialPath,
} from "./src/charts/Alluvial/aggregate.js";
export {
  alluvialNodeId,
  alluvialPathRows,
  alluvialValueTitle,
  applyAlluvialLayout,
  countRows,
} from "./src/charts/Alluvial/applyLayout.js";
export type {
  AlluvialCtx,
  AlluvialDrawnBand,
  AlluvialDrawnNode,
} from "./src/charts/Alluvial/applyLayout.js";
export {
  isMissingCategory,
  resolveAlluvialDimensions,
  resolveColorBy,
} from "./src/charts/Alluvial/dimensions.js";
export type {
  AlluvialAccessor,
  AlluvialDimension,
  AlluvialDimensionInput,
} from "./src/charts/Alluvial/dimensions.js";
export {alluvialEmit, formatAlluvialValue} from "./src/charts/Alluvial/emit.js";
export {
  alluvialHighlight,
  alluvialTooltipRows,
  alluvialTooltipTitle,
  installAlluvialHover,
} from "./src/charts/Alluvial/hover.js";
export {
  alluvialColumns,
  alluvialRibbon,
  incomingBarycenters,
  layoutAlluvial,
  sortAlluvialColumns,
} from "./src/charts/Alluvial/layout.js";
export type {
  AlluvialLayoutOptions,
  AlluvialNodeSort,
} from "./src/charts/Alluvial/layout.js";
export {
  alluvialDimensions,
  alluvialGroupBy,
  alluvialMeta,
  setAlluvialMeta,
  sourceRows,
} from "./src/charts/Alluvial/meta.js";
export type {AlluvialMeta} from "./src/charts/Alluvial/meta.js";
export {
  TITLE_GAP as ALLUVIAL_TITLE_GAP,
  alluvialTitleBoxes,
  alluvialTitleNodes,
  alluvialTitleStyle,
  alluvialTitleTooltip,
  sizeAlluvialTitles,
} from "./src/charts/Alluvial/titles.js";
export type {AlluvialTitle} from "./src/charts/Alluvial/titles.js";
export {
  candleChange,
  candleDirection,
  candlePath,
  candleWidth,
  finiteValue,
  ohlcBarPath,
  ohlcExtent,
  periodSpacing,
  pixelCenter,
  readOhlc,
} from "./src/charts/Candlestick/ohlc.js";
export type {
  CandleDirection,
  CandlestickVariant,
  Ohlc,
  OhlcAccessor,
  OhlcAccessors,
} from "./src/charts/Candlestick/ohlc.js";
export {
  aggregateFunctionFields,
  DEFAULT_AGGS,
  firstValue,
  keyedAccessor,
  lastValue,
  maxValue,
  minValue,
  ohlcAccessors,
  sumValue,
  syncDefaultAggs,
} from "./src/charts/Candlestick/aggregate.js";
export type {Aggregator} from "./src/charts/Candlestick/aggregate.js";
export {
  emitVolume,
  installVolumeStrip,
  stripSize,
  VOLUME_DEFAULTS,
  volumeAccessor,
  volumeScale,
  volumeStripRect,
} from "./src/charts/Candlestick/volume.js";
export type {
  VolumeConfig,
  VolumeStrip,
} from "./src/charts/Candlestick/volume.js";
export {
  candlestickBuffer,
  widenDomain,
} from "./src/charts/Candlestick/buffer.js";
export {
  CANDLESTICK_SHAPE,
  candleTexture,
  emitCandlesticks,
  layoutCandles,
} from "./src/charts/Candlestick/emit.js";
export type {CandleLayout} from "./src/charts/Candlestick/emit.js";
export {
  bandAxisDefaults,
  periodDate,
} from "./src/charts/Candlestick/periods.js";
export {
  candleAriaLabel,
  candleTooltipRows,
  formatChange,
  formatPrice,
  volumeAriaLabel,
} from "./src/charts/Candlestick/tooltip.js";
export {
  BIN_SIZE,
  CONTOUR_DEFAULTS,
  HEXBIN_META,
  HEXBIN_SHAPE,
  POINT_DEFAULTS,
  hexbinMeta,
  hexbinRow,
  hexbinSettings,
  hexbinValue,
  resolveBinValue,
  unwrapHexbinRow,
} from "./src/charts/Hexbin/settings.js";
export type {
  BinMeta,
  BinValueOption,
  ContourConfig,
  ContourMeta,
  ContoursOption,
  HexbinMeta,
  HexbinSettings,
  PointConfig,
} from "./src/charts/Hexbin/settings.js";
export {
  binArea,
  binBounds,
  binMeasure,
  binPath,
  binPoints,
} from "./src/charts/Hexbin/binning.js";
export type {
  BinAgg,
  BinShape,
  PixelBin,
  PixelBounds,
  PixelPoint,
} from "./src/charts/Hexbin/binning.js";
export {
  contourLevels,
  contourPath,
  densityContours,
} from "./src/charts/Hexbin/contours.js";
export type {
  ContourLevel,
  ContourOptions,
} from "./src/charts/Hexbin/contours.js";
export {
  binRows,
  binsInView,
  colorRows,
  colorScaleRows,
  contourRows,
  estimatedColorRows,
  hexbinState,
  noteDrawRows,
  plotFrame,
  pointPath,
  refreshColorScale,
  sharedColorRows,
} from "./src/charts/Hexbin/layers.js";
export type {HexbinState, PlotFrame} from "./src/charts/Hexbin/layers.js";
export {hexbinBuffer} from "./src/charts/Hexbin/buffer.js";
export {hexbinEmit, pixelPoints} from "./src/charts/Hexbin/emit.js";
export {
  binAriaLabel,
  contourAriaLabel,
  contourLevelText,
  hexbinTooltipRows,
  hexbinTooltipTitle,
} from "./src/charts/Hexbin/tooltip.js";
export {
  CONTOUR_LABEL_FONT_SIZE,
  CONTOUR_LABEL_MAX_LEVELS,
  contourLabelSpacing,
  contourLabelStep,
  contourRings,
  emitContourLabels,
  labelledLevels,
  paddedBand,
  ringDistance,
  ringLabelStretches,
} from "./src/charts/Hexbin/contourLabels.js";
export {
  isAggregatedBranch,
  mergeBranch,
  nestPartition,
  partitionLayout,
  partitionLineage,
  partitionSort,
} from "./src/charts/partition/hierarchy.js";
export type {
  PartitionBranch,
  PartitionFields,
  PartitionKey,
  PartitionLayoutInputs,
  PartitionNode,
  PartitionSort,
} from "./src/charts/partition/hierarchy.js";
export {partitionFocus} from "./src/charts/partition/zoom.js";
export {partitionShadeAmount} from "./src/charts/partition/shade.js";
export {
  labelMetrics,
  partitionSplit,
  wrapLineCount,
} from "./src/charts/partition/labelWords.js";
export {icicleLayout} from "./src/charts/Icicle/layout.js";
export type {IcicleNode} from "./src/charts/Icicle/layout.js";
export {
  icicleBands,
  icicleCollapse,
  icicleRect,
} from "./src/charts/Icicle/geometry.js";
export type {IcicleOrient, IcicleRect} from "./src/charts/Icicle/geometry.js";
export {icicleLabelBox} from "./src/charts/Icicle/labelFit.js";
export {
  icicleRootEdge,
  icicleStagger,
} from "./src/charts/Icicle/enterStagger.js";
export type {IcicleStagger} from "./src/charts/Icicle/enterStagger.js";
export {
  polarInnerRadius,
  polarLevels,
  polarPadAngle,
  polarRadius,
  polarSlots,
  polarStack,
} from "./src/charts/polar/geometry.js";
export type {
  PolarDomainInput,
  PolarScale,
  PolarSlot,
  PolarStackSegment,
} from "./src/charts/polar/geometry.js";
export {
  polarBoxesOverlap,
  polarHorizontalLayout,
  polarLabelFitRadius,
  polarLabelPlacement,
  polarLabelRoom,
  polarLabelsCollide,
  polarSpokeRotation,
} from "./src/charts/polar/labels.js";
export {
  polarCategoryLayout,
  polarCategoryNodes,
  polarLevelNodes,
} from "./src/charts/polar/chrome.js";
export {
  polarAxisConfig,
  polarValueRow,
  polarWedgeNodes,
} from "./src/charts/polar/config.js";
export {
  legendLargestFirst,
  rowLegend,
  shareRow,
} from "./src/charts/features/sharedFields.js";
export {
  polarSlotArc,
  polarSlotTops,
  polarWedgeLayout,
} from "./src/charts/polar/wedgeLayout.js";
export type {
  PolarFrame,
  PolarWedge,
  PolarWedgeOptions,
} from "./src/charts/polar/wedgeLayout.js";
export {
  polarFacetHooks,
  polarFacetPanel,
  polarSharedExtent,
  sharePolarScale,
} from "./src/charts/polar/polarFacet.js";
export type {
  PolarDomainValues,
  PolarFacetScale,
} from "./src/charts/polar/polarFacet.js";
export {
  polarAreaDomainValues,
  polarAreaSlotOf,
} from "./src/charts/PolarArea/applyLayout.js";
export {polarAreaEmit} from "./src/charts/PolarArea/emit.js";
export {
  radialBarDomainValues,
  radialBarRows,
} from "./src/charts/RadialBar/applyLayout.js";
export {radialBarEmit} from "./src/charts/RadialBar/emit.js";
export {
  radialBarFootprint,
  radialBarLabelRoom,
  radialBarTracks,
} from "./src/charts/RadialBar/tracks.js";
export {
  measureTrackLabels,
  RADIAL_BAR_MIN_LABEL_GAP,
  radialBarCurvedRows,
  radialBarSweep,
  radialBarTrackLabels,
  radialBarTrackLayout,
  trackFontSize,
} from "./src/charts/RadialBar/trackLayout.js";
export {
  radialBarCurvedLabels,
  radialBarLabelSpot,
} from "./src/charts/RadialBar/curvedLabels.js";
export type {RadialBarLabelSpot} from "./src/charts/RadialBar/curvedLabels.js";
export type {RadialBarFrame} from "./src/charts/RadialBar/trackLayout.js";

// ── ChartDefinition values ───────────────────────────────────────────────────
export {alluvialDef, alluvialValue} from "./src/charts/Alluvial/index.js";
export {beeswarmDef} from "./src/charts/Beeswarm/index.js";
export {bubbleChartDef} from "./src/charts/BubbleChart/index.js";
export {bulletDef} from "./src/charts/Bullet/index.js";
export {calendarDef, defaultCalendarDate} from "./src/charts/Calendar/index.js";
export {candlestickDef} from "./src/charts/Candlestick/index.js";
export {chordDef} from "./src/charts/Chord/index.js";
export {connectedScatterDef} from "./src/charts/ConnectedScatter/index.js";
export {
  DATA_ORDER,
  coerceOrder,
  compareOrder,
  endLabelPath,
  keepOrderField,
  orderOf,
  orderedPointKeys,
  orderedSeries,
  segmentArrows,
  sortByOrder,
} from "./src/charts/Plot/orderPath.js";
export type {OrderAccessor, PathArrow} from "./src/charts/Plot/orderPath.js";
export {
  ORDER_POINT_SHAPES,
  orderTooltipRows,
  orderValueText,
  orderedMarks,
  seriesStrokes,
} from "./src/charts/Plot/orderPathScene.js";
export {
  DENSITY_POINT,
  curvesBeforePreDraw,
  densityPlotDef,
  densityPointMeta,
  densityPointTooltipRows,
} from "./src/charts/DensityPlot/index.js";
export type {DensityPointMeta} from "./src/charts/DensityPlot/index.js";
export {
  densityAreaEmit,
  rugGroups,
  rugNodes,
  rugSegments,
  rugSettings,
  rugTickSize,
} from "./src/charts/DensityPlot/rug.js";
export type {RugConfig} from "./src/charts/DensityPlot/rug.js";
export {connectorStroke, dumbbellDef} from "./src/charts/Dumbbell/index.js";
export {fanChartDef} from "./src/charts/FanChart/index.js";
export {funnelDef} from "./src/charts/Funnel/index.js";
export {ganttDef, progressAgg, taskAccessor} from "./src/charts/Gantt/index.js";
export {gaugeDef} from "./src/charts/Gauge/index.js";
export {geomapDef} from "./src/charts/Geomap/index.js";
export {hexbinDef, keepNumericRows} from "./src/charts/Hexbin/index.js";
export {histogramDef} from "./src/charts/Histogram/index.js";
export {
  horizonChartDef,
  rowLabelOpacity,
  shareHorizonScales,
} from "./src/charts/HorizonChart/index.js";
export {
  applyRowDomain,
  bandCount,
  measureBands,
  rowDomain,
} from "./src/charts/HorizonChart/measure.js";
export {
  handleRowLabel,
  rowHidden,
  labelAnchor,
  rowLabelOf,
  rowLabelTabStop,
  rowToggle,
} from "./src/charts/HorizonChart/rowFilter.js";
export type {RowFilter} from "./src/charts/HorizonChart/rowFilter.js";
export {
  horizonBandSize,
  horizonSlices,
  niceCeil,
} from "./src/charts/HorizonChart/horizonBands.js";
export type {HorizonSlice} from "./src/charts/HorizonChart/horizonBands.js";
export {horizonPalette} from "./src/charts/HorizonChart/horizonColors.js";
export type {
  HorizonColorConfig,
  HorizonColorSetting,
  HorizonPalette,
} from "./src/charts/HorizonChart/horizonColors.js";
export {
  HORIZON_ROW,
  horizonEmit,
  horizonRowBox,
  horizonSlicePath,
} from "./src/charts/HorizonChart/emit.js";
export type {HorizonRowBox} from "./src/charts/HorizonChart/emit.js";
export {
  handleHorizonHover,
  horizonHitRows,
  resolveHorizonHover,
} from "./src/charts/HorizonChart/hover.js";
export type {
  HorizonHitRow,
  HorizonHover,
  HorizonHoverRow,
} from "./src/charts/HorizonChart/hover.js";
export {
  HORIZON_BAND,
  bandKeyRows,
  bandLabel,
  bandMeta,
  horizonState,
  rowValue,
  seriesId,
  userRow as horizonUserRow,
  valueColor,
  valueFormat as horizonValueFormat,
} from "./src/charts/HorizonChart/state.js";
export type {
  HorizonBandMeta,
  HorizonState,
} from "./src/charts/HorizonChart/state.js";
export {icicleDef} from "./src/charts/Icicle/index.js";
export {lollipopDef} from "./src/charts/Lollipop/index.js";
export {marimekkoDef} from "./src/charts/Marimekko/index.js";
export {matrixDef} from "./src/charts/Matrix/index.js";
export {networkDef} from "./src/charts/Network/index.js";
export {arcDiagramDef, arcTableData} from "./src/charts/ArcDiagram/index.js";
export {ringsDef} from "./src/charts/Rings/index.js";
export {sankeyDef} from "./src/charts/Sankey/index.js";
export {scatterDef} from "./src/charts/Scatter/index.js";
export {
  prepareSlope,
  slopeChartDef,
  slopeFill,
  slopeValueAxis,
} from "./src/charts/SlopeChart/index.js";
export {
  slopeColors,
  slopeColorsDark,
  slopeColorsLight,
  slopeDirection,
  slopeDirections,
  slopePeriods,
} from "./src/charts/SlopeChart/slope.js";
export type {
  SlopeColors,
  SlopeColorSetting,
  SlopeDirection,
} from "./src/charts/SlopeChart/slope.js";
export {
  streamgraphDef,
  streamValueAxis,
} from "./src/charts/Streamgraph/index.js";
export {packDef} from "./src/charts/Pack/index.js";
export {
  parallelCoordinatesDef,
  resolveBrushStyle,
} from "./src/charts/ParallelCoordinates/index.js";
export {paretoDef} from "./src/charts/Pareto/index.js";
export {pieDef} from "./src/charts/Pie/index.js";
export {polarAreaDef} from "./src/charts/PolarArea/index.js";
export {priestleyDef} from "./src/charts/Priestley/index.js";
export {pyramidDef} from "./src/charts/Pyramid/index.js";
export {radarDef} from "./src/charts/Radar/index.js";
export {radialBarDef} from "./src/charts/RadialBar/index.js";
export {radialMatrixDef} from "./src/charts/RadialMatrix/index.js";
export {ridgelineDef} from "./src/charts/Ridgeline/index.js";
export {sunburstDef} from "./src/charts/Sunburst/index.js";
export {treeDef} from "./src/charts/Tree/index.js";
export {treemapDef} from "./src/charts/Treemap/index.js";
export {violinDef} from "./src/charts/Violin/index.js";
export {waffleDef} from "./src/charts/Waffle/index.js";
export {waterfallDef} from "./src/charts/Waterfall/index.js";

// ── Fluent-accessor generation ───────────────────────────────────────────────
export {
  installFluent,
  isFluentAccessor,
  mergeConfig,
  mergeConfigBag,
  resolvesReset,
  RESOLVES_RESET,
} from "./src/fluent.js";
export type {FluentHost} from "./src/fluent.js";

// ── Pipeline orchestration + the config/context boundary ─────────────────────
export {runStages} from "./src/charts/pipeline/stages.js";
export {
  runPostDrawFeatures,
  runVizPipeline,
} from "./src/charts/pipeline/runVizPipeline.js";
export {resolveSpec} from "./src/charts/pipeline/resolveSpec.js";
export {vizDraw} from "./src/charts/pipeline/vizDraw.js";
export {
  vizPostThresholdCtx,
  vizPreDraw,
} from "./src/charts/pipeline/vizPreDraw.js";

// ── Plot paint phase + axis rendering ────────────────────────────────────────
export {plotEmit, plotPaint} from "./src/charts/features/plotPaint.js";
export {renderAxes} from "./src/charts/features/axes.js";
export {
  allotEndLabelWidths,
  alignAxisLine,
  domainEnds,
  emitEndLabels,
  END_LABEL_AXIS_CONFIG,
  endLabelSpace,
  labelsXEnds,
  layoutEndLabels,
  measureEndLabels,
  placeEndLabels,
} from "./src/charts/features/plotEndLabels.js";
export {frozenAxis} from "./src/charts/features/frozenAxis.js";
export {computeAxisLayout, measureAxis} from "./src/components/Axis/Axis.js";

// ── Axis breaks (#645, #766, #767) ───────────────────────────────────────────
export {
  brokenScale,
  brokenScaleTicks,
  isBrokenScale,
  normalizeBreaks,
} from "./src/components/Axis/brokenScale.js";
export type {
  BreakRange,
  BrokenScale,
  BrokenScaleSpec,
  ScaleSegment,
} from "./src/components/Axis/brokenScale.js";
export {
  brokenTimeScale,
  isBrokenTimeScale,
} from "./src/components/Axis/brokenTimeScale.js";
export type {
  BrokenTimeScale,
  BrokenTimeScaleOptions,
  ScaleTimeGap,
} from "./src/components/Axis/brokenTimeScale.js";
export {
  gapIndex,
  hidesAllTime,
  isHiddenTime,
  isRangeBreakRule,
  normalizeRangeBreaks,
  offsetVisible,
  rangeBreakGaps,
  rangeBreakTest,
  rangeBreakTime,
  ruleMarker,
  visibleBetween,
} from "./src/components/Axis/rangeBreaks.js";
export type {
  RangeBreakRule,
  RangeBreakTime,
  TimeGap,
} from "./src/components/Axis/rangeBreaks.js";
export {
  applyAxisRangeBreaks,
  visibleTimeValues,
} from "./src/components/Axis/axisRangeBreaks.js";
export {
  dropHiddenRows,
  plotRangeBreaks,
  plotTimeScale,
  rangeBreaksTimeAxis,
  timelineRangeBreaks,
} from "./src/charts/Plot/plotRangeBreaks.js";
export {
  applyAxisBreaks,
  axisBarNodes,
  baselineBreakStyle,
  breakGap,
  breakStyle,
  breakStyleOf,
  breakTickValues,
  brokenBarScene,
  fitBreakSpace,
  resolveBaselineBreak,
} from "./src/components/Axis/axisBreak.js";
export type {
  AxisBaselineBreak,
  AxisBreak,
  BreakStyle,
} from "./src/components/Axis/axisBreak.js";
export {
  bandPolygon,
  breakLineNodes,
  breakLinePaint,
  maskBreaks,
  maskPath,
  unwrapBreakMasks,
} from "./src/charts/Plot/plotBreaks.js";
export {
  baselineBreakAxisConfig,
  clampBarConfig,
  outsideBaselineBreak,
  plotAxisConfig,
  userDomainBreaksBaseline,
  valueAxis,
  valueAxisExtent,
} from "./src/charts/Plot/baselineBreak.js";
export {
  baselineDomainAxis,
  configOpenDomain,
  hasFullConfigDomain,
  hasOpenUserEnd,
  hasUserDomain,
  isOneSided,
  openEndAxisConfig,
  plotAxisRounding,
  secondaryAxisRounding,
  userAxisDomain,
} from "./src/charts/Plot/baselineDomain.js";
export {
  openEnd,
  roundOpenEnd,
  roundPlotOpenEnds,
} from "./src/charts/Plot/openDomainEnds.js";
export {xAxisRounding} from "./src/charts/features/xAxisConfig.js";
export {roundedDomain} from "./src/components/Axis/axisRounding.js";
export {
  clipToPlotArea,
  DOMAIN_CLIP_KEY,
  isDomainClip,
  unwrapDomainClips,
} from "./src/charts/Plot/domainClip.js";
export type {ClipFrame} from "./src/charts/Plot/domainClip.js";

// ── Feature modules (legend, colorScale, timeline, title/subtitle/total, …) ──
export {
  colorScaleFeature,
  cornerControlsHeight,
  cornerPlacements,
  legendFeature,
  runLayout,
  sideControlsDrop,
  subtitleFeature,
  timelineFeature,
  titleFeature,
  totalFeature,
} from "./src/charts/features/features.js";
export {legendLabelsWhole} from "./src/charts/features/featuresLegend.js";
export {
  getTopLeftContributions,
  topLeftControlsFeature,
  TOP_LEFT_CONTRIBUTORS,
} from "./src/charts/drawSteps/topLeftControls.js";
export {backContribution} from "./src/charts/drawSteps/backControl.js";
export {
  BOTTOM_RIGHT_CONTRIBUTORS,
  bottomRightControlsFeature,
  reserveBottomRight,
  sizeLegendContribution,
} from "./src/charts/drawSteps/bottomRightControls.js";
export {
  bottomRightClearance,
  bottomRightControlsBox,
  bottomRightControlsDrop,
  bottomRightControlsInset,
  bottomRightControlsShortfall,
} from "./src/charts/drawSteps/bottomRightControlsMarkup.js";
export type {
  BottomRightBox,
  BottomRightContribution,
} from "./src/charts/drawSteps/bottomRightControlsMarkup.js";
export {
  computeSizeLegend,
  defaultSizeLegendValues,
  zoomSizeLegendScale,
} from "./src/components/SizeLegend/sizeLegendLayout.js";
export type {
  SizeLegendLayout,
  SizeLegendScale,
  SizeLegendSize,
} from "./src/components/SizeLegend/sizeLegendLayout.js";
export {
  drawWithInset,
  fitInset,
  sceneInsetRegion,
} from "./src/charts/pipeline/insetPlacement.js";
export {
  mapBox,
  mapper,
  markBoxes,
  ownBoxes,
} from "./src/charts/features/sceneBounds.js";
export {
  backgroundImageNode,
  backgroundImageNodes,
} from "./src/charts/features/backgroundImageEmit.js";
export {
  INSET_PRIORITY,
  insetBackground,
  insetComponentOffset,
  insetFrame,
  insetOrient,
  insetPlacementFor,
  insetStyle,
  isInsetPending,
} from "./src/charts/features/insetState.js";
export type {
  InsetKey,
  InsetOrient,
  InsetPlacement,
  InsetRegion,
  InsetStyle,
} from "./src/charts/features/insetState.js";
export {tableViewContribution} from "./src/charts/drawSteps/tableViewControl.js";
export {searchContribution} from "./src/charts/drawSteps/searchControls.js";
export {saveContribution} from "./src/charts/drawSteps/saveControl.js";
export {
  canvasTooCoarse,
  resolveSaveConfig,
  saveChart,
  saveFilename,
  saveFormats,
  savePixelRatio,
  svgForSave,
} from "./src/charts/drawSteps/saveChart.js";
export {
  broadcastLegend,
  broadcastLink,
  linkAs,
  linkKeys,
  linkedColorDefaults,
  linkMembers,
  linkPredicate,
  linkValues,
  registerLink,
  resolveLink,
  unregisterLink,
} from "./src/charts/viz/linkGroup.js";
export type {LinkKind, ResolvedLink} from "./src/charts/viz/linkGroup.js";
export {
  dropLegendHistory,
  isLegendEntry,
  latestDrillEntry,
  legendSnapshot,
  recordLegendChange,
  removeLatestDrillEntry,
  restoreLegendEntry,
  sameLegendIds,
  takeLegendState,
} from "./src/charts/viz/history.js";
export type {
  DrillDownHistoryEntry,
  HistoryEntry,
  LegendHistoryEntry,
  LegendState,
} from "./src/charts/viz/vizTypes.js";
export {goBack} from "./src/charts/drawSteps/backControl.js";
export {forEachSceneRow, MARK_TYPES} from "./src/charts/viz/sceneRows.js";
export {
  effectiveDuration,
  motionReduced,
  prefersReducedMotion,
} from "./src/charts/viz/reducedMotion.js";
export type {
  MotionHost,
  ReducedMotionSetting,
} from "./src/charts/viz/reducedMotion.js";

// ── Keyboard navigation (`keyboardNav`) ──────────────────────────────────────
export {
  focusTargets,
  nextTarget,
  readingOrder,
} from "./src/charts/viz/focusTargets.js";
export type {
  FocusDirection,
  FocusTarget,
  TabStopTest,
} from "./src/charts/viz/focusTargets.js";
export {focusRingNode} from "./src/charts/viz/focusRing.js";
export type {FocusRingStyle} from "./src/charts/viz/focusRing.js";
export {
  chartName,
  createKeyboardNavHost,
  KEYBOARD_NAV_INSTRUCTIONS,
  plainText,
  updateKeyboardNavHost,
} from "./src/charts/viz/keyboardNavHost.js";
export type {KeyboardNavHost} from "./src/charts/viz/keyboardNavHost.js";

// ── Nearest-point hover (`hoverDistance`) and point Voronoi diagrams ─────────
export {
  hoverReach,
  isPointShape,
  nearestPick,
  pointMarkTargets,
  pointTarget,
  routePointerEvent,
} from "./src/charts/viz/nearestHover.js";
export type {NearestHoverState} from "./src/charts/viz/nearestHover.js";
export {nearestHoverSurface} from "./src/charts/viz/nearestHoverSurface.js";
export {
  clientAnchor,
  pointTooltipAnchor,
  surfaceOrigin,
} from "./src/charts/viz/pointTooltipAnchor.js";
export type {ClientOrigin} from "./src/charts/viz/pointTooltipAnchor.js";
export {
  tooltipEnabled,
  tooltipLevels,
} from "./src/charts/viz/tooltipEnabled.js";
export type {TooltipHost} from "./src/charts/viz/tooltipEnabled.js";
export {pointVoronoi, polygonDistance} from "./src/charts/viz/pointVoronoi.js";
export {
  boxCoverage,
  boxesOverlap,
  boxHitsCircle,
  placeCircleLabels,
  ringCentroid,
  sideBox,
  sideOrder,
} from "./src/charts/features/circleLabelPlacement.js";
export type {
  CircleLabelBox,
  CircleLabelPlacement,
  CircleLabelRequest,
  LabelCircle,
  LabelPosition,
  LabelSide,
  PlaceCircleLabelsOptions,
} from "./src/charts/features/circleLabelPlacement.js";
export {
  emitOutsideLabels,
  insideFontMin,
  labelFitsInside,
  labelPositionOf,
  layoutCircleLabels,
  measureLabel,
  outsideLabels,
  pointLabelSettings,
  sideAnchor,
} from "./src/charts/features/circleLabels.js";
export type {
  CircleLabelItem,
  CircleLabelLayout,
  InsideLabelBox,
  LabelFont,
  OutsideLabel,
  PointLabelSettings,
} from "./src/charts/features/circleLabels.js";
export {
  labelsOverCircles,
  plotCircleLabels,
} from "./src/charts/Plot/circleLabels.js";
export {
  colorScaleColor,
  colorScaleValue,
  isScaleValue,
  linkColorScaleRows,
  noteLinkValue,
} from "./src/charts/features/colorScaleValue.js";
export {
  coerceLinkColor,
  linkColorResolver,
  linkRow,
  linkValueColor,
} from "./src/charts/features/linkColor.js";
export type {
  LinkColorSetting,
  DrawnLinkEnd,
  LinkEnds,
} from "./src/charts/features/linkColor.js";
export {
  linkSizeMaxField,
  linkStyleFields,
} from "./src/charts/features/linkFields.js";
export {
  LINK_SIZE_SHARE,
  linkWidthRange,
} from "./src/charts/features/linkWidths.js";
export {
  FORMAT_KEYS,
  formatPayload,
  formatterFor,
  isFormatKey,
  loaderFormatFields,
  queuedFormatter,
  setLoaderValue,
  storePayload,
  syncLoaderFormats,
} from "./src/charts/viz/loaderFormat.js";
export type {
  FormatKey,
  LoadFormatter,
  LoaderState,
} from "./src/charts/viz/loaderFormat.js";
export {
  cubicAngle,
  cubicMidpoint,
  cubicPoint,
  labelCorners,
  labelHitsBox,
  labelHitsCircle,
  labelsOverlap,
  placeLinkLabels,
  segmentMidpoint,
  uprightAngle,
} from "./src/charts/features/linkLabelGeometry.js";
export type {
  LabelObstacles,
  LinkAnchor,
  LinkLabelBox,
} from "./src/charts/features/linkLabelGeometry.js";
export {
  emitLinkLabels,
  LINK_LABEL_DEFAULTS,
  linkLabelSettings,
  linkLabelText,
  textLineBoxes,
} from "./src/charts/features/linkLabels.js";
export type {
  LinkLabelRequest,
  LinkLabelSettings,
} from "./src/charts/features/linkLabels.js";
export type {LinkLabelConfig} from "./src/utils/D3plusConfig.js";
export {
  chooseRingLabel,
  ringLabelFit,
  ringLabelPair,
  ringLabelPosition,
  ringPoint,
  ringReadsClockwise,
  ringTextPath,
  textBroken,
} from "./src/charts/features/ringLabels.js";
export type {
  RingArc,
  RingLabelAlign,
  RingLabelCandidate,
  RingLabelChoice,
  RingLabelFit,
  RingLabelFitOptions,
} from "./src/charts/features/ringLabels.js";
export {
  clearRingLabels,
  RING_LABEL_FADE,
  ringLabelFont,
  ringLabelNodes,
  ringTextWidth,
} from "./src/charts/features/ringLabelNodes.js";
export type {
  RingLabel,
  RingLabelFont,
} from "./src/charts/features/ringLabelNodes.js";
export {
  pieSliceLabels,
  ringFontRange,
  textShownWhole,
} from "./src/charts/Pie/curvedLabels.js";
export type {
  PieCurvedInputs,
  PieLabelSlice,
  PieSliceLabelNodes,
} from "./src/charts/Pie/curvedLabels.js";
export {
  OUTSIDE_LABEL_FONT_SIZE,
  leaderPoints,
  leaderRoutes,
  outsideColumn,
  outsideIdealY,
  outsideMetrics,
  outsideRoom,
  outsideSide,
  polylinesCross,
  segmentDistance,
  stackOutsideLabels,
} from "./src/charts/Pie/outsideLabels.js";
export type {
  Leader,
  OutsideMetrics,
  StackItem,
} from "./src/charts/Pie/outsideLabels.js";
export {
  LEADER_OPACITY,
  OUTSIDE_ENTER,
  outsideSpace,
  pieOutsideLabels,
  pieOutsideNodes,
  placeOutsideLabels,
} from "./src/charts/Pie/outsideNodes.js";
export type {
  CrowdedLabel,
  OutsideFrame,
  OutsidePlacement,
  OutsideStackLabel,
  PieOutsideScene,
} from "./src/charts/Pie/outsideNodes.js";
export {
  NO_ROOM,
  OUTSIDE_MAX_SHARE,
  PIE_MIN_SCALE,
  clampSides,
  crowdedRoom,
  layoutWithLabelRoom,
  outsideClaim,
  pieLabelRoom,
  usedRoom,
} from "./src/charts/Pie/labelRoom.js";
export type {PieRoom} from "./src/charts/Pie/labelRoom.js";
export {
  labelGoesOutside,
  outsideFontSize,
  pieLabelPlan,
  pieMayLabelOutside,
  pieSharePct,
  twoLineWidth,
} from "./src/charts/Pie/pieLabels.js";
export type {
  OutsideCandidate,
  PieLabelPlan,
  PieSlice,
} from "./src/charts/Pie/pieLabels.js";
export {pieStraightLabels} from "./src/charts/Pie/straightLabels.js";
export type {StraightLabelInputs} from "./src/charts/Pie/straightLabels.js";
export {
  centeredSectorBox,
  largestSectorBox,
  sectorBoxAt,
  sectorBoxRange,
  sectorEdges,
} from "./src/charts/Pie/sectorBox.js";
export type {
  SectorBox,
  SectorEdges,
  SectorSide,
} from "./src/charts/Pie/sectorBox.js";
export {
  centerLabelLines,
  STRAIGHT_LABEL_DEFAULTS,
  straightLabelLayout,
  straightLabelOptions,
  wrapWidths,
} from "./src/charts/Pie/straightLayout.js";
export type {
  StraightLabelLayout,
  StraightLabelOptions,
} from "./src/charts/Pie/straightLayout.js";
export {
  metricsWidth,
  sunburstCurvedNodes,
  sunburstLabelPlacements,
} from "./src/charts/Sunburst/curvedLabels.js";
export type {
  SunburstLabelInputs,
  SunburstLabelPlacements,
} from "./src/charts/Sunburst/curvedLabels.js";
export {
  applyChordLabelGeometry,
  CHORD_LABEL_FONT_SIZE,
  CHORD_LABEL_PADDING,
  chordAllCurved,
  chordCurves,
  chordLabelFontSize,
} from "./src/charts/Chord/labels.js";
export type {ChordLabelNode} from "./src/charts/Chord/labels.js";
export {
  curvedLabelPad,
  curvedLabelSpot,
  curvePoints,
  distanceAlong,
  LINK_LABEL_MAX_TURN,
  LINK_LABEL_MIN_RADIUS,
  LINK_LABEL_STRAIGHT_TURN,
  labelStretch,
  sharpestTurn,
  trimToNodes,
} from "./src/charts/features/linkLabelPath.js";
export type {CurvedLabelSpot} from "./src/charts/features/linkLabelPath.js";
export {ringsEdgeAnchor, ringsEdgePath} from "./src/charts/Rings/emit.js";
export {sankeyLinkAnchor, sankeyLinkPath} from "./src/charts/Sankey/emit.js";
export {
  awayFromAngle,
  fanOrder,
  isSelfLoop,
  isSelfLoopMark,
  layoutSelfLoops,
  selfLoopAngles,
  selfLoopArrows,
  selfLoopExtent,
  selfLoopGeometry,
  selfLoopOpening,
  selfLoopReach,
  selfLoopSpread,
  unionBox,
  widestGapAngle,
} from "./src/charts/features/selfLoops.js";
export type {
  LoopNode,
  LoopPoint,
  SelfLoopGeometry,
} from "./src/charts/features/selfLoops.js";
export {LOOP_ARROW} from "./src/charts/features/linkInteraction.js";
export {crossLayout} from "./src/charts/ArcDiagram/arcGeometry.js";
export {
  arcLoopReach,
  arcLoopRoom,
  loopAngle,
  loopSide,
  placeLoops,
} from "./src/charts/ArcDiagram/arcLoops.js";
export {ringsLoops} from "./src/charts/Rings/ringsLoops.js";
export {
  arrowTrim,
  cubicPathD,
  defaultArrowSize,
  edgeArrowTrims,
  straightEdgeCuts,
  straightEdgeD,
  trimCubic,
  trimSegment,
} from "./src/charts/features/edgeArrows.js";
export type {
  EdgeArrowTrims,
  EdgeNode,
} from "./src/charts/features/edgeArrows.js";
export {outlineReach} from "./src/charts/features/nodeOutline.js";
export type {NodeOutline} from "./src/charts/features/nodeOutline.js";
export {selfLoopD} from "./src/charts/features/selfLoops.js";
export {
  arcArrowEdge,
  arcPointAlong,
} from "./src/charts/ArcDiagram/arcGeometry.js";
export {
  arrowAlongChord,
  chordAngle,
  chordArrowNodes,
  chordEndsPathD,
  cubicArrowEdge,
  cubicPolyline,
  pathPointBack,
} from "./src/charts/features/curvedArrows.js";
export type {ArrowedEnd} from "./src/charts/features/curvedArrows.js";
export {arcVisibleD} from "./src/charts/ArcDiagram/emit.js";
export {ringsVisibleD} from "./src/charts/Rings/emit.js";
export {
  sankeyDrawableLinks,
  sankeyLoopWarning,
  unlinkedNodeValue,
} from "./src/charts/Sankey/sankeyLinks.js";
export {sankeyAcyclicLinks} from "./src/charts/Sankey/sankeyCycles.js";
export type {SankeyWeightedLink} from "./src/charts/Sankey/sankeyCycles.js";
export {
  CIRCULAR_CLEARANCE,
  CIRCULAR_RADIUS,
  circularLanes,
  circularLinkAnchor,
  circularLinkD,
  circularLinkEdge,
  circularRibbonD,
  offsetCircularShape,
  circularLinkOrder,
  circularLinkShape,
  circularLinkSide,
  circularReserve,
  sankeyNodeValue,
  stackCircularEnds,
} from "./src/charts/Sankey/circularLinks.js";
export type {
  CircularLane,
  CircularLinkInput,
  CircularNode,
  CircularReserve,
  CircularShape,
  CircularSide,
} from "./src/charts/Sankey/circularLinks.js";
export {
  capReserve,
  columnEdges,
  columnScale,
  layOutCircular,
  sankeyScale,
  solveScale,
} from "./src/charts/Sankey/circularLayout.js";
export type {CircularLaidLink} from "./src/charts/Sankey/circularLayout.js";
export {sankeyBandThickness, sankeyRibbonD} from "./src/charts/Sankey/emit.js";
export {
  bandRibbonD,
  edgeD,
  reverseEdge,
  ribbonD,
  shiftEdge,
} from "./src/charts/Sankey/ribbons.js";
export type {Edge, EdgeStep} from "./src/charts/Sankey/ribbons.js";

export {geomapPointLabels} from "./src/charts/Geomap/pointLabels.js";
export type {GeomapPoints} from "./src/charts/Geomap/pointLabels.js";
export type {
  PointVoronoi,
  VoronoiMatch,
  VoronoiPoint,
} from "./src/charts/viz/pointVoronoi.js";
export {
  appendFocusRing,
  focusRingStyle,
  syncKeyboardNav,
  tabTarget,
  targetLabel,
  teardownKeyboardNav,
} from "./src/charts/viz/keyboardNav.js";
export type {KeyboardNavState} from "./src/charts/viz/keyboardNav.js";

// ── Small multiples (`facet` / `facetConfig`) ────────────────────────────────
export {
  coerceFacet,
  FACET_ASPECT,
  FACET_PADDING,
  FACET_TITLE_DEFAULTS,
  facetActive,
  facetOuterAxes,
  facetScalesShared,
  resolveFacetAxes,
  resolveFacetConfig,
} from "./src/charts/facet/facetConfig.js";
export type {
  FacetAccessor,
  FacetAxes,
  FacetAxesMode,
  FacetCell,
  FacetEdges,
  FacetHooks,
  FacetPanelContext,
  FacetPanelState,
  FacetSort,
  FacetValue,
  ResolvedFacetConfig,
} from "./src/charts/facet/facetConfig.js";
export {
  compareFacetValues,
  facetFilteredData,
  facetGroups,
  facetKey,
  facetTimeFilter,
  formatFacetValue,
  groupFacets,
  sortFacetValues,
  toFacetValue,
} from "./src/charts/facet/facetData.js";
export type {FacetGroup} from "./src/charts/facet/facetData.js";
export {
  facetDimensions,
  facetGrid,
  fittedArea,
} from "./src/charts/facet/facetGrid.js";
export type {
  FacetArea,
  FacetGridOptions,
} from "./src/charts/facet/facetGrid.js";
export {
  facetBodyNode,
  facetPanelNode,
  facetTitleNodes,
  measureFacetTitles,
  prefixKeys,
} from "./src/charts/facet/facetScene.js";
export type {FacetTitle} from "./src/charts/facet/facetScene.js";
export {
  clearPanelSlots,
  facetPanelAt,
  withFacetPanel,
} from "./src/charts/facet/facetPanel.js";
export {
  alignInsets,
  expandArea,
  LABEL_COMBOS,
  labelExpansions,
  labelGutter,
  labelKey,
  labelOverhang,
  NO_SIDES,
  panelBase,
} from "./src/charts/facet/facetGutter.js";
export type {FacetLabels, FacetSides} from "./src/charts/facet/facetGutter.js";
export {
  drawChart,
  drawFacets,
  facetAreaMargin,
  facetTitleBand,
  facetTitleStyle,
  facetTitleTexts,
  panelLabels,
  panelTitle,
} from "./src/charts/facet/drawFacets.js";
export {
  listAxis,
  panelAxisConfig,
  plotFacetChrome,
  plotFacetHooks,
  plotFacetInsets,
  plotFacetPanel,
  sharePlotScales,
  unionExtent,
} from "./src/charts/Plot/plotFacet.js";
export {
  mergeStackOrder,
  plotSeriesIds,
  poolStackPositions,
  recordStackLegendOrder,
  stackLegendSort,
  stackPositions,
  stackReadingOrder,
} from "./src/charts/Plot/stackLegendOrder.js";
export type {StackPositions} from "./src/charts/Plot/stackLegendOrder.js";
export {applyPaddedDomains} from "./src/charts/Plot/facetScales.js";
export type {PlotFacetScales} from "./src/charts/Plot/facetScales.js";
export {
  computeFilteredData,
  computeTimeFilter,
  drawnRawRows,
  startingSelection,
} from "./src/charts/pipeline/preDrawData.js";
export {
  classTimelineMode,
  timelineModeClass,
} from "./src/components/Timeline/timelineMode.js";
export type {TimelineMode} from "./src/components/Timeline/timelineMode.js";

// ── Themes ───────────────────────────────────────────────────────────────────
export {
  isDarkColor,
  resolveTheme,
  themed,
  themeDark,
  themeLight,
  themeRamp,
  themeScaleColor,
  themeStyle,
  withOpacity,
} from "./src/utils/theme.js";
export {
  cascadeTheme,
  gridStroke,
  inkAxis,
  inkBackground,
  inkGrid,
  inkText,
  legibleOn,
} from "./src/utils/themeInk.js";
export {
  pageIsDark,
  pageTheme,
  unwatchPageTheme,
  watchPage,
  watchPageTheme,
} from "./src/charts/viz/pageTheme.js";
export {
  applyOverlayColorScheme,
  applyVizTheme,
  themeBackground,
  themeBackgroundNode,
  themeColorScheme,
  themeOverlayStyle,
} from "./src/charts/viz/vizTheme.js";
export {
  backgroundInk,
  chartBackground,
  chartGridline,
} from "./src/charts/viz/backgroundInk.js";
export type {PageTheme, ResolvedTheme} from "./src/utils/theme.js";

// ── Pipeline types ───────────────────────────────────────────────────────────
export type {ResolvedSpec} from "./src/charts/pipeline/resolveSpec.js";
export type {VizContext} from "./src/charts/pipeline/stages.js";
export type {VizDrawResult} from "./src/charts/pipeline/vizDraw.js";
export type {VizPreDrawResult} from "./src/charts/pipeline/preDrawData.js";
export type {
  PlotMeasureResult,
  PlotPaintContext,
} from "./src/charts/features/plotPaint.js";
export type {
  EndLabel,
  EndLabelBox,
  EndLabelMeasure,
  XLabelMode,
} from "./src/charts/features/plotEndLabels.js";
export type {ShapeLike, VizLike} from "./src/charts/features/emitHelpers.js";
export type {VizInstance, VizRenderer} from "./src/charts/viz/vizTypes.js";
export type {AxisLayout, AxisLayoutResult} from "./src/components/Axis/Axis.js";
export type {Contribution} from "./src/charts/drawSteps/topLeftControlsMarkup.js";

// ── Geomap links ─────────────────────────────────────────────────────────────
export {forgetLinkNodes} from "./src/charts/features/linkInteraction.js";
export {
  clipsToCircle,
  coordinateVisible,
  featureAnchor,
  flowArc,
  greatCircle,
  greatCircleCut,
  isLonLat,
  liftPolyline,
  polylineAt,
  polylineBox,
  polylineLength,
  polylineMidpoint,
  pathRuns,
  polylinePath,
  screenArc,
  toLonLat,
  trimPolyline,
  unbrokenPath,
} from "./src/charts/Geomap/flowGeometry.js";
export {visiblePointData} from "./src/charts/Geomap/applyLayout.js";
export type {
  FlowArc,
  GeoPathFn,
  LonLat,
  Projector,
} from "./src/charts/Geomap/flowGeometry.js";
export {
  coordinateLabel,
  flowEndResolver,
  flowLinkCoordinates,
  flowLinkWidths,
  geomapFlowLinks,
  linkEndRef,
} from "./src/charts/Geomap/flowLinks.js";
export type {
  FlowEnd,
  FlowLayoutInput,
  FlowLink,
} from "./src/charts/Geomap/flowLinks.js";
export {
  emitFlowLabels,
  emitFlowLinks,
  flowArrowEdge,
  flowLinkGray,
  flowLinkKey,
} from "./src/charts/Geomap/flowEmit.js";
export {
  flowHoverPredicate,
  flowLinkBox,
  setupGeomapLinks,
} from "./src/charts/Geomap/flowEvents.js";
export {geomapLinkFields} from "./src/charts/Geomap/flowFields.js";
export {
  cartesian,
  dragRotation,
  globeHome,
  globeRotates,
  installGlobeRotation,
  surfaceToMap,
  versor,
  versorDelta,
  versorMultiply,
  versorRotation,
} from "./src/charts/Geomap/globeRotate.js";
export type {
  RotatingProjection,
  Rotation,
  Versor,
} from "./src/charts/Geomap/globeRotate.js";
export {
  GLOBE_KEY_DURATION,
  GLOBE_KEY_INSTRUCTIONS,
  GLOBE_KEY_SHORTCUTS,
  GLOBE_KEY_STEP,
  globeKeyStep,
  installGlobeKeys,
  rotateByStep,
  rotationBetween,
} from "./src/charts/Geomap/globeKeys.js";
export type {KeyboardGesture} from "./src/charts/viz/keyboardNavHost.js";
export type {
  ZoomGesture,
  ZoomGestureEvent,
} from "./src/charts/drawSteps/zoomGesture.js";
export {
  clientPoint,
  gestureHolds,
  gestureHoverEnd,
  gestureHoverMove,
  gestureHoverStart,
  gestureMoves,
} from "./src/charts/drawSteps/gestureHover.js";
export type {GestureHoverState} from "./src/charts/drawSteps/zoomGesture.js";
export {uniqueLinkKeys} from "./src/charts/features/linkKeys.js";
export {sankeyLinkIds} from "./src/charts/Sankey/emit.js";
export {ringsLinkKeys} from "./src/charts/Rings/emit.js";
export {
  bowedEdge,
  edgesBetween,
  fanParallelEdges,
  firstPerNeighbor,
  parallelOffsets,
  slideOnRim,
} from "./src/charts/Rings/ringsParallel.js";
export {
  buildRingsEdges,
  claimRings,
  placeRings,
  ringWeights,
} from "./src/charts/Rings/ringsPlacement.js";
export {
  applyRingArc,
  arcCubics,
  curveRingsEdge,
  gapMiddle,
  ringArcRadius,
  ringArcCubics,
  ringRadius,
} from "./src/charts/Rings/ringsCurves.js";
export type {RingsTree} from "./src/charts/Rings/ringsPlacement.js";
export {
  ringNodeRadii,
  ringsGeometry,
  ringsHops,
  ringsNodeRadii,
} from "./src/charts/Rings/ringsSizing.js";
export {
  cubicsArrowEdge,
  cubicsPathD,
  polylineArrowEdge,
} from "./src/charts/features/curvedArrows.js";
export {polylineReach} from "./src/charts/features/polyline.js";
export {
  EDGE_BUNDLE_DEFAULTS,
  angleCompatibility,
  bundleEdges,
  compatibilityGraph,
  edgeBundleCache,
  edgeBundleKey,
  edgeBundleOptions,
  edgeCompatibility,
  maxLengthRatio,
  positionCompatibility,
  scaleCompatibility,
  subdividePolyline,
  visibilityCompatibility,
} from "./src/charts/features/edgeBundling.js";
export type {
  CompatibilityGraph,
  EdgeBundleCache,
  EdgeBundleOptions,
  Segment,
} from "./src/charts/features/edgeBundling.js";
export {
  bsplinePolyline,
  simplifyPolyline,
  smoothBundle,
  straightenPolyline,
} from "./src/charts/features/edgeBundlingSmooth.js";
export {
  bundleLinkPaths,
  linkBundleCache,
} from "./src/charts/features/linkBundle.js";
export {linkBundleFields} from "./src/charts/features/linkFields.js";
export {
  bundleNetworkLinks,
  bundledLinkAnchor,
  bundledLinkEdge,
  bundledLinkPath,
  bundledOutlineBack,
  bundledTipBack,
} from "./src/charts/Network/bundle.js";
export {bundleFlowLinks} from "./src/charts/Geomap/flowLinks.js";
export {
  CLUSTER_MAX,
  capClusters,
  clusterAutoActive,
  clusterFields,
  clusterHubs,
  clusterLegendRows,
  clusterLegendSort,
  clusterName,
  clusterOf,
  clustersMeaningful,
  findClusters,
  installClusters,
  prepareClusters,
} from "./src/charts/Network/clusters.js";
export type {
  ClusterDefaults,
  ClusterInfo,
  ClusterState,
} from "./src/charts/Network/clusters.js";
export {
  CLUSTER_LABEL_DEFAULTS,
  clusterLabelObstacles,
  clusterLabelSettings,
  clusterRegion,
  emitClusterLabels,
  layoutClusterLabels,
  nearestPoint,
  networkClusterLabels,
  placeClusterLabel,
} from "./src/charts/Network/clusterLabels.js";
export type {
  ClusterLabel,
  ClusterLabelCircle,
  ClusterLabelSettings,
} from "./src/charts/Network/clusterLabels.js";
export type {
  ClusterConfig,
  ClusterLabelConfig,
} from "./src/utils/D3plusConfig.js";
export {CanvasRenderer, SvgRenderer} from "@d3plus/render";
