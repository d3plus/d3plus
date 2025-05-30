import {constant} from "../utils/index.js";

import {default as Plot} from "./Plot.js";

/**
    @class BumpChart
    @extends Plot
    @desc Creates a bump chart based on an array of data.
    @example <caption>the equivalent of calling:</caption>
new d3plus.Plot()
  .discrete("x")
  .shape("Line")
  .y2(d => this._y(d))
  .yConfig({
    tickFormat: val => {
      const data = this._formattedData;
      const xDomain = this._xDomain;
      const startData = data.filter(d => d.x === xDomain[0]);
      const d = startData.find(d => d.y === val);
      return this._drawLabel(d, d.i);
     }
   })
  .y2Config({
    tickFormat: val => {
      const data = this._formattedData;
      const xDomain = this._xDomain;
      const endData = data.filter(d => d.x === xDomain[xDomain.length - 1]);
      const d = endData.find(d => d.y === val);
      return this._drawLabel(d, d.i);
     }
   })
  .ySort((a, b) => b.y - a.y)
  .y2Sort((a, b) => b.y - a.y)
*/
export default class BumpChart extends Plot {

  /**
      @memberof BumpChart
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Plot.
      @private
  */
  constructor() {

    super();
    this._discrete = "x";
    this._shape = constant("Line");
    this.y2(d => this._y(d));

    this.yConfig({
      tickFormat: val => {
        const data = this._formattedData;
        const xMin = data[0].x instanceof Date ? data[0].x.getTime() : data[0].x;
        const startData = data.filter(d => (d.x instanceof Date ? d.x.getTime() : d.x) === xMin);
        const d = startData.find(d => d.y === val);
        return d ? this._drawLabel(d, d.i) : "";
      }
    });
    this.y2Config({
      tickFormat: val => {
        const data = this._formattedData;
        const xMax = data[data.length - 1].x instanceof Date ? data[data.length - 1].x.getTime() : data[data.length - 1].x;
        const endData = data.filter(d => (d.x instanceof Date ? d.x.getTime() : d.x) === xMax);
        const d = endData.find(d => d.y === val);
        return d ? this._drawLabel(d, d.i) : "";
      }
    });
    this.ySort((a, b) => this._y(b) - this._y(a));
    this.y2Sort((a, b) => this._y(b) - this._y(a));
  }

}
