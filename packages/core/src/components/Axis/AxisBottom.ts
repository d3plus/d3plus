import {default as Axis} from "./Axis.js";

/**
    Axis preset whose ticks are drawn below the horizontal domain path. Accepts everything the base Axis class does.
*/
export default class AxisBottom extends Axis {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Axis.
      @private
  */
  constructor() {
    super();
    this.orient("bottom");
  }
}
