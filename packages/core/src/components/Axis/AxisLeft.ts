import {default as Axis} from "./Axis.js";

/**
    Axis preset whose ticks are drawn to the left of the vertical domain path. Accepts everything the base Axis class does.
*/
export default class AxisLeft extends Axis {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Axis.
      @private
  */
  constructor() {
    super();
    this.orient("left");
  }
}
