/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    `vizDraw(viz)` — the imperative shim wrapping `vizDrawPure`.

    The pure function (`vizDrawPure(viz, prevCtx) → Partial<VizDrawCtx>`)
    computes the chart-shell layout — margin claims + reset signals +
    feature panels — at the outer level. Inner FeatureModule.layout()
    calls still mutate viz (they push panels into `viz._featurePanels`
    and mount components); that's the next v5 layer.

    Because the pure function ALREADY writes margin claims through to
    `viz._margin` (so the next `runLayout` sees the updated margins),
    this shim has very little left to do — it's preserved as the public
    `_draw` shape for back-compat and to keep the v4 free-function
    pattern uniform with `vizPreDraw`/`plotPaint`/`runVizPipeline`.

    Note: Plot (and other Viz subclasses) OVERRIDE `_draw` and call
    `super._draw(callback)` — that still works through this shim, which
    in turn invokes `vizDraw(this)` with `this` bound to the subclass.
*/

import {vizDrawPure} from "./vizDrawPure.js";
import type {Viz} from "./vizTypes.js";

export function vizDraw(viz: Viz): void {
  // The pure function does the work + has already written margin claims
  // back to viz (necessary for FeatureModule.layout() side effects to
  // see correct intermediate margins). The shim exists as the public
  // surface; direct callers of vizDrawPure get the ctx.
  vizDrawPure(viz);
}
