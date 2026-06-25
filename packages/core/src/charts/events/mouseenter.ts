import type {DataPoint} from "@d3plus/data";
import {colorScaleBucketOf, colorScaleBucketPredicate} from "../features/colorScaleBucket.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type Viz from "../viz/Viz.js";

/**
    @module mouseEnter
    On mouseenter event for all shapes in a Viz.
    @private
*/
export default function (this: Viz, d: DataPoint, i: number): void {
  if (this.schema.shapeConfig.hoverOpacity !== 1) {
    // ColorScale range swatch: it has no groupBy id, so highlight every datum
    // whose colorScale value falls in this swatch's color range — mirroring
    // the regular legend, which highlights the data shapes by id. `colorScaleBucketOf`
    // unwraps so this also fires when hovering the swatch's LABEL, whose scene
    // datum is double-wrapped (label → shape-row → bucket).
    const bucket = colorScaleBucketOf(d);
    if (bucket) {
      const predicate = colorScaleBucketPredicate(
        this as unknown as VizInstance,
        bucket.color,
      );
      if (predicate) this.hover(predicate);
      return;
    }

    let filterIds = this._id(d, i);
    if (!(filterIds instanceof Array)) filterIds = [filterIds];

    this.hover((h: DataPoint, x: number) => {
      let id = this._id(h, x);
      if (!(id instanceof Array)) id = [id];
      return filterIds.some((f: string) => id.includes(f));
    });
  }
}
