import type {DataPoint} from "@d3plus/data";
import {configPrep} from "../../utils/index.js";
import type {VizContext} from "../../utils/configPrep.js";
import clickShape from "./click.shape.js";
import type Viz from "../Viz.js";

/**
    @module mouseMoveShape
    Tooltip logic for a specified data point.
    @param config Optional configuration methods for the Tooltip class.
    @private
*/
export default function (
  this: Viz,
  d: DataPoint,
  i: number,
  x: DataPoint,
  event: MouseEvent & TouchEvent,
): void {
  if (d && this.schema.tooltip(d, i)) {
    const defaultClick = clickShape.bind(this).toString();

    // does the shape have any user-defined click events?
    const hasUserClick = Object.keys(this.schema.on).some(
      (e: string) =>
        // all valid click event keys,
        ["click", "click.shape"].includes(e) &&
        // truthy values (no nulls),
        this.schema.on[e] &&
        // and it is not our default click.shape function
        this.schema.on[e].toString() !== defaultClick,
    );

    // does the shape still have our default "click.shape" event?
    // (if the user only sets "click", both functions will fire)
    const hasDefaultClick =
      this.schema.on["click.shape"] &&
      this.schema.on["click.shape"].toString() === defaultClick;

    // can the viz show deeper data?
    const hasDeeperLevel = this._drawDepth < this.schema.groupBy.length - 1;

    // only show the hand cursor when the shape has a click event
    this._select.style(
      "cursor",
      hasUserClick || (hasDefaultClick && hasDeeperLevel) ? "pointer" : "auto",
    );

    const position = event.touches
      ? [event.touches[0].clientX, event.touches[0].clientY]
      : [event.clientX, event.clientY];

    this._tooltipClass
      .data([x || d])
      .footer(
        hasDefaultClick && hasDeeperLevel
          ? this.schema.translate("Click to Expand")
          : false,
      )
      .title(this._drawLabel)
      .position(position)
      .config(configPrep.bind(this as unknown as VizContext)(this.schema.tooltipConfig))
      .render();
  }
}
