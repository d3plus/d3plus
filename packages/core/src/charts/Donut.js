import {min} from "d3-array";
import {default as Pie} from "./Pie.js";

/**
    @class Donut
    @extends Pie
    @desc Extends the Pie visualization to create a donut chart.
*/
export default class Donut extends Pie {

  /**
      @memberof Donut
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {

    super();

    this._innerRadius = () => min([
      this._width - this._margin.left - this._margin.right,
      this._height - this._margin.top - this._margin.bottom
    ]) / 4;
    this._padPixel = 2;

  }

}
