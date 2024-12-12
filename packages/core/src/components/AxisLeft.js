import {default as Axis} from "./Axis.js";

/**
    @class AxisLeft
    @extends Axis
    @desc Shorthand method for creating an axis where the ticks are drawn to the left of the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.
*/
export default class AxisLeft extends Axis {

  /**
      @memberof AxisLeft
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Axis.
      @private
  */
  constructor() {
    super();
    this.orient("left");
  }

}
