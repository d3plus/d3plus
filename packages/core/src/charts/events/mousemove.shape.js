import {configPrep} from "../../utils/index.js";
import clickShape from "./click.shape.js";

/**
    @desc Tooltip logic for a specified data point.
    @param {Object} *d* The data object being interacted with.
    @param {Number} *i* The index of the data object being interacted with.
    @param {Object} [*config*] Optional configuration methods for the Tooltip class.
    @private
*/
export default function(d, i, x, event) {

  if (d && this._tooltip(d, i)) {

    const defaultClick = clickShape.bind(this).toString();

    // does the shape have any user-defined click events?
    const hasUserClick = Object.keys(this._on)
      .some(e =>
        // all valid click event keys,
        ["click", "click.shape"].includes(e) &&
        // truthy values (no nulls),
        this._on[e] &&
        // and it is not our default click.shape function
        this._on[e].toString() !== defaultClick
      );

    // does the shape still have our default "click.shape" event?
    // (if the user only sets "click", both functions will fire)
    const hasDefaultClick = this._on["click.shape"] &&
      this._on["click.shape"].toString() === defaultClick;

    // can the viz show deeper data?
    const hasDeeperLevel = this._drawDepth < this._groupBy.length - 1;

    // only show the hand cursor when the shape has a click event
    this._select.style("cursor",
      hasUserClick || hasDefaultClick && hasDeeperLevel ? "pointer" : "auto");

    const position = event.touches
      ? [event.touches[0].clientX, event.touches[0].clientY]
      : [event.clientX, event.clientY];

    this._tooltipClass.data([x || d])
      .footer(
        hasDefaultClick && hasDeeperLevel
          ? this._translate("Click to Expand")
          : false
      )
      .title(this._drawLabel)
      .position(position)
      .config(configPrep.bind(this)(this._tooltipConfig))
      .render();
  }

}
