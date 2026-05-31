
/**
    `vizDraw(viz)` — the imperative shim wrapping `vizDrawPure`.

    The pure function (`vizDrawPure(viz, prevCtx) → Partial<VizDrawCtx>`)
    computes the chart-shell layout — margin deltas + reset signals +
    feature panels — at the outer level. Inner FeatureModule.layout()
    calls still write through to `viz` directly (component mounts,
    intra-feature accessor writes); that's intentional — `vizUpdate` is
    the cross-feature publishing channel, but a feature's OWN intra-body
    state lives on viz directly because the feature's component instance
    (`Legend`, `Timeline`) is a stateful object whose configuration calls
    happen inline.

    `vizDrawPure` threads its margin accumulator locally and returns the
    per-side deltas in `marginDelta`; it no longer writes `viz._margin`.
    This shim applies those deltas to the instance once, so the
    post-layout consumers (axes, chartGeometry, plotPaint, ensureZoomDom,
    attribution) read the final margin off `viz._margin`.

    Note: Plot (and other Viz subclasses) OVERRIDE `_draw` and call
    `super._draw(callback)` — that still works through this shim, which
    in turn invokes `vizDraw(this)` with `this` bound to the subclass.
*/

import {vizDrawPure} from "./vizDrawPure.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

export function vizDraw(viz: Viz): void {
  const ctx = vizDrawPure(viz);
  const d = ctx.marginDelta;
  if (d) {
    viz._margin = {
      top: viz._margin.top + d.top,
      right: viz._margin.right + d.right,
      bottom: viz._margin.bottom + d.bottom,
      left: viz._margin.left + d.left,
    };
  }
}
