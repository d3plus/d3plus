import {elem} from "@d3plus/dom";

/**
    @function _drawTitle
    @desc Draws a title if this._title is defined.
    @param {Array} [*data*] The currently filtered dataset.
    @private
*/
export default function(data = []) {

  const text = this._title ? this._title(data) : false;
  const padding = this._titlePadding() ? this._padding : {top: 0, right: 0, bottom: 0, left: 0};

  const transform = {transform: `translate(${this._margin.left + padding.left}, ${this._margin.top})`};

  const group = elem("g.d3plus-viz-title", {
    enter: transform,
    parent: this._select,
    duration: 0,
    update: transform
  }).node();

  this._titleClass
    .data(text ? [{text}] : [])
    .locale(this._locale)
    .select(group)
    .width(this._width - (this._margin.left + this._margin.right + padding.left + padding.right))
    .config(this._titleConfig)
    .render();

  this._margin.top += text ? group.getBBox().height + this._titleConfig.padding * 2 : 0;

}
