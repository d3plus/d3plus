import type {DataPoint} from "@d3plus/data";
import type Viz from "../viz/Viz.js";

/**
    @module mouseLeave
    On mouseleave event for all shapes in a Viz.
    @private
*/
export default function (this: Viz, d: DataPoint, i: number): void {
  setTimeout(() => {
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
      if (this._id(tooltipDatum) === this._id(d))
        this._tooltipClass.data([]).render();
    }
  }, 50);

  this._select.style("cursor", "auto");
}
