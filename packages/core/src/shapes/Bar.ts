import type {DataPoint} from "@d3plus/data";
import type {D3Selection} from "@d3plus/dom";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

import type {BarConfig} from "./shapeConfig.js";
import Shape, {type ShapeAes} from "./Shape.js";

/**
    Creates SVG areas based on an array of data.
*/
export default class Bar extends Shape {
  _height: AccessorFn;
  declare _labelBounds:
    | ((
        d: DataPoint,
        i: number,
        aes: ShapeAes,
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
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super("rect");

    this._name = "Bar";
    this._height = constant(10);
    this._labelBounds = (
      d: DataPoint,
      i: number,
      s: ShapeAes,
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

  // v4: render() is inherited from Shape — the scene path handles drawing.

  /**
      Returns the bar geometry for a data point, matching _applyPosition: width/height
      from the x/y extents, with the rect centered on the transform origin along the
      non-measure axis.
      @private
*/
  _sceneGeometry(d: DataPoint, i: number): Record<string, unknown> {
    const w = this._getWidth(d, i);
    const h = this._getHeight(d, i);
    return {
      type: "rect",
      x: this._x1 !== null ? this._getX(d, i) : -w / 2,
      y: this._x1 === null ? this._getY(d, i) : -h / 2,
      width: w,
      height: h,
    };
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(d: DataPoint, i: number): ShapeAes {
    return {
      height: this._getHeight(d, i) as number,
      width: this._getWidth(d, i) as number,
    };
  }

  /**
      Provides the default positioning to the <rect> elements.
      @param elem @private
*/
  _applyPosition(elem: D3Selection): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      Calculates the height of the <rect> by assessing the x and y properties.

      @private
*/
  _getHeight(d: DataPoint, i: number): number {
    if (this._x1 !== null) return this._height(d, i) as number;
    return Math.abs((this._y1!(d, i) as number) - (this._y(d, i) as number));
  }

  /**
      Calculates the width of the <rect> by assessing the x and y properties.

      @private
*/
  _getWidth(d: DataPoint, i: number): number {
    if (this._x1 === null) return this._width(d, i) as number;
    return Math.abs((this._x1!(d, i) as number) - (this._x(d, i) as number));
  }

  /**
      Calculates the x of the <rect> by assessing the x and width properties.

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
      Calculates the y of the <rect> by assessing the y and height properties.

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
      The height accessor for each bar.

@example
function(d) {
  return d.height;
}
*/
  height(): AccessorFn;
  height(_: AccessorFn | number): this;
  height(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._height = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._height;
  }

  /**
      The width accessor for each bar.

@example
function(d) {
  return d.width;
}
*/
  width(): AccessorFn;
  width(_: AccessorFn | number): this;
  width(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._width = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._width;
  }

  /**
      The x0 (left edge) position accessor for each bar.
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
      The x1 (right edge) position accessor for each bar.
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
      The y0 (top edge) position accessor for each bar.
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
      The y1 (bottom edge) position accessor for each bar.
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

  /**
      Narrowed `.config()` for Bar. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): BarConfig;
  config(_: Partial<BarConfig>): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config(_?: Partial<BarConfig>): BarConfig | this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (arguments.length ? super.config(_ as any) : super.config()) as any;
  }
}
