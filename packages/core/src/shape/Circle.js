import {assign} from "../dom/index.js";
import {accessor, constant} from "../utils/index.js";

import Shape from "./Shape.js";

/**
    @class Circle
    @extends Shape
    @desc Creates SVG circles based on an array of data.
*/
export default class Circle extends Shape {

  /**
      @memberof Circle
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
  */
  constructor() {
    super("circle");
    this._labelBounds = (d, i, s) =>
      ({width: s.r * 1.5, height: s.r * 1.5, x: -s.r * 0.75, y: -s.r * 0.75});
    this._labelConfig = assign(this._labelConfig, {
      textAnchor: "middle",
      verticalAlign: "middle"
    });
    this._name = "Circle";
    this._r = accessor("r");
  }

  /**
      @memberof Circle
      @desc Provides the default positioning to the <rect> elements.
      @private
  */
  _applyPosition(elem) {
    elem
      .attr("r", (d, i) => this._r(d, i))
      .attr("x", (d, i) => -this._r(d, i) / 2)
      .attr("y", (d, i) => -this._r(d, i) / 2);
  }

  /**
      @memberof Circle
      @desc Draws the circles.
      @param {Function} [*callback*]
      @chainable
  */
  render(callback) {

    super.render(callback);

    const enter = this._enter
      .call(this._applyStyle.bind(this));

    let update = this._update;

    if (this._duration) {
      enter
        .attr("r", 0).attr("x", 0).attr("y", 0)
        .transition(this._transition)
          .call(this._applyPosition.bind(this));
      update = update.transition(this._transition);
      this._exit.transition(this._transition)
        .attr("r", 0).attr("x", 0).attr("y", 0);
    }
    else {
      enter.call(this._applyPosition.bind(this));
    }

    update
      .call(this._applyStyle.bind(this))
      .call(this._applyPosition.bind(this));

    return this;

  }

  /**
      @memberof Circle
      @desc Given a specific data point and index, returns the aesthetic properties of the shape.
      @param {Object} *data point*
      @param {Number} *index*
      @private
  */
  _aes(d, i) {
    return {r: this._r(d, i)};
  }

  /**
      @memberof Circle
      @desc If *value* is specified, sets the radius accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.r;
}
  */
  r(_) {
    return arguments.length ? (this._r = typeof _ === "function" ? _ : constant(_), this) : this._r;
  }

}
