import type {DataPoint} from "@d3plus/data";
import type {D3Selection} from "@d3plus/dom";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";
import type {RectConfig} from "./shapeConfig.js";
import Shape, {type ShapeAes} from "./Shape.js";

/**
    Creates SVG rectangles based on an array of data. See [this example](https://d3plus.org/examples/d3plus-shape/getting-started/) for help getting started using the rectangle generator.
*/
export default class Rect extends Shape {
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

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super("rect");
    this._height = accessor("height");
    this._labelBounds = (
      _d: DataPoint,
      _i: number,
      s: ShapeAes,
    ) => ({
      width: s.width,
      height: s.height,
      x: -(s.width as number) / 2,
      y: -(s.height as number) / 2,
    });
    this._name = "Rect";
    this._width = accessor("width");
  }

  // v4: render() is inherited from Shape — the scene path handles drawing.

  /**
      Returns the rect geometry for a data point, matching _applyPosition: the
      rect is centered on the transform origin (x/y = -size/2).
      @private
*/
  _sceneGeometry(d: DataPoint, i: number): Record<string, unknown> {
    const w = Number(this._width(d, i));
    const h = Number(this._height(d, i));
    const rx = this._styleVal(this._rx, d, i);
    const ry = this._styleVal(this._ry, d, i);
    return {
      type: "rect",
      x: -w / 2,
      y: -h / 2,
      width: w,
      height: h,
      ...(rx == null ? {} : {rx: Number(rx)}),
      ...(ry == null ? {} : {ry: Number(ry)}),
    };
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(d: DataPoint, i: number): ShapeAes {
    return {
      width: this._width(d, i) as number,
      height: this._height(d, i) as number,
    };
  }

  /**
      Provides the default positioning to the <rect> elements.
      @param elem @private
*/
  _applyPosition(elem: D3Selection): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      The height accessor for each rectangle.

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
      The width accessor for each rectangle.

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
      Narrowed `.config()` for Rect. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): RectConfig;
  config(_: Partial<RectConfig>): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config(_?: Partial<RectConfig>): RectConfig | this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (arguments.length ? super.config(_ as any) : super.config()) as any;
  }
}
