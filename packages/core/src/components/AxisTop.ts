import {default as Axis} from "./Axis.js";

/**
    Shorthand method for creating an axis where the ticks are drawn above the vertical domain path. Extends all functionality of the base [Axis](#Axis) class.
*/
export default class AxisTop extends Axis {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Axis.
      @private
  */
  constructor() {
    super();
    this.orient("top");
  }
}
