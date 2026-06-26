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
export {applyGeomapLayout} from "./src/charts/Geomap/applyLayout.js";
export {applyMatrixLayout} from "./src/charts/Matrix/applyLayout.js";
export {applyNetworkLayout} from "./src/charts/Network/applyLayout.js";
export {applyRingsLayout} from "./src/charts/Rings/applyLayout.js";
export {applySankeyLayout} from "./src/charts/Sankey/applyLayout.js";
export {applyPackLayout} from "./src/charts/Pack/applyLayout.js";
export {applyPieLayout} from "./src/charts/Pie/applyLayout.js";
export {applyPriestleyLayout} from "./src/charts/Priestley/applyLayout.js";
export {applyRadarLayout} from "./src/charts/Radar/applyLayout.js";
export {applyRadialMatrixLayout} from "./src/charts/RadialMatrix/applyLayout.js";
export {applyTreeLayout} from "./src/charts/Tree/applyLayout.js";
export {applyTreemapLayout} from "./src/charts/Treemap/applyLayout.js";

// ── ChartDefinition values ───────────────────────────────────────────────────
export {geomapDef} from "./src/charts/Geomap/index.js";
export {matrixDef} from "./src/charts/Matrix/index.js";
export {networkDef} from "./src/charts/Network/index.js";
export {ringsDef} from "./src/charts/Rings/index.js";
export {sankeyDef} from "./src/charts/Sankey/index.js";
export {packDef} from "./src/charts/Pack/index.js";
export {pieDef} from "./src/charts/Pie/index.js";
export {priestleyDef} from "./src/charts/Priestley/index.js";
export {radarDef} from "./src/charts/Radar/index.js";
export {radialMatrixDef} from "./src/charts/RadialMatrix/index.js";
export {treeDef} from "./src/charts/Tree/index.js";
export {treemapDef} from "./src/charts/Treemap/index.js";

// ── Fluent-accessor generation ───────────────────────────────────────────────
export {createFluent, installFluent} from "./src/fluent.js";

// ── Pipeline orchestration + the config/context boundary ─────────────────────
export {runStages} from "./src/charts/pipeline/stages.js";
export {runVizPipeline} from "./src/charts/pipeline/runVizPipeline.js";
export {resolveSpec} from "./src/charts/pipeline/resolveSpec.js";
export {vizDraw} from "./src/charts/pipeline/vizDraw.js";
export {vizDrawPure} from "./src/charts/pipeline/vizDrawPure.js";
export {vizPreDraw} from "./src/charts/pipeline/vizPreDraw.js";
export {vizPreDrawPure, vizPostThresholdCtx} from "./src/charts/pipeline/vizPreDrawPure.js";

// ── Plot paint phase + axis rendering ────────────────────────────────────────
export {plotEmit, plotPaint} from "./src/charts/features/plotPaint.js";
export {renderAxes} from "./src/charts/features/axes.js";
export {computeAxisLayout, measureAxis} from "./src/components/Axis/Axis.js";

// ── Feature modules (legend, colorScale, timeline, title/subtitle/total, …) ──
export {
  backFeature,
  colorScaleFeature,
  legendFeature,
  runLayout,
  subtitleFeature,
  timelineFeature,
  titleFeature,
  totalFeature,
} from "./src/charts/features/features.js";

// ── Pipeline types ───────────────────────────────────────────────────────────
export type {ResolvedSpec} from "./src/charts/pipeline/resolveSpec.js";
export type {VizContext} from "./src/charts/pipeline/vizContext.js";
export type {VizPreDrawResult} from "./src/charts/pipeline/vizPreDrawPure.js";
export type {PlotMeasureResult, PlotPaintContext} from "./src/charts/features/plotPaint.js";
export type {ShapeLike, VizLike} from "./src/charts/features/emitHelpers.js";
export type {VizInstance, VizRenderer} from "./src/charts/viz/vizTypes.js";
export type {AxisLayout, AxisLayoutResult} from "./src/components/Axis/Axis.js";
