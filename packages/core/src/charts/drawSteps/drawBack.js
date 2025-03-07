import {elem} from "@d3plus/dom";

/**
    @function _drawBack
    @desc Draws a back button if there are states in this._history.
    @private
*/
export default function() {

  const visible = this._history.length;

  const backGroup = elem("g.d3plus-viz-back", {
    parent: this._select,
    duration: this._duration,
    update: {transform: `translate(${this._margin.left}, ${this._margin.top})`}
  }).node();

  this._backClass
    .data(visible ? [{text: `← ${this._translate("Back")}`, x: 0, y: 0}] : [])
    .select(backGroup)
    .config(this._backConfig)
    .render();

  this._margin.top += visible ? this._backClass.fontSize()() + this._backClass.padding()() * 2 : 0;

}
