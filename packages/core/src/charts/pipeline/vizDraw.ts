/**
    `vizDraw(viz)` — the chart-shell layout every draw runs: it lays out the
    margin-claiming chrome in two passes, adds their claims to
    `viz._margin`, and collects their panels on
    `viz._featurePanels`. Each FeatureModule.layout() still writes through to
    `viz` (component mounts, intra-feature state); `vizUpdate` is the
    cross-feature publishing channel.

    The first pass lays out everything positioned top or bottom (title /
    subtitle / total, timeline, the bottom-right corner panel, a top/bottom
    legend or colorScale). The second lays out a left/right legend or
    colorScale in the vertical band left between those claims, each starting
    below the corner control panel on its side (see `sideControlsDrop`).

    The post-layout consumers (axes, chartGeometry, plotPaint, ensureZoomDom,
    attribution) read the final margin off `viz._margin`. Plot and other Viz
    subclasses override `_draw` and reach this through `super._draw()`.

    Returns the margin added on each side, the panels, and the sanitized
    legend/colorScale positions (`"auto"` resolved to a side).
*/

import {
  colorScaleFeature,
  cornerControlsHeight,
  legendFeature,
  runLayout,
  sanitizePosition,
  subtitleFeature,
  timelineFeature,
  titleFeature,
  totalFeature,
} from "../features/features.js";
import type {FeatureModule} from "../features/features.js";
import {reserveBottomRight} from "../drawSteps/bottomRightControls.js";
import {
  bottomRightControlsRightShortfall,
  bottomRightControlsShortfall,
} from "../drawSteps/bottomRightControlsMarkup.js";

import {resolveSpec} from "./resolveSpec.js";

import type {SceneNode} from "@d3plus/render";

import type {VizInstance as Viz} from "../viz/vizTypes.js";

export interface VizDrawResult {
  marginDelta: {top: number; bottom: number; left: number; right: number};
  featurePanels: SceneNode[];
  legendPosition?: string | false;
  colorScalePosition?: string | false;
}

type MarginSides = VizDrawResult["marginDelta"];

/**
    Lay out one margin-claiming feature against the `running` margin, and add
    its claim on `sides` to both the draw's `delta` and `running`.
*/
function claimSides(
  viz: Viz,
  feature: FeatureModule,
  running: MarginSides,
  delta: MarginSides,
  sides: (keyof MarginSides)[],
): void {
  const claim = runLayout({viz}, [feature], running);
  for (const side of sides) {
    delta[side] += claim.margin[side];
    running[side] += claim.margin[side];
  }
}

export function vizDraw(viz: Viz): VizDrawResult {
  // `viz._featurePanels` is a cross-stage accumulator: seeded here, appended
  // to later by the post-draw features, and read by Viz.toScene.
  viz._chartScene = [];
  viz._chartTransform = undefined;
  // A small-multiples panel draws only the chart body, inside the margins
  // the facet layout set; the chrome was laid out once for every panel.
  if (viz._facetStep === "panel") {
    return {
      marginDelta: {top: 0, bottom: 0, left: 0, right: 0},
      featurePanels: (viz._featurePanels ?? []).slice(),
    };
  }
  viz._featurePanels = [];
  const out: VizDrawResult = {
    marginDelta: {top: 0, bottom: 0, left: 0, right: 0},
    featurePanels: [],
  };

  // Sanitize positions (resolving "auto" to a side) via the shared
  // `sanitizePosition` helper (same function legendFeature /
  // colorScaleFeature use) so the three sites can't drift. One frozen
  // `resolveSpec` snapshot feeds both accessors: the position accessors
  // take the resolved config as their argument, so a single snapshot
  // reflects config once instead of twice.
  const spec = resolveSpec(viz);
  const legendPosition = sanitizePosition(
    viz.schema.legendPosition.bind(viz)(spec),
    viz,
  );
  const colorScalePosition = sanitizePosition(
    viz.schema.colorScalePosition.bind(viz)(spec),
    viz,
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

  // Everything positioned top or bottom lays out first, then the left/right
  // legend and colorScale fit the vertical band left between them. "← Back"
  // claims no margin here — it's a
  // zero-margin contribution to the shared top-left controls panel
  // (`topLeftControlsFeature`, registered post-draw in `runVizPipeline`),
  // the same way zoom's buttons float rather than claim margin.
  const topBlocks = runLayout(
    {viz},
    [titleFeature, subtitleFeature, totalFeature],
    running,
  );
  viz._featurePanels.push(...topBlocks.panels);
  out.marginDelta.top += topBlocks.margin.top;
  running.top += topBlocks.margin.top;

  const timelineClaim = runLayout({viz}, [timelineFeature], running);
  out.marginDelta.bottom += timelineClaim.margin.bottom;
  running.bottom += timelineClaim.margin.bottom;

  // The bottom-right corner panel (the size legend) measures next, above the
  // timeline and against the area left so far, so the legend/colorScale
  // blocks below can inset around it (see `bottomRightControlsInset`).
  reserveBottomRight(viz, running.bottom, {
    width: viz.schema.width - running.left - running.right,
    height: viz.schema.height - running.top - running.bottom,
  });

  // Top/bottom legend + colorScale, before the side ones so those fit the
  // band between them. They lay out against the right column a right-side
  // bottom-right panel will take, though that width is only claimed below.
  const rightColumn = bottomRightControlsRightShortfall(viz, running.right);
  running.right += rightColumn;
  if (legendPosition === "top" || legendPosition === "bottom") {
    claimSides(viz, legendFeature, running, out.marginDelta, ["top", "bottom"]);
  }
  if (colorScalePosition === "top" || colorScalePosition === "bottom") {
    claimSides(viz, colorScaleFeature, running, out.marginDelta, [
      "top",
      "bottom",
    ]);
  }
  running.right -= rightColumn;

  // A bottom-side panel: the chart body must end above it, so if the bottom
  // claims so far are shorter than it, top the bottom margin up.
  const shortfall = bottomRightControlsShortfall(viz, running.bottom);
  out.marginDelta.bottom += shortfall;
  running.bottom += shortfall;

  // Left/right legend + colorScale claims, within the band the top/bottom
  // claims left (each also starts below the corner controls on its side).
  // Includes `=== false` (mirrors colorScale below) so a previously-rendered
  // left/right legend tears down its DOM when the user toggles off via
  // `.legendPosition(false)`.
  if (
    legendPosition === "left" ||
    legendPosition === "right" ||
    legendPosition === false
  ) {
    claimSides(viz, legendFeature, running, out.marginDelta, ["left", "right"]);
  }
  if (
    colorScalePosition === "left" ||
    colorScalePosition === "right" ||
    colorScalePosition === false
  ) {
    claimSides(viz, colorScaleFeature, running, out.marginDelta, [
      "left",
      "right",
    ]);
  }

  // A right-side bottom-right panel (the size legend's default) shares the
  // right column: widen the right margin to it, if the left/right claims
  // above didn't already.
  const rightShortfall = bottomRightControlsRightShortfall(viz, running.right);
  out.marginDelta.right += rightShortfall;
  running.right += rightShortfall;

  // The corner controls (zoom, back/search) float at y:0 and claim no
  // margin of their own; whatever sits above the chart body (title/
  // subtitle/total, a top legend/colorScale) usually pushes it down clear
  // of them. When those claims fall short of the controls' reach (the
  // buttons plus an equal gap above and below), top margin.top up to it,
  // so the body's top edge — a Treemap's top row, a y-axis's max label —
  // never sits against the buttons.
  const topShortfall = Math.max(
    0,
    cornerControlsHeight(viz) - out.marginDelta.top,
  );
  out.marginDelta.top += topShortfall;
  running.top += topShortfall;

  const d = out.marginDelta;
  viz._margin = {
    top: viz._margin.top + d.top,
    right: viz._margin.right + d.right,
    bottom: viz._margin.bottom + d.bottom,
    left: viz._margin.left + d.left,
  };
  out.featurePanels = viz._featurePanels.slice();
  return out;
}
