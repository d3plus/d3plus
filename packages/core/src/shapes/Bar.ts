import type {BaseType, Selection} from "d3-selection";

import type {DataPoint} from "@d3plus/data";
import type {D3Selection} from "@d3plus/dom";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

import type {BarConfig} from "./shapeConfig.js";
import Shape, {type ShapeAes} from "./Shape.js";

/** Bar's own fluent accessor schema, layered on top of Shape's. */
const barSchema: ConfigField[] = [
  {key: "height", coerce: "const", default: constant(10)},
  {key: "width", coerce: "const", default: constant(10)},
];

/**
    Creates SVG areas based on an array of data.
*/
export default class Bar extends Shape {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super("rect");

    installFluent(this, barSchema);

    this._name = "Bar";
    this.schema.labelBounds = (d: DataPoint, i: number, s: ShapeAes) => ({
      width: s.width,
      height: s.height,
      x: this.schema.x1 !== null ? this._getX(d, i) : -(s.width as number) / 2,
      y: this.schema.x1 === null ? this._getY(d, i) : -(s.height as number) / 2,
    });
    // Bar labels are horizontally centered inside their bar (vs. Shape's
    // "start" default used by Treemap/Pie/etc.). Pre-merged into the
    // Shape.labelConfig defaults so plotPaint's userConfig override
    // path doesn't have to know about it.
    Object.assign(this.schema.labelConfig, {textAnchor: "middle"});
    this.schema.x = accessor("x");
    this.schema.x0 = accessor("x");
    this.schema.x1 = null;
    this.schema.y = constant(0);
    this.schema.y0 = constant(0);
    this.schema.y1 = accessor("y");
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
      x: this.schema.x1 !== null ? this._getX(d, i) : -w / 2,
      y: this.schema.x1 === null ? this._getY(d, i) : -h / 2,
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
    (elem as unknown as Selection<BaseType, DataPoint, BaseType, unknown>)
      .attr("width", (d: DataPoint, i: number) => this._getWidth(d, i))
      .attr("height", (d: DataPoint, i: number) => this._getHeight(d, i))
      .attr("x", (d: DataPoint, i: number) =>
        this.schema.x1 !== null ? this._getX(d, i) : -this._getWidth(d, i) / 2,
      )
      .attr("y", (d: DataPoint, i: number) =>
        this.schema.x1 === null ? this._getY(d, i) : -this._getHeight(d, i) / 2,
      );
  }

  /**
      Calculates the height of the <rect> by assessing the x and y properties.

      @private
*/
  _getHeight(d: DataPoint, i: number): number {
    if (this.schema.x1 !== null) return this.schema.height(d, i) as number;
    return Math.abs(
      (this.schema.y1(d, i) as number) - (this.schema.y(d, i) as number),
    );
  }

  /**
      Calculates the width of the <rect> by assessing the x and y properties.

      @private
*/
  _getWidth(d: DataPoint, i: number): number {
    if (this.schema.x1 === null) return this.schema.width(d, i) as number;
    return Math.abs(
      (this.schema.x1(d, i) as number) - (this.schema.x(d, i) as number),
    );
  }

  /**
      Calculates the x of the <rect> by assessing the x and width properties.

      @private
*/
  _getX(d: DataPoint, i: number): number {
    const w =
      this.schema.x1 === null
        ? (this.schema.x(d, i) as number)
        : (this.schema.x1(d, i) as number) - (this.schema.x(d, i) as number);
    if (w < 0) return w;
    else return 0;
  }

  /**
      Calculates the y of the <rect> by assessing the y and height properties.

      @private
*/
  _getY(d: DataPoint, i: number): number {
    const h =
      this.schema.x1 !== null
        ? (this.schema.y(d, i) as number)
        : (this.schema.y1(d, i) as number) - (this.schema.y(d, i) as number);
    if (h < 0) return h;
    else return 0;
  }

  /**
      The x0 (left edge) position accessor for each bar.
*/
  x0(): AccessorFn;
  x0(_: AccessorFn | number): this;
  x0(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this.schema.x0;
    this.schema.x0 = typeof _ === "function" ? _ : constant(_);
    this.schema.x = this.schema.x0;
    return this;
  }

  /**
      The x1 (right edge) position accessor for each bar.
*/
  x1(): AccessorFn | null;
  x1(_: AccessorFn | number | null): this;
  x1(_?: AccessorFn | number | null): AccessorFn | null | this {
    return arguments.length
      ? ((this.schema.x1 =
          typeof _ === "function" ? _ : _ === null ? null : constant(_)),
        this)
      : this.schema.x1;
  }

  /**
      The y0 (top edge) position accessor for each bar.
*/
  y0(): AccessorFn;
  y0(_: AccessorFn | number): this;
  y0(_?: AccessorFn | number): AccessorFn | this {
    if (!arguments.length) return this.schema.y0;
    this.schema.y0 = typeof _ === "function" ? _ : constant(_);
    this.schema.y = this.schema.y0;
    return this;
  }

  /**
      The y1 (bottom edge) position accessor for each bar.
*/
  y1(): AccessorFn | null;
  y1(_: AccessorFn | number | null): this;
  y1(_?: AccessorFn | number | null): AccessorFn | null | this {
    return arguments.length
      ? ((this.schema.y1 =
          typeof _ === "function" ? _ : _ === null ? null : constant(_)),
        this)
      : this.schema.y1;
  }

  /**
      Narrowed `.config()` for Bar. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): BarConfig;
  config(_: Partial<BarConfig>): this;
  config(_?: Partial<BarConfig>): BarConfig | this {
    if (!arguments.length) return super.config() as BarConfig;
    super.config(_!);
    return this;
  }
}
