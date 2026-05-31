/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    `vizDrawPure(viz, prevCtx)` — the returning form of `vizDraw`.

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
    These writes are part of the contract: subclasses and feature
    modules consume live viz state during the layout body, and the shim
    pattern (`vizDraw` calling `vizDrawPure`) is what bridges the
    free-function surface to the class instances that still hold the
    components.

    The shim (`vizDraw`) wraps this and serves as the public surface.

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
} from "../features/features.js";

import {resolveSpec} from "./resolveSpec.js";

import type {VizContext} from "./vizContext.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

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
  _prevCtx: Partial<VizContext> = {},
): Partial<VizDrawCtx> {
  const out: Partial<VizDrawCtx> = {
    resetChartScene: true,
    resetChartTransform: true,
    resetShapes: true,
    marginDelta: {top: 0, bottom: 0, left: 0, right: 0},
    featurePanels: [],
  };

  // Reset side effects before features run. `viz._featurePanels` is a
  // cross-stage accumulator: seeded here, appended to later by the
  // zoomControls feature, and read by Viz.toScene — so it has to live on
  // the instance, not in a local. The shim RE-reads viz._featurePanels
  // into out.featurePanels for callers.
  viz._featurePanels = [];
  viz._chartScene = [];
  viz._chartTransform = undefined;
  viz._shapes = [];

  // Sanitize positions via the shared `sanitizePosition` helper (same
  // function legendFeature / colorScaleFeature use) so the three sites
  // can't drift. One frozen `resolveSpec` snapshot feeds both accessors:
  // the position accessors take the resolved config as their argument, so
  // a single snapshot reflects config once instead of twice.
  const spec = resolveSpec(viz);
  const legendPosition = sanitizePosition(
    viz.schema.legendPosition.bind(viz)(spec),
  );
  const colorScalePosition = sanitizePosition(
    viz.schema.colorScalePosition.bind(viz)(spec),
  );
  out.legendPosition = legendPosition;
  out.colorScalePosition = colorScalePosition;

  // `running` is the cross-call margin accumulator, threaded into each
  // runLayout as its baseMargin so features read the live running total via
  // ctx.layoutMargin (not viz._margin). Seeded from viz._margin so the math
  // matches whatever base the instance carried in.
  const running = {
    top: viz._margin.top,
    right: viz._margin.right,
    bottom: viz._margin.bottom,
    left: viz._margin.left,
  };

  // Top blocks first (back / title / subtitle / total) so the running
  // margin.top grows BEFORE the left/right legend lays out — the legend
  // positions against it. Title must lay out first or the left legend
  // overlaps the title at y=0.
  const topBlocks = runLayout({viz} as any, [
    backFeature,
    titleFeature,
    subtitleFeature,
    totalFeature,
  ], running);
  viz._featurePanels.push(...topBlocks.panels);
  out.marginDelta!.top += topBlocks.margin.top;
  running.top += topBlocks.margin.top;

  const timelineClaim = runLayout({viz} as any, [timelineFeature], running);
  out.marginDelta!.bottom += timelineClaim.margin.bottom;
  running.bottom += timelineClaim.margin.bottom;

  // Left/right legend + colorScale claims. Includes `=== false` (mirrors
  // colorScale below) so a previously-rendered left/right legend tears
  // down its DOM when the user toggles off via `.legendPosition(false)`.
  if (
    legendPosition === "left" ||
    legendPosition === "right" ||
    legendPosition === false
  ) {
    const claim = runLayout({viz} as any, [legendFeature], running);
    out.marginDelta!.left += claim.margin.left;
    out.marginDelta!.right += claim.margin.right;
    running.left += claim.margin.left;
    running.right += claim.margin.right;
  }
  if (
    colorScalePosition === "left" ||
    colorScalePosition === "right" ||
    colorScalePosition === false
  ) {
    const claim = runLayout({viz} as any, [colorScaleFeature], running);
    out.marginDelta!.left += claim.margin.left;
    out.marginDelta!.right += claim.margin.right;
    running.left += claim.margin.left;
    running.right += claim.margin.right;
  }

  // Top/bottom legend + colorScale.
  if (legendPosition === "top" || legendPosition === "bottom") {
    const claim = runLayout({viz} as any, [legendFeature], running);
    out.marginDelta!.top += claim.margin.top;
    out.marginDelta!.bottom += claim.margin.bottom;
    running.top += claim.margin.top;
    running.bottom += claim.margin.bottom;
  }
  if (colorScalePosition === "top" || colorScalePosition === "bottom") {
    const claim = runLayout({viz} as any, [colorScaleFeature], running);
    out.marginDelta!.top += claim.margin.top;
    out.marginDelta!.bottom += claim.margin.bottom;
    running.top += claim.margin.top;
    running.bottom += claim.margin.bottom;
  }

  // Snapshot final featurePanels onto the returned ctx.
  out.featurePanels = viz._featurePanels.slice();

  return out;
}
