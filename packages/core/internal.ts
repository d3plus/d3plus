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
export {applyBulletLayout, bulletExtents} from "./src/charts/Bullet/applyLayout.js";
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
export {applyNetworkLayout} from "./src/charts/Network/applyLayout.js";
export {applyRingsLayout} from "./src/charts/Rings/applyLayout.js";
export {applySankeyLayout} from "./src/charts/Sankey/applyLayout.js";
export {applyPackLayout} from "./src/charts/Pack/applyLayout.js";
export {applyParallelLayout} from "./src/charts/ParallelCoordinates/applyLayout.js";
export {applyPieLayout} from "./src/charts/Pie/applyLayout.js";
export {applyPolarAreaLayout} from "./src/charts/PolarArea/applyLayout.js";
export {applyPriestleyLayout} from "./src/charts/Priestley/applyLayout.js";
export {applyRadarLayout} from "./src/charts/Radar/applyLayout.js";
export {applyRadialBarLayout} from "./src/charts/RadialBar/applyLayout.js";
export {applyRadialMatrixLayout} from "./src/charts/RadialMatrix/applyLayout.js";
export {applyIcicleLayout} from "./src/charts/Icicle/applyLayout.js";
export {applySunburstLayout, sunburstFocus} from "./src/charts/Sunburst/applyLayout.js";
export {applyTreeLayout} from "./src/charts/Tree/applyLayout.js";
export {applyTreemapLayout} from "./src/charts/Treemap/applyLayout.js";
export {applyWaffleLayout, waffleFillOptions} from "./src/charts/Waffle/applyLayout.js";
export type {WaffleCell} from "./src/charts/Waffle/applyLayout.js";

export {default as binData} from "./src/charts/Histogram/binData.js";
export {bulletStack} from "./src/charts/Bullet/bulletLayout.js";
export {fitAxis as bulletAxis, normalizeBands as bulletBands} from "./src/charts/Bullet/bulletGeometry.js";
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
export {curvePolyline, splitDash, splitLength} from "./src/charts/Plot/curveLength.js";
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
export type {ForecastRow, ForecastSetting, ForecastStart} from "./src/charts/Plot/forecast.js";
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
  betweenPoints,
  emitFillBetween,
  fillBetweenDefaults,
  fillBetweenPairs,
  inheritedFillStyle,
  sideClip,
  valueDirection,
} from "./src/charts/Plot/fillBetween.js";
export type {BetweenPoint, FillBetweenSetting} from "./src/charts/Plot/fillBetween.js";
export {
  closestFreeOffset,
  fitSwarms,
  swarmExtent,
  swarmFitScale,
  swarmLayout,
} from "./src/charts/Plot/swarmLayout.js";
export type {SwarmFit, SwarmFitOptions, SwarmNode, SwarmOverflow} from "./src/charts/Plot/swarmLayout.js";
export {applySwarmLanes, resolveSwarm, swarmHidesAxis, swarmPlacements} from "./src/charts/Plot/swarm.js";
export type {SwarmConfig, SwarmPlacement, SwarmSetting, SwarmState} from "./src/charts/Plot/swarm.js";
export {
  compareCategories,
  stepValue,
  waterfallKinds,
  waterfallStackOffset,
  waterfallStep,
  waterfallSteps,
} from "./src/charts/Waterfall/steps.js";
export type {StepAccessors, WaterfallKind, WaterfallStep} from "./src/charts/Waterfall/steps.js";
export {connectorBars, connectorNodes, connectorSegments} from "./src/charts/Waterfall/connectors.js";
export type {ConnectorBar, ConnectorSegment} from "./src/charts/Waterfall/connectors.js";
export {kindColor, labelAlign, labelBox, stepLabel, tooltipRows as waterfallTooltipRows} from "./src/charts/Waterfall/labels.js";
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
export type {BandBounds, ConfidenceBand} from "./src/charts/Plot/confidenceBands.js";
export {bandRows, rangeText} from "./src/charts/Plot/confidenceTooltip.js";
export {emitLineBands} from "./src/charts/Plot/lineBands.js";
export {nestSunburst, sunburstLayout} from "./src/charts/Sunburst/partition.js";
export {sunburstPadAngle, sunburstRadii} from "./src/charts/Sunburst/geometry.js";
export {sunburstLabelBox, sunburstSplit} from "./src/charts/Sunburst/labelFit.js";
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
export type {CalendarBlock, CalendarDay, CalendarPeriod} from "./src/charts/Calendar/calendarDates.js";
export {
  blockGrid,
  cellCornerRadius,
  fitCalendar,
  monthLabelWeek,
  monthOutlinePath,
  slotPosition,
  weekdayLabelSlots,
} from "./src/charts/Calendar/calendarGrid.js";
export type {CalendarFit, CalendarFitInput, CalendarOrient} from "./src/charts/Calendar/calendarGrid.js";
export {calendarInsets, calendarLayout, labelPadding, weekdayNames} from "./src/charts/Calendar/calendarLayout.js";
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
export {calendarEmit, calendarPalette, colorValue, hasColorValue} from "./src/charts/Calendar/emit.js";
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
export type {FunnelShared, FunnelStage} from "./src/charts/Funnel/applyLayout.js";
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
export type {BarSpan, BarSpanLayout, BarWidthAccessor, MeasuredBar} from "./src/charts/Plot/barWidth.js";
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
export type {BarBox, StemLayout, StemPoint} from "./src/charts/Lollipop/stemLayout.js";
export {lollipopEmit} from "./src/charts/Lollipop/emit.js";
export {columnHighlight} from "./src/charts/Plot/columnHighlight.js";
export {CONNECTOR_KEY_SUFFIX, dumbbellEmit, dumbbellSpans} from "./src/charts/Dumbbell/emit.js";
export type {DumbbellSpan} from "./src/charts/Dumbbell/emit.js";
export {categoryGaps, gapComparator, syncGapSort} from "./src/charts/Dumbbell/gapSort.js";
export type {CategoryComparator, GapSort, GapSortState} from "./src/charts/Dumbbell/gapSort.js";
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
export {waffleCellGeometryNode, waffleCellShape} from "./src/charts/Waffle/emit.js";
export type {WaffleCellShape} from "./src/charts/Waffle/emit.js";
export {formatShare, waffleShare, waffleTooltipRows} from "./src/charts/Waffle/tooltip.js";
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
export type {DensityLayout, DensityMeta} from "./src/charts/helpers/densityChart.js";
export {growFromLine, growRectsFromCenter} from "./src/charts/helpers/densityEnter.js";
export {categoryStep, violinEdges, violinOutline, violinSlots} from "./src/charts/Violin/violinLayout.js";
export type {ViolinPoint, ViolinSide, ViolinSlot, ViolinSlotOptions} from "./src/charts/Violin/violinLayout.js";
export {emitInner, innerSet} from "./src/charts/Violin/inner.js";
export type {InnerFrame, PlacedViolin, ViolinInner} from "./src/charts/Violin/inner.js";
export {VIOLIN_PADDING, violinEmit} from "./src/charts/Violin/emit.js";
export {ridgelineEmit, ridgelinePadding, ridgeOverlap} from "./src/charts/Ridgeline/emit.js";
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
export type {DimensionType, ParallelDimension} from "./src/charts/ParallelCoordinates/dimensions.js";
export {
  brushFromPixels,
  hasBrushes,
  isNumericRange,
  pixelsFromBrush,
  rowPasses,
  valuePasses,
} from "./src/charts/ParallelCoordinates/brushFilter.js";
export type {BrushAxis} from "./src/charts/ParallelCoordinates/brushFilter.js";
export {linePoints, parallelPath} from "./src/charts/ParallelCoordinates/paths.js";
export type {LineAxis, ParallelCurve, ParallelOrient} from "./src/charts/ParallelCoordinates/paths.js";
export {axisDomain, dimensionAxisConfig, dimensionTitleStyle, layoutAxes} from "./src/charts/ParallelCoordinates/axes.js";
export type {AxesLayout, PlacedAxis} from "./src/charts/ParallelCoordinates/axes.js";
export {brushTarget, parallelDimensionKeys, parallelOrient} from "./src/charts/ParallelCoordinates/applyLayout.js";
export {clearStrip, stripLength, stripSelection, syncBrushDom} from "./src/charts/ParallelCoordinates/brushDom.js";
export type {BrushTarget} from "./src/charts/ParallelCoordinates/brushDom.js";
export {lineAriaLabel, parallelEmit, resolveLineOpacity} from "./src/charts/ParallelCoordinates/emit.js";
export type {ParallelLine} from "./src/charts/ParallelCoordinates/emit.js";
export {applyLineStates, grayscale} from "./src/charts/ParallelCoordinates/lineStates.js";
export {dimensionTooltipRows, formatDimensionValue} from "./src/charts/ParallelCoordinates/format.js";
export {titleHeight, titleNodes, titleWidths} from "./src/charts/ParallelCoordinates/titles.js";
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
export type {VolumeConfig, VolumeStrip} from "./src/charts/Candlestick/volume.js";
export {candlestickBuffer, widenDomain} from "./src/charts/Candlestick/buffer.js";
export {CANDLESTICK_SHAPE, candleTexture, emitCandlesticks, layoutCandles} from "./src/charts/Candlestick/emit.js";
export type {CandleLayout} from "./src/charts/Candlestick/emit.js";
export {bandAxisDefaults, periodDate} from "./src/charts/Candlestick/periods.js";
export {
  candleAriaLabel,
  candleTooltipRows,
  formatChange,
  formatPrice,
  volumeAriaLabel,
} from "./src/charts/Candlestick/tooltip.js";
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
export {labelMetrics, partitionSplit, wrapLineCount} from "./src/charts/partition/labelWords.js";
export {icicleLayout} from "./src/charts/Icicle/layout.js";
export type {IcicleNode} from "./src/charts/Icicle/layout.js";
export {icicleBands, icicleCollapse, icicleRect} from "./src/charts/Icicle/geometry.js";
export type {IcicleOrient, IcicleRect} from "./src/charts/Icicle/geometry.js";
export {icicleLabelBox} from "./src/charts/Icicle/labelFit.js";
export {icicleRootEdge, icicleStagger} from "./src/charts/Icicle/enterStagger.js";
export type {IcicleStagger} from "./src/charts/Icicle/enterStagger.js";
export {
  polarInnerRadius,
  polarLevels,
  polarPadAngle,
  polarRadius,
  polarSlots,
  polarStack,
} from "./src/charts/polar/geometry.js";
export type {PolarDomainInput, PolarScale, PolarSlot, PolarStackSegment} from "./src/charts/polar/geometry.js";
export {
  polarBoxesOverlap,
  polarHorizontalLayout,
  polarLabelFitRadius,
  polarLabelPlacement,
  polarLabelRoom,
  polarLabelsCollide,
  polarSpokeRotation,
} from "./src/charts/polar/labels.js";
export {polarCategoryLayout, polarCategoryNodes, polarLevelNodes} from "./src/charts/polar/chrome.js";
export {polarAxisConfig, polarValueRow, polarWedgeNodes} from "./src/charts/polar/config.js";
export {rowLegend, shareRow} from "./src/charts/features/sharedFields.js";
export {polarSlotArc, polarSlotTops, polarWedgeLayout} from "./src/charts/polar/wedgeLayout.js";
export type {PolarFrame, PolarWedge, PolarWedgeOptions} from "./src/charts/polar/wedgeLayout.js";
export {
  polarFacetHooks,
  polarFacetPanel,
  polarSharedExtent,
  sharePolarScale,
} from "./src/charts/polar/polarFacet.js";
export type {PolarDomainValues, PolarFacetScale} from "./src/charts/polar/polarFacet.js";
export {polarAreaDomainValues, polarAreaSlotOf} from "./src/charts/PolarArea/applyLayout.js";
export {polarAreaEmit} from "./src/charts/PolarArea/emit.js";
export {radialBarDomainValues, radialBarRows} from "./src/charts/RadialBar/applyLayout.js";
export {radialBarEmit} from "./src/charts/RadialBar/emit.js";
export {radialBarFootprint, radialBarLabelRoom, radialBarTracks} from "./src/charts/RadialBar/tracks.js";
export {
  RADIAL_BAR_MIN_LABEL_GAP,
  radialBarSweep,
  radialBarTrackLabels,
  radialBarTrackLayout,
} from "./src/charts/RadialBar/trackLayout.js";
export type {RadialBarFrame} from "./src/charts/RadialBar/trackLayout.js";

// ── ChartDefinition values ───────────────────────────────────────────────────
export {beeswarmDef} from "./src/charts/Beeswarm/index.js";
export {bulletDef} from "./src/charts/Bullet/index.js";
export {calendarDef, defaultCalendarDate} from "./src/charts/Calendar/index.js";
export {candlestickDef} from "./src/charts/Candlestick/index.js";
export {chordDef} from "./src/charts/Chord/index.js";
export {connectorStroke, dumbbellDef} from "./src/charts/Dumbbell/index.js";
export {fanChartDef} from "./src/charts/FanChart/index.js";
export {funnelDef} from "./src/charts/Funnel/index.js";
export {gaugeDef} from "./src/charts/Gauge/index.js";
export {geomapDef} from "./src/charts/Geomap/index.js";
export {histogramDef} from "./src/charts/Histogram/index.js";
export {icicleDef} from "./src/charts/Icicle/index.js";
export {lollipopDef} from "./src/charts/Lollipop/index.js";
export {marimekkoDef} from "./src/charts/Marimekko/index.js";
export {matrixDef} from "./src/charts/Matrix/index.js";
export {networkDef} from "./src/charts/Network/index.js";
export {ringsDef} from "./src/charts/Rings/index.js";
export {sankeyDef} from "./src/charts/Sankey/index.js";
export {packDef} from "./src/charts/Pack/index.js";
export {parallelCoordinatesDef, resolveBrushStyle} from "./src/charts/ParallelCoordinates/index.js";
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
export {runPostDrawFeatures, runVizPipeline} from "./src/charts/pipeline/runVizPipeline.js";
export {resolveSpec} from "./src/charts/pipeline/resolveSpec.js";
export {vizDraw} from "./src/charts/pipeline/vizDraw.js";
export {vizPostThresholdCtx, vizPreDraw} from "./src/charts/pipeline/vizPreDraw.js";

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
export type {BreakRange, BrokenScale, BrokenScaleSpec, ScaleSegment} from "./src/components/Axis/brokenScale.js";
export {
  applyAxisBreaks,
  axisBarNodes,
  baselineBreakStyle,
  breakGap,
  breakStyle,
  breakTickValues,
  brokenBarScene,
  resolveBaselineBreak,
} from "./src/components/Axis/axisBreak.js";
export type {AxisBaselineBreak, AxisBreak, BreakStyle} from "./src/components/Axis/axisBreak.js";
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
export {openEnd, roundOpenEnd, roundPlotOpenEnds} from "./src/charts/Plot/openDomainEnds.js";
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
export type {BottomRightBox, BottomRightContribution} from "./src/charts/drawSteps/bottomRightControlsMarkup.js";
export {
  computeSizeLegend,
  defaultSizeLegendValues,
  zoomSizeLegendScale,
} from "./src/components/SizeLegend/sizeLegendLayout.js";
export type {SizeLegendLayout, SizeLegendScale, SizeLegendSize} from "./src/components/SizeLegend/sizeLegendLayout.js";
export {drawWithInset, fitInset, sceneInsetRegion} from "./src/charts/pipeline/insetPlacement.js";
export {markBoxes} from "./src/charts/features/sceneBounds.js";
export {backgroundImageNode, backgroundImageNodes} from "./src/charts/features/backgroundImageEmit.js";
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
export {forEachSceneRow, MARK_TYPES} from "./src/charts/viz/sceneRows.js";

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
export {facetDimensions, facetGrid, fittedArea} from "./src/charts/facet/facetGrid.js";
export type {FacetArea, FacetGridOptions} from "./src/charts/facet/facetGrid.js";
export {
  facetBodyNode,
  facetPanelNode,
  facetTitleNodes,
  measureFacetTitles,
  prefixKeys,
} from "./src/charts/facet/facetScene.js";
export type {FacetTitle} from "./src/charts/facet/facetScene.js";
export {clearPanelSlots, facetPanelAt, withFacetPanel} from "./src/charts/facet/facetPanel.js";
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
  plotFacetHooks,
  plotFacetInsets,
  plotFacetPanel,
  sharePlotScales,
  unionExtent,
} from "./src/charts/Plot/plotFacet.js";
export {applyPaddedDomains} from "./src/charts/Plot/facetScales.js";
export type {PlotFacetScales} from "./src/charts/Plot/facetScales.js";
export {computeFilteredData, computeTimeFilter} from "./src/charts/pipeline/preDrawData.js";

// ── Pipeline types ───────────────────────────────────────────────────────────
export type {ResolvedSpec} from "./src/charts/pipeline/resolveSpec.js";
export type {VizContext} from "./src/charts/pipeline/stages.js";
export type {VizDrawResult} from "./src/charts/pipeline/vizDraw.js";
export type {VizPreDrawResult} from "./src/charts/pipeline/preDrawData.js";
export type {PlotMeasureResult, PlotPaintContext} from "./src/charts/features/plotPaint.js";
export type {EndLabel, EndLabelBox, EndLabelMeasure, XLabelMode} from "./src/charts/features/plotEndLabels.js";
export type {ShapeLike, VizLike} from "./src/charts/features/emitHelpers.js";
export type {VizInstance, VizRenderer} from "./src/charts/viz/vizTypes.js";
export type {AxisLayout, AxisLayoutResult} from "./src/components/Axis/Axis.js";
export type {Contribution} from "./src/charts/drawSteps/topLeftControlsMarkup.js";
