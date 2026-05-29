/**
    `runVizPipeline(viz)` — the v4 chart pipeline as a free function.

    RFC §3.1 calls for the pipeline to be a sequence of pure stages over an
    explicit context (`UserConfig → ResolvedSpec → transform stages →
    SceneGraph → renderer`). Today's class internals don't yet provide a
    pure ResolvedSpec or context-passing stages — `_preDraw`/`_draw` still
    mutate `this`. But the *boundary* between "lifecycle/DOM/data-loading"
    (which lives on Viz.render(), inherently instance-bound) and
    "transform-the-data-into-a-scene" (which is pure-ish and could be a
    free function) is now drawn here.

    Calling this function on a Viz instance runs the same four steps
    `Viz.render()` previously inlined inside its `Promise.all().then()`
    callback:

      1. `viz._preDraw()` — data filtering + legend-data + drawDepth
      2. `viz._draw()`    — chart-specific layout + scene absorption
      3. `zoomControls(viz)` — zoom HTML overlay (architectural carve-out)
      4. `attributionFeature.layout(viz)` — bottom-right attribution panel
      5. `viz._drawSceneToTarget()` — paint scene via SvgRenderer/CanvasRenderer

    Future work:
      - Extract a true `ResolvedSpec` so step 1 takes (config) not (this).
      - Decouple step 2 so it takes (ctx) not (this); stages already follow
        this pattern but `_draw` itself doesn't.
      - Replace step 5's `this._sceneRenderer` slot with a returned handle
        so callers can pick/destroy/diff without instance lookup.

    @param viz A Viz instance (or any subclass: Plot, Treemap, Pack, …).
*/

import {attributionFeature, runLayout} from "./features.js";
import zoomControls from "./drawSteps/zoomControls.js";
import type {VizInstance as Viz} from "./vizTypes.js";

export function runVizPipeline(viz: Viz): void {
  // Goes through `viz._preDraw()` / `viz._draw()` (not the free functions
  // directly) so subclass overrides (Plot._preDraw, Treemap._draw, Plot._draw,
  // Pack/Pie/Matrix/…) still run. The free functions `vizPreDraw` / `vizDraw`
  // hold the BASE Viz behavior; subclasses' `super._preDraw()`/`super._draw()`
  // calls hit the shim which delegates to the free functions.
  viz._preDraw();
  viz._draw();
  zoomControls.bind(viz)();
  runLayout({viz}, [attributionFeature]);
  viz._drawSceneToTarget();
}
