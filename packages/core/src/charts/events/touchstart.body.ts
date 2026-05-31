import type Viz from "../viz/Viz.js";

/**
    @module touchStartBody
    On touchstart event for the Body element.
    @private
 */
export default function (this: Viz): void {
  this._tooltipClass.data([]).render();
}
