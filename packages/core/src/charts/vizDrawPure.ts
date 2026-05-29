/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    `vizDrawPure(viz, prevCtx)` — RFC §3.1 returning-form of `vizDraw`.

    NAMING CAVEAT: the suffix `Pure` here means **"returns a Partial<
    VizContext> describing the layout intent"**, not "free of side effects
    in the FP sense." The OUTER orchestration (margin computation,
    legendPosition resolution, panel aggregation, reset signals) is pure
    in the returned-ctx sense — its observable output is the ctx. The
    inner `runLayout([features])` calls write through to viz directly:
      - reset writes (`viz._featurePanels = []`, `viz._chartScene = []`,
        `viz._chartTransform = undefined`, `viz._shapes = []`)
      - margin claims (`viz._margin.X += claim.margin.X`) so the next
        runLayout sees the updated margins
      - FeatureModule layouts that mount/measure their components
    These writes are part of the v4 contract: subclasses and feature
    modules consume live viz state during the layout body, and the shim
    pattern (`vizDraw` calling `vizDrawPure`) is what bridges the
    free-function v4 surface to the class instances that still hold the
    components.

    The shim (`vizDraw`) wraps this and serves as the v4 public surface.

    Returns a context with:
      - `marginDelta` (top/bottom/left/right) — total added to viz._margin
      - `featurePanels` — final aggregated panel list
      - `resetChartScene`/`resetChartTransform`/`resetShapes` (always true)
      - `legendPosition`/`colorScalePosition` — sanitized values
*/

import {
  backFeature,
  colorScaleFeature,
  legendFeature,
  runLayout,
  sanitizePosition,
  subtitleFeature,
  timelineFeature,
  titleFeature,
  totalFeature,
} from "./features.js";

import type {VizContext} from "./vizContext.js";
import type {VizInstance as Viz} from "./vizTypes.js";

export interface VizDrawCtx extends VizContext {
  marginDelta?: {top: number; bottom: number; left: number; right: number};
  featurePanels?: any[];
  legendPosition?: string | false;
  colorScalePosition?: string | false;
  resetChartScene?: boolean;
  resetChartTransform?: boolean;
  resetShapes?: boolean;
}

export function vizDrawPure(
  viz: Viz,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevCtx: Partial<VizContext> = {},
): Partial<VizDrawCtx> {
  const out: Partial<VizDrawCtx> = {
    resetChartScene: true,
    resetChartTransform: true,
    resetShapes: true,
    marginDelta: {top: 0, bottom: 0, left: 0, right: 0},
    featurePanels: [],
  };

  // Reset side effects before features run (features push into
  // viz._featurePanels, so we have to actually mutate here for the
  // existing FeatureModule.layout impls). The shim then RE-reads
  // viz._featurePanels into out.featurePanels for callers.
  viz._featurePanels = [];
  viz._chartScene = [];
  viz._chartTransform = undefined;
  viz._shapes = [];

  // Sanitize positions via the shared `sanitizePosition` helper (same
  // function legendFeature / colorScaleFeature use) so the three sites
  // can't drift.
  const legendPosition = sanitizePosition(
    viz._legendPosition.bind(viz)(viz.config()),
  );
  const colorScalePosition = sanitizePosition(
    viz._colorScalePosition.bind(viz)(viz.config()),
  );
  out.legendPosition = legendPosition;
  out.colorScalePosition = colorScalePosition;

  // Top blocks first (back / title / subtitle / total) so margin.top is
  // updated BEFORE the left/right legend lays out — legend reads
  // viz._margin.top to position itself. The legacy drawSteps order was
  // title-first; v4 must preserve that or the left legend overlaps the
  // title at y=0.
  const topBlocks = runLayout({viz} as any, [
    backFeature,
    titleFeature,
    subtitleFeature,
    totalFeature,
  ]);
  viz._featurePanels.push(...topBlocks.panels);
  out.marginDelta!.top += topBlocks.margin.top;
  viz._margin.top += topBlocks.margin.top;

  const timelineClaim = runLayout({viz} as any, [timelineFeature]);
  out.marginDelta!.bottom += timelineClaim.margin.bottom;
  viz._margin.bottom += timelineClaim.margin.bottom;

  // Left/right legend + colorScale claims. Includes `=== false` (mirrors
  // colorScale below) so a previously-rendered left/right legend tears
  // down its DOM when the user toggles off via `.legendPosition(false)`.
  if (
    legendPosition === "left" ||
    legendPosition === "right" ||
    legendPosition === false
  ) {
    const claim = runLayout({viz} as any, [legendFeature]);
    out.marginDelta!.left += claim.margin.left;
    out.marginDelta!.right += claim.margin.right;
    viz._margin.left += claim.margin.left;
    viz._margin.right += claim.margin.right;
  }
  if (
    colorScalePosition === "left" ||
    colorScalePosition === "right" ||
    colorScalePosition === false
  ) {
    const claim = runLayout({viz} as any, [colorScaleFeature]);
    out.marginDelta!.left += claim.margin.left;
    out.marginDelta!.right += claim.margin.right;
    viz._margin.left += claim.margin.left;
    viz._margin.right += claim.margin.right;
  }

  // Top/bottom legend + colorScale.
  if (legendPosition === "top" || legendPosition === "bottom") {
    const claim = runLayout({viz} as any, [legendFeature]);
    out.marginDelta!.top += claim.margin.top;
    out.marginDelta!.bottom += claim.margin.bottom;
    viz._margin.top += claim.margin.top;
    viz._margin.bottom += claim.margin.bottom;
  }
  if (colorScalePosition === "top" || colorScalePosition === "bottom") {
    const claim = runLayout({viz} as any, [colorScaleFeature]);
    out.marginDelta!.top += claim.margin.top;
    out.marginDelta!.bottom += claim.margin.bottom;
    viz._margin.top += claim.margin.top;
    viz._margin.bottom += claim.margin.bottom;
  }

  // Snapshot final featurePanels onto the returned ctx.
  out.featurePanels = viz._featurePanels.slice();

  return out;
}
