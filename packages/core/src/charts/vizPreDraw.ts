/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    `vizPreDraw(viz)` — the imperative shim wrapping `vizPreDrawPure`.

    The pure function (`vizPreDrawPure(viz, prevCtx) → Partial<VizContext>`)
    computes the data-prep results without mutating viz. This shim:
      1. calls the pure function;
      2. writes the returned ctx fields back to viz (so subclass methods
         that read `this._drawDepth` / `this._filteredData` see them);
      3. invokes `viz._thresholdFunction(filteredData, tree)` — this is
         an instance method that needs `this`-bound state populated by
         step 2;
      4. recomputes hover-cutoff overrides + no-data flag against the
         threshold-applied data (via `vizPostThresholdCtx`);
      5. applies the deferred DOM side effects (no-data message mount,
         opacity fade).

    `Viz._preDraw()` calls this shim so subclass overrides + the existing
    test surface remain unchanged. Direct consumers of the architectural
    seam should use `vizPreDrawPure` (exported from the package index).
*/

import {vizPostThresholdCtx, vizPreDrawPure} from "./vizPreDrawPure.js";
import type {VizInstance as Viz} from "./vizTypes.js";

export function vizPreDraw(viz: Viz): void {
  const ctx = vizPreDrawPure(viz);

  // 1. Write computed ctx back to viz.
  if (ctx.drawDepth !== undefined) viz._drawDepth = ctx.drawDepth;
  if (ctx.id) viz._id = ctx.id;
  if (ctx.ids) viz._ids = ctx.ids;
  if (ctx.drawLabel) viz._drawLabel = ctx.drawLabel;
  if (ctx.legendData !== undefined) viz._legendData = ctx.legendData;

  // 2. computedTimeFilter — surfaced on the ctx for downstream consumers
  // (rollupAndFilter etc.) but NOT back-assigned to `viz._timeFilter`.
  // Back-assigning would pin the synthesized filter (which captures
  // `latestTime` at synthesis time) to the viz, so a subsequent render
  // with newer data would skip re-synthesis and silently filter
  // post-latestTime rows out. The pure function consumes its own
  // computedTimeFilter for filteredData; legacy `viz._timeFilter`
  // consumers see the user's value (truthy) or undefined.

  // 3. filteredData — pre-threshold from pure, then run threshold (which
  // reads this._aggs/_drawDepth/_groupBy via the instance method).
  let filteredData = ctx.filteredData || [];
  if (viz._data.length && ctx._thresholdTree) {
    filteredData = viz._thresholdFunction(filteredData, ctx._thresholdTree);
  }
  viz._filteredData = filteredData;

  // 4. hover/duration override + noDataMessage flag — computed against
  // the post-threshold filteredData.
  const post = vizPostThresholdCtx(viz, filteredData, viz._id);
  if (post.hoverOverride?.stashOriginals) {
    if (viz._userHover === undefined)
      viz._userHover = viz._shapeConfig.hoverOpacity || 0.5;
    if (viz._userDuration === undefined)
      viz._userDuration = viz._shapeConfig.duration || 600;
    viz._shapeConfig.hoverOpacity = post.hoverOverride.hoverOpacity;
    viz._shapeConfig.duration = post.hoverOverride.duration;
  } else if (post.hoverOverride?.restoreOriginals) {
    viz._shapeConfig.hoverOpacity = post.hoverOverride.hoverOpacity;
    viz._shapeConfig.duration = post.hoverOverride.duration;
  }

  // 5. No-data-message DOM mount + opacity fade.
  if (post.noDataMessage) {
    viz._messageClass.render({
      container: viz._select.node().parentNode,
      html: viz._noDataHTML(viz),
      mask: false,
      style: viz._messageStyle,
    });
    viz._select.transition().duration(viz._duration).attr("opacity", 0);
  }
}
