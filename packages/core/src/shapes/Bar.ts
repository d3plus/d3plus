import type {DataPoint} from "@d3plus/data";
import type {D3Selection} from "@d3plus/dom";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

import Shape, {type ShapeAes} from "./Shape.js";

/**
    @class Bar
    @extends Shape
    @desc Creates SVG areas based on an array of data.
*/
export default class Bar extends Shape {
  _height: AccessorFn;
  declare _labelBounds:
    | ((
        d: DataPoint,
        i: number,
        aes: Record<string, unknown>,
      ) => Record<string, unknown> | null | false)
    | null;
  declare _name: string;
  _width: AccessorFn;
  declare _x: AccessorFn;
  _x0: AccessorFn;
  _x1: AccessorFn | null;
  declare _y: AccessorFn;
  _y0: AccessorFn;
  _y1: AccessorFn | null;

  /**
      @memberof Bar
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
  */
  constructor() {
    super("rect");

    this._name = "Bar";
    this._height = constant(10);
    this._labelBounds = (
      d: DataPoint,
      i: number,
      s: Record<string, unknown>,
    ) => ({
      width: s.width,
      height: s.height,
      x: this._x1 !== null ? this._getX(d, i) : -(s.width as number) / 2,
      y: this._x1 === null ? this._getY(d, i) : -(s.height as number) / 2,
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
  render(callback?: () => void): this {
    super.render(callback);

    let enter: D3Selection = this._enter
      .attr("width", (d: DataPoint, i: number) =>
        this._x1 === null ? this._getWidth(d, i) : 0,
      )
      .attr("height", (d: DataPoint, i: number) =>
        this._x1 !== null ? this._getHeight(d, i) : 0,
      )
      .attr("x", (d: DataPoint, i: number) =>
        this._x1 === null ? -this._getWidth(d, i) / 2 : 0,
      )
      .attr("y", (d: DataPoint, i: number) =>
        this._x1 !== null ? -this._getHeight(d, i) / 2 : 0,
      )
      .call(this._applyStyle.bind(this));

    let update: D3Selection = this._update;

    if (this._duration) {
      enter = enter.transition(this._transition) as unknown as D3Selection;
      update = update.transition(this._transition) as unknown as D3Selection;
      this._exit
        .transition(this._transition)
        .attr("width", (d: DataPoint, i: number) =>
          this._x1 === null ? this._getWidth(d, i) : 0,
        )
        .attr("height", (d: DataPoint, i: number) =>
          this._x1 !== null ? this._getHeight(d, i) : 0,
        )
        .attr("x", (d: DataPoint, i: number) =>
          this._x1 === null ? -this._getWidth(d, i) / 2 : 0,
        )
        .attr("y", (d: DataPoint, i: number) =>
          this._x1 !== null ? -this._getHeight(d, i) / 2 : 0,
        );
    }

    enter.call(this._applyPosition.bind(this));

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
  _aes(d: DataPoint, i: number): ShapeAes {
    return {
      height: this._getHeight(d, i) as number,
      width: this._getWidth(d, i) as number,
    };
  }

  /**
      @memberof Bar
      @desc Provides the default positioning to the <rect> elements.
      @param {D3Selection} *elem*
      @private
  */
  _applyPosition(elem: D3Selection): void {
    (elem as any)
      .attr("width", (d: DataPoint, i: number) => this._getWidth(d, i))
      .attr("height", (d: DataPoint, i: number) => this._getHeight(d, i))
      .attr("x", (d: DataPoint, i: number) =>
        this._x1 !== null ? this._getX(d, i) : -this._getWidth(d, i) / 2,
      )
      .attr("y", (d: DataPoint, i: number) =>
        this._x1 === null ? this._getY(d, i) : -this._getHeight(d, i) / 2,
      );
  }

  /**
      @memberof Bar
      @desc Calculates the height of the <rect> by assessing the x and y properties.
      @param {Object} *d*
      @param {Number} *i*
      @private
  */
  _getHeight(d: DataPoint, i: number): number {
    if (this._x1 !== null) return this._height(d, i) as number;
    return Math.abs((this._y1!(d, i) as number) - (this._y(d, i) as number));
  }

  /**
      @memberof Bar
      @desc Calculates the width of the <rect> by assessing the x and y properties.
      @param {Object} *d*
      @param {Number} *i*
      @private
  */
  _getWidth(d: DataPoint, i: number): number {
    if (this._x1 === null) return this._width(d, i) as number;
    return Math.abs((this._x1!(d, i) as number) - (this._x(d, i) as number));
  }

  /**
      @memberof Bar
      @desc Calculates the x of the <rect> by assessing the x and width properties.
      @param {Object} *d*
      @param {Number} *i*
      @private
  */
  _getX(d: DataPoint, i: number): number {
    const w =
      this._x1 === null
        ? (this._x(d, i) as number)
        : (this._x1!(d, i) as number) - (this._x(d, i) as number);
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
  _getY(d: DataPoint, i: number): number {
    const h =
      this._x1 !== null
        ? (this._y(d, i) as number)
        : (this._y1!(d, i) as number) - (this._y(d, i) as number);
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
  height(): AccessorFn;
  height(_: AccessorFn | number): this;
  height(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._height = typeof _ === "function" ? _ : constant(_)), this)
      : this._height;
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
  width(): AccessorFn;
  width(_: AccessorFn | number): this;
  width(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._width = typeof _ === "function" ? _ : constant(_)), this)
      : this._width;
  }

  /**
      @memberof Bar
      @desc If *value* is specified, sets the x0 accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
  */
  x0(): AccessorFn;
  x0(_: AccessorFn | number): this;
  x0(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this._x0;
    this._x0 =
      typeof _ === "function" ? _ : (constant(_) as unknown as AccessorFn);
    this._x = this._x0;
    return this;
  }

  /**
      @memberof Bar
      @desc If *value* is specified, sets the x1 accessor to the specified function or number and returns the current class instance.
      @param {Function|Number|null} [*value*]
      @chainable
  */
  x1(): AccessorFn | null;
  x1(_: AccessorFn | number | null): this;
  x1(_?: AccessorFn | number | null): AccessorFn | null | this {
    return arguments.length
      ? ((this._x1 =
          typeof _ === "function"
            ? _
            : _ === null
              ? null
              : (constant(_) as unknown as AccessorFn)),
        this)
      : this._x1;
  }

  /**
      @memberof Bar
      @desc If *value* is specified, sets the y0 accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
  */
  y0(): AccessorFn;
  y0(_: AccessorFn | number): this;
  y0(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this._y0;
    this._y0 =
      typeof _ === "function" ? _ : (constant(_) as unknown as AccessorFn);
    this._y = this._y0;
    return this;
  }

  /**
      @memberof Bar
      @desc If *value* is specified, sets the y1 accessor to the specified function or number and returns the current class instance.
      @param {Function|Number|null} [*value*]
      @chainable
  */
  y1(): AccessorFn | null;
  y1(_: AccessorFn | number | null): this;
  y1(_?: AccessorFn | number | null): AccessorFn | null | this {
    return arguments.length
      ? ((this._y1 =
          typeof _ === "function"
            ? _
            : _ === null
              ? null
              : (constant(_) as unknown as AccessorFn)),
        this)
      : this._y1;
  }
}
