import {select} from "d3-selection";
import {stylize} from "@d3plus/dom";

/**
    @name _drawAttribution
    @desc Draws absolute positioned attribution text.
    @private
*/
export default function() {

  let attr = select(this._select.node().parentNode)
    .selectAll("div.d3plus-attribution")
    .data(this._attribution ? [0] : []);

  const attrEnter = attr.enter().append("div")
    .attr("class", "d3plus-attribution");

  attr.exit().remove();

  attr = attr.merge(attrEnter)
    .style("position", "absolute")
    .html(this._attribution)
    .style("right", `${this._margin.right}px`)
    .style("bottom", `${this._margin.bottom}px`)
    .call(stylize, this._attributionStyle);

}
