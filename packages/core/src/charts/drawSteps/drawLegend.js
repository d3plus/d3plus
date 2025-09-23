import {rollup} from "d3-array";
import {merge} from "@d3plus/data";
import {elem} from "@d3plus/dom";
import {configPrep} from "../../utils/index.js";

const legendAttrs = ["fill", "opacity", "texture"];

/**
    @function legendLabel
    @desc Default label function for the legend.
    @private
*/
export function legendLabel(d, i) {
  return this._drawLabel(d, i, this._legendDepth);
}

/**
    @function _drawLegend
    @desc Renders the legend if this._legend is not falsy.
    @param {Array} data The filtered data array to be displayed.
    @private
*/
export default function(data = []) {

  const legendData = [];

  const getAttr = (d, i, attr) => {
    const shape = this._shape(d, i);
    if (attr === "fill" && shape === "Line") attr = "stroke";
    const value = this._shapeConfig[shape] && this._shapeConfig[shape][attr]
      ? this._shapeConfig[shape][attr] : this._shapeConfig[attr];
    return typeof value === "function" ? value.bind(this)(d, i) : value;
  };

  const fill = (d, i) => legendAttrs.map(a => getAttr(d, i, a)).join("_");

  const rollupData = this._colorScale ? data.filter((d, i) => this._colorScale(d, i) === undefined) : data;
  rollup(rollupData, leaves => legendData.push(merge(leaves, this._aggs)), fill);

  legendData.sort(this._legendSort);

  const labels = legendData.map((d, i) => this._ids(d, i).slice(0, this._drawDepth + 1));
  this._legendDepth = 0;
  for (let x = 0; x <= this._drawDepth; x++) {
    const values = labels.map(l => l[x]);
    if (!values.some(v => v instanceof Array) && Array.from(new Set(values)).length === legendData.length) {
      this._legendDepth = x;
      break;
    }
  }

  const hidden = (d, i) => {
    let id = this._id(d, i);
    if (id instanceof Array) id = id[0];
    return this._hidden.includes(id) || this._solo.length && !this._solo.includes(id);
  };

  const legendBounds = this._legendClass.outerBounds();
  const config = this.config();
  let position = this._legendPosition.bind(this)(config);
  if (![false, "top", "bottom", "left", "right"].includes(position)) position = "bottom";
  const wide = ["top", "bottom"].includes(position);
  const padding = this._legendPadding() ? this._padding : {top: 0, right: 0, bottom: 0, left: 0};
  const transform = {transform: `translate(${wide ? this._margin.left + padding.left : this._margin.left}, ${wide ? this._margin.top : this._margin.top + padding.top})`};
  const visible = this._legend.bind(this)(config, legendData);

  const legendGroup = elem("g.d3plus-viz-legend", {
    condition: visible && !this._legendConfig.select,
    enter: transform,
    parent: this._select,
    duration: this._duration,
    update: transform
  }).node();

  this._legendClass
    .id(fill)
    .align(wide ? "center" : position)
    .direction(wide ? "row" : "column")
    .duration(this._duration)
    .data(visible ? legendData : [])
    .height(wide ? this._height - (this._margin.bottom + this._margin.top) : this._height - (this._margin.bottom + this._margin.top + padding.bottom + padding.top))
    .locale(this._locale)
    .parent(this)
    .select(legendGroup)
    .shape((d, i) => this._shape(d, i) === "Circle" ? "Circle" : "Rect")
    .verticalAlign(!wide ? "middle" : position)
    .width(wide ? this._width - (this._margin.left + this._margin.right + padding.left + padding.right) : this._width - (this._margin.left + this._margin.right))
    .shapeConfig(configPrep.bind(this)(this._shapeConfig, "legend"))
    .shapeConfig({
      fill: (d, i) => hidden(d, i) ? this._hiddenColor(d, i) : getAttr(d, i, "fill"),
      labelConfig: {
        fontOpacity: (d, i) => hidden(d, i) ? this._hiddenOpacity(d, i) : 1
      },
    })
    .config(this._legendConfig)
    .render();

  if (!this._legendConfig.select && legendBounds.height) {
    if (wide) this._margin[position] += legendBounds.height + this._legendClass.padding() * 2;
    else this._margin[position] += legendBounds.width + this._legendClass.padding() * 2;
  }

}
