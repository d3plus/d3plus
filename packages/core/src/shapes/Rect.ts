import type {DataPoint} from "@d3plus/data";
import type {D3Selection} from "@d3plus/dom";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";
import Shape, {type ShapeAes} from "./Shape.js";

/**
    @class Rect
    @extends Shape
    @desc Creates SVG rectangles based on an array of data. See [this example](https://d3plus.org/examples/d3plus-shape/getting-started/) for help getting started using the rectangle generator.
*/
export default class Rect extends Shape {
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

  /**
      @memberof Rect
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
  */
  constructor() {
    super("rect");
    this._height = accessor("height");
    this._labelBounds = (
      d: DataPoint,
      i: number,
      s: Record<string, unknown>,
    ) => ({
      width: s.width,
      height: s.height,
      x: -(s.width as number) / 2,
      y: -(s.height as number) / 2,
    });
    this._name = "Rect";
    this._width = accessor("width");
  }

  /**
      @memberof Rect
      @desc Draws the rectangles.
      @param {Function} [*callback*]
      @chainable
  */
  render(callback?: () => void): this {
    super.render(callback);

    let enter: D3Selection = this._enter
      .attr("width", 0)
      .attr("height", 0)
      .attr("x", 0)
      .attr("y", 0)
      .call(this._applyStyle.bind(this));

    let update: D3Selection = this._update;

    if (this._duration) {
      enter = enter.transition(this._transition) as unknown as D3Selection;
      update = update.transition(this._transition) as unknown as D3Selection;
      this._exit
        .transition(this._transition)
        .attr("width", 0)
        .attr("height", 0)
        .attr("x", 0)
        .attr("y", 0);
    }

    enter.call(this._applyPosition.bind(this));

    update
      .call(this._applyStyle.bind(this))
      .call(this._applyPosition.bind(this));

    return this;
  }

  /**
      @memberof Rect
      @desc Given a specific data point and index, returns the aesthetic properties of the shape.
      @param {Object} *data point*
      @param {Number} *index*
      @private
  */
  _aes(d: DataPoint, i: number): ShapeAes {
    return {
      width: this._width(d, i) as number,
      height: this._height(d, i) as number,
    };
  }

  /**
      @memberof Rect
      @desc Provides the default positioning to the <rect> elements.
      @param {D3Selection} *elem*
      @private
  */
  _applyPosition(elem: D3Selection): void {
    (elem as any)
      .attr("width", (d: DataPoint, i: number) => this._width(d, i))
      .attr("height", (d: DataPoint, i: number) => this._height(d, i))
      .attr(
        "x",
        (d: DataPoint, i: number) => -(this._width(d, i) as number) / 2,
      )
      .attr(
        "y",
        (d: DataPoint, i: number) => -(this._height(d, i) as number) / 2,
      );
  }

  /**
      @memberof Rect
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
      @memberof Rect
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
}
