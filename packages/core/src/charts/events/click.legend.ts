import {merge} from "d3-array";
import type {DataPoint} from "@d3plus/data";
import type Viz from "../viz/Viz.js";

/**
    @module clickLegend
    On click event for all legend shapes in a Viz.
    @private
*/
export default function (
  this: Viz,
  d: DataPoint,
  i: number,
  x: DataPoint,
  event: MouseEvent,
): void {
  this._select.style("cursor", "auto");
  if (this.schema.tooltip(d, i)) this._tooltipClass.data([]).render();

  let id = this._id(d, i);
  if (!(id instanceof Array)) id = [id];
  const hiddenIndex = this._hidden.indexOf(id[0]);
  const soloIndex = this._solo.indexOf(id[0]);
  const dataLength = merge(
    this._legendClass.data().map((d: DataPoint, i: number) => {
      let id = this._id(d, i);
      if (!(id instanceof Array)) id = [id];
      return id;
    }),
  ).length;

  const inverted = this.schema.legendFilterInvert.bind(this)();

  if (inverted) {
    if (event.shiftKey) {
      if (hiddenIndex < 0 && !this._solo.length) {
        this._hidden = this._hidden.concat(id);
        if (soloIndex >= 0) this._solo = [];
        if (this._hidden.length === dataLength) this._hidden = [];
        this.render();
      } else if (soloIndex >= 0) {
        this._solo = [];
        this._hidden = [];
        this.render();
      }
    } else {
      if (soloIndex < 0 && this._hidden.length < dataLength - 1) {
        this._solo = id;
        this._hidden = [];
      } else {
        this._solo = [];
        this._hidden = [];
      }
      this.render();
    }
  } else {
    if (event.shiftKey && soloIndex < 0) {
      this._solo = id;
      this._hidden = [];
      this.render();
    } else if (!event.shiftKey) {
      if (hiddenIndex >= 0) {
        this._hidden.splice(hiddenIndex, id.length);
      } else if (soloIndex >= 0) {
        this._solo = [];
        this._hidden = [];
      } else if (this._solo.length && soloIndex < 0) {
        this._solo = this._solo.concat(id);
        if (this._solo.length === dataLength) this._solo = [];
      } else {
        this._hidden = this._hidden.concat(id);
        if (this._hidden.length === dataLength) this._hidden = [];
      }
      this.render();
    }
  }
}
