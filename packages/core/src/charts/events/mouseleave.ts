import type {DataPoint} from "@d3plus/data";
import {shapeHoverEnabled} from "../viz/shapeHover.js";
import type Viz from "../viz/Viz.js";

/**
    Whether two `_id` results name the same item. A legend entry that merges
    several groupBy members (a legend grouped by color, or by a shallower
    groupBy level than the chart draws) has an array id, built afresh on each
    call, so the ids compare by their members.
*/
function sameId(a: unknown, b: unknown): boolean {
  if (!Array.isArray(a) && !Array.isArray(b)) return a === b;
  const as = new Set(([] as unknown[]).concat(a));
  const bs = new Set(([] as unknown[]).concat(b));
  return as.size === bs.size && [...as].every(v => bs.has(v));
}

/**
    @module mouseLeave
    On mouseleave event for all shapes in a Viz.
    @private
*/
export default function (this: Viz, d: DataPoint, i: number): void {
  setTimeout(() => {
    let leaveDatum = d as DataPoint & {__d3plus__?: boolean; data?: DataPoint};
    while (leaveDatum && leaveDatum.__d3plus__ && leaveDatum.data)
      leaveDatum = leaveDatum.data as typeof leaveDatum;
    // A node without a datum (a plot background, an inset backing) set no
    // hover or tooltip, so there is nothing to clear — and resetting hover
    // here would wipe the one the next mark just set.
    if (!leaveDatum) return;

    // A shape and its text label are separate scene nodes over the same datum,
    // so crossing between them fires a leave for one then an enter for the
    // other. `_hoverDatum` is what the pointer rests on once that hand-off
    // settles; if it's the same datum we left, this isn't a real exit — bail
    // before resetting hover or hiding the tooltip so neither flickers.
    let hoverDatum = this._hoverDatum as
      (DataPoint & {__d3plus__?: boolean; data?: DataPoint}) | null | undefined;
    while (hoverDatum && hoverDatum.__d3plus__ && hoverDatum.data)
      hoverDatum = hoverDatum.data as typeof hoverDatum;
    if (hoverDatum && sameId(this._id(hoverDatum), this._id(leaveDatum)))
      return;

    // The shared multi-series tooltip (Plot) owns hover + tooltip while active
    // and clears both itself on leaving the plot area.
    if (this._sharedHoverActive) return;
    if (shapeHoverEnabled(this) && this._hover ? this._hover(d, i) : true) {
      this.hover(false);
    }
    const tooltipData = this._tooltipClass.data();
    if (tooltipData.length && this.schema.tooltip(d, i)) {
      let tooltipDatum = tooltipData[0];
      while (tooltipDatum.__d3plus__ && tooltipDatum.data)
        tooltipDatum = tooltipDatum.data;
      if (sameId(this._id(tooltipDatum), this._id(leaveDatum)))
        this._tooltipClass.data([]).render();
    }
    // Deferred by a single macrotask (not a fixed delay): the shape→label
    // hand-off fires this leave, then the renderer synchronously fires the
    // enter that sets `_hoverDatum`. Waiting one macrotask lets the guard
    // above observe that updated datum, while still hiding promptly — a
    // larger delay made the tooltip lag behind the cursor on dense charts.
  }, 0);

  this._select.style("cursor", "auto");
}
