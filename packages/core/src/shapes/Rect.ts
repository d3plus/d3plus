import type {BaseType, Selection} from "d3-selection";

import type {DataPoint} from "@d3plus/data";
import type {D3Selection} from "@d3plus/dom";
import {accessor} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";
import type {RectConfig} from "./shapeConfig.js";
import Shape, {type ShapeAes} from "./Shape.js";

/** Rect's own fluent accessor schema, layered on top of Shape's. */
const rectSchema: ConfigField[] = [
  {key: "height", coerce: "accessor", default: accessor("height")},
  {key: "width", coerce: "accessor", default: accessor("width")},
];

/**
    Creates SVG rectangles based on an array of data. See [this example](https://d3plus.org/examples/d3plus-shape/getting-started/) for help getting started using the rectangle generator.
*/
export default class Rect extends Shape {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super("rect");
    installFluent(this, rectSchema);
    this._name = "Rect";
    this.schema.labelBounds = (_d: DataPoint, _i: number, s: ShapeAes) => ({
      width: s.width,
      height: s.height,
      x: -(s.width as number) / 2,
      y: -(s.height as number) / 2,
    });
  }

  // v4: render() is inherited from Shape — the scene path handles drawing.

  /**
      Returns the rect geometry for a data point, matching _applyPosition: the
      rect is centered on the transform origin (x/y = -size/2).
      @private
*/
  _sceneGeometry(d: DataPoint, i: number): Record<string, unknown> {
    const w = Number(this.schema.width(d, i));
    const h = Number(this.schema.height(d, i));
    const rx = this._styleVal(this.schema.rx, d, i);
    const ry = this._styleVal(this.schema.ry, d, i);
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
      width: this.schema.width(d, i) as number,
      height: this.schema.height(d, i) as number,
    };
  }

  /**
      Provides the default positioning to the <rect> elements.
      @param elem @private
*/
  _applyPosition(elem: D3Selection): void {
    (elem as unknown as Selection<BaseType, DataPoint, BaseType, unknown>)
      .attr("width", (d: DataPoint, i: number) => this.schema.width(d, i))
      .attr("height", (d: DataPoint, i: number) => this.schema.height(d, i))
      .attr(
        "x",
        (d: DataPoint, i: number) => -(this.schema.width(d, i) as number) / 2,
      )
      .attr(
        "y",
        (d: DataPoint, i: number) => -(this.schema.height(d, i) as number) / 2,
      );
  }

  /**
      Narrowed `.config()` for Rect. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): RectConfig;
  config(_: Partial<RectConfig>): this;
  config(_?: Partial<RectConfig>): RectConfig | this {
    if (!arguments.length) return super.config() as RectConfig;
    super.config(_!);
    return this;
  }
}
