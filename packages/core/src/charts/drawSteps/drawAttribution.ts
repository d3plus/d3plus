import {select} from "d3-selection";
import {stylize} from "@d3plus/dom";
import type Viz from "../Viz.js";

/**
    @name _drawAttribution
    Draws absolute positioned attribution text.
    @private
*/
export default function (this: Viz): void {
  let attr: ReturnType<typeof select> = select(this._select.node().parentNode)
    .selectAll("div.d3plus-attribution")
    .data(this._attribution ? [0] : []) as unknown as ReturnType<typeof select>;

  const attrEnter = attr
    .enter()
    .append("div")
    .attr("class", "d3plus-attribution");

  attr.exit().remove();

  attr = attr
    .merge(attrEnter as unknown as ReturnType<typeof select>)
    .style("position", "absolute")
    .html(this._attribution)
    .style("right", `${this._margin.right}px`)
    .style("bottom", `${this._margin.bottom}px`)
    .call(stylize as never, this._attributionStyle);
}
