import type {DataPoint} from "@d3plus/data";
import type Viz from "../viz/Viz.js";

/**
    @module mouseEnter
    On mouseenter event for all shapes in a Viz.
    @private
*/
export default function (this: Viz, d: DataPoint, i: number): void {
  if (this.schema.shapeConfig.hoverOpacity !== 1) {
    let filterIds = this._id(d, i);
    if (!(filterIds instanceof Array)) filterIds = [filterIds];

    this.hover((h: DataPoint, x: number) => {
      let id = this._id(h, x);
      if (!(id instanceof Array)) id = [id];
      return filterIds.some((f: string) => id.includes(f));
    });
  }
}
