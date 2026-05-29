/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    `vizDrawPure(viz, prevCtx)` — the pure form of `vizDraw`.

    RFC §3.1 contract: `(spec, prevCtx) → Partial<VizContext>`. Computes
    the chart-shell layout (margin claims + reset signals + feature panel
    list) without mutating viz at the OUTER level. The inner
    `runLayout([features])` calls still trigger FeatureModule side effects
    (component mounts, panel emission) — those are not yet pure; that's
    the next layer of v5 work.

    The shim (`vizDraw`) writes the returned values back to viz.

    Returns a context with:
      - `marginDelta` (top/bottom/left/right) — to be ADDED to viz._margin
      - `featurePanels` — final aggregated panel list
      - `resetChartScene`/`resetChartTransform`/`resetShapes` (always true)
      - `legendPosition`/`colorScalePosition` — sanitized values
*/

import {
  backFeature,
  colorScaleFeature,
  legendFeature,
  runLayout,
  subtitleFeature,
  timelineFeature,
  titleFeature,
  totalFeature,
} from "./features.js";

import type {VizContext} from "./vizContext.js";

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
  viz: any,
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

  // Sanitize positions.
  let legendPosition = viz._legendPosition.bind(viz)(viz.config());
  if (![false, "top", "bottom", "left", "right"].includes(legendPosition))
    legendPosition = "bottom";
  let colorScalePosition = viz._colorScalePosition.bind(viz)(viz.config());
  if (![false, "top", "bottom", "left", "right"].includes(colorScalePosition))
    colorScalePosition = "bottom";
  out.legendPosition = legendPosition;
  out.colorScalePosition = colorScalePosition;

  // Left/right legend + colorScale claims.
  if (legendPosition === "left" || legendPosition === "right") {
    const claim = runLayout({viz} as any, [legendFeature]);
    out.marginDelta!.left += claim.margin.left;
    out.marginDelta!.right += claim.margin.right;
    // Margin changes need to land BEFORE the next runLayout call so
    // top features see the updated horizontal margins.
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

  // Top blocks (back / title / subtitle / total) + timeline.
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
