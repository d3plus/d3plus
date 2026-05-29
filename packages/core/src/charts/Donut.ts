import {min} from "d3-array";
import {donutDef} from "./ChartDefinition.js";
import {chartBounds} from "./chartGeometry.js";
import {default as Pie} from "./Pie.js";

/**
    Extends the Pie visualization to create a donut chart.
*/
export default class Donut extends Pie {
  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    super();

    // `_innerRadius` is a closure over this._width/this._height/this._margin
    // — stays imperative because donutDef.defaults can only hold static values.
    this._innerRadius = () => {
      const {width, height} = chartBounds(this as never);
      return min([width, height])! / 4;
    };
    // E3: scalar default sourced from donutDef.
    this._padPixel = donutDef.defaults.padPixel as number;
  }
}
