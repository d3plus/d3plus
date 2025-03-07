import {accessor, constant} from "../utils/index.js";

import Shape from "./Shape.js";

/**
    @class Bar
    @extends Shape
    @desc Creates SVG areas based on an array of data.
*/
export default class Bar extends Shape {

  /**
      @memberof Bar
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
  */
  constructor() {

    super("rect");

    this._name = "Bar";
    this._height = constant(10);
    this._labelBounds = (d, i, s) => ({
      width: s.width,
      height: s.height,
      x: this._x1 !== null ? this._getX(d, i) : -s.width / 2,
      y: this._x1 === null ? this._getY(d, i) : -s.height / 2
    });
    this._width = constant(10);
    this._x = accessor("x");
    this._x0 = accessor("x");
    this._x1 = null;
    this._y = constant(0);
    this._y0 = constant(0);
    this._y1 = accessor("y");

  }

  /**
      @memberof Bar
      @desc Draws the bars.
      @param {Function} [*callback*]
      @chainable
  */
  render(callback) {

    super.render(callback);

    let enter = this._enter
      .attr("width", (d, i) => this._x1 === null ? this._getWidth(d, i) : 0)
      .attr("height", (d, i) => this._x1 !== null ? this._getHeight(d, i) : 0)
      .attr("x", (d, i) => this._x1 === null ? -this._getWidth(d, i) / 2 : 0)
      .attr("y", (d, i) => this._x1 !== null ? -this._getHeight(d, i) / 2 : 0)
      .call(this._applyStyle.bind(this));

    let update = this._update;

    if (this._duration) {
      enter = enter.transition(this._transition);
      update = update.transition(this._transition);
      this._exit.transition(this._transition)
        .attr("width", (d, i) => this._x1 === null ? this._getWidth(d, i) : 0)
        .attr("height", (d, i) => this._x1 !== null ? this._getHeight(d, i) : 0)
        .attr("x", (d, i) => this._x1 === null ? -this._getWidth(d, i) / 2 : 0)
        .attr("y", (d, i) => this._x1 !== null ? -this._getHeight(d, i) / 2 : 0);
    }

    enter
      .call(this._applyPosition.bind(this));

    update
      .call(this._applyStyle.bind(this))
      .call(this._applyPosition.bind(this));

    return this;

  }

  /**
      @memberof Bar
      @desc Given a specific data point and index, returns the aesthetic properties of the shape.
      @param {Object} *data point*
      @param {Number} *index*
      @private
  */
  _aes(d, i) {
    return {height: this._getHeight(d, i), width: this._getWidth(d, i)};
  }

  /**
      @memberof Bar
      @desc Provides the default positioning to the <rect> elements.
      @param {D3Selection} *elem*
      @private
  */
  _applyPosition(elem) {
    elem
      .attr("width", (d, i) => this._getWidth(d, i))
      .attr("height", (d, i) => this._getHeight(d, i))
      .attr("x", (d, i) => this._x1 !== null ? this._getX(d, i) : -this._getWidth(d, i) / 2)
      .attr("y", (d, i) => this._x1 === null ? this._getY(d, i) : -this._getHeight(d, i) / 2);
  }

  /**
      @memberof Bar
      @desc Calculates the height of the <rect> by assessing the x and y properties.
      @param {Object} *d*
      @param {Number} *i*
      @private
  */
  _getHeight(d, i) {
    if (this._x1 !== null) return this._height(d, i);
    return Math.abs(this._y1(d, i) - this._y(d, i));
  }

  /**
      @memberof Bar
      @desc Calculates the width of the <rect> by assessing the x and y properties.
      @param {Object} *d*
      @param {Number} *i*
      @private
  */
  _getWidth(d, i) {
    if (this._x1 === null) return this._width(d, i);
    return Math.abs(this._x1(d, i) - this._x(d, i));
  }

  /**
      @memberof Bar
      @desc Calculates the x of the <rect> by assessing the x and width properties.
      @param {Object} *d*
      @param {Number} *i*
      @private
  */
  _getX(d, i) {
    const w = this._x1 === null ? this._x(d, i) : this._x1(d, i) - this._x(d, i);
    if (w < 0) return w;
    else return 0;
  }

  /**
      @memberof Bar
      @desc Calculates the y of the <rect> by assessing the y and height properties.
      @param {Object} *d*
      @param {Number} *i*
      @private
  */
  _getY(d, i) {
    const h = this._x1 !== null ? this._y(d, i) : this._y1(d, i) - this._y(d, i);
    if (h < 0) return h;
    else return 0;
  }

  /**
      @memberof Bar
      @desc If *value* is specified, sets the height accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.height;
}
  */
  height(_) {
    return arguments.length ? (this._height = typeof _ === "function" ? _ : constant(_), this) : this._height;
  }

  /**
      @memberof Bar
      @desc If *value* is specified, sets the width accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.width;
}
  */
  width(_) {
    return arguments.length ? (this._width = typeof _ === "function" ? _ : constant(_), this) : this._width;
  }

  /**
      @memberof Bar
      @desc If *value* is specified, sets the x0 accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
  */
  x0(_) {
    if (!arguments.length) return this._x0;
    this._x0 = typeof _ === "function" ? _ : constant(_);
    this._x = this._x0;
    return this;
  }

  /**
      @memberof Bar
      @desc If *value* is specified, sets the x1 accessor to the specified function or number and returns the current class instance.
      @param {Function|Number|null} [*value*]
      @chainable
  */
  x1(_) {
    return arguments.length ? (this._x1 = typeof _ === "function" || _ === null ? _ : constant(_), this) : this._x1;
  }

  /**
      @memberof Bar
      @desc If *value* is specified, sets the y0 accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
  */
  y0(_) {
    if (!arguments.length) return this._y0;
    this._y0 = typeof _ === "function" ? _ : constant(_);
    this._y = this._y0;
    return this;
  }

  /**
      @memberof Bar
      @desc If *value* is specified, sets the y1 accessor to the specified function or number and returns the current class instance.
      @param {Function|Number|null} [*value*]
      @chainable
  */
  y1(_) {
    return arguments.length ? (this._y1 = typeof _ === "function" || _ === null ? _ : constant(_), this) : this._y1;
  }

}
