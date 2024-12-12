import {default as Axis} from "./Axis.js";

/**
    @class AxisRight
    @extends Axis
    @desc Shorthand method for creating an axis where the ticks are drawn to the right of the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.
*/
export default class AxisRight extends Axis {

  /**
      @memberof AxisRight
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Axis.
      @private
  */
  constructor() {
    super();
    this.orient("right");
  }

}
