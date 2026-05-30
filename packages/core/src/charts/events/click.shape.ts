import type {DataPoint} from "@d3plus/data";
import type Viz from "../Viz.js";

/**
    @module clickShape
    On click event for all shapes in a Viz.
    @private
*/
export default function (
  this: Viz,
  d: DataPoint,
  i: number,
  x: DataPoint,
  event: MouseEvent,
): void {
  event.stopPropagation();

  if (this._drawDepth < this.schema.groupBy.length - 1) {
    this._select.style("cursor", "auto");

    const filterGroup = this.schema.groupBy[this._drawDepth],
      filterId = filterGroup(d, i);

    this.hover(false);
    if (this.schema.tooltip(d, i)) this._tooltipClass.data([]).render();

    const oldFilter = this.schema.filter;

    this._history.push({
      depth: this.schema.depth,
      filter: oldFilter,
    });

    this.config({
      depth: this._drawDepth + 1,
      filter: (f: DataPoint, x: number) =>
        (!oldFilter || oldFilter(f, x)) && filterGroup(f, x) === filterId,
    }).render();
  }
}
