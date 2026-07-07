import type {DataPoint} from "@d3plus/data";
import type Viz from "../viz/Viz.js";

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

    // A shape and its text label are separate scene nodes over the same datum,
    // so crossing between them fires a leave for one then an enter for the
    // other. `_hoverDatum` is what the pointer rests on once that hand-off
    // settles; if it's the same datum we left, this isn't a real exit — bail
    // before resetting hover or hiding the tooltip so neither flickers.
    let hoverDatum = this._hoverDatum as
      | (DataPoint & {__d3plus__?: boolean; data?: DataPoint})
      | null
      | undefined;
    while (hoverDatum && hoverDatum.__d3plus__ && hoverDatum.data)
      hoverDatum = hoverDatum.data as typeof hoverDatum;
    if (hoverDatum && this._id(hoverDatum) === this._id(leaveDatum)) return;

    if (
      this.schema.shapeConfig.hoverOpacity !== 1 && this._hover
        ? this._hover(d, i)
        : true
    ) {
      this.hover(false);
    }
    const tooltipData = this._tooltipClass.data();
    if (tooltipData.length && this.schema.tooltip(d, i)) {
      let tooltipDatum = tooltipData[0];
      while (tooltipDatum.__d3plus__ && tooltipDatum.data)
        tooltipDatum = tooltipDatum.data;
      if (this._id(tooltipDatum) === this._id(leaveDatum))
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
