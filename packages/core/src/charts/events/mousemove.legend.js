import {merge} from "d3-array";
import clickLegend from "./click.legend.js";
import {legendLabel} from "../drawSteps/drawLegend.js";
import {configPrep} from "../../utils/index.js";

/**
    @desc Tooltip logic for a specified data point.
    @param {Object} *d* The data object being interacted with.
    @param {Number} *i* The index of the data object being interacted with.
    @param {Object} [*config*] Optional configuration methods for the Tooltip class.
    @private
*/
export default function(d, i, x, event) {

  const position = event.touches ? [event.touches[0].clientX, event.touches[0].clientY] : [event.clientX, event.clientY];
  const dataLength = merge(this._legendClass.data().map((d, i) => {
    let id = this._id(d, i);
    if (!(id instanceof Array)) id = [id];
    return id;
  })).length;

  if (d && this._tooltip(d, i)) {

    let id = this._id(d, i);
    if (id instanceof Array) id = id[0];

    const t = this._translate;
    const defaultClick = clickLegend.bind(this).toString();

    // does the legend have any user-defined click events?
    const hasUserClick = Object.keys(this._on)
      .some(e =>
        // all valid click event keys,
        ["click", "click.legend"].includes(e) &&
        // truthy values (no nulls),
        this._on[e] &&
        // and it is not our default click.legend function
        this._on[e].toString() !== defaultClick
      );

    // does the legend still have our default "click.legend" event?
    // (if the user only sets "click", both functions will fire)
    const hasDefaultClick = this._on["click.legend"] &&
      this._on["click.legend"].toString() === defaultClick;

    // can the viz show deeper data?
    const hasDeeperLevel = this._drawDepth < this._groupBy.length - 1;

    // only show the hand cursor when the shape has a click event
    this._select.style("cursor",
      hasUserClick || hasDefaultClick && hasDeeperLevel ? "pointer" : "auto");

    const invertedBehavior = this._legendFilterInvert.bind(this)();

    const solo = this._solo.includes(id);
    const hidden = this._hidden.includes(id);

    this._tooltipClass.data([x || d])
      .footer(
        hasDefaultClick
          ? invertedBehavior
            ? this._solo.length && !solo || hidden ? t("Click to Highlight")
            : this._solo.length === 1 && solo || this._hidden.length === dataLength - 1 ? t("Click to Show All")
            : `${t("Click to Highlight")}<br />${t("Shift+Click to Hide")}`

            : this._solo.length && !solo || hidden ? `${t("Click to Show")}<br />${t("Shift+Click to Highlight")}`
            : this._solo.length === 1 && solo || this._hidden.length === dataLength - 1 ? t("Click to Show All")
            : `${t("Click to Hide")}<br />${t("Shift+Click to Highlight")}`
          : false
      )
      .title(this._legendConfig.label ? this._legendClass.label() : legendLabel.bind(this))
      .position(position)
      .config(configPrep.bind(this)(this._tooltipConfig))
      .config(configPrep.bind(this)(this._legendTooltip))
      .render();

  }

}
