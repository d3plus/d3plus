import type {DataPoint} from "@d3plus/data";
import {assign} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

import type {CircleConfig} from "./shapeConfig.js";
import Shape, {type ShapeAes} from "./Shape.js";

/**
    Creates SVG circles based on an array of data.
*/
export default class Circle extends Shape {
  declare _labelBounds:
    | ((
        d: DataPoint,
        i: number,
        aes: ShapeAes,
      ) => Record<string, unknown> | null | false)
    | null;
  declare _labelConfig: Record<string, unknown>;
  declare _name: string;
  _r: AccessorFn;

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super("circle");
    this._labelBounds = (
      _d: DataPoint,
      _i: number,
      s: ShapeAes,
    ) => ({
      width: (s.r as number) * 1.5,
      height: (s.r as number) * 1.5,
      x: -(s.r as number) * 0.75,
      y: -(s.r as number) * 0.75,
    });
    this._labelConfig = assign(this._labelConfig, {
      textAnchor: "middle",
      verticalAlign: "middle",
    });
    this._name = "Circle";
    this._r = accessor("r");
  }

  /**
      Provides the default positioning to the <rect> elements.
      @private
*/
  _applyPosition(elem: D3Selection): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (elem as any)
      .attr("r", (d: DataPoint, i: number) => this._r(d, i))
      .attr("x", (d: DataPoint, i: number) => -(this._r(d, i) as number) / 2)
      .attr("y", (d: DataPoint, i: number) => -(this._r(d, i) as number) / 2);
  }

  // v4: render() is inherited from Shape — the scene path handles drawing.

  /**
      Returns the circle geometry for a data point. The circle is centered on the
      transform origin (cx/cy = 0); the group transform positions it.
      @private
*/
  _sceneGeometry(d: DataPoint, i: number): Record<string, unknown> {
    return {type: "circle", cx: 0, cy: 0, r: Number(this._r(d, i))};
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(d: DataPoint, i: number): ShapeAes {
    return {r: this._r(d, i) as number};
  }

  /**
      The radius accessor for each circle.

@example
function(d) {
  return d.r;
}
*/
  r(): AccessorFn;
  r(_: AccessorFn | number): this;
  r(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._r = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._r;
  }

  /**
      Narrowed `.config()` for Circle. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): CircleConfig;
  config(_: Partial<CircleConfig>): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config(_?: Partial<CircleConfig>): CircleConfig | this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (arguments.length ? super.config(_ as any) : super.config()) as any;
  }
}
