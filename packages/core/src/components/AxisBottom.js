import {default as Axis} from "./Axis.js";

/**
    @class AxisBottom
    @extends Axis
    @desc Shorthand method for creating an axis where the ticks are drawn below the horizontal domain path. Extends all functionality of the base [Axis](#Axis) class.
*/
export default class AxisBottom extends Axis {

  /**
      @memberof AxisBottom
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Axis.
      @private
  */
  constructor() {
    super();
    this.orient("bottom");
  }

}
