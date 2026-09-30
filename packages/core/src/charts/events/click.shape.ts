import type {DataPoint} from "@d3plus/data";
import {nodeRect} from "../pipeline/drillMorph.js";
import type Viz from "../viz/Viz.js";

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

    // Arm the drill-down morph: normalize the clicked node's live rect as
    // fractions of the *current* (pre-click) body rect, so the fraction
    // survives a possible margin/frame shift (e.g. the back button claiming
    // margin for the first time) between this frame and the next one, where
    // resolveDrillMorph denormalizes against the *new* body rect.
    const pickedNode = this._lastScenePick?.node;
    const r = pickedNode && nodeRect(pickedNode);
    if (r && this._bodyRect && this._bodyRect.width && this._bodyRect.height) {
      const b = this._bodyRect;
      this._pendingEnterOrigin = {
        fx: (r.x - b.x) / b.width, fy: (r.y - b.y) / b.height,
        fw: r.width / b.width, fh: r.height / b.height,
        key: pickedNode.key,
        parentStartAngle: pickedNode.startAngle,
        parentEndAngle: pickedNode.endAngle,
      };
    }

    this._history.push({
      depth: this.schema.depth,
      filter: oldFilter,
      groupId: filterId,
      groupDepth: this._drawDepth,
    });

    this.config({
      depth: this._drawDepth + 1,
      filter: (f: DataPoint, x: number) =>
        (!oldFilter || oldFilter(f, x)) && filterGroup(f, x) === filterId,
    }).render();
  }
}
