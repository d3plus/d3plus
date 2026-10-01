/**
    `runVizPipeline(viz)` — the chart pipeline as a free function.

    Draws the boundary between "lifecycle/DOM/data-loading" (which lives on
    `Viz.render()`, inherently instance-bound) and
    "transform-the-data-into-a-scene" (callable without the lifecycle). The
    transform side isn't fully pure yet — `_preDraw`/`_draw` still mutate
    `this` rather than threading an explicit context
    (`UserConfig → ResolvedSpec → transform stages → SceneGraph → renderer`).

    Calling this function on a Viz instance runs the same four steps
    `Viz.render()` previously inlined inside its `Promise.all().then()`
    callback:

      1. `viz._preDraw()` — data filtering + legend-data + drawDepth
      2. `viz._draw()`    — chart-specific layout + scene absorption
      3. `zoomControls(viz)` — zoom HTML overlay (architectural carve-out)
      4. `minimapFeature.layout(viz)` — zoomed-chart viewport indicator
      5. `topLeftControlsFeature.layout(viz)` — back/table-view/search panel
      5b. `bottomRightControlsFeature.layout(viz)` — size-legend corner panel
      6. `attributionFeature.layout(viz)` — bottom-right attribution panel
      7. `tableViewFeature.layout(viz)` — chart-sized data-table overlay
      8. `viz._drawSceneToTarget()` — paint scene via SvgRenderer/CanvasRenderer

    Future work:
      - Extract a `ResolvedSpec` so step 1 takes (config) not (this).
      - Decouple step 2 so it takes (ctx) not (this); stages already follow
        this pattern but `_draw` itself doesn't.
      - Replace step 8's `this._sceneRenderer` slot with a returned handle
        so callers can pick/destroy/diff without instance lookup.

    @param viz A Viz instance (or any subclass: Plot, Treemap, Pack, …).
*/

import {attributionFeature, runLayout} from "../features/features.js";
import {minimapFeature} from "../drawSteps/minimap.js";
import {zoomFeature} from "../drawSteps/zoomControls.js";
import {resolveDrillMorph} from "./drillMorph.js";
import {topLeftControlsFeature} from "../drawSteps/topLeftControls.js";
import {bottomRightControlsFeature} from "../drawSteps/bottomRightControls.js";
import {tableViewFeature} from "../drawSteps/tableView.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

export function runVizPipeline(viz: Viz): void {
  // Goes through `viz._preDraw()` / `viz._draw()` (not the free functions
  // directly) so subclass overrides (Plot._preDraw, Treemap._draw, Plot._draw,
  // Pack/Pie/Matrix/…) still run. The free functions `vizPreDraw` / `vizDraw`
  // hold the BASE Viz behavior; subclasses' `super._preDraw()`/`super._draw()`
  // calls hit the shim which delegates to the free functions.
  viz._preDraw();
  viz._draw();
  // Post-draw features: zoom + brush event wiring, the minimap, the shared
  // top-left controls panel (back / table-view button / search), the
  // attribution overlay, and the table-view data-table overlay. All run
  // after `_draw()` (zoom needs the rendered chart body + `_container`/
  // `_zoomGroup`), claim zero margin, and wire DOM the serializable scene
  // graph can't carry. `minimapFeature` runs right after `zoomFeature` — it
  // needs `_zoomBehavior`'s `translateExtent()`/`scaleExtent()` already
  // configured for this draw — and before `attributionFeature` to preserve
  // the prior step order; `topLeftControlsFeature` has no ordering
  // dependency on either. `tableViewFeature` runs LAST so its panel — a
  // chart-sized overlay, present only while table view is active — stacks
  // above every other panel in the overlay host (siblings paint in scene
  // order), covering zoom/minimap/top-left-controls/attribution while
  // showing.
  // Each of these returns its overlay as a panel rather than mutating
  // `viz._featurePanels` from inside `layout()` (the FeatureModule
  // contract). The engine appends the returned panels to the instance
  // buffer that `toScene()` reads — including on later repaints (a zoom
  // event, a table-view toggle), which re-walk `toScene()` outside this
  // pipeline pass.
  runPostDrawFeatures(viz);
  // Resolve the drill-down morph's enter/exit boxes (if a drill click armed
  // one) now that this draw's _bodyRect/_chartScene are final.
  resolveDrillMorph(viz);
  viz._drawSceneToTarget();
}

/**
    Runs the post-draw features (see above) and appends their panels. Anything
    that re-runs `viz._draw()` outside this pipeline — Rings re-centering on a
    click, say — must call this after it: `_draw()` resets the feature panels,
    so skipping it drops the corner controls, size legend, and attribution.
*/
export function runPostDrawFeatures(viz: Viz): void {
  const post = runLayout({viz}, [
    zoomFeature,
    minimapFeature,
    topLeftControlsFeature,
    bottomRightControlsFeature,
    attributionFeature,
    tableViewFeature,
  ]);
  if (post.panels.length)
    viz._featurePanels = [...(viz._featurePanels || []), ...post.panels];
}
